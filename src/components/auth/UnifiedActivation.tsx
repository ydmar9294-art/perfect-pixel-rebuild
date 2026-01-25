import React, { useState, useEffect } from 'react';
import { Key, Building2, User, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, Sparkles } from 'lucide-react';
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
      
      addNotification('تم تفعيل الحساب بنجاح! جاري تسجيل الدخول...', 'success');
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
          borderColor: 'border-primary/30',
          glowColor: 'shadow-primary/20'
        };
      case 'employee':
        return {
          icon: User,
          label: 'كود موظف',
          description: 'سيتم تفعيلك كموظف في المنشأة',
          color: 'text-success',
          bgColor: 'bg-success/10',
          borderColor: 'border-success/30',
          glowColor: 'shadow-success/20'
        };
      default:
        return {
          icon: Key,
          label: 'كود التفعيل',
          description: 'أدخل الكود للمتابعة',
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          borderColor: 'border-border',
          glowColor: ''
        };
    }
  };

  const typeInfo = getCodeTypeInfo();
  const TypeIcon = typeInfo.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 pb-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-3">
          <Sparkles className="w-7 h-7 text-primary" />
        </div>
        <h3 className="text-lg font-black text-foreground">تفعيل حساب جديد</h3>
        <p className="text-xs text-muted-foreground">أدخل كود التفعيل الخاص بك للبدء</p>
      </div>

      {/* Activation Code */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-foreground flex items-center gap-2">
          <Key className="w-4 h-4 text-primary" />
          كود التفعيل
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="XXXX-XXXX أو EMP-XXXX"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            disabled={loading}
            className={`input-field text-center tracking-[0.3em] font-mono text-lg transition-all duration-300 ${
              codeType !== 'unknown' 
                ? `${typeInfo.bgColor} border-2 ${typeInfo.borderColor} shadow-lg ${typeInfo.glowColor}` 
                : 'bg-muted'
            }`}
            dir="ltr"
          />
        </div>
        
        {/* Code Type Indicator with Animation */}
        <div className={`overflow-hidden transition-all duration-500 ease-out ${code.length > 0 ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className={`flex items-center gap-3 p-4 rounded-2xl ${typeInfo.bgColor} border ${typeInfo.borderColor} transition-all duration-300`}>
            <div className={`w-10 h-10 rounded-xl ${typeInfo.bgColor} flex items-center justify-center`}>
              <TypeIcon className={`w-5 h-5 ${typeInfo.color}`} />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-black ${typeInfo.color}`}>{typeInfo.label}</p>
              <p className="text-[11px] text-muted-foreground">{typeInfo.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Email */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-foreground">البريد الإلكتروني</label>
        <input
          type="email"
          placeholder="example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className="input-field transition-all duration-300 focus:shadow-lg focus:shadow-primary/10"
          dir="ltr"
        />
      </div>

      {/* Password */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-foreground">كلمة المرور</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="input-field transition-all duration-300 focus:shadow-lg focus:shadow-primary/10"
            dir="ltr"
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

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive rounded-2xl border border-destructive/20 animate-in slide-in-from-top duration-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleActivation}
        disabled={loading || !code || !email || !password}
        className="w-full py-5 bg-foreground text-background rounded-2xl font-black text-base flex items-center justify-center gap-3 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 shadow-xl shadow-foreground/10 hover:shadow-2xl hover:shadow-foreground/20"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            جارٍ التفعيل...
          </>
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5" />
            تفعيل الحساب والدخول
          </>
        )}
      </button>

      {/* Help Text */}
      <div className="text-center space-y-1 pt-2">
        <p className="text-[11px] text-muted-foreground">
          <span className="font-bold">كود المنشأة:</span> XXXX-XXXX
        </p>
        <p className="text-[11px] text-muted-foreground">
          <span className="font-bold">كود الموظف:</span> EMP-XXXX-XXXX
        </p>
      </div>
    </div>
  );
};

export default UnifiedActivation;
