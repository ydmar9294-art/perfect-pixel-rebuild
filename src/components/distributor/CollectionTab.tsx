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

  const handleQuickAmount = (value: number) => {
    const currentAmount = parseFloat(amount) || 0;
    setAmount((currentAmount + value).toString());
  };

  const quickAmounts = [1000, 5000, 10000, 25000, 50000, 100000];

  return (
    <div className="p-5 space-y-5">
      {/* Success Message */}
      {success && (
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl flex items-center gap-2 border border-emerald-200">
          <Check className="w-5 h-5" />
          <span className="font-bold">تم التحصيل بنجاح!</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-2 border border-red-200">
          <AlertCircle className="w-5 h-5" />
          <span className="font-bold">{error}</span>
        </div>
      )}

      {/* Amount Input Section */}
      <div className="bg-gray-50 rounded-3xl p-5">
        <p className="text-gray-400 text-center text-sm mb-3">إدخال مبلغ التحصيل</p>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full text-center text-3xl font-black text-gray-800 bg-transparent border-none outline-none py-4"
          dir="ltr"
        />
        
        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {quickAmounts.map((value) => (
            <button
              key={value}
              onClick={() => handleQuickAmount(value)}
              className="py-3 bg-white rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
            >
              +{value.toLocaleString('ar-SA')}
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleCollect}
        disabled={loading || !amount || !selectedSaleId}
        className="w-full bg-emerald-100 text-emerald-700 font-black py-5 rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50 hover:bg-emerald-200 transition-all"
      >
        {loading ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            جارٍ التحصيل...
          </>
        ) : (
          <>
            <DollarSign className="w-6 h-6" />
            توثيق سند القبض
          </>
        )}
      </button>

      {/* Sale Selection */}
      {!selectedSale && (
        <div className="space-y-3">
          <p className="text-gray-400 text-sm">اختر الفاتورة:</p>
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="بحث بالعميل..."
              value={searchSale}
              onChange={(e) => setSearchSale(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-2xl px-12 py-4 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          
          {unpaidSales.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="font-bold">لا توجد فواتير مستحقة</p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredSales.map((sale) => (
                <button
                  key={sale.id}
                  onClick={() => setSelectedSaleId(sale.id)}
                  className="w-full text-start p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-800">{sale.customerName}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(sale.timestamp).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="font-black text-orange-500">
                        {Number(sale.remaining).toLocaleString('ar-SA')} ل.س
                      </p>
                      <p className="text-xs text-gray-500">متبقي</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected Sale Info */}
      {selectedSale && (
        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-lg">{selectedSale.customerName}</span>
            </div>
            <button
              onClick={() => {
                setSelectedSaleId('');
                setAmount('');
              }}
              className="p-1 text-gray-400 hover:text-red-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white rounded-xl p-3">
              <p className="text-xs text-gray-400">الإجمالي</p>
              <p className="font-bold text-gray-800">
                {Number(selectedSale.grandTotal).toLocaleString('ar-SA')}
              </p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">المدفوع</p>
              <p className="font-bold text-emerald-600">
                {Number(selectedSale.paidAmount).toLocaleString('ar-SA')}
              </p>
            </div>
            <div className="bg-orange-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">المتبقي</p>
              <p className="font-bold text-orange-500">
                {Number(selectedSale.remaining).toLocaleString('ar-SA')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionTab;
