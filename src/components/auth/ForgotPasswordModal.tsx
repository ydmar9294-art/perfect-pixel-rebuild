import React, { useState } from 'react';
import { X, Mail, Loader2, CheckCircle2, ArrowRight, KeyRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose, initialEmail = '' }) => {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('يرجى إدخال البريد الإلكتروني');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'فشل إرسال رابط إعادة التعيين');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSent(false);
    setError('');
    setEmail(initialEmail);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay p-4 animate-in fade-in duration-300" onClick={handleClose}>
      <div 
        className="bg-card rounded-[2.5rem] w-full max-w-md p-8 space-y-6 animate-in zoom-in duration-300 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <button 
            onClick={handleClose}
            className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all"
          >
            <X size={20} />
          </button>
          <h3 className="text-xl font-black text-foreground">استعادة كلمة المرور</h3>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {!sent ? (
          <>
            {/* Icon */}
            <div className="text-center py-4">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                <KeyRound className="w-10 h-10 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="input-field"
                  dir="ltr"
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-2xl text-sm font-bold border border-destructive/20">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-5 bg-foreground text-background rounded-2xl font-black text-base flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جارٍ الإرسال...
                  </>
                ) : (
                  <>
                    إرسال رابط الاستعادة
                    <ArrowRight className="w-5 h-5 rotate-180" />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          /* Success State */
          <div className="text-center py-8 space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-success/10 flex items-center justify-center animate-in zoom-in duration-500">
              <CheckCircle2 className="w-12 h-12 text-success" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-black text-foreground">تم الإرسال بنجاح!</h4>
              <p className="text-sm text-muted-foreground">
                تم إرسال رابط إعادة تعيين كلمة المرور إلى
              </p>
              <p className="text-sm font-bold text-primary" dir="ltr">{email}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              تحقق من بريدك الإلكتروني واتبع التعليمات
            </p>
            <button
              onClick={handleClose}
              className="w-full py-4 bg-muted text-foreground rounded-2xl font-black transition-all hover:bg-muted/80"
            >
              حسناً، فهمت
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
