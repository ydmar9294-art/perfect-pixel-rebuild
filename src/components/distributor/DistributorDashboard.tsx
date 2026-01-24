import React, { useState } from 'react';
import { 
  FileText, 
  RotateCcw, 
  Wallet, 
  Users,
  Plus,
  TrendingUp
} from 'lucide-react';
import { useApp } from '@/store/AppContext';
import NewSaleTab from './NewSaleTab';
import SalesReturnTab from './SalesReturnTab';
import CollectionTab from './CollectionTab';
import CustomerDebtsTab from './CustomerDebtsTab';

type DistributorTabType = 'new-sale' | 'returns' | 'collections' | 'debts';

const DistributorDashboard: React.FC = () => {
  const { sales, customers } = useApp();
  const [activeTab, setActiveTab] = useState<DistributorTabType>('new-sale');

  // Calculate KPIs
  const todaySales = sales.filter(s => {
    const today = new Date().toDateString();
    return new Date(s.timestamp).toDateString() === today && !s.isVoided;
  });

  const todayTotal = todaySales.reduce((sum, s) => sum + Number(s.grandTotal), 0);
  const totalDebt = customers.reduce((sum, c) => sum + Number(c.balance), 0);

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
      {/* Header */}
      <div className="bg-card border-b p-4 sticky top-0 z-40">
        <h1 className="text-xl font-black text-foreground mb-4 flex items-center gap-2">
          <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          لوحة الموزع
        </h1>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/10">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground font-bold">مبيعات اليوم</span>
            </div>
            <p className="text-2xl font-black text-primary">
              {todayTotal.toLocaleString('ar-SA')}
            </p>
            <p className="text-xs text-muted-foreground">
              {todaySales.length} فاتورة
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-warning/10 to-warning/5 rounded-2xl p-4 border border-warning/10">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-warning" />
              <span className="text-xs text-muted-foreground font-bold">إجمالي الديون</span>
            </div>
            <p className="text-2xl font-black text-warning">
              {totalDebt.toLocaleString('ar-SA')}
            </p>
            <p className="text-xs text-muted-foreground">
              {customers.filter(c => Number(c.balance) > 0).length} عميل
            </p>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {renderTabContent()}
      </div>

      {/* Bottom Navigation - Improved */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t shadow-lg p-2 z-50">
        <div className="flex justify-around gap-1 max-w-lg mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-2xl text-[10px] font-black transition-all duration-200 ${
                activeTab === tab.id 
                  ? 'bg-foreground text-background shadow-xl scale-105' 
                  : 'text-muted-foreground hover:bg-muted'
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
