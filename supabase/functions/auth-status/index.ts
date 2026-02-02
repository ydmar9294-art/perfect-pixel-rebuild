/**
 * Lightweight Auth Status Endpoint
 * Returns auth state instantly without heavy logic
 * Used for quick session validation on app load
 * Includes real-time license status enforcement
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get auth token from header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          authenticated: false, 
          reason: 'NO_TOKEN' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client with service role for efficient queries
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify JWT and get user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ 
          authenticated: false, 
          reason: 'INVALID_TOKEN' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Single optimized query: Get profile with organization join
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        role,
        employee_type,
        organization_id,
        license_key
      `)
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ 
          authenticated: true,
          needs_activation: true,
          user_id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          google_id: user.user_metadata?.sub || user.user_metadata?.provider_id || user.id
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get organization name if exists (single indexed query)
    let orgName: string | null = null
    if (profile.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', profile.organization_id)
        .single()
      orgName = org?.name || null
    }

    // Check license status for non-developers (indexed query)
    // This enforces real-time license status - any status check will catch suspended licenses
    let licenseStatus: string | null = null
    
    if (profile.role !== 'DEVELOPER') {
      // For owners - check their own license
      if (profile.license_key) {
        const { data: license } = await supabase
          .from('developer_licenses')
          .select('status')
          .eq('licenseKey', profile.license_key)
          .single()
        licenseStatus = license?.status || null
      } 
      // For employees - find owner's license via organization
      else if (profile.organization_id) {
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('license_key')
          .eq('organization_id', profile.organization_id)
          .eq('role', 'OWNER')
          .maybeSingle()
        
        if (ownerProfile?.license_key) {
          const { data: license } = await supabase
            .from('developer_licenses')
            .select('status')
            .eq('licenseKey', ownerProfile.license_key)
            .single()
          licenseStatus = license?.status || null
        }
      }

      // REAL-TIME LICENSE ENFORCEMENT
      // Check if suspended - immediately deny access
      if (licenseStatus === 'SUSPENDED') {
        return new Response(
          JSON.stringify({ 
            authenticated: true,
            access_denied: true,
            reason: 'LICENSE_SUSPENDED',
            message: 'تم إيقاف الترخيص. يرجى مراجعة قسم المالية لسداد المستحقات.',
            force_logout: true
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Check if expired
      if (licenseStatus === 'EXPIRED') {
        return new Response(
          JSON.stringify({ 
            authenticated: true,
            access_denied: true,
            reason: 'LICENSE_EXPIRED',
            message: 'انتهت صلاحية الترخيص. يرجى تجديد الاشتراك.',
            force_logout: true
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Return complete auth state for caching
    return new Response(
      JSON.stringify({
        authenticated: true,
        needs_activation: false,
        access_denied: false,
        user_id: user.id,
        role: profile.role,
        employee_type: profile.employee_type,
        organization_id: profile.organization_id,
        organization_name: orgName,
        license_status: licenseStatus,
        full_name: profile.full_name,
        email: profile.email
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('[auth-status] Error:', error)
    return new Response(
      JSON.stringify({ 
        authenticated: false, 
        reason: 'SERVER_ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
