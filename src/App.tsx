import React, { useState, useEffect } from 'react';
import { useApp } from '@/store/AppContext';
import { UserRole, EmployeeType } from '@/types';
import { Layout } from '@/components/Layout';
import { ToastManager } from '@/components/ToastManager';
import { supabase } from '@/integrations/supabase/client';
import { 
  ShieldCheck, Loader2,
  Key, UserPlus, LogOut,
  Copy, CheckCircle2, Plus,
  Clock, Lock, Unlock, Activity,
  Calculator
} from 'lucide-react';
import { CURRENCY } from '@/constants';
import { LicenseStatus } from '@/types';
import DistributorDashboard from '@/components/distributor/DistributorDashboard';
import AccountantDashboard from '@/components/accountant/AccountantDashboard';
import OwnerDashboard from '@/components/owner/OwnerDashboard';
import AuthFlow from '@/components/auth/AuthFlow';
import { usePushNotifications } from '@/hooks/usePushNotifications';

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
// VIEW MANAGER
// ==========================================
const ViewManager: React.FC = () => {
  const { role, user } = useApp();
  
  // Route based on role
  switch (role) {
    case UserRole.DEVELOPER:
      return <DeveloperHub />;
    case UserRole.OWNER:
      return <OwnerDashboard />;
    case UserRole.EMPLOYEE:
      if (user?.employeeType === EmployeeType.ACCOUNTANT) {
        return <AccountantDashboard />;
      }
      return <DistributorDashboard />;
    default:
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">لا يمكن تحديد نوع المستخدم</p>
        </div>
      );
  }
};

// ==========================================
// MAIN CONTENT
// ==========================================
const MainContent: React.FC = () => {
  const { user, isLoading, refreshAuth, needsActivation } = useApp();
  
  // Initialize push notifications
  usePushNotifications();
  
  // Loading timeout detection
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        console.warn('[App] Loading timeout - potential stuck state');
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (isLoading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-900">
      <Loader2 size={48} className="animate-spin text-primary mb-4" />
      <p className="text-white/40 font-black text-sm mb-2">جارٍ تحميل النظام...</p>
      <p className="text-white/20 font-bold text-[10px] uppercase tracking-[0.2em]">Smart System</p>
    </div>
  );

  // Show auth flow if not logged in or needs activation
  if (!user || needsActivation) {
    return (
      <>
        <ToastManager />
        <AuthFlow onAuthComplete={refreshAuth} />
      </>
    );
  }

  return (
    <>
      <ToastManager />
      <Layout><ViewManager /></Layout>
    </>
  );
};

// ==========================================
// APP - Main Application Entry Point
// ==========================================
const App: React.FC = () => {
  return <MainContent />;
};

export default App;
