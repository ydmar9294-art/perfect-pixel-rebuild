import React, { useState } from 'react';
import { Bell, Package, Receipt, AlertTriangle } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface AlertItem {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'due_invoice';
  title: string;
  description: string;
  timestamp: Date;
}

export const NotificationCenter: React.FC = () => {
  const { products, sales } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  // Calculate alerts
  const lowStockProducts = products.filter(p => !p.isDeleted && p.stock <= p.minStock && p.stock > 0);
  const outOfStockProducts = products.filter(p => !p.isDeleted && p.stock === 0);
  
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  
  const dueInvoices = sales.filter(sale => {
    if (sale.isVoided || sale.remaining <= 0) return false;
    return sale.timestamp < sevenDaysAgo;
  });

  const alerts: AlertItem[] = [
    ...outOfStockProducts.map(p => ({
      id: `out_${p.id}`,
      type: 'out_of_stock' as const,
      title: 'نفاد المخزون',
      description: `${p.name} - نفد من المخزون`,
      timestamp: new Date()
    })),
    ...lowStockProducts.map(p => ({
      id: `low_${p.id}`,
      type: 'low_stock' as const,
      title: 'مخزون منخفض',
      description: `${p.name} - متبقي ${p.stock} ${p.unit}`,
      timestamp: new Date()
    })),
    ...dueInvoices.map(s => ({
      id: `due_${s.id}`,
      type: 'due_invoice' as const,
      title: 'فاتورة مستحقة',
      description: `${s.customerName} - ${s.remaining.toLocaleString()} ر.س`,
      timestamp: new Date(s.timestamp)
    }))
  ];

  const totalAlerts = alerts.length;
  const criticalAlerts = outOfStockProducts.length;

  const getAlertIcon = (type: AlertItem['type']) => {
    switch (type) {
      case 'out_of_stock':
        return <Package className="h-4 w-4 text-red-500" />;
      case 'low_stock':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'due_invoice':
        return <Receipt className="h-4 w-4 text-blue-500" />;
    }
  };

  const getAlertBg = (type: AlertItem['type']) => {
    switch (type) {
      case 'out_of_stock':
        return 'bg-red-50 border-red-100';
      case 'low_stock':
        return 'bg-amber-50 border-amber-100';
      case 'due_invoice':
        return 'bg-blue-50 border-blue-100';
    }
  };

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
          <div className="flex gap-2">
            {criticalAlerts > 0 && (
              <Badge variant="destructive" className="text-xs">
                {criticalAlerts} حرج
              </Badge>
            )}
            {totalAlerts > 0 && (
              <Badge variant="secondary" className="text-xs">
                {totalAlerts} تنبيه
              </Badge>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-[300px]">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm">لا توجد تنبيهات</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {alerts.map(alert => (
                <div 
                  key={alert.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${getAlertBg(alert.type)}`}
                >
                  <div className="mt-0.5">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground">{alert.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{alert.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {alerts.length > 0 && (
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
