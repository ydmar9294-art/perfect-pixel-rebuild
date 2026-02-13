import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';

/**
 * Auth page - handles OAuth callback tokens (from both web redirect and native deeplink).
 * Parses access_token/refresh_token from URL hash or query params,
 * calls setSession(), then redirects to home.
 */
const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const handleAuth = async () => {
      // Already logged in? Go home
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession) {
        navigate('/', { replace: true });
        return;
      }

      // Parse tokens from URL hash (Supabase implicit flow: /auth#access_token=xxx)
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const windowParams = new URLSearchParams(window.location.search);

      // Check for OAuth errors
      const errorParam = searchParams.get('error') || hashParams.get('error') || windowParams.get('error');
      const errorDescription = searchParams.get('error_description') || hashParams.get('error_description');
      if (errorParam) {
        setError(errorDescription || errorParam);
        return;
      }

      // Get tokens (try all sources: hash, search params, query params)
      const accessToken = hashParams.get('access_token') || searchParams.get('access_token') || windowParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token') || windowParams.get('refresh_token');

      if (accessToken) {
        try {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          if (sessionError) {
            setError(sessionError.message);
            return;
          }
          navigate('/', { replace: true });
        } catch (err) {
          setError(err instanceof Error ? err.message : 'فشل تعيين الجلسة');
        }
        return;
      }

      // No tokens - redirect to home (login screen)
      navigate('/', { replace: true });
    };

    handleAuth();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6" dir="rtl">
        <div className="bg-card rounded-[2.5rem] p-8 border shadow-xl max-w-md w-full space-y-6 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-destructive">فشل تسجيل الدخول</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground font-bold text-sm">جارٍ تسجيل الدخول...</p>
      </div>
    </div>
  );
};

export default Auth;
