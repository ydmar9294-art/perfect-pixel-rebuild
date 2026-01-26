import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  ShoppingCart, 
  RotateCcw, 
  Wallet, 
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Search,
  Download,
  BarChart3
} from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { supabase } from '@/integrations/supabase/client';
import SalesInvoicesTab from './SalesInvoicesTab';
import PurchasesTab from './PurchasesTab';
import SalesReturnsTab from './SalesReturnsTab';
import PurchaseReturnsTab from './PurchaseReturnsTab';
import CollectionsTab from './CollectionsTab';
import DebtsTab from './DebtsTab';
import ReportsTab from './ReportsTab';

type AccountantTabType = 'sales' | 'purchases' | 'sales-returns' | 'purchase-returns' | 'collections' | 'debts' | 'reports';

const AccountantDashboard: React.FC = () => {
  const { sales, customers } = useApp();
  const [activeTab, setActiveTab] = useState<AccountantTabType>('sales');
  const [purchasesTotal, setPurchasesTotal] = useState(0);
  const [collectionsTotal, setCollectionsTotal] = useState(0);

  // Calculate KPIs
  const totalSales = sales.filter(s => !s.isVoided).reduce((sum, s) => sum + Number(s.grandTotal), 0);
  const totalDebt = customers.reduce((sum, c) => sum + Number(c.balance), 0);
  const totalPaid = sales.filter(s => !s.isVoided).reduce((sum, s) => sum + Number(s.paidAmount), 0);

  useEffect(() => {
    const loadTotals = async () => {
      try {
        // Load purchases total
        const { data: purchases } = await supabase
          .from('purchases')
          .select('total_price');
        if (purchases) {
          setPurchasesTotal(purchases.reduce((sum, p) => sum + Number(p.total_price), 0));
        }

        // Load collections total
        const { data: collections } = await supabase
          .from('collections')
          .select('amount, is_reversed')
          .eq('is_reversed', false);
        if (collections) {
          setCollectionsTotal(collections.reduce((sum, c) => sum + Number(c.amount), 0));
        }
      } catch (error) {
        console.error('Error loading totals:', error);
      }
    };
    loadTotals();
  }, []);

  const tabs: { id: AccountantTabType; label: string; icon: React.ReactNode }[] = [
    { id: 'sales', label: 'المبيعات', icon: <FileText className="w-4 h-4" /> },
    { id: 'purchases', label: 'المشتريات', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'sales-returns', label: 'مرتجعات البيع', icon: <RotateCcw className="w-4 h-4" /> },
    { id: 'purchase-returns', label: 'مرتجعات الشراء', icon: <RotateCcw className="w-4 h-4" /> },
    { id: 'collections', label: 'التحصيلات', icon: <Wallet className="w-4 h-4" /> },
    { id: 'debts', label: 'الديون', icon: <Users className="w-4 h-4" /> },
    { id: 'reports', label: 'التقارير', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'sales':
        return <SalesInvoicesTab />;
      case 'purchases':
        return <PurchasesTab />;
      case 'sales-returns':
        return <SalesReturnsTab />;
      case 'purchase-returns':
        return <PurchaseReturnsTab />;
      case 'collections':
        return <CollectionsTab />;
      case 'debts':
        return <DebtsTab />;
      case 'reports':
        return <ReportsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header - Matching Distributor Style */}
      <div className="bg-gray-50 pt-4 px-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-800">لوحة المحاسب</h1>
              <p className="text-xs text-gray-500">إدارة العمليات المالية</p>
            </div>
          </div>
        </div>
        
        {/* KPI Cards - Modern Light Style */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-bold">إجمالي المبيعات</span>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-xl font-black text-emerald-600">
              {totalSales.toLocaleString('ar-SA')}
            </p>
            <p className="text-xs text-gray-400">ل.س</p>
          </div>
          
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-bold">إجمالي المشتريات</span>
              <ShoppingCart className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-xl font-black text-blue-600">
              {purchasesTotal.toLocaleString('ar-SA')}
            </p>
            <p className="text-xs text-gray-400">ل.س</p>
          </div>
          
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-bold">إجمالي التحصيلات</span>
              <Wallet className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-xl font-black text-emerald-600">
              {collectionsTotal.toLocaleString('ar-SA')}
            </p>
            <p className="text-xs text-gray-400">ل.س</p>
          </div>
          
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-bold">إجمالي الديون</span>
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-xl font-black text-red-600">
              {totalDebt.toLocaleString('ar-SA')}
            </p>
            <p className="text-xs text-gray-400">ل.س</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation - Pill Style matching Distributor */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-3xl p-2 shadow-sm overflow-x-auto no-scrollbar">
          <div className="flex gap-1 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 pb-8">
        <div className="bg-white rounded-3xl shadow-sm min-h-[50vh] overflow-hidden p-4">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default AccountantDashboard;
