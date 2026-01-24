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
  LogOut
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
  const { sales, customers, logout, user } = useApp();
  const [activeTab, setActiveTab] = useState<AccountantTabType>('sales');
  const [purchasesTotal, setPurchasesTotal] = useState(0);
  const [collectionsTotal, setCollectionsTotal] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);

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

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

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
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Premium Soft Header */}
      <div className="header-premium pt-6 pb-10 px-4 md:px-6 sticky top-0 z-40">
        {/* Soft Decorative Orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/15 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-success/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4"></div>
        
        <div className="relative z-10">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="icon-container icon-container-lg icon-container-primary animate-float">
                <BarChart3 className="w-8 h-8 drop-shadow-md" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-white">لوحة المحاسب المالي</h1>
                {user && (
                  <p className="text-white/50 text-xs font-bold mt-0.5">{user.name}</p>
                )}
              </div>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="btn-logout"
            >
              <LogOut className={`w-4 h-4 ${loggingOut ? 'animate-spin' : ''}`} />
              <span className="text-xs font-black hidden sm:inline">خروج</span>
            </button>
          </div>
          
          {/* Soft Glass KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="kpi-dark hover-lift">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/60 font-bold">إجمالي المبيعات</span>
                <div className="icon-container icon-container-sm bg-success/20 text-success">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl md:text-2xl font-black text-white">
                {totalSales.toLocaleString('ar-SA')}
              </p>
              <p className="text-[10px] text-white/40 mt-1 font-medium">ر.س</p>
            </div>
            
            <div className="kpi-dark hover-lift">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/60 font-bold">إجمالي المشتريات</span>
                <div className="icon-container icon-container-sm bg-primary/20 text-primary">
                  <ShoppingCart className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl md:text-2xl font-black text-white">
                {purchasesTotal.toLocaleString('ar-SA')}
              </p>
              <p className="text-[10px] text-white/40 mt-1 font-medium">ر.س</p>
            </div>
            
            <div className="kpi-dark hover-lift">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/60 font-bold">إجمالي التحصيلات</span>
                <div className="icon-container icon-container-sm bg-success/20 text-success">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl md:text-2xl font-black text-white">
                {collectionsTotal.toLocaleString('ar-SA')}
              </p>
              <p className="text-[10px] text-white/40 mt-1 font-medium">ر.س</p>
            </div>
            
            <div className="kpi-dark hover-lift">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/60 font-bold">إجمالي الديون</span>
                <div className="icon-container icon-container-sm bg-destructive/20 text-destructive">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl md:text-2xl font-black text-white">
                {totalDebt.toLocaleString('ar-SA')}
              </p>
              <p className="text-[10px] text-white/40 mt-1 font-medium">ر.س</p>
            </div>
          </div>
        </div>
      </div>

      {/* Soft Tab Navigation */}
      <div className="bg-card/95 backdrop-blur-md border-b border-border/30 overflow-x-auto no-scrollbar sticky top-[180px] md:top-[200px] z-30">
        <div className="flex p-2.5 gap-2 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-black text-sm transition-all duration-300 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-foreground text-background shadow-lg shadow-foreground/10 scale-[1.02]'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Soft Content Area */}
      <div className="p-4 md:p-6 pb-8">
        <div className="animate-in">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default AccountantDashboard;