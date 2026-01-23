import React, { useState } from 'react';
import { useApp } from '@/store/AppContext';
import { CURRENCY } from '@/constants';
import { 
  Package, Box, ShoppingCart, Truck, Plus, X, Calendar, User, 
  Check, Trash2, Search, Settings2, AlertTriangle
} from 'lucide-react';
import { EmployeeType, Product } from '@/types';

interface DeliveryItem {
  product_id: string;
  product_name: string;
  quantity: number;
}

type SubTab = 'products' | 'purchases' | 'deliveries';

export const InventoryTab: React.FC = () => {
  const { 
    products, users, purchases = [], deliveries = [], 
    addPurchase, createDelivery, addProduct, updateProduct, deleteProduct 
  } = useApp();
  const [subTab, setSubTab] = useState<SubTab>('products');

  // Purchases Modal State
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseProduct, setPurchaseProduct] = useState('');
  const [purchaseQty, setPurchaseQty] = useState(1);
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [purchaseSupplier, setPurchaseSupplier] = useState('');
  const [purchaseNotes, setPurchaseNotes] = useState('');

  // Delivery Modal State
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [distributorName, setDistributorName] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliveryItems, setDeliveryItems] = useState<DeliveryItem[]>([]);
  const [selectedDeliveryProduct, setSelectedDeliveryProduct] = useState('');
  const [deliveryItemQty, setDeliveryItemQty] = useState(1);

  // Products Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const distributors = users.filter(u => u.employeeType === EmployeeType.FIELD_AGENT);
  const filteredProducts = products.filter(p => p.name.includes(searchTerm) || p.category.includes(searchTerm));
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

  // Purchase Handlers
  const handlePurchaseProductChange = (productId: string) => {
    setPurchaseProduct(productId);
    const product = products.find(p => p.id === productId);
    if (product) setPurchasePrice(product.costPrice);
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseProduct || purchaseQty <= 0) return;
    await addPurchase(purchaseProduct, purchaseQty, purchasePrice, purchaseSupplier || undefined, purchaseNotes || undefined);
    setShowPurchaseModal(false);
    resetPurchaseForm();
  };

  const resetPurchaseForm = () => {
    setPurchaseProduct('');
    setPurchaseQty(1);
    setPurchasePrice(0);
    setPurchaseSupplier('');
    setPurchaseNotes('');
  };

  // Delivery Handlers
  const addDeliveryItem = () => {
    if (!selectedDeliveryProduct || deliveryItemQty <= 0) return;
    const product = products.find(p => p.id === selectedDeliveryProduct);
    if (!product) return;

    const existingItem = deliveryItems.find(i => i.product_id === selectedDeliveryProduct);
    const totalQty = (existingItem?.quantity || 0) + deliveryItemQty;
    if (totalQty > product.stock) return;

    if (existingItem) {
      setDeliveryItems(deliveryItems.map(i => 
        i.product_id === selectedDeliveryProduct 
          ? { ...i, quantity: i.quantity + deliveryItemQty }
          : i
      ));
    } else {
      setDeliveryItems([...deliveryItems, {
        product_id: product.id,
        product_name: product.name,
        quantity: deliveryItemQty
      }]);
    }
    setSelectedDeliveryProduct('');
    setDeliveryItemQty(1);
  };

  const removeDeliveryItem = (productId: string) => {
    setDeliveryItems(deliveryItems.filter(i => i.product_id !== productId));
  };

  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!distributorName || deliveryItems.length === 0) return;
    await createDelivery(distributorName, deliveryItems, deliveryNotes || undefined);
    setShowDeliveryModal(false);
    resetDeliveryForm();
  };

  const resetDeliveryForm = () => {
    setDistributorName('');
    setDeliveryNotes('');
    setDeliveryItems([]);
    setSelectedDeliveryProduct('');
    setDeliveryItemQty(1);
  };

  // Product Handlers
  const handleOpenProductModal = (p: Product | null = null) => {
    setEditingProduct(p);
    setShowProductModal(true);
  };

  const handleProductSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productData = {
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      costPrice: Number(formData.get('costPrice')),
      basePrice: Number(formData.get('basePrice')),
      stock: Number(formData.get('stock')),
      minStock: Number(formData.get('minStock')),
      unit: formData.get('unit') as string,
      isDeleted: false,
    };

    if (editingProduct) {
      updateProduct({ ...productData, id: editingProduct.id, organization_id: editingProduct.organization_id });
    } else {
      addProduct(productData);
    }
    setShowProductModal(false);
    setEditingProduct(null);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Sub-tabs */}
      <div className="grid grid-cols-3 gap-2 bg-muted p-1.5 rounded-2xl">
        <button 
          onClick={() => setSubTab('products')} 
          className={`py-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all ${subTab === 'products' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
        >
          <Package size={14} /> المواد
        </button>
        <button 
          onClick={() => setSubTab('purchases')} 
          className={`py-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all ${subTab === 'purchases' ? 'bg-card shadow-sm text-success' : 'text-muted-foreground'}`}
        >
          <ShoppingCart size={14} /> شراء
        </button>
        <button 
          onClick={() => setSubTab('deliveries')} 
          className={`py-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all ${subTab === 'deliveries' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground'}`}
        >
          <Truck size={14} /> تسليم
        </button>
      </div>

      {/* Products Sub-Tab */}
      {subTab === 'products' && (
        <div className="space-y-3">
          {lowStockCount > 0 && (
            <div className="bg-warning/10 p-4 rounded-2xl border border-warning/20 flex items-center gap-3">
              <AlertTriangle size={20} className="text-warning shrink-0" />
              <p className="text-xs font-bold text-warning">{lowStockCount} صنف يحتاج إعادة تعبئة</p>
            </div>
          )}

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                placeholder="بحث عن صنف..." 
                className="input-field pr-10" 
              />
            </div>
            <button onClick={() => handleOpenProductModal()} className="px-4 bg-primary text-primary-foreground rounded-2xl flex items-center gap-1">
              <Plus size={18} />
            </button>
          </div>

          <div className="space-y-2">
            {filteredProducts.length === 0 ? (
              <div className="bg-card p-8 rounded-[2.5rem] border text-center">
                <Box size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground font-bold">لا توجد منتجات</p>
              </div>
            ) : (
              filteredProducts.map(p => (
                <div key={p.id} className="bg-card p-4 rounded-[1.8rem] border shadow-sm flex justify-between items-center">
                  <div>
                    <p className="font-black text-foreground text-sm">{p.name}</p>
                    <p className="text-[9px] text-muted-foreground font-bold">{p.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-black px-2 py-1 rounded-lg ${p.stock <= p.minStock ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
                      {p.stock} {p.unit}
                    </span>
                    <button onClick={() => handleOpenProductModal(p)} className="p-2 bg-muted rounded-xl text-muted-foreground hover:text-primary">
                      <Settings2 size={16} />
                    </button>
                    <button onClick={() => deleteProduct(p.id)} className="p-2 bg-destructive/10 rounded-xl text-destructive">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Purchases Sub-Tab */}
      {subTab === 'purchases' && (
        <div className="space-y-3">
          <button 
            onClick={() => setShowPurchaseModal(true)} 
            className="w-full py-4 bg-success text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            <ShoppingCart size={18}/> تسجيل عملية شراء
          </button>

          {purchases.length === 0 ? (
            <div className="bg-card p-8 rounded-[2.5rem] border text-center">
              <Package size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-bold">لا توجد مشتريات</p>
            </div>
          ) : (
            purchases.map((purchase) => (
              <div key={purchase.id} className="bg-card p-4 rounded-[1.8rem] border shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-black text-foreground text-sm">{purchase.product_name}</h3>
                    <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                      <Calendar size={10} />
                      {new Date(purchase.created_at).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                  <span className="badge badge-success text-[9px]">{purchase.quantity} وحدة</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <User size={12} />
                    {purchase.supplier_name || 'غير محدد'}
                  </span>
                  <span className="font-black text-success">{purchase.total_price.toLocaleString()} {CURRENCY}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Deliveries Sub-Tab */}
      {subTab === 'deliveries' && (
        <div className="space-y-3">
          <button 
            onClick={() => setShowDeliveryModal(true)} 
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            <Truck size={18}/> تسليم بضاعة للموزع
          </button>

          {deliveries.length === 0 ? (
            <div className="bg-card p-8 rounded-[2.5rem] border text-center">
              <Truck size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-bold">لا توجد تسليمات</p>
            </div>
          ) : (
            deliveries.map((delivery) => (
              <div key={delivery.id} className="bg-card p-4 rounded-[1.8rem] border shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-black text-foreground text-sm flex items-center gap-1">
                      <User size={14} className="text-primary" />
                      {delivery.distributor_name}
                    </h3>
                    <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                      <Calendar size={10} />
                      {new Date(delivery.created_at).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                  <span className={`badge text-[9px] ${delivery.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                    {delivery.status === 'completed' ? 'مكتمل' : 'معلق'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="modal-overlay p-4">
          <div className="bg-card rounded-[2.5rem] w-full max-w-md shadow-2xl animate-zoom-in overflow-hidden max-h-[85vh] overflow-y-auto">
            <div className="p-5 bg-success text-white flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-lg font-black flex items-center gap-2">
                <ShoppingCart size={20} /> شراء مواد
              </h2>
              <button onClick={() => { setShowPurchaseModal(false); resetPurchaseForm(); }} className="text-white/50 p-1">
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handlePurchaseSubmit} className="p-5 space-y-4 text-end">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-muted-foreground uppercase mr-2">المادة</label>
                <select value={purchaseProduct} onChange={(e) => handlePurchaseProductChange(e.target.value)} required className="input-field">
                  <option value="">اختر المادة...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-muted-foreground uppercase mr-2">الكمية</label>
                  <input type="number" min="1" value={purchaseQty} onChange={(e) => setPurchaseQty(Number(e.target.value))} required className="input-field" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-muted-foreground uppercase mr-2">سعر الوحدة</label>
                  <input type="number" min="0" step="0.01" value={purchasePrice} onChange={(e) => setPurchasePrice(Number(e.target.value))} required className="input-field" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-muted-foreground uppercase mr-2">المورد</label>
                <input type="text" value={purchaseSupplier} onChange={(e) => setPurchaseSupplier(e.target.value)} placeholder="اختياري" className="input-field" />
              </div>
              <div className="bg-success/10 p-3 rounded-xl border border-success/20 flex justify-between items-center">
                <span className="font-bold text-muted-foreground text-sm">الإجمالي:</span>
                <span className="text-xl font-black text-success">{(purchaseQty * purchasePrice).toLocaleString()} {CURRENCY}</span>
              </div>
              <button type="submit" className="w-full bg-success text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all">
                تأكيد الشراء
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delivery Modal */}
      {showDeliveryModal && (
        <div className="modal-overlay p-4">
          <div className="bg-card rounded-[2.5rem] w-full max-w-md shadow-2xl animate-zoom-in overflow-hidden max-h-[85vh] overflow-y-auto">
            <div className="p-5 bg-primary text-primary-foreground flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-lg font-black flex items-center gap-2">
                <Truck size={20} /> تسليم للموزع
              </h2>
              <button onClick={() => { setShowDeliveryModal(false); resetDeliveryForm(); }} className="text-primary-foreground/50 p-1">
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleDeliverySubmit} className="p-5 space-y-4 text-end">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-muted-foreground uppercase mr-2">الموزع</label>
                {distributors.length > 0 ? (
                  <select value={distributorName} onChange={(e) => setDistributorName(e.target.value)} required className="input-field">
                    <option value="">اختر الموزع...</option>
                    {distributors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                ) : (
                  <input type="text" value={distributorName} onChange={(e) => setDistributorName(e.target.value)} required placeholder="اسم الموزع" className="input-field" />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-muted-foreground uppercase mr-2">إضافة أصناف</label>
                <div className="flex gap-2">
                  <select value={selectedDeliveryProduct} onChange={(e) => setSelectedDeliveryProduct(e.target.value)} className="input-field flex-1">
                    <option value="">اختر...</option>
                    {products.filter(p => p.stock > 0).map(p => <option key={p.id} value={p.id}>{p.name} ({p.stock})</option>)}
                  </select>
                  <input type="number" min="1" value={deliveryItemQty} onChange={(e) => setDeliveryItemQty(Number(e.target.value))} className="input-field w-16 text-center" />
                  <button type="button" onClick={addDeliveryItem} className="px-3 bg-primary text-primary-foreground rounded-xl">
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {deliveryItems.length > 0 && (
                <div className="space-y-2 bg-muted p-3 rounded-xl">
                  {deliveryItems.map((item) => (
                    <div key={item.product_id} className="flex justify-between items-center bg-card p-2 rounded-lg">
                      <span className="font-bold text-xs">{item.product_name}</span>
                      <div className="flex items-center gap-2">
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-black text-xs">{item.quantity}</span>
                        <button type="button" onClick={() => removeDeliveryItem(item.product_id)} className="text-destructive p-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button type="submit" disabled={deliveryItems.length === 0} className="w-full bg-primary text-primary-foreground font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all disabled:opacity-50">
                <Check size={18} className="inline ml-2" />
                تأكيد التسليم
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="modal-overlay p-4">
          <div className="bg-card rounded-[2.5rem] w-full max-w-md shadow-2xl animate-zoom-in overflow-hidden max-h-[85vh] overflow-y-auto">
            <div className="p-5 bg-primary text-primary-foreground flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-lg font-black flex items-center gap-2">
                <Package size={20} /> {editingProduct ? 'تعديل صنف' : 'إضافة صنف جديد'}
              </h2>
              <button onClick={() => { setShowProductModal(false); setEditingProduct(null); }} className="text-primary-foreground/50 p-1">
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleProductSubmit} className="p-5 space-y-3 text-end">
              <input name="name" required defaultValue={editingProduct?.name} placeholder="اسم الصنف" className="input-field" />
              <input name="category" defaultValue={editingProduct?.category} placeholder="الفئة" className="input-field" />
              <div className="grid grid-cols-2 gap-3">
                <input name="costPrice" type="number" step="0.01" defaultValue={editingProduct?.costPrice} placeholder="التكلفة" className="input-field" />
                <input name="basePrice" type="number" step="0.01" defaultValue={editingProduct?.basePrice} placeholder="سعر المبيع" className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input name="stock" type="number" defaultValue={editingProduct?.stock ?? 0} placeholder="المخزون" className="input-field" />
                <input name="minStock" type="number" defaultValue={editingProduct?.minStock ?? 5} placeholder="الحد الأدنى" className="input-field" />
              </div>
              <input name="unit" defaultValue={editingProduct?.unit ?? 'قطعة'} placeholder="الوحدة" className="input-field" />
              <button type="submit" className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black shadow-lg">
                {editingProduct ? 'حفظ التعديلات' : 'حفظ الصنف'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
