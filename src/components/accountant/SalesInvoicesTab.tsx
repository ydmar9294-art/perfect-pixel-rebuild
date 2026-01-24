import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Calendar,
  Eye,
  X,
  Check,
  Ban
} from 'lucide-react';
import { useApp } from '@/store/AppContext';

const SalesInvoicesTab: React.FC = () => {
  const { sales, customers } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'pending' | 'voided'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

  const filteredSales = sales.filter(s => {
    // Search filter
    if (searchTerm && !s.customerName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Status filter
    if (statusFilter === 'paid' && Number(s.remaining) > 0) return false;
    if (statusFilter === 'partial' && (Number(s.remaining) === 0 || Number(s.paidAmount) === 0)) return false;
    if (statusFilter === 'pending' && Number(s.paidAmount) > 0) return false;
    if (statusFilter === 'voided' && !s.isVoided) return false;
    if (statusFilter !== 'all' && statusFilter !== 'voided' && s.isVoided) return false;

    // Date filter
    if (dateFrom) {
      const saleDate = new Date(s.timestamp);
      const fromDate = new Date(dateFrom);
      if (saleDate < fromDate) return false;
    }
    if (dateTo) {
      const saleDate = new Date(s.timestamp);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59);
      if (saleDate > toDate) return false;
    }

    return true;
  }).sort((a, b) => b.timestamp - a.timestamp);

  const getStatusBadge = (sale: typeof sales[0]) => {
    if (sale.isVoided) {
      return <span className="badge badge-danger">ملغاة</span>;
    }
    if (Number(sale.remaining) === 0) {
      return <span className="badge badge-success">مدفوعة</span>;
    }
    if (Number(sale.paidAmount) > 0) {
      return <span className="badge badge-warning">جزئي</span>;
    }
    return <span className="badge badge-primary">آجل</span>;
  };

  const selectedSale = sales.find(s => s.id === selectedSaleId);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card-elevated p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="input-field"
          >
            <option value="all">جميع الحالات</option>
            <option value="paid">مدفوعة</option>
            <option value="partial">جزئي</option>
            <option value="pending">آجل</option>
            <option value="voided">ملغاة</option>
          </select>
          
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
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-success/10 rounded-2xl p-4 text-center">
          <p className="text-sm text-muted-foreground">الإجمالي</p>
          <p className="text-xl font-black text-success">
            {filteredSales.filter(s => !s.isVoided).reduce((sum, s) => sum + Number(s.grandTotal), 0).toLocaleString('ar-SA')}
          </p>
        </div>
        <div className="bg-primary/10 rounded-2xl p-4 text-center">
          <p className="text-sm text-muted-foreground">المحصّل</p>
          <p className="text-xl font-black text-primary">
            {filteredSales.filter(s => !s.isVoided).reduce((sum, s) => sum + Number(s.paidAmount), 0).toLocaleString('ar-SA')}
          </p>
        </div>
        <div className="bg-warning/10 rounded-2xl p-4 text-center">
          <p className="text-sm text-muted-foreground">المتبقي</p>
          <p className="text-xl font-black text-warning">
            {filteredSales.filter(s => !s.isVoided).reduce((sum, s) => sum + Number(s.remaining), 0).toLocaleString('ar-SA')}
          </p>
        </div>
      </div>

      {/* Sales Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-start p-4 font-bold text-sm">العميل</th>
                <th className="text-start p-4 font-bold text-sm">التاريخ</th>
                <th className="text-start p-4 font-bold text-sm">الإجمالي</th>
                <th className="text-start p-4 font-bold text-sm">المدفوع</th>
                <th className="text-start p-4 font-bold text-sm">المتبقي</th>
                <th className="text-start p-4 font-bold text-sm">الحالة</th>
                <th className="text-start p-4 font-bold text-sm">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className={`hover:bg-muted/50 ${sale.isVoided ? 'opacity-50' : ''}`}>
                  <td className="p-4 font-bold">{sale.customerName}</td>
                  <td className="p-4 text-muted-foreground text-sm">
                    {new Date(sale.timestamp).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="p-4 font-bold">{Number(sale.grandTotal).toLocaleString('ar-SA')}</td>
                  <td className="p-4 text-success font-bold">{Number(sale.paidAmount).toLocaleString('ar-SA')}</td>
                  <td className="p-4 text-warning font-bold">{Number(sale.remaining).toLocaleString('ar-SA')}</td>
                  <td className="p-4">{getStatusBadge(sale)}</td>
                  <td className="p-4">
                    <button 
                      onClick={() => setSelectedSaleId(sale.id)}
                      className="p-2 text-primary hover:bg-primary/10 rounded-lg"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredSales.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد فواتير</p>
          </div>
        )}
      </div>

      {/* Sale Details Modal */}
      {selectedSale && (
        <div className="modal-overlay" onClick={() => setSelectedSaleId(null)}>
          <div className="bg-card w-full max-w-lg mx-4 rounded-3xl p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black">تفاصيل الفاتورة</h3>
              <button onClick={() => setSelectedSaleId(null)} className="p-2 hover:bg-muted rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                <span className="text-muted-foreground">العميل</span>
                <span className="font-bold">{selectedSale.customerName}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                <span className="text-muted-foreground">التاريخ</span>
                <span className="font-bold">{new Date(selectedSale.timestamp).toLocaleString('ar-SA')}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                <span className="text-muted-foreground">الإجمالي</span>
                <span className="font-bold text-lg">{Number(selectedSale.grandTotal).toLocaleString('ar-SA')} ر.س</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-success/10 rounded-xl">
                <span className="text-muted-foreground">المدفوع</span>
                <span className="font-bold text-success text-lg">{Number(selectedSale.paidAmount).toLocaleString('ar-SA')} ر.س</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-warning/10 rounded-xl">
                <span className="text-muted-foreground">المتبقي</span>
                <span className="font-bold text-warning text-lg">{Number(selectedSale.remaining).toLocaleString('ar-SA')} ر.س</span>
              </div>

              {selectedSale.isVoided && (
                <div className="p-3 bg-destructive/10 rounded-xl">
                  <div className="flex items-center gap-2 text-destructive mb-1">
                    <Ban className="w-4 h-4" />
                    <span className="font-bold">فاتورة ملغاة</span>
                  </div>
                  {selectedSale.voidReason && (
                    <p className="text-sm text-muted-foreground">{selectedSale.voidReason}</p>
                  )}
                </div>
              )}

              {/* Items */}
              {selectedSale.items && selectedSale.items.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-bold mb-3">المنتجات</h4>
                  <div className="space-y-2">
                    {selectedSale.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm">
                        <span>{item.productName}</span>
                        <span className="text-muted-foreground">
                          {item.quantity} × {Number(item.unitPrice).toLocaleString('ar-SA')} = {Number(item.totalPrice).toLocaleString('ar-SA')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesInvoicesTab;
