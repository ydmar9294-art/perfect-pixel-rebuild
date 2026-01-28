import React, { useState } from 'react';
import { 
  FileText, 
  RotateCcw, 
  Wallet, 
  Users,
  LogOut,
  UserPlus,
  X,
  User,
  Phone,
  MapPin,
  Check,
  Loader2
} from 'lucide-react';
import { useApp } from '@/store/AppContext';
import AIAssistant from '@/components/ai/AIAssistant';
import NewSaleTab from './NewSaleTab';
import SalesReturnTab from './SalesReturnTab';
import CollectionTab from './CollectionTab';
import CustomerDebtsTab from './CustomerDebtsTab';

type DistributorTabType = 'new-sale' | 'returns' | 'collections' | 'debts';

const DistributorDashboard: React.FC = () => {
  const { customers, logout, addCustomer, addNotification } = useApp();
  const [activeTab, setActiveTab] = useState<DistributorTabType>('new-sale');
  const [loggingOut, setLoggingOut] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerLocation, setNewCustomerLocation] = useState('');
  const [addingCustomer, setAddingCustomer] = useState(false);

  const totalDebt = customers.reduce((sum, c) => sum + Number(c.balance), 0);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustomerName.trim()) {
      addNotification('يرجى إدخال اسم الزبون', 'warning');
      return;
    }

    if (newCustomerPhone.trim() && !/^[0-9+\-\s]+$/.test(newCustomerPhone.trim())) {
      addNotification('رقم الهاتف غير صالح', 'warning');
      return;
    }

    setAddingCustomer(true);
    try {
      await addCustomer(newCustomerName.trim(), newCustomerPhone.trim(), newCustomerLocation.trim());
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerLocation('');
      setShowAddCustomerModal(false);
      addNotification('تم إضافة الزبون بنجاح', 'success');
    } catch (error) {
      console.error('Error adding customer:', error);
      addNotification('حدث خطأ أثناء إضافة الزبون', 'error');
    } finally {
      setAddingCustomer(false);
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
          
          {/* Center: AI Assistant */}
          <AIAssistant />

          {/* Right: Add Customer */}
          <button 
            onClick={() => setShowAddCustomerModal(true)}
            className="p-2.5 bg-blue-600 rounded-full shadow-md text-white hover:bg-blue-700 transition-all"
            title="إضافة زبون جديد"
          >
            <UserPlus className="w-5 h-5" />
          </button>
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

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
          onClick={() => setShowAddCustomerModal(false)}
        >
          <div 
            className="bg-white w-full max-w-md rounded-3xl p-6 space-y-5" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                إضافة زبون جديد
              </h3>
              <button 
                onClick={() => setShowAddCustomerModal(false)} 
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-600 mb-2 block">
                  اسم الزبون <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="أدخل اسم الزبون"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="w-full bg-gray-50 border-none rounded-xl px-12 py-4 font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    disabled={addingCustomer}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-bold text-gray-600 mb-2 block">
                  رقم الهاتف
                </label>
                <div className="relative">
                  <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="09xxxxxxxx"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value.replace(/[^0-9+\-\s]/g, ''))}
                    className="w-full bg-gray-50 border-none rounded-xl px-12 py-4 font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    disabled={addingCustomer}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-600 mb-2 block">
                  موقع الزبون
                </label>
                <div className="relative">
                  <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="أدخل موقع أو عنوان الزبون"
                    value={newCustomerLocation}
                    onChange={(e) => setNewCustomerLocation(e.target.value)}
                    className="w-full bg-gray-50 border-none rounded-xl px-12 py-4 font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    disabled={addingCustomer}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAddCustomer}
                disabled={addingCustomer || !newCustomerName.trim()}
                className="flex-1 bg-emerald-500 text-white py-4 rounded-xl flex items-center justify-center gap-2 font-bold disabled:opacity-50 hover:bg-emerald-600"
              >
                {addingCustomer ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جارٍ الحفظ...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    حفظ
                  </>
                )}
              </button>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                disabled={addingCustomer}
                className="px-6 py-4 bg-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-200 disabled:opacity-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistributorDashboard;
