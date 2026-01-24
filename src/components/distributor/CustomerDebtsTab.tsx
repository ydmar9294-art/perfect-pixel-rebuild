import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Phone,
  TrendingDown,
  Calendar,
  FileText
} from 'lucide-react';
import { useApp } from '@/store/AppContext';

const CustomerDebtsTab: React.FC = () => {
  const { customers, sales } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'balance' | 'name'>('balance');

  // Filter and sort customers with debt
  const debtCustomers = customers
    .filter(c => Number(c.balance) > 0)
    .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'balance') {
        return Number(b.balance) - Number(a.balance);
      }
      return a.name.localeCompare(b.name, 'ar');
    });

  const totalDebt = debtCustomers.reduce((sum, c) => sum + Number(c.balance), 0);

  const customerSales = sales.filter(s => s.customer_id === selectedCustomerId && !s.isVoided);

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="card-elevated p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">إجمالي الديون المستحقة</span>
          <TrendingDown className="w-5 h-5 text-destructive" />
        </div>
        <p className="text-3xl font-black text-destructive">
          {totalDebt.toLocaleString('ar-SA')} ر.س
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {debtCustomers.length} عميل لديهم ديون
        </p>
      </div>

      {/* Search & Sort */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="بحث عن عميل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pr-10"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'balance' | 'name')}
          className="input-field w-auto px-4"
        >
          <option value="balance">الأعلى ديناً</option>
          <option value="name">الاسم</option>
        </select>
      </div>

      {/* Customer List */}
      {debtCustomers.length === 0 ? (
        <div className="card-elevated p-8 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">لا يوجد عملاء بديون مستحقة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {debtCustomers.map((customer) => (
            <div 
              key={customer.id}
              className="card-elevated p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedCustomerId(
                selectedCustomerId === customer.id ? null : customer.id
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                    <span className="text-lg font-black text-destructive">
                      {customer.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{customer.name}</p>
                    {customer.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {customer.phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-end">
                  <p className="text-xl font-black text-destructive">
                    {Number(customer.balance).toLocaleString('ar-SA')}
                  </p>
                  <p className="text-xs text-muted-foreground">ر.س</p>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedCustomerId === customer.id && customerSales.length > 0 && (
                <div className="mt-4 pt-4 border-t space-y-2">
                  <p className="text-sm font-bold text-muted-foreground mb-2">الفواتير المستحقة</p>
                  {customerSales
                    .filter(s => Number(s.remaining) > 0)
                    .slice(0, 5)
                    .map((sale) => (
                      <div 
                        key={sale.id}
                        className="flex items-center justify-between bg-muted rounded-xl p-3"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(sale.timestamp).toLocaleDateString('ar-SA')}
                            </p>
                          </div>
                        </div>
                        <div className="text-end">
                          <p className="font-bold text-warning">
                            {Number(sale.remaining).toLocaleString('ar-SA')} ر.س
                          </p>
                          <p className="text-xs text-muted-foreground">
                            من {Number(sale.grandTotal).toLocaleString('ar-SA')}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerDebtsTab;
