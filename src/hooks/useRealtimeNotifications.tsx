import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/store/AppContext';
import { pushNotificationService } from '@/services/pushNotifications';

export const useRealtimeNotifications = () => {
  const { user, products, sales, addNotification } = useApp();
  const processedAlerts = useRef<Set<string>>(new Set());

  // Helper to send both in-app and push notification
  const sendNotification = async (
    message: string, 
    type: 'success' | 'error' | 'warning',
    pushTitle?: string,
    pushData?: Record<string, unknown>
  ) => {
    // In-app notification
    addNotification(message, type);
    
    // Push notification (will only work on native platforms or web with permission)
    if (pushTitle) {
      try {
        await pushNotificationService.showLocalNotification({
          title: pushTitle,
          body: message,
          data: pushData
        });
      } catch (err) {
        console.log('Push notification not available:', err);
      }
    }
  };

  // Check for low stock products
  const checkLowStock = () => {
    if (!products || products.length === 0) return;
    
    const lowStockProducts = products.filter(p => !p.isDeleted && p.stock <= p.minStock && p.stock > 0);
    const outOfStockProducts = products.filter(p => !p.isDeleted && p.stock === 0);
    
    lowStockProducts.forEach(product => {
      const alertKey = `low_stock_${product.id}`;
      if (!processedAlerts.current.has(alertKey)) {
        processedAlerts.current.add(alertKey);
        sendNotification(
          `⚠️ مخزون منخفض: ${product.name} (${product.stock} ${product.unit})`, 
          'warning',
          'مخزون منخفض',
          { type: 'low_stock', productId: product.id }
        );
      }
    });

    outOfStockProducts.forEach(product => {
      const alertKey = `out_of_stock_${product.id}`;
      if (!processedAlerts.current.has(alertKey)) {
        processedAlerts.current.add(alertKey);
        sendNotification(
          `🚨 نفاد المخزون: ${product.name}`, 
          'error',
          'نفاد المخزون!',
          { type: 'out_of_stock', productId: product.id }
        );
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
        sendNotification(
          `📋 فاتورة مستحقة: ${sale.customerName} - ${sale.remaining.toLocaleString()} ل.س`, 
          'warning',
          'فاتورة مستحقة',
          { type: 'overdue_invoice', saleId: sale.id }
        );
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
              sendNotification(
                `⚠️ تحديث المخزون: ${product.name} أصبح ${product.stock} فقط`, 
                'warning',
                'تحديث المخزون',
                { type: 'low_stock', productId: product.id }
              );
            } else if (product.stock === 0) {
              sendNotification(
                `🚨 نفاد المخزون: ${product.name}`, 
                'error',
                'نفاد المخزون!',
                { type: 'out_of_stock', productId: product.id }
              );
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
            sendNotification(
              `📝 فاتورة جديدة آجلة: ${sale.customer_name} - ${sale.remaining.toLocaleString()} ل.س`, 
              'warning',
              'فاتورة جديدة',
              { type: 'new_sale', saleId: sale.id }
            );
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