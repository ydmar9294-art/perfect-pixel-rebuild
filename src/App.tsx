import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from '@/store/AppContext';
import { UserRole, EmployeeType } from '@/types';
import { Layout } from '@/components/Layout';
import { ToastManager } from '@/components/ToastManager';
import { supabase } from '@/integrations/supabase/client';
import { 
  ShieldCheck, Eye, EyeOff, Loader2, Terminal, Store,
  Key, UserPlus, LogOut, Receipt, Wallet,
  LayoutDashboard, TrendingUp, Box, Users,
  Copy, CheckCircle2, X, Plus,
  Clock, Lock, Unlock, Activity,
  Calculator, DollarSign, AlertCircle
} from 'lucide-react';
import { CURRENCY } from '@/constants';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { LicenseStatus, Product } from '@/types';
import { FinanceTab } from '@/components/owner/FinanceTab';
import { EmployeeKPIs } from '@/components/owner/EmployeeKPIs';
import { InventoryTab } from '@/components/owner/InventoryTab';
import DistributorDashboard from '@/components/distributor/DistributorDashboard';
import AccountantDashboard from '@/components/accountant/AccountantDashboard';
import OwnerDashboard from '@/components/owner/OwnerDashboard';
import UnifiedActivation from '@/components/auth/UnifiedActivation';
import { usePushNotifications } from '@/hooks/usePushNotifications';

// ==========================================
// LOGIN VIEW
// ==========================================
import ForgotPasswordModal from '@/components/auth/ForgotPasswordModal';

