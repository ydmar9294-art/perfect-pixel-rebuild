import React, { useState } from 'react';
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
  UserPlus,
  Phone,
  ChevronDown
} from 'lucide-react';
import { useApp } from '@/store/AppContext';

interface CartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

const NewSaleTab: React.FC = () => {
  const { products, customers, createSale, refreshAllData, addCustomer, addNotification } = useApp();
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [addingCustomer, setAddingCustomer] = useState(false);
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

  const handleAddCustomer = async () => {
    if (!newCustomerName.trim()) {
      addNotification('يرجى إدخال اسم العميل', 'warning');
      return;
    }

    setAddingCustomer(true);
    try {
      await addCustomer(newCustomerName.trim(), newCustomerPhone.trim());
      setNewCustomerName('');
      setNewCustomerPhone('');
      setShowAddCustomerModal(false);
    } catch (error) {
      console.error('Error adding customer:', error);
    } finally {
      setAddingCustomer(false);
    }
  };

  return (
    <div className="p-5 space-y-5">
      {/* Success Message */}
      {success && (
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl flex items-center gap-2 border border-emerald-200">
          <Check className="w-5 h-5" />
          <span className="font-bold">تم إنشاء الفاتورة بنجاح!</span>
        </div>
      )}

      {/* Section Title */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-gray-800">الأصناف المطلوبة</h3>
        <button
          onClick={() => setShowProductPicker(true)}
          className="flex items-center gap-1.5 text-blue-600 font-bold text-sm hover:text-blue-700"
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
                  <span className="font-black w-8 text-center text-lg">{item.quantity}</span>
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

      {/* Customer Picker Modal */}
      {showCustomerPicker && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCustomerPicker(false)}>
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-lg">اختر الزبون</h3>
                <button onClick={() => setShowCustomerPicker(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <button
                onClick={() => {
                  setShowCustomerPicker(false);
                  setShowAddCustomerModal(true);
                }}
                className="w-full bg-blue-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold mb-4 hover:bg-blue-700"
              >
                <UserPlus className="w-5 h-5" />
                إضافة زبون جديد
              </button>
              
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="بحث..."
                  value={searchCustomer}
                  onChange={(e) => setSearchCustomer(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-12 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
            
            <div className="max-h-[50vh] overflow-y-auto p-4 space-y-2">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <User className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p className="font-bold">لا يوجد زبائن</p>
                </div>
              ) : (
                filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => {
                      setSelectedCustomer(customer.id);
                      setShowCustomerPicker(false);
                      setSearchCustomer('');
                    }}
                    className="w-full text-start p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                  >
                    <p className="font-bold text-gray-800">{customer.name}</p>
                    <p className="text-sm text-gray-500">
                      الرصيد: {Number(customer.balance).toLocaleString('ar-SA')} ل.س
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddCustomerModal(false)}>
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                إضافة زبون جديد
              </h3>
              <button onClick={() => setShowAddCustomerModal(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-600 mb-2 block">
                  اسم الزبون <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="أدخل اسم الزبون"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="w-full bg-gray-50 border-none rounded-xl px-12 py-4 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    disabled={addingCustomer}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-bold text-gray-600 mb-2 block">
                  رقم الهاتف (اختياري)
                </label>
                <div className="relative">
                  <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="05xxxxxxxx"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    className="w-full bg-gray-50 border-none rounded-xl px-12 py-4 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    disabled={addingCustomer}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAddCustomer}
                disabled={addingCustomer || !newCustomerName.trim()}
                className="flex-1 bg-emerald-500 text-white py-4 rounded-xl flex items-center justify-center gap-2 font-bold disabled:opacity-50 hover:bg-emerald-600"
              >
                {addingCustomer ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جارٍ الحفظ...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    حفظ
                  </>
                )}
              </button>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                disabled={addingCustomer}
                className="px-6 py-4 bg-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-200"
              >
                إلغاء
              </button>
            </div>
          </div>
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
                  className="w-full bg-white border border-gray-200 rounded-xl px-12 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="w-full text-start p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-800">{product.name}</p>
                      <p className="text-sm text-gray-500">
                        المخزون: {product.stock} {product.unit}
                      </p>
                    </div>
                    <span className="font-black text-blue-600">
                      {Number(product.basePrice).toLocaleString('ar-SA')}
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
