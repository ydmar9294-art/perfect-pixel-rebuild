import React, { useState, useEffect } from 'react';
import { Key, Building2, User, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '@/store/AppContext';

interface UnifiedActivationProps {
  onSuccess: () => void;
}

const UnifiedActivation: React.FC<UnifiedActivationProps> = ({ onSuccess }) => {
  const { signUp } = useApp();
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [codeType, setCodeType] = useState<'unknown' | 'org' | 'employee'>('unknown');

  // Auto-detect code type
  useEffect(() => {
    const trimmedCode = code.trim().toUpperCase();
    if (trimmedCode.startsWith('EMP-')) {
      setCodeType('employee');
    } else if (trimmedCode.length >= 9 && trimmedCode.includes('-')) {
      setCodeType('org');
    } else {
      setCodeType('unknown');
    }
  }, [code]);

  const handleActivation = async () => {
    setError('');

    if (!code.trim()) {
      setError('يرجى إدخال كود التفعيل');
      return;
    }

    if (!email.trim()) {
      setError('يرجى إدخال البريد الإلكتروني');
      return;
    }

    if (!password) {
      setError('يرجى إدخال كلمة المرور');
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
      await signUp(email, password, code.trim().toUpperCase());
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'فشل في التفعيل');
    } finally {
      setLoading(false);
    }
  };

  const getCodeTypeInfo = () => {
    switch (codeType) {
      case 'org':
        return {
          icon: Building2,
          label: 'كود منشأة',
          description: 'سيتم تفعيلك كمالك للمنشأة',
          color: 'text-primary',
          bgColor: 'bg-primary/10'
        };
      case 'employee':
        return {
          icon: User,
          label: 'كود موظف',
          description: 'سيتم تفعيلك كموظف في المنشأة',
          color: 'text-success',
          bgColor: 'bg-success/10'
        };
      default:
        return {
          icon: Key,
          label: 'كود التفعيل',
          description: 'أدخل الكود للمتابعة',
          color: 'text-muted-foreground',
          bgColor: 'bg-muted'
        };
    }
  };

  const typeInfo = getCodeTypeInfo();
  const TypeIcon = typeInfo.icon;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Key className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-black text-foreground mb-2">
            تفعيل الحساب للمرة الأولى
          </h1>
          <p className="text-muted-foreground text-sm">
            أدخل كود التفعيل الذي استلمته لإنشاء حسابك
          </p>
        </div>

        {/* Form Card */}
        <div className="card-elevated p-6 space-y-5">
          {/* Activation Code */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">كود التفعيل</label>
            <div className="relative">
              <input
                type="text"
                placeholder="XXXX-XXXX أو EMP-XXXX-XXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="input-field text-center tracking-widest font-mono text-lg"
                dir="ltr"
              />
            </div>
            
            {/* Code Type Indicator */}
            {code.length > 0 && (
              <div className={`flex items-center gap-2 p-3 rounded-xl ${typeInfo.bgColor} mt-2`}>
                <TypeIcon className={`w-5 h-5 ${typeInfo.color}`} />
                <div>
                  <p className={`text-sm font-bold ${typeInfo.color}`}>{typeInfo.label}</p>
                  <p className="text-xs text-muted-foreground">{typeInfo.description}</p>
                </div>
              </div>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">البريد الإلكتروني</label>
            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              dir="ltr"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">كلمة المرور</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              dir="ltr"
            />
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">تأكيد كلمة المرور</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
              dir="ltr"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-xl">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleActivation}
            disabled={loading || !code || !email || !password}
            className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                جارٍ التفعيل...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                تفعيل الحساب
              </>
            )}
          </button>
        </div>

        {/* Help Text */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          إذا لم يكن لديك كود تفعيل، تواصل مع مدير النظام
        </p>
      </div>
    </div>
  );
};

export default UnifiedActivation;
