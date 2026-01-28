import React, { useState, useEffect } from 'react';
import { Bell, Package, Receipt, AlertTriangle, X, Trash2 } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface PersistentNotification {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'due_invoice' | 'success' | 'error' | 'warning';
  title: string;
  description: string;
  timestamp: number;
}

const STORAGE_KEY = 'notification_center_items';

export const NotificationCenter: React.FC = () => {
  const { products, sales, notifications } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [persistentNotifications, setPersistentNotifications] = useState<PersistentNotification[]>([]);

  // Load persisted notifications from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setPersistentNotifications(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load notifications:', e);
      }
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistentNotifications));
  }, [persistentNotifications]);

  // Add new app notifications to persistent list
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      const notifId = `app_${latest.id}`;
      
      // Check if already exists
      if (!persistentNotifications.find(n => n.id === notifId)) {
        const newNotif: PersistentNotification = {
          id: notifId,
          type: latest.type,
          title: latest.type === 'success' ? 'نجاح' : latest.type === 'error' ? 'خطأ' : 'تحذير',
          description: latest.message,
          timestamp: Date.now()
        };
        setPersistentNotifications(prev => [newNotif, ...prev]);
      }
    }
  }, [notifications]);

  // Calculate system alerts (these are dynamic, not persistent)
  const lowStockProducts = products.filter(p => !p.isDeleted && p.stock <= p.minStock && p.stock > 0);
  const outOfStockProducts = products.filter(p => !p.isDeleted && p.stock === 0);
  
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const dueInvoices = sales.filter(sale => {
    if (sale.isVoided || sale.remaining <= 0) return false;
    return sale.timestamp < sevenDaysAgo;
  });

  // Create system alerts
  const systemAlerts: PersistentNotification[] = [
    ...outOfStockProducts.map(p => ({
      id: `sys_out_${p.id}`,
      type: 'out_of_stock' as const,
      title: 'نفاد المخزون',
      description: `${p.name} - نفد من المخزون`,
      timestamp: Date.now()
    })),
    ...lowStockProducts.map(p => ({
      id: `sys_low_${p.id}`,
      type: 'low_stock' as const,
      title: 'مخزون منخفض',
      description: `${p.name} - متبقي ${p.stock} ${p.unit}`,
      timestamp: Date.now()
    })),
    ...dueInvoices.map(s => ({
      id: `sys_due_${s.id}`,
      type: 'due_invoice' as const,
      title: 'فاتورة مستحقة',
      description: `${s.customerName} - ${s.remaining.toLocaleString()} ل.س`,
      timestamp: s.timestamp
    }))
  ];

  // Combine system alerts with persistent notifications (remove duplicates)
  const allNotifications = [
    ...systemAlerts,
    ...persistentNotifications.filter(pn => !pn.id.startsWith('sys_'))
  ].sort((a, b) => b.timestamp - a.timestamp);

  const totalAlerts = allNotifications.length;
  const criticalAlerts = outOfStockProducts.length;

  const deleteNotification = (id: string) => {
    setPersistentNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllUserNotifications = () => {
    setPersistentNotifications(prev => prev.filter(n => n.id.startsWith('sys_')));
  };

  const getAlertIcon = (type: PersistentNotification['type']) => {
    switch (type) {
      case 'out_of_stock':
        return <Package className="h-4 w-4 text-red-500" />;
      case 'low_stock':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'due_invoice':
        return <Receipt className="h-4 w-4 text-blue-500" />;
      case 'success':
        return <Bell className="h-4 w-4 text-emerald-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAlertBg = (type: PersistentNotification['type']) => {
    switch (type) {
      case 'out_of_stock':
      case 'error':
        return 'bg-red-50 border-red-100';
      case 'low_stock':
      case 'warning':
        return 'bg-amber-50 border-amber-100';
      case 'due_invoice':
        return 'bg-blue-50 border-blue-100';
      case 'success':
        return 'bg-emerald-50 border-emerald-100';
      default:
        return 'bg-gray-50 border-gray-100';
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${days} يوم`;
  };

  const userNotificationsCount = persistentNotifications.filter(n => !n.id.startsWith('sys_')).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {totalAlerts > 0 && (
            <span className={`absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs font-bold flex items-center justify-center text-white ${
              criticalAlerts > 0 ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
            }`}>
              {totalAlerts > 9 ? '9+' : totalAlerts}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="end"
        dir="rtl"
      >
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <h3 className="font-bold text-sm">مركز التنبيهات</h3>
          <div className="flex gap-2 items-center">
            {userNotificationsCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={clearAllUserNotifications}
              >
                <Trash2 className="h-3 w-3 ml-1" />
                مسح الكل
              </Button>
            )}
            {totalAlerts > 0 && (
              <Badge variant="secondary" className="text-xs">
                {totalAlerts}
              </Badge>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-[350px]">
          {allNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm">لا توجد تنبيهات</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {allNotifications.map(alert => (
                <div 
                  key={alert.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${getAlertBg(alert.type)} group relative`}
                >
                  <div className="mt-0.5">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-foreground">{alert.title}</p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatTime(alert.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                  </div>
                  {/* Only show delete button for user notifications, not system alerts */}
                  {!alert.id.startsWith('sys_') && (
                    <button
                      onClick={() => deleteNotification(alert.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded-full"
                    >
                      <X className="h-3 w-3 text-red-500" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {(systemAlerts.length > 0) && (
          <div className="p-3 border-t bg-muted/20">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-red-100 rounded-lg p-2">
                <p className="font-bold text-red-700">{outOfStockProducts.length}</p>
                <p className="text-red-600">نفاد</p>
              </div>
              <div className="bg-amber-100 rounded-lg p-2">
                <p className="font-bold text-amber-700">{lowStockProducts.length}</p>
                <p className="text-amber-600">منخفض</p>
              </div>
              <div className="bg-blue-100 rounded-lg p-2">
                <p className="font-bold text-blue-700">{dueInvoices.length}</p>
                <p className="text-blue-600">مستحق</p>
              </div>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};