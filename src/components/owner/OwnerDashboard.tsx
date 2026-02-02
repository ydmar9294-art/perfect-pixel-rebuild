import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Package, 
  Users,
  TrendingUp,
  LogOut,
  LayoutDashboard,
  DollarSign,
  Receipt,
  Wallet,
  UserPlus,
  X,
  Copy,
  CheckCircle2,
  Clock,
  ShieldCheck,
  MessageCircle,
  Sparkles
} from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { CURRENCY } from '@/constants';
import { UserRole, EmployeeType } from '@/types';
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { InventoryTab } from './InventoryTab';
import { FinanceTab } from './FinanceTab';
import { EmployeeKPIs } from './EmployeeKPIs';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import AIAssistant from '@/components/ai/AIAssistant';

type OwnerTabType = 'daily' | 'inventory' | 'team' | 'customers' | 'finance';

const OwnerDashboard: React.FC = () => {
  const { 
    user, 
    sales = [], 
    payments = [], 
    customers = [], 
    users = [], 
    logout, 
    addDistributor, 
    pendingEmployees = [] 
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<OwnerTabType>('daily');
  const [loggingOut, setLoggingOut] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [newEmployeeCode, setNewEmployeeCode] = useState<string | null>(null);
  const [newEmployeeData, setNewEmployeeData] = useState<any | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [copiedPayment, setCopiedPayment] = useState(false);

  const SHAMCASH_ADDRESS = 'efd5411a5f29e0cdb279363de2dd62b3';

  const handleCopyPayment = () => {
    navigator.clipboard.writeText(SHAMCASH_ADDRESS);
    setCopiedPayment(true);
    setTimeout(() => setCopiedPayment(false), 2000);
  };

  React.useEffect(() => { setIsMounted(true); }, []);

  const stats = useMemo(() => {
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const todaySales = sales.filter(s => s.timestamp >= todayStart);
    const todayRevenue = todaySales.reduce((s, i) => s + i.grandTotal, 0);
    const totalCollections = payments.filter(c => c.timestamp >= todayStart).reduce((s, i) => s + i.amount, 0);

    const chartData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const sOfDay = new Date(d).setHours(0, 0, 0, 0);
      const eOfDay = new Date(d).setHours(23, 59, 59, 999);
      const daySales = sales.filter(s => s.timestamp >= sOfDay && s.timestamp <= eOfDay);
      return { 
        day: d.toLocaleDateString('ar-EG', { weekday: 'short' }), 
        revenue: daySales.reduce((s, v) => s + v.grandTotal, 0) 
      };
    });

    return { todayRevenue, totalCollections, chartData };
  }, [sales, payments]);

  const teamMembers = users.filter(u => u.role === UserRole.EMPLOYEE);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const result = await addDistributor(
      fd.get('name') as string, 
      fd.get('phone') as string, 
      UserRole.EMPLOYEE, 
      fd.get('type') as EmployeeType
    );
    
    if (result.code) {
      setNewEmployeeCode(result.code);
      setNewEmployeeData(result.employee);
    }
  };

  const closeEmployeeModal = () => {
    setShowAddUserModal(false);
    setNewEmployeeCode(null);
    setNewEmployeeData(null);
  };

  const tabs: { id: OwnerTabType; label: string; icon: React.ReactNode; color: string; bgColor: string }[] = [
    { 
      id: 'daily', 
      label: 'الرئيسية', 
      icon: <LayoutDashboard className="w-5 h-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-600'
    },
    { 
      id: 'inventory', 
      label: 'المخزون', 
      icon: <Package className="w-5 h-5" />,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-600'
    },
    { 
      id: 'team', 
      label: 'الفريق', 
      icon: <Users className="w-5 h-5" />,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500'
    },
    { 
      id: 'customers', 
      label: 'الزبائن', 
      icon: <span className="text-sm font-bold">ل.س</span>,
      color: 'text-red-500',
      bgColor: 'bg-red-500'
    },
    { 
      id: 'finance', 
      label: 'المالية', 
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-600'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-lg mx-auto">
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
            
            {/* Center: User Info */}
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div className="text-end">
                <p className="font-bold text-gray-800 text-sm">{user?.name || 'المالك'}</p>
                <p className="text-[10px] text-gray-400">لوحة الإدارة</p>
              </div>
            </div>

            {/* Right: AI Assistant, Support & Notification */}
            <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-2 py-1.5 rounded-2xl shadow-md mt-1">
              <AIAssistant />
              <div className="w-px h-6 bg-gray-200" />
              <a
                href="https://wa.me/963947744162"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gradient-to-br from-green-400 to-green-600 rounded-xl text-white hover:shadow-lg transition-all active:scale-95"
                title="فريق الدعم"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <div className="w-px h-6 bg-gray-200" />
              <NotificationCenter />
            </div>
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
                <span className="text-[10px] font-bold">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-4 pb-8">
        {/* Daily Tab */}
        {activeTab === 'daily' && (
          <div className="space-y-4 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-5 rounded-3xl shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <Receipt className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">مبيعات اليوم</p>
                <p className="text-2xl font-black text-gray-800">{stats.todayRevenue.toLocaleString()}</p>
                <p className="text-xs text-gray-400">{CURRENCY}</p>
              </div>
              
              <div className="bg-white p-5 rounded-3xl shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">التحصيلات</p>
                <p className="text-2xl font-black text-gray-800">{stats.totalCollections.toLocaleString()}</p>
                <p className="text-xs text-gray-400">{CURRENCY}</p>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white p-6 rounded-3xl shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">أداء الأسبوع</h3>
              <div className="h-48">
                {isMounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.chartData}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                      <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            
            {/* Employee KPIs */}
            <EmployeeKPIs />
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="bg-white rounded-3xl shadow-sm p-4">
            <InventoryTab />
          </div>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <div className="space-y-4 animate-fade-in">
            <button 
              onClick={() => setShowAddUserModal(true)} 
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
            >
              <UserPlus className="w-5 h-5" /> إضافة موظف
            </button>
            
            {/* Pending Employees */}
            {pendingEmployees.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 px-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  أكواد تفعيل معلقة
                </h3>
                {pendingEmployees.map(pe => (
                  <div key={pe.id} className="bg-orange-50 p-4 rounded-2xl border border-orange-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-gray-800">{pe.name}</p>
                        <p className="text-xs text-gray-500">{pe.phone}</p>
                      </div>
                      <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-lg text-xs font-bold">
                        {pe.employee_type === EmployeeType.FIELD_AGENT ? 'موزع' : 'محاسب'}
                      </span>
                    </div>
                    <div 
                      onClick={() => { navigator.clipboard.writeText(pe.activation_code); setCopiedId(pe.id); setTimeout(() => setCopiedId(null), 2000); }}
                      className="bg-white p-3 rounded-xl flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-mono font-bold text-blue-600 tracking-wider">{pe.activation_code}</span>
                      {copiedId === pe.id ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 text-gray-400" />}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Active Team Members */}
            <div className="space-y-3">
              {teamMembers.length === 0 && pendingEmployees.length === 0 ? (
                <div className="bg-white p-8 rounded-3xl text-center">
                  <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-400 font-medium">لا يوجد موظفين</p>
                </div>
              ) : (
                teamMembers.map(u => (
                  <div key={u.id} className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{u.name}</p>
                        <p className="text-xs text-gray-400">
                          {u.employeeType === EmployeeType.FIELD_AGENT ? 'موزع ميداني' : 'محاسب مالي'}
                        </p>
                      </div>
                    </div>
                    <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-lg text-xs font-bold">نشط</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div className="space-y-3 animate-fade-in">
            <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-3xl text-white shadow-lg">
              <p className="text-xs opacity-80 mb-1">إجمالي ذمم السوق</p>
              <p className="text-3xl font-black">{customers.reduce((s, c) => s + c.balance, 0).toLocaleString()} {CURRENCY}</p>
            </div>
            {customers.map(c => (
              <div key={c.id} className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center">
                <p className="font-bold text-gray-800">{c.name}</p>
                <p className={`font-bold ${c.balance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                  {c.balance.toLocaleString()} {CURRENCY}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Finance Tab */}
        {activeTab === 'finance' && (
          <div className="space-y-4 animate-fade-in">
            {/* ShamCash Payment Button */}
            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              <Wallet className="w-5 h-5" />
              الدفع عبر شام كاش
            </button>
            
            <div className="bg-white rounded-3xl shadow-sm p-4">
              <FinanceTab />
            </div>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 animate-zoom-in">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {newEmployeeCode ? 'تم إنشاء كود التفعيل' : 'إضافة موظف جديد'}
              </h2>
              <button onClick={closeEmployeeModal} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {newEmployeeCode ? (
              <div className="space-y-4">
                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200 text-center">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
                  <p className="text-sm text-gray-500 mb-2">كود تفعيل الموظف:</p>
                  <p className="text-2xl font-mono font-bold text-blue-600 tracking-widest">{newEmployeeCode}</p>
                </div>
                
                {newEmployeeData && (
                  <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm">
                    <p><span className="text-gray-500">الاسم:</span> <span className="font-bold">{newEmployeeData.name}</span></p>
                    <p><span className="text-gray-500">الهاتف:</span> <span className="font-bold">{newEmployeeData.phone}</span></p>
                    <p><span className="text-gray-500">النوع:</span> <span className="font-bold">{newEmployeeData.employee_type === EmployeeType.FIELD_AGENT ? 'موزع ميداني' : 'محاسب'}</span></p>
                  </div>
                )}
                
                <button 
                  onClick={() => { navigator.clipboard.writeText(newEmployeeCode); }}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <Copy className="w-5 h-5" /> نسخ الكود
                </button>
                <button onClick={closeEmployeeModal} className="w-full py-3 bg-gray-100 text-gray-500 rounded-xl font-bold">
                  إغلاق
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddEmployee} className="space-y-4">
                <input 
                  name="name" 
                  required 
                  placeholder="اسم الموظف" 
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input 
                  name="phone" 
                  required 
                  placeholder="رقم الهاتف" 
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select 
                  name="type" 
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={EmployeeType.FIELD_AGENT}>موزع ميداني</option>
                  <option value={EmployeeType.ACCOUNTANT}>محاسب مالي</option>
                </select>
                <button 
                  type="submit" 
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold"
                >
                  توليد كود التفعيل
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ShamCash Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPaymentModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 animate-zoom-in" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Wallet className="w-6 h-6 text-green-500" />
                الدفع عبر شام كاش
              </h2>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="flex items-center justify-center py-4">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/ShamCash_logo.svg/1200px-ShamCash_logo.svg.png" 
                alt="ShamCash" 
                className="h-16 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            
            <p className="text-center text-sm text-gray-600 font-medium">عنوان الدفع:</p>
            <div 
              onClick={handleCopyPayment}
              className="bg-gray-50 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors border-2 border-green-200"
            >
              <span className="font-mono text-base text-gray-800 tracking-wide" dir="ltr">{SHAMCASH_ADDRESS}</span>
              {copiedPayment ? (
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
              ) : (
                <Copy className="w-6 h-6 text-gray-400 flex-shrink-0" />
              )}
            </div>
            <p className="text-center text-xs text-gray-500">اضغط لنسخ العنوان</p>
            
            <button 
              onClick={() => setShowPaymentModal(false)}
              className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default OwnerDashboard;
