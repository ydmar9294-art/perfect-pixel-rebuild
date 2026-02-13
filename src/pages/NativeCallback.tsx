import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

/**
 * NativeCallback page - runs inside ASWebAuthenticationSession / Chrome Custom Tab.
 * Parses OAuth tokens from URL hash, then redirects to a deeplink to:
 * 1. Close the browser session
 * 2. Pass tokens back to the native app's WebView
 */
const NativeCallback = () => {
  const [searchParams] = useSearchParams();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    // Get deeplink scheme from query params (set by auth-start edge function)
    const deeplinkScheme = searchParams.get('deeplink_scheme') ||
      new URLSearchParams(window.location.search).get('deeplink_scheme');

    if (!deeplinkScheme) {
      console.error('[NativeCallback] No deeplink_scheme provided');
      return;
    }

    // Parse tokens from URL hash (Supabase implicit flow puts them here)
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);

    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (!accessToken) {
      // Check for errors
      const error = hashParams.get('error') || searchParams.get('error');
      const errorDesc = hashParams.get('error_description') || searchParams.get('error_description');

      // Redirect to app with error
      const errorUrl = `${deeplinkScheme}://oauth/auth?error=${encodeURIComponent(error || 'unknown')}&error_description=${encodeURIComponent(errorDesc || '')}`;
      window.location.href = errorUrl;
      return;
    }

    // Build deeplink URL
    // Format: myapp://oauth/auth?access_token=xxx&refresh_token=yyy
    // - myapp:// = app scheme
    // - oauth/ = tells native code to close browser session
    // - auth = path to navigate to in WebView
    const params = new URLSearchParams();
    params.set('access_token', accessToken);
    if (refreshToken) {
      params.set('refresh_token', refreshToken);
    }

    const deeplinkUrl = `${deeplinkScheme}://oauth/auth?${params.toString()}`;

    // This closes the ASWebAuthenticationSession / Chrome Custom Tab
    // and opens /auth?access_token=xxx in the WebView
    window.location.href = deeplinkUrl;
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground font-bold text-sm">جارٍ إكمال تسجيل الدخول...</p>
      </div>
    </div>
  );
};

export default NativeCallback;
