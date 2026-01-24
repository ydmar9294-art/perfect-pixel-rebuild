import React, { useState } from 'react';
import { 
  FileText, 
  RotateCcw, 
  Wallet, 
  Users,
  Plus,
  TrendingUp,
  LogOut
} from 'lucide-react';
import { useApp } from '@/store/AppContext';
import NewSaleTab from './NewSaleTab';
import SalesReturnTab from './SalesReturnTab';
import CollectionTab from './CollectionTab';
import CustomerDebtsTab from './CustomerDebtsTab';

type DistributorTabType = 'new-sale' | 'returns' | 'collections' | 'debts';

const DistributorDashboard: React.FC = () => {
  const { sales, customers, logout, user } = useApp();
  const [activeTab, setActiveTab] = useState<DistributorTabType>('new-sale');
  const [loggingOut, setLoggingOut] = useState(false);

  // Calculate KPIs
  const todaySales = sales.filter(s => {
    const today = new Date().toDateString();
    return new Date(s.timestamp).toDateString() === today && !s.isVoided;
  });

  const todayTotal = todaySales.reduce((sum, s) => sum + Number(s.grandTotal), 0);
  const totalDebt = customers.reduce((sum, c) => sum + Number(c.balance), 0);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  const tabs: { id: DistributorTabType; label: string; icon: React.ReactNode }[] = [
    { id: 'new-sale', label: 'فاتورة جديدة', icon: <Plus className="w-5 h-5" /> },
    { id: 'returns', label: 'المرتجعات', icon: <RotateCcw className="w-5 h-5" /> },
    { id: 'collections', label: 'التحصيلات', icon: <Wallet className="w-5 h-5" /> },
    { id: 'debts', label: 'الديون', icon: <Users className="w-5 h-5" /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'new-sale':
        return <NewSaleTab />;
      case 'returns':
        return <SalesReturnTab />;
      case 'collections':
        return <CollectionTab />;
      case 'debts':
        return <CustomerDebtsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      {/* Premium Header with Soft Gradients */}
      <div className="header-premium pt-6 pb-12 px-4">
        {/* Soft Decorative Orbs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/15 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-indigo-500/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4"></div>
        
        {/* Header Content */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* Premium Oval Icon */}
              <div className="icon-container icon-container-lg icon-container-primary animate-float">
                <FileText className="w-8 h-8 drop-shadow-md" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">لوحة الموزع</h1>
                {user && (
                  <p className="text-white/50 text-xs font-bold mt-0.5">{user.name}</p>
                )}
              </div>
            </div>
            
            {/* Soft Logout Button */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="btn-logout"
            >
              <LogOut className={`w-4 h-4 ${loggingOut ? 'animate-spin' : ''}`} />
              <span className="text-xs font-black">خروج</span>
            </button>
          </div>
          
          {/* Soft Glass KPI Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="kpi-dark">
              <div className="flex items-center gap-3 mb-3">
                <div className="icon-container icon-container-sm bg-primary/20 text-primary">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-xs text-white/60 font-bold">مبيعات اليوم</span>
              </div>
              <p className="text-2xl font-black text-white">
                {todayTotal.toLocaleString('ar-SA')}
              </p>
              <p className="text-xs text-white/40 mt-1.5 font-medium">
                {todaySales.length} فاتورة
              </p>
            </div>
            
            <div className="kpi-dark">
              <div className="flex items-center gap-3 mb-3">
                <div className="icon-container icon-container-sm bg-warning/20 text-warning">
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="text-xs text-white/60 font-bold">إجمالي الديون</span>
              </div>
              <p className="text-2xl font-black text-white">
                {totalDebt.toLocaleString('ar-SA')}
              </p>
              <p className="text-xs text-white/40 mt-1.5 font-medium">
                {customers.filter(c => Number(c.balance) > 0).length} عميل
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Soft Content Container */}
      <div className="p-4 -mt-6 relative z-20">
        <div className="content-container animate-in">
          {renderTabContent()}
        </div>
      </div>

      {/* Premium Soft Bottom Navigation */}
      <div className="nav-bottom">
        <div className="flex justify-around gap-2 max-w-lg mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-tab ${
                activeTab === tab.id 
                  ? 'nav-tab-active' 
                  : 'nav-tab-inactive'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DistributorDashboard;