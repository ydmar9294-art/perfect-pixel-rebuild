import React, { useState } from 'react';
import { 
  FileText, 
  RotateCcw, 
  Wallet, 
  Users,
  LogOut,
  UserPlus
} from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import NewSaleTab from './NewSaleTab';
import SalesReturnTab from './SalesReturnTab';
import CollectionTab from './CollectionTab';
import CustomerDebtsTab from './CustomerDebtsTab';

type DistributorTabType = 'new-sale' | 'returns' | 'collections' | 'debts';

const DistributorDashboard: React.FC = () => {
  const { customers, logout, user } = useApp();
  const [activeTab, setActiveTab] = useState<DistributorTabType>('new-sale');
  const [loggingOut, setLoggingOut] = useState(false);

  const totalDebt = customers.reduce((sum, c) => sum + Number(c.balance), 0);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  const tabs: { id: DistributorTabType; label: string; icon: React.ReactNode; color: string; bgColor: string }[] = [
    { 
      id: 'new-sale', 
      label: 'فاتورة', 
      icon: <FileText className="w-5 h-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-600'
    },
    { 
      id: 'collections', 
      label: 'تحصيل', 
      icon: <Wallet className="w-5 h-5" />,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-600'
    },
    { 
      id: 'returns', 
      label: 'مرتجع', 
      icon: <RotateCcw className="w-5 h-5" />,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500'
    },
    { 
      id: 'debts', 
      label: 'الزبائن', 
      icon: <Users className="w-5 h-5" />,
      color: 'text-red-500',
      bgColor: 'bg-red-500'
    },
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
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Top Header */}
      <div className="bg-gray-50 pt-4 px-4">
        <div className="flex items-center justify-between mb-4">
          {/* Left: Logout */}
          <button 
            onClick={handleLogout}
            disabled={loggingOut}
            className="p-2.5 bg-white/80 backdrop-blur-sm rounded-full shadow-md text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all"
            title="تسجيل الخروج"
          >
            <LogOut className={`w-5 h-5 ${loggingOut ? 'animate-spin' : ''}`} />
          </button>
          
          {/* Center: Notification Center */}
          <NotificationCenter />
        </div>
      </div>

      {/* Tab Navigation - Pill Style */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-3xl p-2 shadow-sm flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl transition-all duration-300 ${
                activeTab === tab.id 
                  ? `${tab.bgColor} text-white shadow-lg` 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <div className={`${activeTab === tab.id ? 'scale-110' : ''} transition-transform duration-300`}>
                {tab.icon}
              </div>
              <span className="text-[11px] font-bold">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Customer Selection Card */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">اختيار الزبون</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md hover:bg-blue-700 transition-colors">
              <UserPlus className="w-5 h-5 text-white" />
            </button>
            <button className="flex-1 flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3.5">
              <span className="text-gray-400 font-medium">- ابحث عن زبون -</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 pb-32">
        <div className="bg-white rounded-3xl shadow-sm min-h-[50vh] overflow-hidden">
          {renderTabContent()}
        </div>
      </div>

      {/* Summary Card - Only for Debts Tab */}
      {activeTab === 'debts' && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-4 bg-gradient-to-t from-gray-50 via-gray-50 pt-8">
          <div className="bg-white rounded-2xl p-4 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">إجمالي الذمم الميدانية:</p>
            </div>
            <p className="text-2xl font-black text-emerald-600">
              {totalDebt.toLocaleString('ar-SA')} ل.س
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistributorDashboard;
