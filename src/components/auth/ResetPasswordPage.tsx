import React, { useState, useEffect } from 'react';
import { KeyRound, Loader2, CheckCircle2, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [sessionReady, setSessionReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // التحقق من وجود جلسة استعادة كلمة المرور
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setSessionReady(true);
        } else {
          setError('رابط إعادة التعيين غير صالح أو منتهي الصلاحية');
        }
      } catch (err) {
        console.error('Session check error:', err);
        setError('حدث خطأ في التحقق من الرابط');
      } finally {
        setCheckingSession(false);
      }
    };

    // الاستماع لأحداث المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
        setCheckingSession(false);
      }
    });

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('يرجى إدخال كلمة المرور الجديدة');
      return;
    }

    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      
      // تسجيل الخروج بعد 3 ثواني وتوجيه للصفحة الرئيسية
      setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
      }, 3000);
    } catch (err: any) {
      console.error('Password update error:', err);
      setError(err.message || 'فشل في تحديث كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    window.location.href = '/';
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900" dir="rtl">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-white/40 font-bold">جارٍ التحقق من الرابط...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-tajawal bg-background" dir="rtl">
      {/* Header Section */}
      <div className="bg-slate-900 pt-14 pb-16 px-6 relative overflow-hidden flex flex-col items-center">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        {/* Logo */}
        <div className="w-20 h-20 rounded-[1.8rem] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl mb-5 z-10 border-4 border-white/5">
          <KeyRound size={40} className="text-white" />
        </div>
        
        {/* Title */}
        <h1 className="text-3xl font-black text-white mb-2 tracking-tight z-10">
          إعادة تعيين كلمة المرور
        </h1>
        
        {/* Subtitle */}
        <p className="text-white/50 text-[11px] font-bold z-10 text-center leading-relaxed max-w-[250px]">
          أدخل كلمة المرور الجديدة لحسابك
        </p>
      </div>

      {/* Card Section */}
      <div className="max-w-md w-full mx-auto px-6 -mt-8 z-20 flex-1 flex flex-col pb-24">
        <div className="bg-card rounded-[2.5rem] shadow-xl border overflow-hidden p-6">
          {!sessionReady && !success ? (
            /* Error State - Invalid Link */
            <div className="text-center py-8 space-y-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-12 h-12 text-destructive" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-black text-foreground">رابط غير صالح</h4>
                <p className="text-sm text-muted-foreground">
                  {error || 'هذا الرابط غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.'}
                </p>
              </div>
              <button
                onClick={goToLogin}
                className="w-full py-4 bg-foreground text-background rounded-2xl font-black transition-all hover:opacity-90"
              >
                العودة لتسجيل الدخول
              </button>
            </div>
          ) : success ? (
            /* Success State */
            <div className="text-center py-8 space-y-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-success/10 flex items-center justify-center animate-in zoom-in duration-500">
                <CheckCircle2 className="w-12 h-12 text-success" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-black text-foreground">تم التحديث بنجاح!</h4>
                <p className="text-sm text-muted-foreground">
                  تم تغيير كلمة المرور بنجاح. سيتم توجيهك لصفحة تسجيل الدخول...
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-primary">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-bold">جارٍ التوجيه...</span>
              </div>
            </div>
          ) : (
            /* Password Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  كلمة المرور الجديدة
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="input-field"
                    dir="ltr"
                    autoFocus
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground">يجب أن تكون 6 أحرف على الأقل</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">تأكيد كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className="input-field"
                    dir="ltr"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-2xl text-sm font-bold border border-destructive/20 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="w-full py-5 bg-foreground text-background rounded-2xl font-black text-base flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جارٍ التحديث...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    تحديث كلمة المرور
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;