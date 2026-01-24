import React, { useState } from 'react';
import { 
  RotateCcw, 
  Search, 
  FileText,
  Package,
  Check,
  Loader2,
  X,
  AlertCircle,
  Minus,
  Plus
} from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { supabase } from '@/integrations/supabase/client';

interface ReturnItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  max_quantity: number;
}

const SalesReturnTab: React.FC = () => {
  const { sales, refreshAllData } = useApp();
  const [selectedSaleId, setSelectedSaleId] = useState<string>('');
  const [saleItems, setSaleItems] = useState<any[]>([]);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [searchSale, setSearchSale] = useState('');

  const activeSales = sales.filter(s => !s.isVoided);
  
  const filteredSales = activeSales.filter(s =>
    s.customerName.toLowerCase().includes(searchSale.toLowerCase()) ||
    s.id.toLowerCase().includes(searchSale.toLowerCase())
  );

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
      setReturnItems([]);
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

  const addReturnItem = (item: any) => {
    const existing = returnItems.find(ri => ri.product_id === item.product_id);
    if (!existing) {
      setReturnItems([...returnItems, {
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: 1,
        unit_price: Number(item.unit_price),
        max_quantity: item.quantity
      }]);
    }
  };

  const updateReturnQuantity = (productId: string, delta: number) => {
    setReturnItems(returnItems.map(item => {
      if (item.product_id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0 || newQty > item.max_quantity) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeReturnItem = (productId: string) => {
    setReturnItems(returnItems.filter(item => item.product_id !== productId));
  };

  const totalReturn = returnItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  const handleCreateReturn = async () => {
    if (!selectedSaleId || returnItems.length === 0) return;

    setLoading(true);
    setError('');
    try {
      const items = returnItems.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price
      }));

      const { error: rpcError } = await supabase.rpc('create_sales_return_rpc', {
        p_sale_id: selectedSaleId,
        p_items: items,
        p_reason: reason || null
      });

      if (rpcError) throw rpcError;

      setSelectedSaleId('');
      setSaleItems([]);
      setReturnItems([]);
      setReason('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      await refreshAllData();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إنشاء المرتجع');
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
          <span className="font-bold">تم إنشاء المرتجع بنجاح!</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span className="font-bold">{error}</span>
        </div>
      )}

      {/* Sale Selection */}
      <div className="card-elevated p-4">
        <label className="text-sm font-bold text-foreground mb-2 block">اختر الفاتورة</label>
        
        {selectedSale ? (
          <div className="bg-muted rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span className="font-bold">{selectedSale.customerName}</span>
              </div>
              <button
                onClick={() => {
                  setSelectedSaleId('');
                  setSaleItems([]);
                  setReturnItems([]);
                }}
                className="p-1 text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>الإجمالي: {Number(selectedSale.grandTotal).toLocaleString('ar-SA')} ر.س</p>
              <p>التاريخ: {new Date(selectedSale.timestamp).toLocaleDateString('ar-SA')}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="بحث بالعميل أو رقم الفاتورة..."
                value={searchSale}
                onChange={(e) => setSearchSale(e.target.value)}
                className="input-field pr-10"
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {filteredSales.slice(0, 10).map((sale) => (
                <button
                  key={sale.id}
                  onClick={() => handleSelectSale(sale.id)}
                  className="w-full text-start p-3 bg-muted rounded-xl hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-foreground">{sale.customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(sale.timestamp).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    <span className="font-bold text-primary">
                      {Number(sale.grandTotal).toLocaleString('ar-SA')} ر.س
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sale Items */}
      {selectedSaleId && (
        <div className="card-elevated p-4">
          <h3 className="font-bold text-foreground mb-3">منتجات الفاتورة</h3>
          
          {loadingItems ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-2">
              {saleItems.map((item) => {
                const isSelected = returnItems.some(ri => ri.product_id === item.product_id);
                return (
                  <button
                    key={item.id}
                    onClick={() => !isSelected && addReturnItem(item)}
                    disabled={isSelected}
                    className={`w-full text-start p-3 rounded-xl transition-colors ${
                      isSelected 
                        ? 'bg-success/10 border-2 border-success' 
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span className="font-bold">{item.product_name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {item.quantity} × {Number(item.unit_price).toLocaleString('ar-SA')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Return Items */}
      {returnItems.length > 0 && (
        <div className="card-elevated p-4">
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-warning" />
            المنتجات المرتجعة
          </h3>
          
          <div className="space-y-3">
            {returnItems.map((item) => (
              <div key={item.product_id} className="bg-warning/10 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-foreground">{item.product_name}</span>
                  <button
                    onClick={() => removeReturnItem(item.product_id)}
                    className="p-1 text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateReturnQuantity(item.product_id, -1)}
                      className="w-8 h-8 bg-card rounded-lg flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-bold w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateReturnQuantity(item.product_id, 1)}
                      className="w-8 h-8 bg-card rounded-lg flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-muted-foreground">
                      (الحد الأقصى: {item.max_quantity})
                    </span>
                  </div>
                  <span className="font-bold text-warning">
                    {(item.quantity * item.unit_price).toLocaleString('ar-SA')} ر.س
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Reason */}
          <div className="mt-4">
            <label className="text-sm font-bold text-foreground mb-2 block">سبب الإرجاع (اختياري)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="أدخل سبب الإرجاع..."
              className="input-field min-h-[80px] resize-none"
            />
          </div>
        </div>
      )}

      {/* Total & Submit */}
      {returnItems.length > 0 && (
        <div className="card-elevated p-4 space-y-4">
          <div className="flex items-center justify-between text-lg">
            <span className="font-bold text-foreground">إجمالي المرتجع</span>
            <span className="font-black text-warning text-2xl">
              {totalReturn.toLocaleString('ar-SA')} ر.س
            </span>
          </div>
          <button
            onClick={handleCreateReturn}
            disabled={loading}
            className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                جارٍ الحفظ...
              </>
            ) : (
              <>
                <RotateCcw className="w-5 h-5" />
                تأكيد المرتجع
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default SalesReturnTab;
