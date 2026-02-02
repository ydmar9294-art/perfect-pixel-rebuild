import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  Search, 
  FileText,
  Package,
  Check,
  Loader2,
  X,
  AlertCircle,
  ChevronDown,
  Printer
} from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { supabase } from '@/integrations/supabase/client';
import InvoicePrint from './InvoicePrint';

interface ReturnItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  max_quantity: number;
}

interface DistributorProduct {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
}

interface SalesReturnTabProps {
  selectedCustomer: import('@/types').Customer | null;
}

const SalesReturnTab: React.FC<SalesReturnTabProps> = ({ selectedCustomer }) => {
  const { sales, refreshAllData } = useApp();
  const [selectedSaleId, setSelectedSaleId] = useState<string>('');
  const [saleItems, setSaleItems] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('ممتاز (يعود للمخزون)');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [distributorInventory, setDistributorInventory] = useState<DistributorProduct[]>([]);
  
  // Print state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [lastReturnData, setLastReturnData] = useState<{
    id: string;
    customerName: string;
    items: { product_name: string; quantity: number; unit_price: number; total_price: number }[];
    grandTotal: number;
    reason?: string;
  } | null>(null);

  // جلب مخزون الموزع الخاص به فقط
  useEffect(() => {
    const fetchDistributorInventory = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('distributor_inventory')
          .select('id, product_id, product_name, quantity')
          .eq('distributor_id', user.id)
          .gt('quantity', 0);

        if (error) throw error;
        setDistributorInventory(data || []);
      } catch (err) {
        console.error('Error fetching distributor inventory:', err);
      }
    };

    fetchDistributorInventory();
  }, []);

  const activeSales = sales.filter(s => !s.isVoided);
  const selectedSale = sales.find(s => s.id === selectedSaleId);

  const loadSaleItems = async (saleId: string) => {
    setLoadingItems(true);
    try {
      const { data, error } = await supabase
        .from('sale_items')
        .select('*')
        .eq('sale_id', saleId);

      if (error) throw error;
      setSaleItems(data || []);
    } catch (err) {
      console.error('Error loading sale items:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleSelectSale = (saleId: string) => {
    setSelectedSaleId(saleId);
    loadSaleItems(saleId);
  };

  const handleCreateReturn = async () => {
    if (!selectedProduct || quantity <= 0) {
      setError('يرجى اختيار المادة والكمية');
      return;
    }

    const product = saleItems.find(item => item.product_id === selectedProduct);
    if (!product) {
      setError('المادة غير موجودة');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const items = [{
        product_id: selectedProduct,
        product_name: product.product_name,
        quantity: quantity,
        unit_price: Number(product.unit_price)
      }];

      const { error: rpcError } = await supabase.rpc('create_sales_return_rpc', {
        p_sale_id: selectedSaleId,
        p_items: items,
        p_reason: reason || null
      });

      if (rpcError) throw rpcError;

      const totalAmount = quantity * Number(product.unit_price);
      
      // Store return data for printing
      setLastReturnData({
        id: crypto.randomUUID(),
        customerName: selectedSale?.customerName || '',
        items: [{
          product_name: product.product_name,
          quantity: quantity,
          unit_price: Number(product.unit_price),
          total_price: totalAmount
        }],
        grandTotal: totalAmount,
        reason: reason || undefined
      });

      setSelectedSaleId('');
      setSaleItems([]);
      setSelectedProduct('');
      setQuantity(1);
      setReason('');
      setSuccess(true);
      setShowPrintModal(true); // Show print modal after success
      await refreshAllData();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إنشاء المرتجع');
    } finally {
      setLoading(false);
    }
  };

  const closePrintModal = () => {
    setShowPrintModal(false);
    setSuccess(false);
    setLastReturnData(null);
  };

  const totalReturn = selectedProduct && saleItems.length > 0 
    ? quantity * Number(saleItems.find(i => i.product_id === selectedProduct)?.unit_price || 0)
    : 0;

  return (
    <div className="p-5 space-y-5">
      {/* Print Modal */}
      {showPrintModal && lastReturnData && (
        <InvoicePrint
          invoiceType="return"
          invoiceId={lastReturnData.id}
          customerName={lastReturnData.customerName}
          date={new Date()}
          items={lastReturnData.items}
          grandTotal={lastReturnData.grandTotal}
          notes={lastReturnData.reason}
          onClose={closePrintModal}
        />
      )}

      {/* Success Message */}
      {success && !showPrintModal && (
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl flex items-center gap-2 border border-emerald-200">
          <Check className="w-5 h-5" />
          <span className="font-bold">تم إنشاء المرتجع بنجاح!</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-2 border border-red-200">
          <AlertCircle className="w-5 h-5" />
          <span className="font-bold">{error}</span>
        </div>
      )}

      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-black text-gray-800 mb-2">تسجيل مرتجع مبيعات</h3>
        <p className="text-gray-400 text-sm">سيتم إعادة البضاعة للمخزن وتعديل ذمة الزبون</p>
      </div>

      {/* Product Selection */}
      <div className="space-y-4">
        <div className="relative">
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="">-- اختر المادة المرتجعة --</option>
            {saleItems.map((item) => (
              <option key={item.product_id} value={item.product_id}>
                {item.product_name} (متوفر: {item.quantity})
              </option>
            ))}
            {distributorInventory.map((product) => (
              <option key={product.product_id} value={product.product_id}>
                {product.product_name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min="1"
              className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-medium text-center focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              placeholder="الكمية"
            />
          </div>
          <div className="relative">
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="ممتاز (يعو">ممتاز (يعو</option>
              <option value="جيد">جيد</option>
              <option value="تالف">تالف</option>
            </select>
            <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleCreateReturn}
        disabled={loading || !selectedProduct || quantity <= 0}
        className="w-full bg-orange-100 text-orange-700 font-black py-5 rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50 hover:bg-orange-200 transition-all"
      >
        {loading ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            جارٍ الحفظ...
          </>
        ) : (
          <>
            <RotateCcw className="w-6 h-6" />
            تأكيد عملية المرتجع
          </>
        )}
      </button>

      {/* Sale Selection if not selected */}
      {!selectedSaleId && (
        <div className="space-y-3">
          <p className="text-gray-400 text-sm">اختر فاتورة للإرجاع:</p>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {activeSales.slice(0, 10).map((sale) => (
              <button
                key={sale.id}
                onClick={() => handleSelectSale(sale.id)}
                className="w-full text-start p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-800">{sale.customerName}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(sale.timestamp).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <span className="font-bold text-blue-600">
                    {Number(sale.grandTotal).toLocaleString('ar-SA')} ل.س
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Sale Info */}
      {selectedSale && (
        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" />
              <span className="font-bold">{selectedSale.customerName}</span>
            </div>
            <button
              onClick={() => {
                setSelectedSaleId('');
                setSaleItems([]);
                setSelectedProduct('');
              }}
              className="p-1 text-gray-400 hover:text-red-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesReturnTab;
