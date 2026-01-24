import React from 'react';
import { useApp } from '@/store/AppContext';
import { UserRole, LicenseStatus } from '@/types';
import { ShieldAlert, Phone, LogOut } from 'lucide-react';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, organization } = useApp();
  
  // Initialize realtime notifications
  useRealtimeNotifications();

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
      <div className="min-h-screen header-premium flex items-center justify-center p-6 text-center" dir="rtl">
        {/* Soft Decorative Orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-destructive/15 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-warning/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4"></div>
        
        <div className="max-w-md space-y-6 animate-zoom-in relative z-10">
          <div
            className={`icon-container w-24 h-24 mx-auto mb-8 ${
              isExpired ? 'icon-container-warning' : 'icon-container-danger'
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
              className="btn-primary w-full py-4 flex items-center justify-center gap-2"
            >
              <Phone size={20} />
              اتصل بالإدارة المالية
            </a>

            <button
              onClick={logout}
              className="btn-logout w-full py-4 justify-center"
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
        {/* Soft Header with Notification Center */}
        <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border/30 px-4 py-3 flex items-center justify-between" style={{ boxShadow: 'var(--shadow-soft)' }}>
          <div className="flex items-center gap-3">
            <NotificationCenter />
          </div>
          <div className="text-sm font-bold text-muted-foreground">
            {user.name}
          </div>
        </div>
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
};