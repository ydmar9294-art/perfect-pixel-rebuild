import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Search,
  User,
  Check,
  X as XIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Collection {
  id: string;
  sale_id: string;
  amount: number;
  notes: string | null;
  is_reversed: boolean;
  reverse_reason: string | null;
  created_at: string;
}

const CollectionsTab: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showReversed, setShowReversed] = useState(false);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCollections(data || []);
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCollections = collections.filter(c => {
    if (!showReversed && c.is_reversed) return false;

    if (dateFrom) {
      const collDate = new Date(c.created_at);
      const fromDate = new Date(dateFrom);
      if (collDate < fromDate) return false;
    }
    if (dateTo) {
      const collDate = new Date(c.created_at);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59);
      if (collDate > toDate) return false;
    }

    return true;
  });

  const totalAmount = filteredCollections
    .filter(c => !c.is_reversed)
    .reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card-elevated p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="input-field"
            placeholder="من تاريخ"
          />
          
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="input-field"
            placeholder="إلى تاريخ"
          />
          
          <label className="flex items-center gap-2 p-3 bg-muted rounded-2xl cursor-pointer">
            <input
              type="checkbox"
              checked={showReversed}
              onChange={(e) => setShowReversed(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-bold">إظهار الملغاة</span>
          </label>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-success/10 rounded-2xl p-4 text-center">
          <p className="text-sm text-muted-foreground">إجمالي التحصيلات</p>
          <p className="text-2xl font-black text-success">
            {totalAmount.toLocaleString('ar-SA')} ل.س
          </p>
        </div>
        <div className="bg-muted rounded-2xl p-4 text-center">
          <p className="text-sm text-muted-foreground">عدد العمليات</p>
          <p className="text-2xl font-black text-foreground">
            {filteredCollections.filter(c => !c.is_reversed).length}
          </p>
        </div>
      </div>

      {/* Collections Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-start p-4 font-bold text-sm">المبلغ</th>
                <th className="text-start p-4 font-bold text-sm">الملاحظات</th>
                <th className="text-start p-4 font-bold text-sm">الحالة</th>
                <th className="text-start p-4 font-bold text-sm">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredCollections.map((coll) => (
                <tr key={coll.id} className={`hover:bg-muted/50 ${coll.is_reversed ? 'opacity-50' : ''}`}>
                  <td className="p-4 font-bold text-success">
                    {Number(coll.amount).toLocaleString('ar-SA')} ل.س
                  </td>
                  <td className="p-4 text-muted-foreground text-sm">{coll.notes || '-'}</td>
                  <td className="p-4">
                    {coll.is_reversed ? (
                      <span className="badge badge-danger">ملغى</span>
                    ) : (
                      <span className="badge badge-success">تم</span>
                    )}
                  </td>
                  <td className="p-4 text-muted-foreground text-sm">
                    {new Date(coll.created_at).toLocaleDateString('ar-SA')}
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
        ) : filteredCollections.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد تحصيلات</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CollectionsTab;
