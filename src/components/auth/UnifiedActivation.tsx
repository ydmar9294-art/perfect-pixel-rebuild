import React, { useState, useEffect } from 'react';
import { Key, Building2, User, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useApp } from '@/store/AppContext';

interface UnifiedActivationProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

const UnifiedActivation: React.FC<UnifiedActivationProps> = ({ onSuccess, onBack }) => {
  const { signUp, signUpEmployee, addNotification } = useApp();
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [codeType, setCodeType] = useState<'unknown' | 'org' | 'employee'>('unknown');

  // Auto-detect code type
  useEffect(() => {
    const trimmedCode = code.trim().toUpperCase();
    if (trimmedCode.startsWith('EMP-')) {
      setCodeType('employee');
    } else if (trimmedCode.length >= 4 && !trimmedCode.startsWith('EMP-')) {
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

    setLoading(true);

    try {
      const trimmedCode = code.trim().toUpperCase();
      
      // تحديد نوع التفعيل تلقائياً بناءً على الكود
      if (trimmedCode.startsWith('EMP-')) {
        // كود موظف
        await signUpEmployee(email.trim(), password, trimmedCode);
      } else {
        // كود منشأة
        await signUp(email.trim(), password, trimmedCode);
      }
      
      addNotification('تم تفعيل الحساب بنجاح!', 'success');
      onSuccess?.();
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
          bgColor: 'bg-primary/10',
          borderColor: 'border-primary/20'
        };
      case 'employee':
        return {
          icon: User,
          label: 'كود موظف',
          description: 'سيتم تفعيلك كموظف في المنشأة',
          color: 'text-success',
          bgColor: 'bg-success/10',
          borderColor: 'border-success/20'
        };
      default:
        return {
          icon: Key,
          label: 'كود التفعيل',
          description: 'أدخل الكود للمتابعة',
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          borderColor: 'border-border'
        };
    }
  };

  const typeInfo = getCodeTypeInfo();
  const TypeIcon = typeInfo.icon;

  return (
    <div className="space-y-5">
      {/* Activation Code */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-foreground">كود التفعيل</label>
        <div className="relative">
          <input
            type="text"
            placeholder="أدخل كود المنشأة أو الموظف"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            disabled={loading}
            className={`input-field text-center tracking-widest font-mono text-lg ${typeInfo.bgColor} border-2 ${typeInfo.borderColor}`}
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
          disabled={loading}
          className="input-field"
          dir="ltr"
        />
      </div>

      {/* Password */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-foreground">كلمة المرور</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="input-field"
            dir="ltr"
          />
          <button 
            type="button" 
            onClick={() => setShowPassword(!showPassword)} 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
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
        className="w-full py-5 bg-foreground text-background rounded-2xl font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
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

      {/* Help Text */}
      <p className="text-center text-xs text-muted-foreground">
        أدخل كود المنشأة (مثال: XXXX-XXXX) أو كود الموظف (مثال: EMP-XXXX-XXXX)
      </p>
    </div>
  );
};

export default UnifiedActivation;
