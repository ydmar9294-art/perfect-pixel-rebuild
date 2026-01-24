import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/store/AppContext';

export const useRealtimeNotifications = () => {
  const { user, products, sales, addNotification } = useApp();
  const processedAlerts = useRef<Set<string>>(new Set());

  // Check for low stock products
  const checkLowStock = () => {
    if (!products || products.length === 0) return;
    
    const lowStockProducts = products.filter(p => !p.isDeleted && p.stock <= p.minStock && p.stock > 0);
    const outOfStockProducts = products.filter(p => !p.isDeleted && p.stock === 0);
    
    lowStockProducts.forEach(product => {
      const alertKey = `low_stock_${product.id}`;
      if (!processedAlerts.current.has(alertKey)) {
        processedAlerts.current.add(alertKey);
        addNotification(`⚠️ مخزون منخفض: ${product.name} (${product.stock} ${product.unit})`, 'warning');
      }
    });

    outOfStockProducts.forEach(product => {
      const alertKey = `out_of_stock_${product.id}`;
      if (!processedAlerts.current.has(alertKey)) {
        processedAlerts.current.add(alertKey);
        addNotification(`🚨 نفاد المخزون: ${product.name}`, 'error');
      }
    });
  };

  // Check for due invoices (unpaid sales older than 7 days)
  const checkDueInvoices = () => {
    if (!sales || sales.length === 0) return;
    
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    const dueInvoices = sales.filter(sale => {
      if (sale.isVoided || sale.remaining <= 0) return false;
      return sale.timestamp < sevenDaysAgo;
    });

    dueInvoices.forEach(sale => {
      const alertKey = `due_invoice_${sale.id}`;
      if (!processedAlerts.current.has(alertKey)) {
        processedAlerts.current.add(alertKey);
        addNotification(`📋 فاتورة مستحقة: ${sale.customerName} - ${sale.remaining.toLocaleString()} ر.س`, 'warning');
      }
    });
  };

  // Initial check on mount
  useEffect(() => {
    if (user) {
      // Delay initial checks to avoid overwhelming the user
      const timer = setTimeout(() => {
        checkLowStock();
        checkDueInvoices();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user, products.length, sales.length]);

  // Setup realtime subscriptions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const product = payload.new as any;
            if (product.stock <= product.min_stock && product.stock > 0) {
              const alertKey = `realtime_low_${product.id}_${Date.now()}`;
              addNotification(`⚠️ تحديث المخزون: ${product.name} أصبح ${product.stock} فقط`, 'warning');
            } else if (product.stock === 0) {
              addNotification(`🚨 نفاد المخزون: ${product.name}`, 'error');
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sales'
        },
        (payload) => {
          const sale = payload.new as any;
          if (sale.remaining > 0) {
            addNotification(`📝 فاتورة جديدة آجلة: ${sale.customer_name} - ${sale.remaining.toLocaleString()} ر.س`, 'warning');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, addNotification]);

  return {
    checkLowStock,
    checkDueInvoices
  };
};
