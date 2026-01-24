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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b p-4 md:p-6">
        <h1 className="text-2xl font-black text-foreground mb-6">لوحة المحاسب المالي</h1>
        
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="kpi-card">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">إجمالي المبيعات</span>
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <p className="text-2xl font-black text-success">
              {totalSales.toLocaleString('ar-SA')}
            </p>
            <p className="text-xs text-muted-foreground">ر.س</p>
          </div>
          
          <div className="kpi-card">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">إجمالي المشتريات</span>
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-black text-primary">
              {purchasesTotal.toLocaleString('ar-SA')}
            </p>
            <p className="text-xs text-muted-foreground">ر.س</p>
          </div>
          
          <div className="kpi-card">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">إجمالي التحصيلات</span>
              <Wallet className="w-5 h-5 text-success" />
            </div>
            <p className="text-2xl font-black text-success">
              {collectionsTotal.toLocaleString('ar-SA')}
            </p>
            <p className="text-xs text-muted-foreground">ر.س</p>
          </div>
          
          <div className="kpi-card">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">إجمالي الديون</span>
              <TrendingDown className="w-5 h-5 text-destructive" />
            </div>
            <p className="text-2xl font-black text-destructive">
              {totalDebt.toLocaleString('ar-SA')}
            </p>
            <p className="text-xs text-muted-foreground">ر.س</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-card border-b overflow-x-auto no-scrollbar">
        <div className="flex p-2 gap-1 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4 md:p-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AccountantDashboard;
