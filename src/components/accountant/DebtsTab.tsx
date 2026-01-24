import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Phone,
  TrendingDown,
  Building2
} from 'lucide-react';
import { useApp } from '@/store/AppContext';

const DebtsTab: React.FC = () => {
  const { customers } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
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

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-destructive/10 rounded-2xl p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <TrendingDown className="w-6 h-6 text-destructive" />
          <span className="text-muted-foreground">إجمالي ديون العملاء</span>
        </div>
        <p className="text-4xl font-black text-destructive">
          {totalDebt.toLocaleString('ar-SA')} ر.س
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          {debtCustomers.length} عميل لديهم ديون مستحقة
        </p>
      </div>

      {/* Filters */}
      <div className="card-elevated p-4">
        <div className="flex gap-3">
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
      </div>

      {/* Debts Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-start p-4 font-bold text-sm">العميل</th>
                <th className="text-start p-4 font-bold text-sm">الهاتف</th>
                <th className="text-start p-4 font-bold text-sm">تاريخ الإنشاء</th>
                <th className="text-start p-4 font-bold text-sm">الرصيد المستحق</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {debtCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-muted/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                        <span className="font-black text-destructive">
                          {customer.name.charAt(0)}
                        </span>
                      </div>
                      <span className="font-bold">{customer.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {customer.phone || '-'}
                  </td>
                  <td className="p-4 text-muted-foreground text-sm">
                    {customer.created_at ? new Date(customer.created_at).toLocaleDateString('ar-SA') : '-'}
                  </td>
                  <td className="p-4">
                    <span className="text-xl font-black text-destructive">
                      {Number(customer.balance).toLocaleString('ar-SA')} ر.س
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {debtCustomers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>لا يوجد عملاء بديون مستحقة</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebtsTab;
