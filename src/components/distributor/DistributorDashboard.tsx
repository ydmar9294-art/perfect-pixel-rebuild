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
      {/* Professional Header with Dark Gradient */}
      <div className="bg-slate-900 pt-6 pb-10 px-4 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        {/* Header Content */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 animate-float">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">لوحة الموزع</h1>
                {user && (
                  <p className="text-white/50 text-xs font-medium">{user.name}</p>
                )}
              </div>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-xl transition-all duration-200 border border-white/10"
            >
              <LogOut className={`w-4 h-4 ${loggingOut ? 'animate-spin' : ''}`} />
              <span className="text-xs font-bold">خروج</span>
            </button>
          </div>
          
          {/* Quick Stats - Premium Style */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-primary/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs text-white/60 font-bold">مبيعات اليوم</span>
              </div>
              <p className="text-2xl font-black text-white">
                {todayTotal.toLocaleString('ar-SA')}
              </p>
              <p className="text-xs text-white/40 mt-1">
                {todaySales.length} فاتورة
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-warning/20 rounded-xl flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-warning" />
                </div>
                <span className="text-xs text-white/60 font-bold">إجمالي الديون</span>
              </div>
              <p className="text-2xl font-black text-white">
                {totalDebt.toLocaleString('ar-SA')}
              </p>
              <p className="text-xs text-white/40 mt-1">
                {customers.filter(c => Number(c.balance) > 0).length} عميل
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content with smooth top margin */}
      <div className="p-4 -mt-4 relative z-20">
        <div className="bg-card rounded-t-3xl shadow-lg border -mx-4 px-4 pt-6 min-h-[60vh]">
          {renderTabContent()}
        </div>
      </div>

      {/* Bottom Navigation - Premium Style */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-white/10 p-2 z-50">
        <div className="flex justify-around gap-1 max-w-lg mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-2xl text-[10px] font-black transition-all duration-200 ${
                activeTab === tab.id 
                  ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105' 
                  : 'text-white/50 hover:text-white/80 hover:bg-white/10'
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
