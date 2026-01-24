import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Package
} from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { supabase } from '@/integrations/supabase/client';

interface Purchase {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  supplier_name: string | null;
  notes: string | null;
  created_at: string;
}

const PurchasesTab: React.FC = () => {
  const { products } = useApp();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (error) {
      console.error('Error loading purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPurchases = purchases.filter(p => {
    if (searchTerm && !p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (!p.supplier_name || !p.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()))) {
      return false;
    }

    if (dateFrom) {
      const purchaseDate = new Date(p.created_at);
      const fromDate = new Date(dateFrom);
      if (purchaseDate < fromDate) return false;
    }
    if (dateTo) {
      const purchaseDate = new Date(p.created_at);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59);
      if (purchaseDate > toDate) return false;
    }

    return true;
  });

  const totalAmount = filteredPurchases.reduce((sum, p) => sum + Number(p.total_price), 0);
  const totalQuantity = filteredPurchases.reduce((sum, p) => sum + p.quantity, 0);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card-elevated p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="بحث بالمنتج أو المورد..."
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
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-primary/10 rounded-2xl p-4 text-center">
          <p className="text-sm text-muted-foreground">إجمالي المشتريات</p>
          <p className="text-xl font-black text-primary">
            {totalAmount.toLocaleString('ar-SA')} ر.س
          </p>
        </div>
        <div className="bg-muted rounded-2xl p-4 text-center">
          <p className="text-sm text-muted-foreground">إجمالي الكمية</p>
          <p className="text-xl font-black text-foreground">
            {totalQuantity.toLocaleString('ar-SA')} وحدة
          </p>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-start p-4 font-bold text-sm">المنتج</th>
                <th className="text-start p-4 font-bold text-sm">المورد</th>
                <th className="text-start p-4 font-bold text-sm">الكمية</th>
                <th className="text-start p-4 font-bold text-sm">سعر الوحدة</th>
                <th className="text-start p-4 font-bold text-sm">الإجمالي</th>
                <th className="text-start p-4 font-bold text-sm">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPurchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-muted/50">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span className="font-bold">{purchase.product_name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {purchase.supplier_name || '-'}
                  </td>
                  <td className="p-4 font-bold">{purchase.quantity}</td>
                  <td className="p-4">{Number(purchase.unit_price).toLocaleString('ar-SA')}</td>
                  <td className="p-4 font-bold text-primary">{Number(purchase.total_price).toLocaleString('ar-SA')}</td>
                  <td className="p-4 text-muted-foreground text-sm">
                    {new Date(purchase.created_at).toLocaleDateString('ar-SA')}
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
        ) : filteredPurchases.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد مشتريات</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default PurchasesTab;
