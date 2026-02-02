import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Loader2, AlertCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getCachedAuth, clearAuthCache } from '@/lib/authCache';
import { checkAuthStatus } from '@/hooks/useAuthOperations';
import GoogleAuthButton from './GoogleAuthButton';
import LicenseActivation from './LicenseActivation';

interface AuthFlowProps {
  onAuthComplete: () => void;
}

type AuthState = 
  | { type: 'initial' }
  | { type: 'loading' }
  | { type: 'needs_activation'; userId: string; googleId: string; email: string; fullName: string }
  | { type: 'access_denied'; reason: string; message: string }
  | { type: 'error'; message: string };

const AuthFlow: React.FC<AuthFlowProps> = ({ onAuthComplete }) => {
  const [authState, setAuthState] = useState<AuthState>({ type: 'initial' });
  const [authError, setAuthError] = useState<string>('');

  const checkUserProfile = useCallback(async (userId: string, user: any) => {
    try {
      // Get Google provider data
      const googleId = user.user_metadata?.sub || user.user_metadata?.provider_id || user.id;
      const email = user.email || '';
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
      const emailVerified = user.email_confirmed_at || user.user_metadata?.email_verified;

      // Check if email is verified
      if (!emailVerified) {
        setAuthState({
          type: 'access_denied',
          reason: 'EMAIL_NOT_VERIFIED',
          message: 'يجب التحقق من البريد الإلكتروني عبر Google'
        });
        return;
      }

      // Use optimized auth-status endpoint
      const status = await checkAuthStatus();

      if (!status.authenticated) {
        setAuthState({
          type: 'needs_activation',
          userId,
          googleId,
          email,
          fullName
        });
        return;
      }

      if (status.access_denied) {
        setAuthState({
          type: 'access_denied',
          reason: status.reason || 'UNKNOWN',
          message: status.message || 'تم رفض الوصول'
        });
        return;
      }

      if (status.needs_activation) {
        setAuthState({
          type: 'needs_activation',
          userId,
          googleId: status.google_id || googleId,
          email: status.email || email,
          fullName: status.full_name || fullName
        });
        return;
      }

      // Profile exists and active - complete auth
      onAuthComplete();
    } catch (err: any) {
      console.error('[AuthFlow] Check profile error:', err);
      setAuthState({
        type: 'error',
        message: err.message || 'حدث خطأ في التحقق من الحساب'
      });
    }
  }, [onAuthComplete]);

  // Listen for auth state changes
  useEffect(() => {
    // Check cache first for fast path
    const cached = getCachedAuth();
    
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthFlow] Auth event:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        // If we have valid cache for this user, skip profile check
        if (cached && cached.userId === session.user.id) {
          console.log('[AuthFlow] Cache hit - fast completing auth');
          onAuthComplete();
          return;
        }
        
        setAuthState({ type: 'loading' });
        await checkUserProfile(session.user.id, session.user);
      } else if (event === 'SIGNED_OUT') {
        clearAuthCache();
        setAuthState({ type: 'initial' });
      }
    });

    // Check initial session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Fast path with cache
        if (cached && cached.userId === session.user.id) {
          console.log('[AuthFlow] Initial cache hit - fast completing auth');
          onAuthComplete();
          return;
        }
        
        setAuthState({ type: 'loading' });
        await checkUserProfile(session.user.id, session.user);
      }
    };
    
    checkSession();

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [checkUserProfile, onAuthComplete]);

  const handleLogout = async () => {
    clearAuthCache();
    await supabase.auth.signOut();
    setAuthState({ type: 'initial' });
    setAuthError('');
  };

  const handleActivationSuccess = () => {
    onAuthComplete();
  };

  const handleGoogleError = (error: string) => {
    setAuthError(error);
  };

  // Render based on auth state
  const renderContent = () => {
    switch (authState.type) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground font-bold text-sm">جارٍ التحقق من الحساب...</p>
          </div>
        );

      case 'needs_activation':
        return (
          <LicenseActivation
            userId={authState.userId}
            googleId={authState.googleId}
            email={authState.email}
            fullName={authState.fullName}
            onSuccess={handleActivationSuccess}
            onLogout={handleLogout}
          />
        );

      case 'access_denied':
        return (
          <div className="space-y-6 text-center py-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-destructive">تم رفض الوصول</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                {authState.message}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-8 py-3 bg-muted text-foreground rounded-2xl font-bold text-sm hover:bg-muted/80 transition-colors"
            >
              تسجيل الخروج
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="space-y-6 text-center py-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-destructive">حدث خطأ</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                {authState.message}
              </p>
            </div>
            <button
              onClick={() => setAuthState({ type: 'initial' })}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm hover:bg-primary/90 transition-colors"
            >
              المحاولة مرة أخرى
            </button>
          </div>
        );

      case 'initial':
      default:
        return (
          <div className="space-y-6">
            {/* Welcome Message */}
            <div className="text-center space-y-2 pb-4">
              <h3 className="text-lg font-black text-foreground">مرحباً بك</h3>
              <p className="text-xs text-muted-foreground">
                سجل دخولك بحساب Google للمتابعة
              </p>
            </div>

            {/* Error Display */}
            {authError && (
              <div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive rounded-2xl border border-destructive/20">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-bold">{authError}</p>
              </div>
            )}

            {/* Google Sign In Button */}
            <GoogleAuthButton onError={handleGoogleError} />

            {/* Security Notice */}
            <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
              <ShieldCheck className="w-4 h-4" />
              <span>تسجيل دخول آمن عبر Google</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-tajawal relative bg-background" dir="rtl">
      {/* Header Section */}
      <div className="bg-slate-900 pt-14 pb-16 px-6 relative overflow-hidden flex flex-col items-center shrink-0">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        {/* Logo */}
        <div className="w-20 h-20 rounded-[1.8rem] flex items-center justify-center shadow-2xl mb-5 z-10 border-4 border-white/5 animate-float bg-gradient-to-br from-blue-500 to-indigo-600">
          <ShieldCheck size={40} className="text-white" />
        </div>
        
        {/* Title */}
        <h1 className="text-3xl font-black text-white mb-2 tracking-tight z-10">
          النظام الذكي
        </h1>
        
        {/* Subtitle */}
        <p className="text-white/50 text-[11px] font-bold z-10 text-center leading-relaxed max-w-[200px]">
          الخاص بإدارة البيع والتوزيع للمنشآت الصغيرة
        </p>
      </div>

      {/* Card Section */}
      <div className="max-w-md w-full mx-auto px-6 -mt-8 z-20 flex-1 flex flex-col pb-24">
        <div className="bg-card rounded-[2.5rem] shadow-xl border overflow-hidden p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AuthFlow;
