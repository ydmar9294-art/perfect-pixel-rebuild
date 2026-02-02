import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Minus, 
  ShoppingBag, 
  User, 
  Search,
  X,
  Check,
  Loader2,
  Package,
  AlertCircle,
  Printer
} from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Customer } from '@/types';
import InvoicePrint from './InvoicePrint';

interface CartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

interface DistributorProduct {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  base_price: number;
}

interface NewSaleTabProps {
  selectedCustomer: Customer | null;
}

const NewSaleTab: React.FC<NewSaleTabProps> = ({ selectedCustomer }) => {
  const { createSale, refreshAllData, addNotification } = useApp();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [distributorInventory, setDistributorInventory] = useState<DistributorProduct[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  
  // Print state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [lastSaleData, setLastSaleData] = useState<{
    id: string;
    customerName: string;
    items: CartItem[];
    grandTotal: number;
  } | null>(null);

  // جلب مخزون الموزع الخاص به فقط
  useEffect(() => {
    const fetchDistributorInventory = async () => {
      setLoadingInventory(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('distributor_inventory')
          .select('id, product_id, product_name, quantity')
          .eq('distributor_id', user.id)
          .gt('quantity', 0);

        if (error) throw error;

        // جلب أسعار المنتجات من جدول المنتجات
        const productIds = (data || []).map(d => d.product_id);
        const { data: productsData } = await supabase
          .from('products')
          .select('id, base_price')
          .in('id', productIds);

        const priceMap = new Map((productsData || []).map(p => [p.id, Number(p.base_price)]));

        setDistributorInventory((data || []).map(item => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          base_price: priceMap.get(item.product_id) || 0
        })));
      } catch (err) {
        console.error('Error fetching distributor inventory:', err);
      } finally {
        setLoadingInventory(false);
      }
    };

    fetchDistributorInventory();
  }, []);

  // استخدام مخزون الموزع بدلاً من المخزون العام
  const activeProducts = distributorInventory.filter(p => p.quantity > 0);
  
  const filteredProducts = activeProducts.filter(p =>
    p.product_name.toLowerCase().includes(searchProduct.toLowerCase())
  );

  const addToCart = (product: DistributorProduct) => {
    const existing = cart.find(item => item.product_id === product.product_id);
    if (existing) {
      if (existing.quantity < product.quantity) {
        setCart(cart.map(item =>
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      }
    } else {
      setCart([...cart, {
        product_id: product.product_id,
        product_name: product.product_name,
        quantity: 1,
        unit_price: product.base_price
      }]);
    }
    setShowProductPicker(false);
    setSearchProduct('');
  };

  const updateQuantity = (productId: string, delta: number) => {
    const product = distributorInventory.find(p => p.product_id === productId);
    setCart(cart.map(item => {
      if (item.product_id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        if (product && newQty > product.quantity) return item;
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
    if (!selectedCustomer?.id || cart.length === 0) return;

    setLoading(true);
    try {
      await createSale(selectedCustomer.id, cart);
      
      // Store sale data for printing
      setLastSaleData({
        id: crypto.randomUUID(),
        customerName: selectedCustomer.name,
        items: [...cart],
        grandTotal
      });
      
      setCart([]);
      setSuccess(true);
      setShowPrintModal(true); // Show print modal after success
      await refreshAllData();
    } catch (error) {
      console.error('Error creating sale:', error);
      addNotification('حدث خطأ أثناء إنشاء الفاتورة', 'error');
    } finally {
      setLoading(false);
    }
  };

  const closePrintModal = () => {
    setShowPrintModal(false);
    setSuccess(false);
    setLastSaleData(null);
  };

  return (
    <div className="p-5 space-y-5">
      {/* Print Modal */}
      {showPrintModal && lastSaleData && (
        <InvoicePrint
          invoiceType="sale"
          invoiceId={lastSaleData.id}
          customerName={lastSaleData.customerName}
          date={new Date()}
          items={lastSaleData.items.map(item => ({
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.quantity * item.unit_price
          }))}
          grandTotal={lastSaleData.grandTotal}
          paidAmount={0}
          remaining={lastSaleData.grandTotal}
          onClose={closePrintModal}
        />
      )}

      {/* Success Message */}
      {success && !showPrintModal && (
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl flex items-center gap-2 border border-emerald-200">
          <Check className="w-5 h-5" />
          <span className="font-bold">تم إنشاء الفاتورة بنجاح!</span>
        </div>
      )}

      {/* No Customer Selected Warning */}
      {!selectedCustomer && (
        <div className="bg-amber-50 text-amber-700 p-4 rounded-2xl flex items-center gap-2 border border-amber-200">
          <AlertCircle className="w-5 h-5" />
          <span className="font-bold">يرجى اختيار زبون من القائمة أعلاه</span>
        </div>
      )}

      {/* Selected Customer Info */}
      {selectedCustomer && (
        <div className="bg-blue-50 rounded-2xl p-4 flex items-center gap-3 border border-blue-200">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-800">{selectedCustomer.name}</p>
            <p className="text-sm text-gray-500">
              الرصيد: {Number(selectedCustomer.balance).toLocaleString('ar-SA')} ل.س
            </p>
          </div>
        </div>
      )}

      {/* Section Title */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-gray-800">الأصناف المطلوبة</h3>
        <button
          onClick={() => setShowProductPicker(true)}
          className="flex items-center gap-1.5 text-blue-600 font-bold text-sm hover:text-blue-700"
          disabled={!selectedCustomer}
        >
          <Plus className="w-4 h-4" />
          إضافة مادة
        </button>
      </div>

      {/* Cart Items or Empty State */}
      {cart.length === 0 ? (
        <div className="bg-gray-50 rounded-3xl p-8 text-center">
          <div className="w-20 h-20 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-sm">
            <ShoppingBag className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-gray-400 font-bold">السلة فارغة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cart.map((item) => (
            <div key={item.product_id} className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-gray-800">{item.product_name}</span>
                <button
                  onClick={() => removeFromCart(item.product_id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 bg-white rounded-xl p-1">
                  <button
                    onClick={() => updateQuantity(item.product_id, -1)}
                    className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200"
                  >
                    <Minus className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="font-black w-8 text-center text-lg text-foreground">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product_id, 1)}
                    className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </button>
                </div>
                <span className="font-black text-blue-600 text-lg">
                  {(item.quantity * item.unit_price).toLocaleString('ar-SA')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Total & Submit */}
      {cart.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-500">الإجمالي</span>
            <span className="font-black text-blue-600 text-2xl">
              {grandTotal.toLocaleString('ar-SA')} ل.س
            </span>
          </div>
          <button
            onClick={handleCreateSale}
            disabled={loading || !selectedCustomer}
            className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none hover:bg-blue-700 transition-all"
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

      {/* Product Picker Modal */}
      {showProductPicker && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowProductPicker(false)}>
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-lg">اختر المادة</h3>
                <button onClick={() => setShowProductPicker(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="بحث..."
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-12 py-3 font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
            
            <div className="max-h-[50vh] overflow-y-auto p-4 space-y-2">
              {loadingInventory ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-blue-600" />
                  <p className="text-gray-400 font-bold">جارٍ التحميل...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Package className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p className="font-bold">لا توجد مواد متاحة</p>
                  <p className="text-sm mt-1">تواصل مع صاحب المنشأة لاستلام بضاعة</p>
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="w-full text-start p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-800">{product.product_name}</p>
                        <p className="text-sm text-gray-500">
                          المتوفر: {product.quantity} | السعر: {product.base_price.toLocaleString('ar-SA')} ل.س
                        </p>
                      </div>
                      <Plus className="w-5 h-5 text-blue-600" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewSaleTab;
