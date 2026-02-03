import React, { useState, useEffect } from 'react';
import { X, Truck, Package, Calendar, User, Hash, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DeliveryItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
}

interface DeliveryDetailsModalProps {
  deliveryId: string;
  distributorName: string;
  createdAt: number;
  notes?: string;
  onClose: () => void;
}

const DeliveryDetailsModal: React.FC<DeliveryDetailsModalProps> = ({
  deliveryId,
  distributorName,
  createdAt,
  notes,
  onClose
}) => {
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDeliveryItems = async () => {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('delivery_items')
          .select('*')
          .eq('delivery_id', deliveryId)
          .order('created_at', { ascending: true });

        if (fetchError) throw fetchError;
        setItems(data || []);
      } catch (err: any) {
        console.error('Error fetching delivery items:', err);
        setError('حدث خطأ في تحميل تفاصيل الفاتورة');
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveryItems();
  }, [deliveryId]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const invoiceNumber = deliveryId.substring(0, 8).toUpperCase();

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-card w-full max-w-lg rounded-3xl shadow-2xl animate-zoom-in overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-primary text-primary-foreground flex justify-between items-center">
          <h2 className="text-lg font-black flex items-center gap-2">
            <Truck size={22} />
            تفاصيل فاتورة التسليم
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-primary-foreground/10 rounded-xl transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Invoice Info */}
        <div className="p-5 border-b bg-muted/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Hash size={16} />
              <span className="text-xs font-bold">رقم الفاتورة</span>
            </div>
            <span className="font-black text-foreground">{invoiceNumber}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User size={16} />
              <span className="text-xs font-bold">الموزع</span>
            </div>
            <span className="font-bold text-foreground">{distributorName}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar size={16} />
              <span className="text-xs font-bold">تاريخ التسليم</span>
            </div>
            <span className="font-bold text-foreground">
              {new Date(createdAt).toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package size={16} />
              <span className="text-xs font-bold">إجمالي القطع</span>
            </div>
            <span className="font-black text-primary text-lg">{totalItems}</span>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
              <p className="text-muted-foreground font-bold">جارٍ التحميل...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive font-bold">{error}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground font-bold">لا توجد أصناف</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">
                قائمة الأصناف ({items.length} صنف)
              </h3>
              {items.map((item, index) => (
                <div 
                  key={item.id} 
                  className="bg-muted rounded-2xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center text-xs font-black text-primary">
                      {index + 1}
                    </div>
                    <span className="font-bold text-foreground">{item.product_name}</span>
                  </div>
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full font-black text-sm">
                    {item.quantity} قطعة
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        {notes && (
          <div className="p-5 border-t bg-muted/30">
            <p className="text-xs font-black text-muted-foreground uppercase mb-2">ملاحظات</p>
            <p className="text-sm text-foreground bg-muted p-3 rounded-xl">{notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryDetailsModal;
