import React, { useState } from 'react';
import { 
  Plus, 
  Minus, 
  ShoppingCart, 
  User, 
  Search,
  X,
  Check,
  Loader2,
  Package
} from 'lucide-react';
import { useApp } from '@/store/AppContext';

interface CartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

const NewSaleTab: React.FC = () => {
  const { products, customers, createSale, refreshAllData } = useApp();
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const activeProducts = products.filter(p => !p.isDeleted && p.stock > 0);
  
  const filteredProducts = activeProducts.filter(p =>
    p.name.toLowerCase().includes(searchProduct.toLowerCase())
  );

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchCustomer.toLowerCase())
  );

  const selectedCustomerData = customers.find(c => c.id === selectedCustomer);

  const addToCart = (product: typeof products[0]) => {
    const existing = cart.find(item => item.product_id === product.id);
    if (existing) {
      if (existing.quantity < product.stock) {
        setCart(cart.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      }
    } else {
      setCart([...cart, {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.basePrice
      }]);
    }
    setShowProductPicker(false);
    setSearchProduct('');
  };

  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find(p => p.id === productId);
    setCart(cart.map(item => {
      if (item.product_id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        if (product && newQty > product.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const grandTotal = cart.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  const handleCreateSale = async () => {
    if (!selectedCustomer || cart.length === 0) return;

    setLoading(true);
    try {
      await createSale(selectedCustomer, cart);
      setCart([]);
      setSelectedCustomer('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      await refreshAllData();
    } catch (error) {
      console.error('Error creating sale:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Success Message */}
      {success && (
        <div className="bg-success/10 text-success p-4 rounded-2xl flex items-center gap-2">
          <Check className="w-5 h-5" />
          <span className="font-bold">تم إنشاء الفاتورة بنجاح!</span>
        </div>
      )}

      {/* Customer Selection */}
      <div className="card-elevated p-4">
        <label className="text-sm font-bold text-foreground mb-2 block">العميل</label>
        {selectedCustomerData ? (
          <div className="flex items-center justify-between bg-muted rounded-xl p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground">{selectedCustomerData.name}</p>
                <p className="text-xs text-muted-foreground">
                  الرصيد: {Number(selectedCustomerData.balance).toLocaleString('ar-SA')} ر.س
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedCustomer('')}
              className="p-2 text-muted-foreground hover:text-destructive"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCustomerPicker(true)}
            className="w-full btn-secondary py-4 flex items-center justify-center gap-2"
          >
            <User className="w-5 h-5" />
            اختر العميل
          </button>
        )}
      </div>

      {/* Cart */}
      <div className="card-elevated p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            سلة المنتجات
          </h3>
          <button
            onClick={() => setShowProductPicker(true)}
            className="btn-primary px-4 py-2 text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            إضافة منتج
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>لا توجد منتجات في السلة</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.product_id} className="bg-muted rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-foreground">{item.product_name}</span>
                  <button
                    onClick={() => removeFromCart(item.product_id)}
                    className="p-1 text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product_id, -1)}
                      className="w-8 h-8 bg-card rounded-lg flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-bold w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product_id, 1)}
                      className="w-8 h-8 bg-card rounded-lg flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="font-bold text-primary">
                    {(item.quantity * item.unit_price).toLocaleString('ar-SA')} ر.س
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total & Submit */}
      {cart.length > 0 && (
        <div className="card-elevated p-4 space-y-4">
          <div className="flex items-center justify-between text-lg">
            <span className="font-bold text-foreground">الإجمالي</span>
            <span className="font-black text-primary text-2xl">
              {grandTotal.toLocaleString('ar-SA')} ر.س
            </span>
          </div>
          <button
            onClick={handleCreateSale}
            disabled={loading || !selectedCustomer}
            className="btn-success w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                جارٍ الحفظ...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                تأكيد الفاتورة
              </>
            )}
          </button>
        </div>
      )}

      {/* Customer Picker Modal */}
      {showCustomerPicker && (
        <div className="modal-overlay" onClick={() => setShowCustomerPicker(false)}>
          <div className="bg-card w-full max-w-md mx-4 rounded-3xl p-4 max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">اختر العميل</h3>
              <button onClick={() => setShowCustomerPicker(false)} className="p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative mb-4">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="بحث..."
                value={searchCustomer}
                onChange={(e) => setSearchCustomer(e.target.value)}
                className="input-field pr-10"
              />
            </div>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => {
                    setSelectedCustomer(customer.id);
                    setShowCustomerPicker(false);
                    setSearchCustomer('');
                  }}
                  className="w-full text-start p-3 bg-muted rounded-xl hover:bg-muted/80 transition-colors"
                >
                  <p className="font-bold text-foreground">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    الرصيد: {Number(customer.balance).toLocaleString('ar-SA')} ر.س
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Product Picker Modal */}
      {showProductPicker && (
        <div className="modal-overlay" onClick={() => setShowProductPicker(false)}>
          <div className="bg-card w-full max-w-md mx-4 rounded-3xl p-4 max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">اختر المنتج</h3>
              <button onClick={() => setShowProductPicker(false)} className="p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative mb-4">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="بحث..."
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                className="input-field pr-10"
              />
            </div>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="w-full text-start p-3 bg-muted rounded-xl hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        المخزون: {product.stock} {product.unit}
                      </p>
                    </div>
                    <span className="font-bold text-primary">
                      {Number(product.basePrice).toLocaleString('ar-SA')} ر.س
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewSaleTab;
