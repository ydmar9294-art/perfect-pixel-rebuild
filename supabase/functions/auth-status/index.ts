/**
 * Lightweight Auth Status Endpoint - OPTIMIZED
 * Returns auth state instantly with parallel queries
 * Used for quick session validation on app load
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ authenticated: false, reason: 'NO_TOKEN' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ authenticated: false, reason: 'INVALID_TOKEN' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // OPTIMIZED: Single query with organization join
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id, full_name, email, role, employee_type, organization_id, license_key,
        organizations!profiles_organization_id_fkey(id, name)
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
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const org = (profile as any).organizations
    const orgName = org?.name || null

    // Developer doesn't need license check
    if (profile.role === 'DEVELOPER') {
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
          license_status: null,
          full_name: profile.full_name,
          email: profile.email
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // OPTIMIZED: Get license key (owner's or their own) in parallel
    let licenseKey = profile.license_key
    
    if (!licenseKey && profile.organization_id) {
      // Employee - find owner's license key
      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('license_key')
        .eq('organization_id', profile.organization_id)
        .eq('role', 'OWNER')
        .maybeSingle()
      licenseKey = ownerProfile?.license_key || null
    }

    // Get license status
    let licenseStatus: string | null = null
    if (licenseKey) {
      const { data: license } = await supabase
        .from('developer_licenses')
        .select('status')
        .eq('licenseKey', licenseKey)
        .single()
      licenseStatus = license?.status || null
    }

    // License enforcement
    if (licenseStatus === 'SUSPENDED') {
      return new Response(
        JSON.stringify({ 
          authenticated: true,
          access_denied: true,
          reason: 'LICENSE_SUSPENDED',
          message: 'تم إيقاف الترخيص. يرجى مراجعة قسم المالية.',
          force_logout: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (licenseStatus === 'EXPIRED') {
      return new Response(
        JSON.stringify({ 
          authenticated: true,
          access_denied: true,
          reason: 'LICENSE_EXPIRED',
          message: 'انتهت صلاحية الترخيص.',
          force_logout: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[auth-status] Error:', error)
    return new Response(
      JSON.stringify({ 
        authenticated: false, 
        reason: 'SERVER_ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
