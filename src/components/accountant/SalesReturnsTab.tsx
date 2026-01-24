import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  Search,
  Package
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SalesReturn {
  id: string;
  sale_id: string;
  customer_name: string;
  total_amount: number;
  reason: string | null;
  created_at: string;
}

const SalesReturnsTab: React.FC = () => {
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    loadReturns();
  }, []);

  const loadReturns = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales_returns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReturns(data || []);
    } catch (error) {
      console.error('Error loading sales returns:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReturns = returns.filter(r => {
    if (searchTerm && !r.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    if (dateFrom) {
      const returnDate = new Date(r.created_at);
      const fromDate = new Date(dateFrom);
      if (returnDate < fromDate) return false;
    }
    if (dateTo) {
      const returnDate = new Date(r.created_at);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59);
      if (returnDate > toDate) return false;
    }

    return true;
  });

  const totalAmount = filteredReturns.reduce((sum, r) => sum + Number(r.total_amount), 0);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card-elevated p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="بحث بالعميل..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pr-10"
            />
          </div>
          
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="input-field"
          />
          
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="input-field"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="bg-warning/10 rounded-2xl p-4 text-center">
        <p className="text-sm text-muted-foreground">إجمالي مرتجعات المبيعات</p>
        <p className="text-2xl font-black text-warning">
          {totalAmount.toLocaleString('ar-SA')} ر.س
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {filteredReturns.length} عملية إرجاع
        </p>
      </div>

      {/* Returns Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-start p-4 font-bold text-sm">العميل</th>
                <th className="text-start p-4 font-bold text-sm">المبلغ</th>
                <th className="text-start p-4 font-bold text-sm">السبب</th>
                <th className="text-start p-4 font-bold text-sm">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredReturns.map((ret) => (
                <tr key={ret.id} className="hover:bg-muted/50">
                  <td className="p-4 font-bold">{ret.customer_name}</td>
                  <td className="p-4 font-bold text-warning">{Number(ret.total_amount).toLocaleString('ar-SA')} ر.س</td>
                  <td className="p-4 text-muted-foreground text-sm">{ret.reason || '-'}</td>
                  <td className="p-4 text-muted-foreground text-sm">
                    {new Date(ret.created_at).toLocaleDateString('ar-SA')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <RotateCcw className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد مرتجعات مبيعات</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SalesReturnsTab;
