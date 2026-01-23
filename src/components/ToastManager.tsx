import React, { useState, useEffect } from 'react';
import { useApp } from '@/store/AppContext';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Notification } from '@/types';

export const ToastManager: React.FC = () => {
  const { notifications } = useApp();
  const [visibleToasts, setVisibleToasts] = useState<Notification[]>([]);

  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      if (!visibleToasts.find(t => t.id === latest.id)) {
        setVisibleToasts(prev => [...prev, latest]);
        const timer = setTimeout(() => {
          setVisibleToasts(prev => prev.filter(t => t.id !== latest.id));
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [notifications]);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 w-full max-w-sm px-4">
      {visibleToasts.map((toast) => (
        <div 
          key={toast.id} 
          className={`flex items-center gap-3 p-4 rounded-2xl shadow-2xl border animate-slide-in-from-top ${
            toast.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' :
            toast.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-700' :
            'bg-emerald-50 border-emerald-100 text-emerald-700'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle size={20} /> : 
           toast.type === 'warning' ? <AlertTriangle size={20} /> : 
           <CheckCircle2 size={20} />}
          <p className="flex-1 font-black text-sm text-end leading-relaxed">{toast.message}</p>
        </div>
      ))}
    </div>
  );
};
