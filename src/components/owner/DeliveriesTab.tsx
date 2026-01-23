import React, { useState } from 'react';
import { useApp } from '@/store/AppContext';
import { CURRENCY } from '@/constants';
import { Truck, Plus, X, Package, Calendar, User, Minus, Check, Trash2 } from 'lucide-react';
import { EmployeeType } from '@/types';

interface DeliveryItem {
  product_id: string;
  product_name: string;
  quantity: number;
}

interface Delivery {
  id: string;
  distributor_name: string;
  status: string;
  notes?: string;
  created_at: number;
  items?: DeliveryItem[];
}

export const DeliveriesTab: React.FC = () => {
  const { products, users, createDelivery, deliveries = [] } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [distributorName, setDistributorName] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);

  // الموزعين فقط
  const distributors = users.filter(u => u.employeeType === EmployeeType.FIELD_AGENT);

  const addItem = () => {
    if (!selectedProduct || itemQuantity <= 0) return;
    
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    // التحقق من المخزون
    const existingItem = items.find(i => i.product_id === selectedProduct);
    const totalQty = (existingItem?.quantity || 0) + itemQuantity;
    
    if (totalQty > product.stock) {
      return;
    }

    if (existingItem) {
      setItems(items.map(i => 
        i.product_id === selectedProduct 
          ? { ...i, quantity: i.quantity + itemQuantity }
          : i
      ));
    } else {
      setItems([...items, {
        product_id: product.id,
        product_name: product.name,
        quantity: itemQuantity
      }]);
    }

    setSelectedProduct('');
    setItemQuantity(1);
  };

  const removeItem = (productId: string) => {
    setItems(items.filter(i => i.product_id !== productId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!distributorName || items.length === 0) return;
    
    await createDelivery(distributorName, items, notes || undefined);
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setDistributorName('');
    setNotes('');
    setItems([]);
    setSelectedProduct('');
    setItemQuantity(1);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <button 
        onClick={() => setShowModal(true)} 
        className="w-full py-5 bg-primary text-primary-foreground rounded-[1.8rem] font-black text-sm flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
      >
        <Truck size={18}/> تسليم بضاعة للموزع
      </button>

      {/* قائمة التسليمات */}
      <div className="space-y-3">
        {deliveries.length === 0 ? (
          <div className="bg-card p-8 rounded-[2.5rem] border text-center">
            <Truck size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground font-bold">لا توجد تسليمات مسجلة</p>
          </div>
        ) : (
          deliveries.map((delivery: Delivery) => (
            <div key={delivery.id} className="bg-card p-5 rounded-[2.2rem] border shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-black text-foreground flex items-center gap-2">
                    <User size={16} className="text-primary" />
                    {delivery.distributor_name}
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-1 mt-1">
                    <Calendar size={12} />
                    {new Date(delivery.created_at).toLocaleDateString('ar-EG')}
                  </p>
                </div>
                <span className={`badge ${delivery.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                  {delivery.status === 'completed' ? 'مكتمل' : 'معلق'}
                </span>
              </div>
              {delivery.notes && (
                <p className="text-xs text-muted-foreground bg-muted p-2 rounded-lg">{delivery.notes}</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal تسليم بضاعة */}
      {showModal && (
        <div className="modal-overlay p-4">
          <div className="bg-card rounded-[3rem] w-full max-w-lg shadow-2xl animate-zoom-in overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 bg-primary text-primary-foreground flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-xl font-black flex items-center gap-2">
                <Truck size={24} /> تسليم بضاعة للموزع
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-primary-foreground/40 p-2">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5 text-end">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mr-2">الموزع</label>
                {distributors.length > 0 ? (
                  <select 
                    value={distributorName} 
                    onChange={(e) => setDistributorName(e.target.value)}
                    required
                    className="input-field"
                  >
                    <option value="">اختر الموزع...</option>
                    {distributors.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text"
                    value={distributorName}
                    onChange={(e) => setDistributorName(e.target.value)}
                    required
                    placeholder="اسم الموزع"
                    className="input-field" 
                  />
                )}
              </div>

              {/* إضافة أصناف */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mr-2">إضافة أصناف</label>
                <div className="flex gap-2">
                  <select 
                    value={selectedProduct} 
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="input-field flex-1"
                  >
                    <option value="">اختر المادة...</option>
                    {products.filter(p => p.stock > 0).map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.stock})</option>
                    ))}
                  </select>
                  <input 
                    type="number" 
                    min="1"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(Number(e.target.value))}
                    className="input-field w-20 text-center"
                  />
                  <button 
                    type="button"
                    onClick={addItem}
                    className="px-4 bg-primary text-primary-foreground rounded-xl"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              {/* قائمة الأصناف المضافة */}
              {items.length > 0 && (
                <div className="space-y-2 bg-muted p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-muted-foreground uppercase mb-2">الأصناف المختارة:</p>
                  {items.map((item) => (
                    <div key={item.product_id} className="flex justify-between items-center bg-card p-3 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Package size={16} className="text-primary" />
                        <span className="font-bold text-sm">{item.product_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded font-black text-xs">{item.quantity}</span>
                        <button 
                          type="button"
                          onClick={() => removeItem(item.product_id)}
                          className="text-destructive p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mr-2">ملاحظات (اختياري)</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي ملاحظات إضافية..."
                  className="input-field min-h-[80px] resize-none" 
                />
              </div>

              <button 
                type="submit" 
                disabled={items.length === 0}
                className="w-full bg-primary text-primary-foreground font-black py-5 rounded-[1.8rem] shadow-xl active:scale-95 transition-all disabled:opacity-50"
              >
                <Check size={20} className="inline ml-2" />
                تأكيد التسليم وخصم من المخزون
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
