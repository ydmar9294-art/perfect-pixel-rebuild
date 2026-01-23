import React from 'react';
import { useApp } from '@/store/AppContext';
import { UserRole, LicenseStatus } from '@/types';
import { ShieldAlert, Phone, LogOut } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, organization } = useApp();

  // If no user, show login pages
  if (!user) {
    return <>{children}</>;
  }

  const licenseStatus = (organization as any)?.licenseStatus;
  const expiryDate = (organization as any)?.expiryDate;

  const isSuspended = licenseStatus === LicenseStatus.SUSPENDED;
  const isExpired = typeof expiryDate === 'number' && expiryDate < Date.now();

  if ((isSuspended || isExpired) && user.role !== UserRole.DEVELOPER) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center" dir="rtl">
        <div className="max-w-md space-y-6 animate-zoom-in">
          <div
            className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl mx-auto mb-8 ${
              isExpired ? 'bg-warning' : 'bg-destructive'
            }`}
          >
            <ShieldAlert size={48} />
          </div>

          <h2 className="text-3xl font-black text-white">
            {isExpired ? 'انتهت فترة التجربة' : 'الترخيص موقوف مؤقتاً'}
          </h2>

          <p className="text-slate-400 font-bold text-lg">
            {isExpired
              ? 'لقد انتهت الفترة الممنوحة لاستخدام النظام. يرجى مراجعة القسم المالي للتحويل إلى الترخيص الدائم.'
              : 'يرجى مراجعة القسم المالي لتسوية المستحقات وإعادة تفعيل الخدمة.'}
          </p>

          <div className="pt-8 flex flex-col gap-3">
            <a
              href="tel:09xxxxxxx"
              className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Phone size={20} />
              اتصل بالإدارة المالية
            </a>

            <button
              onClick={logout}
              className="w-full py-4 bg-white/10 text-white/60 rounded-2xl font-black flex items-center justify-center gap-2"
            >
              <LogOut size={20} />
              تسجيل الخروج
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex bg-background text-end overflow-x-hidden font-tajawal"
      dir="rtl"
    >
      <main className="flex-1 relative">
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
};