const LoginView: React.FC = () => {
  const { login, loginDeveloper, isLoading, addNotification, developerExists } = useApp();
  const [mode, setMode] = useState<'login' | 'activate'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [tabSwitching, setTabSwitching] = useState(false);
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);

  const handleTabSwitch = (newMode: 'login' | 'activate') => {
    if (mode === newMode) return;
    setTabSwitching(true);
    setTimeout(() => {
      setMode(newMode);
      setTimeout(() => setTabSwitching(false), 100);
    }, 150);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      addNotification("يرجى إدخال كافة البيانات", "warning");
      return;
    }

    setLocalLoading(true);
    try {
      if (isDeveloperMode) {
        // Developer login mode
        const success = await loginDeveloper(email.trim(), password.trim());
        if (!success) {
          // Error notification already shown by loginDeveloper
        }
      } else {
        // Normal user login
        await login(email.trim(), password.trim());
      }
    } catch (err: any) {
      addNotification(err.message || "فشلت عملية الدخول", "error");
    } finally {
      setLocalLoading(false);
    }
  };

  const toggleDeveloperMode = () => {
    setIsDeveloperMode(!isDeveloperMode);
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex flex-col font-tajawal relative bg-background" dir="rtl">
      {/* Header Section */}
      <div className="bg-slate-900 pt-14 pb-16 px-6 relative overflow-hidden flex flex-col items-center shrink-0">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        {/* Developer Mode Toggle */}
        <button
          onClick={toggleDeveloperMode}
          className={`absolute top-4 left-4 p-2 rounded-xl transition-all z-20 ${
            isDeveloperMode 
              ? 'bg-primary text-primary-foreground shadow-lg' 
              : 'bg-white/10 text-white/40 hover:bg-white/20 hover:text-white/60'
          }`}
          title={isDeveloperMode ? 'إيقاف وضع المطور' : 'وضع المطور'}
        >
          <Terminal size={18} />
        </button>
        
        {/* Logo */}
        <div className={`w-20 h-20 rounded-[1.8rem] flex items-center justify-center shadow-2xl mb-5 z-10 border-4 border-white/5 animate-float ${
          isDeveloperMode 
            ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
            : 'bg-gradient-to-br from-blue-500 to-indigo-600'
        }`}>
          {isDeveloperMode ? <Terminal size={40} className="text-white" /> : <ShieldCheck size={40} className="text-white" />}
        </div>
        
        {/* Title */}
        <h1 className="text-3xl font-black text-white mb-2 tracking-tight z-10">
          {isDeveloperMode ? 'وضع المطور' : 'النظام الذكي'}
        </h1>
        
        {/* Subtitle */}
        <p className="text-white/50 text-[11px] font-bold z-10 text-center leading-relaxed max-w-[200px]">
          {isDeveloperMode 
            ? (developerExists ? 'تسجيل دخول المطور المعتمد' : 'تسجيل المطور الأول في النظام')
            : 'الخاص بإدارة البيع والتوزيع للمنشآت الصغيرة'
          }
        </p>
      </div>

      {/* Card Section */}
      <div className="max-w-md w-full mx-auto px-6 -mt-8 z-20 flex-1 flex flex-col pb-24">
        <div className="bg-card rounded-[2.5rem] shadow-xl border overflow-hidden">
          
          {/* Tab Switcher - Hidden in Developer Mode */}
          {!isDeveloperMode && (
            <div className={`flex bg-muted p-1.5 m-4 rounded-2xl border tab-container-animated ${tabSwitching ? 'switching' : ''}`}>
              <button 
                onClick={() => handleTabSwitch('login')} 
                className={`flex-1 py-3.5 rounded-xl font-black text-xs transition-all duration-300 ${
                  mode === 'login' 
                    ? 'bg-card text-foreground shadow-md' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                تسجيل الدخول
              </button>
              <button 
                onClick={() => handleTabSwitch('activate')} 
                className={`flex-1 py-3.5 rounded-xl font-black text-xs transition-all duration-300 ${
                  mode === 'activate' 
                    ? 'bg-card text-foreground shadow-md' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                تفعيل حساب جديد
              </button>
            </div>
          )}
          
          {/* Developer Mode Header */}
          {isDeveloperMode && (
            <div className="p-4 m-4 mb-0 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 rounded-xl">
                  <Terminal size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-black text-emerald-700 dark:text-emerald-300">
                    {developerExists ? 'تسجيل دخول المطور' : 'تسجيل المطور الأول'}
                  </p>
                  <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">
                    {developerExists ? 'أدخل بيانات حساب المطور المسجل' : 'سيتم تسجيلك كمطور رئيسي للنظام'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Content */}
          <div className="tab-content-enter" key={isDeveloperMode ? 'dev' : mode}>
            {isDeveloperMode ? (
              /* Developer Login Form */
              <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
                <input 
                  type="email" 
                  placeholder="بريد المطور الإلكتروني" 
                  value={email} 
                  disabled={localLoading}
                  className="input-field" 
                  onChange={e => setEmail(e.target.value)} 
                />
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="كلمة مرور المطور" 
                    value={password} 
                    disabled={localLoading}
                    className="input-field" 
                    onChange={e => setPassword(e.target.value)} 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <button 
                  type="submit" 
                  disabled={localLoading || isLoading} 
                  className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl hover:bg-emerald-700"
                >
                  {(localLoading || isLoading) ? <Loader2 size={24} className="animate-spin" /> : (
                    <>
                      <Terminal size={20} />
                      {developerExists ? 'دخول المطور' : 'تسجيل كمطور'}
                    </>
                  )}
                </button>
              </form>
            ) : mode === 'login' ? (
              <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                <input 
                  type="email" 
                  placeholder="البريد الإلكتروني" 
                  value={email} 
                  disabled={localLoading}
                  className="input-field" 
                  onChange={e => setEmail(e.target.value)} 
                />
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="كلمة المرور" 
                    value={password} 
                    disabled={localLoading}
                    className="input-field" 
                    onChange={e => setPassword(e.target.value)} 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <button 
                  type="submit" 
                  disabled={localLoading || isLoading} 
                  className="w-full py-5 bg-foreground text-background rounded-2xl font-black text-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl"
                >
                  {(localLoading || isLoading) ? <Loader2 size={24} className="animate-spin" /> : 'دخول النظام'}
                </button>
              </form>
            ) : (
              <div className="px-6 pb-6">
                <UnifiedActivation />
              </div>
            )}
          </div>
          
          {/* Forgot Password Link - Hidden in Developer Mode */}
          {mode === 'login' && !isDeveloperMode && (
            <div className="px-8 pb-5">
              <button 
                type="button" 
                onClick={() => setShowForgotPassword(true)}
                disabled={localLoading}
                className="w-full text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-2"
              >
                <Key size={14} />
                نسيت كلمة المرور؟
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        isOpen={showForgotPassword} 
        onClose={() => setShowForgotPassword(false)}
        initialEmail={email}
      />
    </div>
  );
};

// ==========================================
// DEVELOPER HUB
// ==========================================
const DeveloperHub: React.FC = () => {
  const { licenses, issueLicense, updateLicenseStatus, makeLicensePermanent, logout } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12 text-end" dir="rtl">
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-4xl font-black flex items-center gap-4">نظام التراخيص <Key className="text-primary" /></h1>
            <p className="text-slate-400 font-bold mt-2">إصدار ومراقبة مفاتيح التفعيل السحابية.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowForm(true)} className="px-8 py-4 bg-primary rounded-2xl font-black shadow-xl flex items-center gap-3 active:scale-95 transition-all"><UserPlus size={20} /> إصدار ترخيص</button>
            <button onClick={logout} className="px-6 py-4 bg-white/10 rounded-2xl font-black hover:bg-destructive/20 active:scale-95 transition-all"><LogOut size={20} /></button>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-[2.5rem] p-8 border shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-black flex items-center gap-2"><Activity size={20} className="text-primary"/> سجل التراخيص الصادرة</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {licenses.map((license) => (
            <div key={license.id} className={`p-6 rounded-[2.5rem] border-2 transition-all ${license.status === LicenseStatus.SUSPENDED ? 'bg-destructive/5 border-destructive/20' : 'bg-card border-border shadow-md'}`}>
              <div className="flex justify-between items-start mb-4">
                <span className={`badge ${license.status === LicenseStatus.ACTIVE ? 'badge-success' : license.status === LicenseStatus.READY ? 'badge-primary' : 'bg-destructive text-white'}`}>
                  {license.status === LicenseStatus.ACTIVE ? 'مفعل' : license.status === LicenseStatus.READY ? 'جاهز للتسليم' : 'موقوف'}
                </span>
                <span className="text-[10px] font-black text-muted-foreground flex items-center gap-1">
                  {license.type === 'TRIAL' ? <Clock size={12}/> : <ShieldCheck size={12}/>}
                  {license.type === 'TRIAL' ? 'تجريبي' : 'دائم'}
                </span>
              </div>
              
              <h3 className="font-black text-foreground text-lg mb-1">{license.orgName}</h3>
              
              <div onClick={() => copyKey(license.licenseKey)} className="bg-muted p-3 rounded-xl flex justify-between items-center cursor-pointer hover:bg-muted/80 transition-colors mb-6 group">
                <span className="font-mono font-black text-primary tracking-wider">{license.licenseKey}</span>
                {copied === license.licenseKey ? <CheckCircle2 size={16} className="text-success" /> : <Copy size={16} className="text-muted-foreground group-hover:text-primary" />}
              </div>

              {license.status !== LicenseStatus.READY && (
                <div className="flex gap-2 mb-6">
                  {license.status === LicenseStatus.ACTIVE ? (
                    <button onClick={() => updateLicenseStatus(license.id, license.ownerId || null, LicenseStatus.SUSPENDED)} className="flex-1 py-3 bg-destructive/10 text-destructive rounded-xl text-[10px] font-black flex items-center justify-center gap-2"><Lock size={14}/> إيقاف</button>
                  ) : (
                    <button onClick={() => updateLicenseStatus(license.id, license.ownerId || null, LicenseStatus.ACTIVE)} className="flex-1 py-3 bg-success text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-2"><Unlock size={14}/> تفعيل</button>
                  )}
                  {license.type === 'TRIAL' && (
                    <button onClick={() => makeLicensePermanent(license.id, license.ownerId || null)} className="flex-1 py-3 bg-primary/10 text-primary rounded-xl text-[10px] font-black flex items-center justify-center gap-2"><ShieldCheck size={14}/> تمليك</button>
                  )}
                </div>
              )}

              <div className="text-[9px] text-muted-foreground font-bold border-t pt-4 flex justify-between">
                <span>أنشئ: {new Date(license.issuedAt).toLocaleDateString('ar-EG')}</span>
                {license.expiryDate && <span>ينتهي: {new Date(license.expiryDate).toLocaleDateString('ar-EG')}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay p-4">
          <div className="bg-card rounded-[3rem] w-full max-w-md p-8 space-y-6 animate-zoom-in">
            <h3 className="text-xl font-black">إصدار ترخيص جديد</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              await issueLicense(fd.get('org') as string, fd.get('type') as any, Number(fd.get('days')));
              setShowForm(false);
            }} className="space-y-4">
              <input name="org" required placeholder="اسم المنشأة" className="input-field" />
              <select name="type" className="input-field">
                <option value="TRIAL">تجريبي (Trial)</option>
                <option value="PERMANENT">دائم (Permanent)</option>
              </select>
              <input name="days" type="number" defaultValue="30" placeholder="عدد أيام التجربة" className="input-field" />
              <button type="submit" className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-black shadow-lg">توليد الترخيص</button>
              <button type="button" onClick={() => setShowForm(false)} className="w-full py-4 bg-muted text-muted-foreground rounded-xl font-black">إغلاق</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
// OwnerDashboard is now imported from @/components/owner/OwnerDashboard

const KpiCard: React.FC<any> = ({ label, value, icon }) => (
  <div className="kpi-card text-end">
    <div className="p-3 rounded-2xl w-fit bg-primary/10 text-primary">{icon}</div>
    <div>
      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">{label}</span>
      <p className="text-2xl font-black text-foreground leading-none">{value} <span className="text-[11px] font-medium opacity-20">{CURRENCY}</span></p>
    </div>
  </div>
);


// ==========================================
// DISTRIBUTOR VIEW
// ==========================================
const DistributorView: React.FC = () => {
  const { user, customers, sales, addCustomer, submitInvoice, submitPayment, addNotification, logout } = useApp();
  const [activeMode, setActiveMode] = useState<'invoice' | 'payment' | 'customers'>('invoice');
  const [selectedCust, setSelectedCust] = useState('');
  const [selectedSale, setSelectedSale] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  const isReadOnly = user?.employeeType === EmployeeType.ACCOUNTANT;

  const handleInvoice = async () => {
    if (isReadOnly || !selectedCust || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const customer = customers.find(c => c.id === selectedCust);
      await submitInvoice({ customerId: selectedCust, customerName: customer?.name || 'غير معروف', grandTotal: 0, items: [], paymentType: 'CASH' });
      setIsSuccess(true);
    } catch (e: any) {
      addNotification("خطأ في إنشاء الفاتورة", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayment = async () => {
    if (isReadOnly || !selectedSale || paymentAmount <= 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitPayment({ saleId: selectedSale, amount: paymentAmount, notes: 'تحصيل ميداني' });
      setIsSuccess(true);
    } catch (e: any) {
      addNotification("خطأ في تسجيل الدفعة", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) return (
    <div className="flex flex-col items-center justify-center p-10 text-center animate-zoom-in">
      <CheckCircle2 size={64} className="text-success mb-4" />
      <h2 className="text-2xl font-black">تمت العملية بنجاح</h2>
      <button onClick={() => setIsSuccess(false)} className="mt-6 bg-foreground text-background px-8 py-3 rounded-xl font-bold">متابعة العمل</button>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in" dir="rtl">
      <div className="flex items-center justify-between bg-card px-5 py-4 rounded-[1.8rem] shadow-sm border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground"><Calculator size={20} /></div>
          <div>
            <h1 className="text-lg font-black text-foreground leading-none">{isReadOnly ? 'المحاسب المالي' : 'الموزع الميداني'} ({user?.name || 'المستخدم'})</h1>
            <p className="text-muted-foreground text-[9px] font-bold mt-1">{isReadOnly ? 'وضع العرض فقط' : 'إنشاء فواتير وتحصيل'}</p>
          </div>
        </div>
        <button onClick={logout} className="w-10 h-10 flex items-center justify-center bg-destructive/10 text-destructive rounded-xl active:scale-90"><LogOut size={20} /></button>
      </div>

      <div className="flex bg-card p-2 rounded-2xl shadow-sm border gap-2 overflow-x-auto">
        <button onClick={() => setActiveMode('invoice')} className={`flex-1 py-3 rounded-xl font-black text-xs ${activeMode === 'invoice' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>فواتير</button>
        <button onClick={() => setActiveMode('payment')} className={`flex-1 py-3 rounded-xl font-black text-xs ${activeMode === 'payment' ? 'bg-success text-success-foreground' : 'text-muted-foreground'}`}>تحصيل</button>
        <button onClick={() => setActiveMode('customers')} className={`flex-1 py-3 rounded-xl font-black text-xs ${activeMode === 'customers' ? 'bg-foreground text-background' : 'text-muted-foreground'}`}>الزبائن</button>
      </div>

      <div className="bg-card p-6 rounded-[2rem] border shadow-sm space-y-4">
        <label className="text-[10px] font-black text-muted-foreground uppercase mr-2">اختيار الزبون</label>
        <select value={selectedCust} onChange={e => { setSelectedCust(e.target.value); setSelectedSale(''); }} className="input-field">
          <option value="">-- ابحث عن زبون --</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {activeMode === 'payment' && selectedCust && (
          <>
            <label className="text-[10px] font-black text-muted-foreground uppercase mr-2">اختيار الفاتورة</label>
            <select value={selectedSale} onChange={e => setSelectedSale(e.target.value)} className="input-field">
              <option value="">-- اختر الفاتورة --</option>
              {sales.filter(s => s.customer_id === selectedCust && !s.isVoided).map(s => (
                <option key={s.id} value={s.id}>فاتورة #{s.id.slice(0,8)} - القيمة: {s.grandTotal}</option>
              ))}
            </select>
            <label className="text-[10px] font-black text-muted-foreground uppercase mr-2">المبلغ</label>
            <input type="number" placeholder="0" className="input-field" value={paymentAmount || ''} onChange={e => setPaymentAmount(Number(e.target.value))} />
          </>
        )}

        {activeMode === 'customers' && !isReadOnly && (
          <button onClick={() => setShowAddCustomer(true)} className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black flex items-center justify-center gap-2">
            <Plus size={18} /> إضافة زبون جديد
          </button>
        )}
      </div>

      {isReadOnly ? (
        <div className="bg-warning/10 p-6 rounded-[1.5rem] border border-warning/20 flex items-center gap-4 text-warning">
          <AlertCircle />
          <p className="text-xs font-bold leading-relaxed">أنت في وضع "المحاسب المالي". يمكنك استعراض البيانات فقط.</p>
        </div>
      ) : (
        <>
          {activeMode === 'invoice' && (
            <button onClick={handleInvoice} disabled={isSubmitting || !selectedCust} className="w-full py-5 bg-primary text-primary-foreground rounded-[1.5rem] font-black shadow-xl disabled:opacity-50 active:scale-95 transition-all">
              {isSubmitting ? 'جاري الاعتماد...' : 'اعتماد فاتورة جديدة'}
            </button>
          )}
          {activeMode === 'payment' && (
            <button onClick={handlePayment} disabled={isSubmitting || !selectedSale || paymentAmount <= 0} className="w-full py-5 bg-success text-success-foreground rounded-[1.5rem] font-black shadow-xl disabled:opacity-50 active:scale-95 transition-all">
              {isSubmitting ? 'جاري تسجيل الدفعة...' : 'تسجيل التحصيل المالي'}
            </button>
          )}
        </>
      )}

      {showAddCustomer && (
        <div className="modal-overlay">
          <div className="bg-card rounded-[2.5rem] w-full max-w-md p-8 space-y-6 animate-zoom-in">
            <h3 className="text-xl font-black">إضافة زبون جديد</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              await addCustomer(fd.get('name') as string, fd.get('phone') as string);
              setShowAddCustomer(false);
            }} className="space-y-4">
              <input name="name" required placeholder="اسم الزبون" className="input-field" />
              <input name="phone" placeholder="رقم الهاتف" className="input-field" />
              <button type="submit" className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-black">إضافة</button>
              <button type="button" onClick={() => setShowAddCustomer(false)} className="w-full py-4 bg-muted text-muted-foreground rounded-xl font-black">إلغاء</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// AccountantView and DistributorView are now imported from their respective components
const StatCard = ({ label, val, icon, isCount }: any) => (
  <div className="bg-card p-5 rounded-2xl border flex items-center gap-4">
    <div className="p-3 rounded-xl bg-primary/10 text-primary">{icon}</div>
    <div>
      <p className="text-[10px] font-black text-muted-foreground uppercase">{label}</p>
      <p className="text-lg font-black">{val.toLocaleString()} {!isCount && CURRENCY}</p>
    </div>
  </div>
);

// ==========================================
// VIEW MANAGER
// ==========================================
const ViewManager: React.FC = () => {
  const { user, organization, logout } = useApp();
  if (!user) return <LoginView />;

  if (user.role === UserRole.OWNER && !organization) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center" dir="rtl">
        <div className="max-w-md space-y-6 animate-zoom-in">
          <div className="w-24 h-24 bg-destructive rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-2xl">
            <Store size={48} />
          </div>
          <h2 className="text-3xl font-black text-white">لا توجد منشأة نشطة</h2>
          <p className="text-slate-400 font-bold text-lg leading-relaxed">لم يتم ربط حسابك بأي منشأة تجارية.</p>
          <button onClick={logout} className="w-full py-4 bg-white/10 text-white rounded-2xl font-black mt-8 active:scale-95 transition-all">تسجيل الخروج</button>
        </div>
      </div>
    );
  }

  switch (user.role) {
    case UserRole.OWNER: return <OwnerDashboard />;
    case UserRole.EMPLOYEE:
      return user.employeeType === EmployeeType.ACCOUNTANT ? <AccountantDashboard /> : <DistributorDashboard />;
    case UserRole.DEVELOPER: return <DeveloperHub />;
    default: return <OwnerDashboard />;
  }
};

// ==========================================
// MAIN CONTENT
// ==========================================
const MainContent: React.FC = () => {
  const { user, isLoading } = useApp();
  const [showRetry, setShowRetry] = useState(false);
  
  // Initialize push notifications
  const { isInitialized: pushInitialized } = usePushNotifications();

  // إظهار زر إعادة المحاولة بعد 5 ثواني
  React.useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setShowRetry(true), 5000);
      return () => clearTimeout(timer);
    } else {
      setShowRetry(false);
    }
  }, [isLoading]);

  const handleRetry = () => {
    window.location.reload();
  };

  if (isLoading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-900">
      <Loader2 size={48} className="animate-spin text-primary mb-4" />
      <p className="text-white/40 font-black text-sm mb-2">جارٍ تحميل النظام...</p>
      <p className="text-white/20 font-bold text-[10px] uppercase tracking-[0.2em]">Smart System</p>
      
      {showRetry && (
        <div className="mt-8 text-center animate-fade-in">
          <p className="text-white/30 text-xs mb-3">يبدو أن التحميل يستغرق وقتاً أطول</p>
          <button
            onClick={handleRetry}
            className="px-6 py-3 bg-primary/20 text-primary rounded-xl font-bold text-sm hover:bg-primary/30 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <ToastManager />
      {!user ? <LoginView /> : <Layout><ViewManager /></Layout>}
    </>
  );
};

// ==========================================
// APP - Main Application Entry Point
// ==========================================
const App: React.FC = () => {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
};

export default App;
