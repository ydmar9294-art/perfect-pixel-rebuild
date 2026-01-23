import React, { useState } from 'react';
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

// ==========================================
// LOGIN VIEW
// ==========================================
const LoginView: React.FC = () => {
  const { login, signUp, signUpEmployee, loginDeveloper, isLoading, addNotification, developerExists } = useApp();
  const [mode, setMode] = useState<'login' | 'signup' | 'employee'>('login');
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      addNotification("يرجى إدخال كافة البيانات", "warning");
      return;
    }

    setLocalLoading(true);
    try {
      if (isDeveloperMode) {
        const success = await loginDeveloper(email.trim(), password.trim());
        if (!success) addNotification("بيانات المطور غير صحيحة", "error");
      } else {
        if (!developerExists) {
          addNotification("يجب تسجيل دخول المطور أولاً", "error");
          return;
        }
        if (mode === 'signup') {
          if (!activationCode.trim()) {
            addNotification("كود تفعيل المنشأة مطلوب", "error");
            return;
          }
          await signUp(email.trim(), password.trim(), activationCode.trim().toUpperCase());
        } else if (mode === 'employee') {
          if (!activationCode.trim()) {
            addNotification("كود تفعيل الموظف مطلوب", "error");
            return;
          }
          await signUpEmployee(email.trim(), password.trim(), activationCode.trim().toUpperCase());
        } else {
          await login(email.trim(), password.trim());
        }
      }
    } catch (err: any) {
      addNotification(err.message || "فشلت عملية الدخول", "error");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      addNotification("أدخل البريد الإلكتروني أولاً", "warning");
      return;
    }
    setLocalLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin
      });
      if (error) throw error;
      addNotification("تم إرسال رابط إعادة تعيين كلمة المرور", "success");
    } catch (err: any) {
      addNotification(err.message || "فشل إرسال الرابط", "error");
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-tajawal relative ${isDeveloperMode ? 'bg-slate-900' : 'bg-background'}`} dir="rtl">
      <div className={`${isDeveloperMode ? 'bg-slate-800 border-b border-white/5' : 'bg-slate-900'} pt-14 pb-12 px-6 relative overflow-hidden flex flex-col items-center shrink-0`}>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        <div className={`w-20 h-20 rounded-[1.8rem] flex items-center justify-center shadow-2xl mb-5 z-10 border-4 border-white/5 ${isDeveloperMode ? 'bg-primary' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
          {isDeveloperMode ? <Terminal size={40} className="text-white" /> : <ShieldCheck size={40} className="text-white" />}
        </div>
        <h1 className="text-3xl font-black text-white mb-1 tracking-tight z-10">
          {isDeveloperMode ? 'بوابة المطورين' : 'النظام الذكي'}
        </h1>
        <p className="text-white/60 text-[10px] font-medium z-10 mb-8 text-center leading-relaxed">
          الخاص بإدارة البيع والتوزيع للمنشآت الصغيرة
        </p>
      </div>

      <div className="max-w-md w-full mx-auto px-6 -mt-6 z-20 flex-1 flex flex-col pb-24">
        <div className="bg-card rounded-[2.5rem] shadow-xl border overflow-hidden">
          <div className="flex bg-muted p-1 m-4 rounded-2xl border">
            {!isDeveloperMode ? (
              <>
                <button onClick={() => { setMode('login'); setActivationCode(''); }} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${mode === 'login' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>دخول</button>
                <button onClick={() => { setMode('signup'); setActivationCode(''); }} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${mode === 'signup' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>تفعيل منشأة</button>
                <button onClick={() => { setMode('employee'); setActivationCode(''); }} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${mode === 'employee' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>تفعيل موظف</button>
              </>
            ) : (
              <div className="w-full text-center py-3.5 font-black text-foreground text-sm">واجهة التطوير التقني</div>
            )}
          </div>
          
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
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {mode === 'signup' && !isDeveloperMode && (
              <input 
                type="text" 
                placeholder="كود تفعيل المنشأة" 
                value={activationCode} 
                disabled={localLoading}
                className="w-full bg-primary/10 border-2 border-primary/20 rounded-2xl px-6 py-4 font-black text-primary outline-none uppercase" 
                onChange={e => setActivationCode(e.target.value)} 
              />
            )}
            {mode === 'employee' && !isDeveloperMode && (
              <input 
                type="text" 
                placeholder="كود تفعيل الموظف (EMP-XXXX-XXXX)" 
                value={activationCode} 
                disabled={localLoading}
                className="w-full bg-success/10 border-2 border-success/20 rounded-2xl px-6 py-4 font-black text-success outline-none uppercase" 
                onChange={e => setActivationCode(e.target.value)} 
              />
            )}
            <button 
              type="submit" 
              disabled={localLoading || isLoading} 
              className="w-full py-5 bg-foreground text-background rounded-2xl font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
            >
              {(localLoading || isLoading) ? <Loader2 size={24} className="animate-spin" /> : mode === 'login' ? 'دخول النظام' : 'تفعيل الحساب'}
            </button>
          </form>
          
          {/* Forgot Password Link */}
          {mode === 'login' && !isDeveloperMode && (
            <div className="px-8 pb-4">
              <button 
                type="button" 
                onClick={handleForgotPassword}
                disabled={localLoading}
                className="w-full text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-2"
              >
                <Key size={14} />
                نسيت كلمة المرور؟
              </button>
            </div>
          )}
          
          <div className="px-8 pb-6 border-t border-border pt-4 flex justify-center">
            <button 
              onClick={() => setIsDeveloperMode(!isDeveloperMode)} 
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
              title={isDeveloperMode ? 'العودة لواجهة المستخدم' : 'بوابة المطورين'}
            >
              {isDeveloperMode ? <Store size={18} /> : <Terminal size={18} />}
            </button>
          </div>
        </div>
      </div>
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

// ==========================================
// OWNER DASHBOARD
// ==========================================
const OwnerDashboard: React.FC = () => {
  const { user, sales = [], payments = [], products = [], users = [], customers = [], logout, addDistributor, pendingEmployees = [] } = useApp();
  const [activeTab, setActiveTab] = useState<'daily' | 'team' | 'inventory' | 'customers' | 'finance'>('daily');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [newEmployeeCode, setNewEmployeeCode] = useState<string | null>(null);
  const [newEmployeeData, setNewEmployeeData] = useState<any | null>(null);

  React.useEffect(() => { setIsMounted(true); }, []);

  const stats = React.useMemo(() => {
    const todayStart = new Date().setHours(0,0,0,0);
    const todaySales = sales.filter(s => s.timestamp >= todayStart);
    const todayRevenue = todaySales.reduce((s, i) => s + i.grandTotal, 0);
    const totalCollections = payments.filter(c => c.timestamp >= todayStart).reduce((s, i) => s + i.amount, 0);

    const chartData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const sOfDay = new Date(d).setHours(0,0,0,0);
      const eOfDay = new Date(d).setHours(23,59,59,999);
      const daySales = sales.filter(s => s.timestamp >= sOfDay && s.timestamp <= eOfDay);
      return { day: d.toLocaleDateString('ar-EG', { weekday: 'short' }), revenue: daySales.reduce((s, v) => s + v.grandTotal, 0) };
    });

    return { todayRevenue, totalCollections, chartData };
  }, [sales, payments]);

  const teamMembers = users.filter(u => u.role === UserRole.EMPLOYEE);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const result = await addDistributor(
      fd.get('name') as string, 
      fd.get('phone') as string, 
      UserRole.EMPLOYEE, 
      fd.get('type') as EmployeeType
    );
    
    if (result.code) {
      setNewEmployeeCode(result.code);
      setNewEmployeeData(result.employee);
    }
  };

  const closeEmployeeModal = () => {
    setShowAddUserModal(false);
    setNewEmployeeCode(null);
    setNewEmployeeData(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-24 text-end animate-fade-in" dir="rtl">
      <div className="flex items-center justify-between bg-card px-5 py-4 rounded-[1.8rem] shadow-sm border mx-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground"><ShieldCheck size={20} /></div>
          <div>
            <h1 className="text-lg font-black text-foreground leading-none">لوحة المالك ({user?.name || 'المستخدم'})</h1>
            <p className="text-muted-foreground text-[9px] font-bold mt-1">الإدارة المالية الذكية</p>
          </div>
        </div>
        <button onClick={logout} className="w-10 h-10 flex items-center justify-center bg-destructive/10 text-destructive rounded-xl active:scale-90"><LogOut size={20} /></button>
      </div>

      <div className="sticky top-2 z-[100] mx-2 grid grid-cols-5 gap-1 bg-card/80 backdrop-blur-lg p-1.5 rounded-2xl border shadow-xl">
        <TabBtn active={activeTab === 'daily'} onClick={() => setActiveTab('daily')} icon={<LayoutDashboard size={16}/>} label="الرئيسية" />
        <TabBtn active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon={<Box size={16}/>} label="المخزون" />
        <TabBtn active={activeTab === 'team'} onClick={() => setActiveTab('team')} icon={<Users size={16}/>} label="الفريق" />
        <TabBtn active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} icon={<DollarSign size={16}/>} label="الزبائن" />
        <TabBtn active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} icon={<TrendingUp size={16}/>} label="المالية" />
      </div>

      <div className="px-2 space-y-4">
        {activeTab === 'daily' && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-3">
              <KpiCard label="مبيعات اليوم" value={stats.todayRevenue.toLocaleString()} icon={<Receipt size={18}/>} />
              <KpiCard label="التحصيل" value={stats.totalCollections.toLocaleString()} icon={<Wallet size={18}/>} />
            </div>
            <div className="bg-card p-6 rounded-[2.5rem] border shadow-sm h-72">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.chartData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
            
            {/* Employee KPIs */}
            <EmployeeKPIsSection />
          </div>
        )}

        {activeTab === 'team' && (
          <div className="space-y-4 animate-fade-in">
            <button onClick={() => setShowAddUserModal(true)} className="w-full py-5 bg-primary text-primary-foreground rounded-[1.8rem] font-black text-sm flex items-center justify-center gap-2 shadow-xl">
              <UserPlus size={18}/> إضافة موظف
            </button>
            
            {/* Pending Employees with codes */}
            {pendingEmployees.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-black text-foreground text-sm flex items-center gap-2 px-2">
                  <Clock size={16} className="text-warning" />
                  أكواد تفعيل معلقة
                </h3>
                {pendingEmployees.map(pe => (
                  <div key={pe.id} className="bg-warning/10 p-4 rounded-[2rem] border border-warning/20">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-black text-foreground">{pe.name}</p>
                        <p className="text-[10px] text-muted-foreground">{pe.phone}</p>
                      </div>
                      <span className="badge badge-warning text-[9px]">
                        {pe.employee_type === EmployeeType.FIELD_AGENT ? 'موزع' : 'محاسب'}
                      </span>
                    </div>
                    <div 
                      onClick={() => { navigator.clipboard.writeText(pe.activation_code); setCopiedId(pe.id); setTimeout(() => setCopiedId(null), 2000); }}
                      className="bg-card p-3 rounded-xl flex justify-between items-center cursor-pointer hover:bg-muted transition-colors"
                    >
                      <span className="font-mono font-black text-primary tracking-wider text-sm">{pe.activation_code}</span>
                      {copiedId === pe.id ? <CheckCircle2 size={18} className="text-success" /> : <Copy size={18} className="text-muted-foreground" />}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Active Team Members */}
            <div className="grid grid-cols-1 gap-3">
              {teamMembers.length === 0 && pendingEmployees.length === 0 ? (
                <div className="bg-card p-8 rounded-[2.5rem] border text-center">
                  <Users size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground font-bold">لا يوجد موظفين</p>
                </div>
              ) : (
                teamMembers.map(u => (
                  <div key={u.id} className="bg-card p-5 rounded-[2.2rem] border shadow-sm flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-success/10 rounded-2xl flex items-center justify-center text-success"><CheckCircle2 size={24}/></div>
                      <div>
                        <p className="font-black text-foreground text-sm">{u.name}</p>
                        <p className="text-[9px] font-black text-muted-foreground uppercase">
                          {u.employeeType === EmployeeType.FIELD_AGENT ? 'موزع ميداني' : 'محاسب مالي'}
                        </p>
                      </div>
                    </div>
                    <span className="badge badge-success">نشط</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'inventory' && <InventoryTabSection />}
        
        {activeTab === 'finance' && <FinanceTabSection />}
        
        {activeTab === 'customers' && (
          <div className="space-y-3 animate-fade-in">
            <div className="bg-destructive p-6 rounded-[2.5rem] text-destructive-foreground shadow-xl">
              <p className="text-[10px] font-black opacity-60 mb-1">إجمالي ذمم السوق</p>
              <p className="text-3xl font-black">{customers.reduce((s, c) => s + c.balance, 0).toLocaleString()} {CURRENCY}</p>
            </div>
            {customers.map(c => (
              <div key={c.id} className="bg-card p-5 rounded-[2.2rem] border shadow-sm flex justify-between items-center">
                <p className="font-black text-foreground text-sm">{c.name}</p>
                <p className={`font-black text-sm ${c.balance > 0 ? 'text-destructive' : 'text-success'}`}>{c.balance.toLocaleString()} {CURRENCY}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddUserModal && (
        <div className="modal-overlay p-4">
          <div className="bg-card rounded-[2.5rem] w-full max-w-md p-8 space-y-6 animate-zoom-in">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black">{newEmployeeCode ? 'تم إنشاء كود التفعيل' : 'إضافة موظف جديد'}</h2>
              <button onClick={closeEmployeeModal} className="p-2 bg-muted rounded-full"><X size={20}/></button>
            </div>
            
            {newEmployeeCode ? (
              <div className="space-y-4">
                <div className="bg-success/10 p-6 rounded-2xl border border-success/20 text-center">
                  <CheckCircle2 size={48} className="mx-auto text-success mb-3" />
                  <p className="text-sm text-muted-foreground mb-2">كود تفعيل الموظف:</p>
                  <p className="text-2xl font-mono font-black text-primary tracking-widest">{newEmployeeCode}</p>
                </div>
                
                {newEmployeeData && (
                  <div className="bg-muted p-4 rounded-xl space-y-2 text-sm">
                    <p><span className="text-muted-foreground">الاسم:</span> <span className="font-black">{newEmployeeData.name}</span></p>
                    <p><span className="text-muted-foreground">الهاتف:</span> <span className="font-black">{newEmployeeData.phone}</span></p>
                    <p><span className="text-muted-foreground">النوع:</span> <span className="font-black">{newEmployeeData.employee_type === EmployeeType.FIELD_AGENT ? 'موزع ميداني' : 'محاسب'}</span></p>
                  </div>
                )}
                
                <button 
                  onClick={() => { navigator.clipboard.writeText(newEmployeeCode); }}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black flex items-center justify-center gap-2"
                >
                  <Copy size={18} /> نسخ الكود
                </button>
                <button onClick={closeEmployeeModal} className="w-full py-4 bg-muted text-muted-foreground rounded-2xl font-black">إغلاق</button>
              </div>
            ) : (
              <form onSubmit={handleAddEmployee} className="space-y-4">
                <input name="name" required placeholder="اسم الموظف" className="input-field" />
                <input name="phone" required placeholder="رقم الهاتف" className="input-field" />
                <select name="type" className="input-field">
                  <option value={EmployeeType.FIELD_AGENT}>موزع ميداني</option>
                  <option value={EmployeeType.ACCOUNTANT}>محاسب مالي</option>
                </select>
                <button type="submit" className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black">توليد كود التفعيل</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Simple wrapper components
const InventoryTabSection: React.FC = () => <InventoryTab />;
const FinanceTabSection: React.FC = () => <FinanceTab />;
const EmployeeKPIsSection: React.FC = () => <EmployeeKPIs />;

const TabBtn: React.FC<any> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl font-bold text-[9px] transition-all ${
      active 
        ? 'bg-primary text-primary-foreground shadow-md' 
        : 'text-muted-foreground hover:text-foreground'
    }`}
  >
    {icon}
    <span className="mt-0.5 truncate max-w-full">{label}</span>
  </button>
);

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

// ==========================================
// ACCOUNTANT VIEW
// ==========================================
const AccountantView: React.FC = () => {
  const { user, sales, payments, customers, logout } = useApp();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in" dir="rtl">
      <div className="flex items-center justify-between bg-card px-5 py-4 rounded-[1.8rem] shadow-sm border">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black text-foreground tracking-tight">المحاسب المالي ({user?.name || 'المستخدم'})</h1>
          <p className="text-muted-foreground text-xs font-bold">متابعة دقيقة لكافة العمليات المالية.</p>
        </div>
        <button onClick={logout} className="w-10 h-10 flex items-center justify-center bg-destructive/10 text-destructive rounded-xl active:scale-90"><LogOut size={20} /></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="المبيعات" val={sales.reduce((s,i) => s + i.grandTotal, 0)} icon={<Receipt/>} />
        <StatCard label="التحصيلات" val={payments.reduce((s,i) => s + i.amount, 0)} icon={<DollarSign/>} />
        <StatCard label="الزبائن" val={customers.length} icon={<Users/>} isCount />
      </div>

      <div className="bg-card rounded-[2rem] border overflow-hidden">
        <div className="p-6 bg-muted border-b">
          <h3 className="font-black text-foreground">آخر الفواتير</h3>
        </div>
        <div className="divide-y">
          {sales.slice(0, 10).map(s => (
            <div key={s.id} className="p-5 flex justify-between items-center hover:bg-muted/50 transition-colors">
              <div>
                <p className="font-black text-foreground">{s.customerName}</p>
                <p className="text-[10px] text-muted-foreground font-bold">{new Date(s.timestamp).toLocaleString('ar-EG')}</p>
              </div>
              <p className="font-black text-primary">{s.grandTotal.toLocaleString()} {CURRENCY}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

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
      return user.employeeType === EmployeeType.ACCOUNTANT ? <AccountantView /> : <DistributorView />;
    case UserRole.DEVELOPER: return <DeveloperHub />;
    default: return <OwnerDashboard />;
  }
};

// ==========================================
// MAIN CONTENT
// ==========================================
const MainContent: React.FC = () => {
  const { user, isLoading } = useApp();

  if (isLoading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-900">
      <Loader2 size={48} className="animate-spin text-primary mb-4" />
      <p className="text-white/20 font-black text-[10px] uppercase tracking-[0.3em]">Smart System Initialization</p>
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
// APP
// ==========================================
const App: React.FC = () => (
  <AppProvider>
    <MainContent />
  </AppProvider>
);

export default App;
