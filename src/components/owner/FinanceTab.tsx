import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '@/store/AppContext';
import { CURRENCY } from '@/constants';
import { 
  TrendingUp, TrendingDown, DollarSign, CreditCard, AlertTriangle, 
  Package, ArrowUpRight, ArrowDownRight, BarChart3, PieChart 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell 
} from 'recharts';

export const FinanceTab: React.FC = () => {
  const { sales, payments, products, customers } = useApp();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const lastWeekEnd = new Date(weekStart);
    lastWeekEnd.setMilliseconds(-1);

    // مبيعات هذا الأسبوع
    const thisWeekSales = sales.filter(s => s.timestamp >= weekStart.getTime() && !s.isVoided);
    const thisWeekRevenue = thisWeekSales.reduce((sum, s) => sum + s.grandTotal, 0);
    
    // مبيعات الأسبوع السابق
    const lastWeekSales = sales.filter(s => s.timestamp >= lastWeekStart.getTime() && s.timestamp < weekStart.getTime() && !s.isVoided);
    const lastWeekRevenue = lastWeekSales.reduce((sum, s) => sum + s.grandTotal, 0);
    
    // نسبة التغيير
    const revenueChange = lastWeekRevenue > 0 ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : 0;

    // التحصيلات
    const thisWeekCollections = payments.filter(p => p.timestamp >= weekStart.getTime() && !p.isReversed);
    const totalCollections = thisWeekCollections.reduce((sum, p) => sum + p.amount, 0);
    
    const lastWeekCollections = payments.filter(p => p.timestamp >= lastWeekStart.getTime() && p.timestamp < weekStart.getTime() && !p.isReversed);
    const lastCollections = lastWeekCollections.reduce((sum, p) => sum + p.amount, 0);
    const collectionsChange = lastCollections > 0 ? ((totalCollections - lastCollections) / lastCollections) * 100 : 0;

    // إجمالي الذمم
    const totalDebts = customers.reduce((sum, c) => sum + c.balance, 0);

    // المرتجعات (المبيعات الملغاة)
    const thisWeekReturns = sales.filter(s => s.timestamp >= weekStart.getTime() && s.isVoided);
    const totalReturns = thisWeekReturns.reduce((sum, s) => sum + s.grandTotal, 0);

    // المنتجات الأكثر مبيعاً (من المبيعات)
    const productSalesMap: { [key: string]: number } = {};
    thisWeekSales.forEach(sale => {
      // نستخدم customerName كمؤشر مؤقت
      const productName = sale.customerName || 'منتج';
      productSalesMap[productName] = (productSalesMap[productName] || 0) + sale.grandTotal;
    });
    
    const topProducts = Object.entries(productSalesMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    // بيانات الرسم البياني للأسبوع
    const dailyData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const dayStart = new Date(d).setHours(0, 0, 0, 0);
      const dayEnd = new Date(d).setHours(23, 59, 59, 999);
      
      const daySales = sales.filter(s => s.timestamp >= dayStart && s.timestamp <= dayEnd && !s.isVoided);
      const dayCollections = payments.filter(p => p.timestamp >= dayStart && p.timestamp <= dayEnd && !p.isReversed);
      
      return {
        day: d.toLocaleDateString('ar-EG', { weekday: 'short' }),
        sales: daySales.reduce((s, v) => s + v.grandTotal, 0),
        collections: dayCollections.reduce((s, p) => s + p.amount, 0)
      };
    });

    return {
      thisWeekRevenue,
      lastWeekRevenue,
      revenueChange,
      totalCollections,
      collectionsChange,
      totalDebts,
      totalReturns,
      topProducts,
      dailyData,
      thisWeekSalesCount: thisWeekSales.length,
      lastWeekSalesCount: lastWeekSales.length
    };
  }, [sales, payments, customers, products]);

  const COLORS = ['hsl(221, 83%, 53%)', 'hsl(142, 76%, 36%)', 'hsl(48, 96%, 53%)', 'hsl(0, 84%, 60%)', 'hsl(262, 83%, 58%)'];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* KPIs الرئيسية */}
      <div className="grid grid-cols-2 gap-3">
        <FinanceKpiCard 
          label="مبيعات الأسبوع" 
          value={stats.thisWeekRevenue} 
          change={stats.revenueChange}
          icon={<DollarSign size={20} />}
          color="primary"
        />
        <FinanceKpiCard 
          label="التحصيلات" 
          value={stats.totalCollections} 
          change={stats.collectionsChange}
          icon={<CreditCard size={20} />}
          color="success"
        />
        <FinanceKpiCard 
          label="إجمالي الذمم" 
          value={stats.totalDebts} 
          icon={<AlertTriangle size={20} />}
          color="destructive"
          negative
        />
        <FinanceKpiCard 
          label="المرتجعات" 
          value={stats.totalReturns} 
          icon={<Package size={20} />}
          color="warning"
        />
      </div>

      {/* مقارنة أسبوعية */}
      <div className="bg-card p-5 rounded-[2.5rem] border shadow-sm">
        <h3 className="font-black text-foreground mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-primary" />
          مقارنة مع الأسبوع السابق
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <ComparisonCard 
            label="المبيعات"
            thisWeek={stats.thisWeekRevenue}
            lastWeek={stats.lastWeekRevenue}
          />
          <ComparisonCard 
            label="عدد الفواتير"
            thisWeek={stats.thisWeekSalesCount}
            lastWeek={stats.lastWeekSalesCount}
            isCurrency={false}
          />
        </div>
      </div>

      {/* الرسم البياني */}
      <div className="bg-card p-6 rounded-[2.5rem] border shadow-sm">
        <h3 className="font-black text-foreground mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-primary" />
          أداء الأسبوع اليومي
        </h3>
        <div className="h-64">
          {isMounted && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.dailyData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCollections" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                  formatter={(value: number, name: string) => [
                    `${value.toLocaleString()} ${CURRENCY}`,
                    name === 'sales' ? 'المبيعات' : 'التحصيلات'
                  ]}
                />
                <Area type="monotone" dataKey="sales" stroke="hsl(221, 83%, 53%)" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                <Area type="monotone" dataKey="collections" stroke="hsl(142, 76%, 36%)" fillOpacity={1} fill="url(#colorCollections)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-xs font-bold text-muted-foreground">المبيعات</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-xs font-bold text-muted-foreground">التحصيلات</span>
          </div>
        </div>
      </div>

      {/* المنتجات الأكثر مبيعاً */}
      {stats.topProducts.length > 0 && (
        <div className="bg-card p-5 rounded-[2.5rem] border shadow-sm">
          <h3 className="font-black text-foreground mb-4 flex items-center gap-2">
            <PieChart size={20} className="text-primary" />
            أعلى الزبائن حجماً
          </h3>
          <div className="space-y-2">
            {stats.topProducts.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between bg-muted p-3 rounded-xl">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="font-bold text-sm">{item.name}</span>
                </div>
                <span className="font-black text-primary">{item.value.toLocaleString()} {CURRENCY}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const FinanceKpiCard: React.FC<{
  label: string;
  value: number;
  change?: number;
  icon: React.ReactNode;
  color: 'primary' | 'success' | 'destructive' | 'warning';
  negative?: boolean;
}> = ({ label, value, change, icon, color, negative }) => {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    destructive: 'bg-destructive/10 text-destructive',
    warning: 'bg-warning/10 text-warning'
  };

  return (
    <div className="bg-card p-5 rounded-[2rem] border shadow-sm">
      <div className={`p-3 rounded-xl w-fit mb-3 ${colorClasses[color]}`}>
        {icon}
      </div>
      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">{label}</span>
      <p className={`text-xl font-black leading-none ${negative ? 'text-destructive' : 'text-foreground'}`}>
        {value.toLocaleString()} <span className="text-[10px] font-medium opacity-30">{CURRENCY}</span>
      </p>
      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${change >= 0 ? 'text-success' : 'text-destructive'}`}>
          {change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(change).toFixed(1)}%
        </div>
      )}
    </div>
  );
};

const ComparisonCard: React.FC<{
  label: string;
  thisWeek: number;
  lastWeek: number;
  isCurrency?: boolean;
}> = ({ label, thisWeek, lastWeek, isCurrency = true }) => {
  const change = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <div className="bg-muted p-4 rounded-2xl">
      <p className="text-[10px] font-black text-muted-foreground uppercase mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">هذا الأسبوع</span>
          <span className="font-black text-foreground">
            {thisWeek.toLocaleString()} {isCurrency && <span className="text-[10px] opacity-30">{CURRENCY}</span>}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">الأسبوع السابق</span>
          <span className="font-bold text-muted-foreground">
            {lastWeek.toLocaleString()} {isCurrency && <span className="text-[10px] opacity-30">{CURRENCY}</span>}
          </span>
        </div>
        <div className={`flex items-center justify-end gap-1 pt-1 text-xs font-black ${isPositive ? 'text-success' : 'text-destructive'}`}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {Math.abs(change).toFixed(1)}%
        </div>
      </div>
    </div>
  );
};
