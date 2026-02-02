import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'UNAUTHORIZED', message: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'UNAUTHORIZED', message: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { bootstrap_code, full_name, google_id, email } = await req.json();

    // Validate required fields
    if (!bootstrap_code || !google_id || !email) {
      return new Response(
        JSON.stringify({ success: false, error: 'INVALID_INPUT', message: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the secure bootstrap code from environment
    const validBootstrapCode = Deno.env.get('DEVELOPER_BOOTSTRAP_CODE');
    
    if (!validBootstrapCode) {
      console.error('DEVELOPER_BOOTSTRAP_CODE not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'CONFIG_ERROR', message: 'Bootstrap not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate the bootstrap code
    if (bootstrap_code.trim() !== validBootstrapCode) {
      console.log('Invalid bootstrap code attempt');
      return new Response(
        JSON.stringify({ success: false, error: 'INVALID_CODE', message: 'كود التفعيل غير صحيح' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if developer already exists
    const { data: existingDev, error: devCheckError } = await supabaseClient
      .from('user_roles')
      .select('id')
      .eq('role', 'DEVELOPER')
      .limit(1);

    if (devCheckError) {
      console.error('Error checking developer:', devCheckError);
      return new Response(
        JSON.stringify({ success: false, error: 'DB_ERROR', message: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existingDev && existingDev.length > 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'DEVELOPER_EXISTS', message: 'المطور مسجل بالفعل في النظام' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create profile for developer
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: full_name || 'المطور الرئيسي',
        role: 'DEVELOPER',
        google_id: google_id,
        email: email,
        email_verified: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      return new Response(
        JSON.stringify({ success: false, error: 'PROFILE_ERROR', message: 'Failed to create profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add developer role
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .upsert({
        user_id: user.id,
        role: 'DEVELOPER'
      }, { onConflict: 'user_id,role', ignoreDuplicates: true });

    if (roleError) {
      console.error('Error adding role:', roleError);
      return new Response(
        JSON.stringify({ success: false, error: 'ROLE_ERROR', message: 'Failed to assign role' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Developer bootstrap successful for user:', user.id);

    return new Response(
      JSON.stringify({
        success: true,
        role: 'DEVELOPER',
        message: 'تم تسجيلك كمطور رئيسي بنجاح'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Bootstrap error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'SERVER_ERROR', message: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
