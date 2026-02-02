import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  ShoppingCart, 
  RotateCcw, 
  Wallet, 
  Users,
  TrendingUp,
  TrendingDown,
  BarChart3,
  LogOut,
  MessageCircle
} from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { supabase } from '@/integrations/supabase/client';
import WelcomeSplash from '@/components/ui/WelcomeSplash';
import SalesInvoicesTab from './SalesInvoicesTab';
import PurchasesTab from './PurchasesTab';
import SalesReturnsTab from './SalesReturnsTab';
import PurchaseReturnsTab from './PurchaseReturnsTab';
import CollectionsTab from './CollectionsTab';
import DebtsTab from './DebtsTab';
import ReportsTab from './ReportsTab';

type AccountantTabType = 'sales' | 'purchases' | 'sales-returns' | 'purchase-returns' | 'collections' | 'debts' | 'reports';

const AccountantDashboard: React.FC = () => {
  const { sales, customers, logout } = useApp();
  const [activeTab, setActiveTab] = useState<AccountantTabType>('sales');
  const [purchasesTotal, setPurchasesTotal] = useState(0);
  const [collectionsTotal, setCollectionsTotal] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  // Calculate KPIs
  const totalSales = sales.filter(s => !s.isVoided).reduce((sum, s) => sum + Number(s.grandTotal), 0);
  const totalDebt = customers.reduce((sum, c) => sum + Number(c.balance), 0);

  useEffect(() => {
    const loadTotals = async () => {
      try {
        const { data: purchases } = await supabase
          .from('purchases')
          .select('total_price');
        if (purchases) {
          setPurchasesTotal(purchases.reduce((sum, p) => sum + Number(p.total_price), 0));
        }

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
    { id: 'sales-returns', label: 'مرتجع بيع', icon: <RotateCcw className="w-4 h-4" /> },
    { id: 'purchase-returns', label: 'مرتجع شراء', icon: <RotateCcw className="w-4 h-4" /> },
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
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden" dir="rtl">
      {/* Header - Compact for mobile */}
      <div className="flex-shrink-0 bg-gray-50 pt-3 px-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black text-gray-800">لوحة المحاسب</h1>
              <p className="text-[10px] text-gray-500">إدارة العمليات المالية</p>
            </div>
          </div>
          
          {/* Support & Logout Buttons */}
          <div className="flex items-center gap-2">
            <a
              href="https://wa.me/963947744162"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-green-500 rounded-full shadow-md text-white hover:bg-green-600 transition-all"
              title="فريق الدعم"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
            <button 
              onClick={handleLogout}
              disabled={loggingOut}
              className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all"
              title="تسجيل الخروج"
            >
              <LogOut className={`w-4 h-4 ${loggingOut ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        
        {/* KPI Cards - Compact 2x2 Grid */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="bg-white rounded-xl p-2 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-sm font-black text-emerald-600 truncate">
              {(totalSales / 1000).toFixed(0)}K
            </p>
            <p className="text-[9px] text-gray-400">المبيعات</p>
          </div>
          
          <div className="bg-white rounded-xl p-2 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <ShoppingCart className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-sm font-black text-blue-600 truncate">
              {(purchasesTotal / 1000).toFixed(0)}K
            </p>
            <p className="text-[9px] text-gray-400">المشتريات</p>
          </div>
          
          <div className="bg-white rounded-xl p-2 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <Wallet className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-sm font-black text-emerald-600 truncate">
              {(collectionsTotal / 1000).toFixed(0)}K
            </p>
            <p className="text-[9px] text-gray-400">التحصيلات</p>
          </div>
          
          <div className="bg-white rounded-xl p-2 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <TrendingDown className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-sm font-black text-red-600 truncate">
              {(totalDebt / 1000).toFixed(0)}K
            </p>
            <p className="text-[9px] text-gray-400">الديون</p>
          </div>
        </div>
      </div>

      {/* Welcome Splash */}
      <WelcomeSplash />

      {/* Tab Navigation - Horizontal scrollable pills */}
      <div className="flex-shrink-0 px-3 pb-2">
        <div className="bg-white rounded-2xl p-1.5 shadow-sm overflow-x-auto no-scrollbar">
          <div className="flex gap-1 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
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

      {/* Tab Content - Fills remaining space */}
      <div className="flex-1 px-3 pb-3 min-h-0">
        <div className="bg-white rounded-2xl shadow-sm h-full overflow-hidden">
          <div className="h-full overflow-y-auto p-3">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountantDashboard;