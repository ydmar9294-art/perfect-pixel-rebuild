import React, { useState } from 'react';
import { 
  Wallet, 
  Search, 
  FileText,
  Check,
  Loader2,
  X,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { supabase } from '@/integrations/supabase/client';

const CollectionTab: React.FC = () => {
  const { sales, refreshAllData } = useApp();
  const [selectedSaleId, setSelectedSaleId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [searchSale, setSearchSale] = useState('');

  // Filter sales with remaining balance
  const unpaidSales = sales.filter(s => !s.isVoided && Number(s.remaining) > 0);
  
  const filteredSales = unpaidSales.filter(s =>
    s.customerName.toLowerCase().includes(searchSale.toLowerCase())
  );

  const selectedSale = sales.find(s => s.id === selectedSaleId);

  const handleCollect = async () => {
    if (!selectedSaleId || !amount) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('يرجى إدخال مبلغ صحيح');
      return;
    }

    if (selectedSale && numAmount > Number(selectedSale.remaining)) {
      setError('المبلغ أكبر من المتبقي');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { error: rpcError } = await supabase.rpc('add_collection_rpc', {
        p_sale_id: selectedSaleId,
        p_amount: numAmount,
        p_notes: notes || null
      });

      if (rpcError) throw rpcError;

      setSelectedSaleId('');
      setAmount('');
      setNotes('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      await refreshAllData();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء التحصيل');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAmount = (percentage: number) => {
    if (selectedSale) {
      const calcAmount = (Number(selectedSale.remaining) * percentage / 100).toFixed(2);
      setAmount(calcAmount);
    }
  };

  return (
    <div className="space-y-4">
      {/* Success Message */}
      {success && (
        <div className="bg-success/10 text-success p-4 rounded-2xl flex items-center gap-2">
          <Check className="w-5 h-5" />
          <span className="font-bold">تم التحصيل بنجاح!</span>
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
          <div className="bg-muted rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span className="font-bold text-lg">{selectedSale.customerName}</span>
              </div>
              <button
                onClick={() => {
                  setSelectedSaleId('');
                  setAmount('');
                }}
                className="p-1 text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-card rounded-xl p-2">
                <p className="text-xs text-muted-foreground">الإجمالي</p>
                <p className="font-bold text-foreground">
                  {Number(selectedSale.grandTotal).toLocaleString('ar-SA')}
                </p>
              </div>
              <div className="bg-success/10 rounded-xl p-2">
                <p className="text-xs text-muted-foreground">المدفوع</p>
                <p className="font-bold text-success">
                  {Number(selectedSale.paidAmount).toLocaleString('ar-SA')}
                </p>
              </div>
              <div className="bg-warning/10 rounded-xl p-2">
                <p className="text-xs text-muted-foreground">المتبقي</p>
                <p className="font-bold text-warning">
                  {Number(selectedSale.remaining).toLocaleString('ar-SA')}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="بحث بالعميل..."
                value={searchSale}
                onChange={(e) => setSearchSale(e.target.value)}
                className="input-field pr-10"
              />
            </div>
            
            {unpaidSales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>لا توجد فواتير مستحقة</p>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredSales.map((sale) => (
                  <button
                    key={sale.id}
                    onClick={() => setSelectedSaleId(sale.id)}
                    className="w-full text-start p-3 bg-muted rounded-xl hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-foreground">{sale.customerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(sale.timestamp).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                      <div className="text-end">
                        <p className="font-bold text-warning">
                          {Number(sale.remaining).toLocaleString('ar-SA')} ر.س
                        </p>
                        <p className="text-xs text-muted-foreground">متبقي</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Collection Form */}
      {selectedSale && (
        <div className="card-elevated p-4 space-y-4">
          {/* Amount Input */}
          <div>
            <label className="text-sm font-bold text-foreground mb-2 block">مبلغ التحصيل</label>
            <div className="relative">
              <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="input-field pr-10 text-2xl font-black text-center"
                dir="ltr"
              />
            </div>
            
            {/* Quick Amount Buttons */}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleQuickAmount(25)}
                className="flex-1 btn-secondary py-2 text-sm"
              >
                25%
              </button>
              <button
                onClick={() => handleQuickAmount(50)}
                className="flex-1 btn-secondary py-2 text-sm"
              >
                50%
              </button>
              <button
                onClick={() => handleQuickAmount(100)}
                className="flex-1 btn-success py-2 text-sm"
              >
                الكل
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-bold text-foreground mb-2 block">ملاحظات (اختياري)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي ملاحظات..."
              className="input-field min-h-[60px] resize-none"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleCollect}
            disabled={loading || !amount}
            className="btn-success w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                جارٍ التحصيل...
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5" />
                تأكيد التحصيل
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default CollectionTab;
