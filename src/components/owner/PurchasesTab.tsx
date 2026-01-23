import React, { useState } from 'react';
import { useApp } from '@/store/AppContext';
import { CURRENCY } from '@/constants';
import { ShoppingCart, Plus, X, Package, Calendar, User } from 'lucide-react';

interface Purchase {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  supplier_name?: string;
  notes?: string;
  created_at: number;
}

export const PurchasesTab: React.FC = () => {
  const { products, addPurchase, purchases = [] } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [supplierName, setSupplierName] = useState('');
  const [notes, setNotes] = useState('');

  const handleProductChange = (productId: string) => {
    setSelectedProduct(productId);
    const product = products.find(p => p.id === productId);
    if (product) {
      setUnitPrice(product.costPrice);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || quantity <= 0) return;
    
    await addPurchase(selectedProduct, quantity, unitPrice, supplierName || undefined, notes || undefined);
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedProduct('');
    setQuantity(1);
    setUnitPrice(0);
    setSupplierName('');
    setNotes('');
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <button 
        onClick={() => setShowModal(true)} 
        className="w-full py-5 bg-success text-white rounded-[1.8rem] font-black text-sm flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
      >
        <ShoppingCart size={18}/> تسجيل عملية شراء
      </button>

      {/* قائمة المشتريات */}
      <div className="space-y-3">
        {purchases.length === 0 ? (
          <div className="bg-card p-8 rounded-[2.5rem] border text-center">
            <Package size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground font-bold">لا توجد مشتريات مسجلة</p>
          </div>
        ) : (
          purchases.map((purchase: Purchase) => (
            <div key={purchase.id} className="bg-card p-5 rounded-[2.2rem] border shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-black text-foreground">{purchase.product_name}</h3>
                  <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-1 mt-1">
                    <Calendar size={12} />
                    {new Date(purchase.created_at).toLocaleDateString('ar-EG')}
                  </p>
                </div>
                <span className="badge badge-success">{purchase.quantity} وحدة</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-bold flex items-center gap-1">
                  <User size={14} />
                  {purchase.supplier_name || 'غير محدد'}
                </span>
                <span className="font-black text-success">{purchase.total_price.toLocaleString()} {CURRENCY}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal إضافة شراء */}
      {showModal && (
        <div className="modal-overlay p-4">
          <div className="bg-card rounded-[3rem] w-full max-w-md shadow-2xl animate-zoom-in overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 bg-success text-white flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-xl font-black flex items-center gap-2">
                <ShoppingCart size={24} /> تسجيل شراء مواد
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-white/40 p-2">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5 text-end">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mr-2">المادة</label>
                <select 
                  value={selectedProduct} 
                  onChange={(e) => handleProductChange(e.target.value)}
                  required
                  className="input-field"
                >
                  <option value="">اختر المادة...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.stock} {p.unit})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase mr-2">الكمية</label>
                  <input 
                    type="number" 
                    min="1"
                    value={quantity} 
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    required
                    className="input-field" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase mr-2">سعر الوحدة</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={unitPrice} 
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    required
                    className="input-field" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mr-2">المورد (اختياري)</label>
                <input 
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="اسم المورد"
                  className="input-field" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mr-2">ملاحظات (اختياري)</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي ملاحظات إضافية..."
                  className="input-field min-h-[80px] resize-none" 
                />
              </div>

              {/* ملخص */}
              <div className="bg-success/10 p-4 rounded-2xl border border-success/20">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-muted-foreground">الإجمالي:</span>
                  <span className="text-2xl font-black text-success">{(quantity * unitPrice).toLocaleString()} {CURRENCY}</span>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-success text-white font-black py-5 rounded-[1.8rem] shadow-xl active:scale-95 transition-all"
              >
                تأكيد الشراء وزيادة المخزون
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
