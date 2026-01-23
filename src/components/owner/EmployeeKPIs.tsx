import React, { useMemo } from 'react';
import { useApp } from '@/store/AppContext';
import { CURRENCY } from '@/constants';
import { Trophy, Star, TrendingUp, Users, DollarSign, Target, Award, Medal } from 'lucide-react';
import { EmployeeType } from '@/types';

interface EmployeePerformance {
  id: string;
  name: string;
  type: EmployeeType;
  totalSales: number;
  totalCollections: number;
  salesCount: number;
  collectionsCount: number;
  score: number;
}

export const EmployeeKPIs: React.FC = () => {
  const { users, sales, payments } = useApp();

  const performance = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    
    // الموظفين فقط
    const employees = users.filter(u => u.employeeType);

    const performanceData: EmployeePerformance[] = employees.map(emp => {
      // مبيعات هذا الشهر للموظف
      const empSales = sales.filter(s => 
        s.timestamp >= monthStart && 
        !s.isVoided
      );
      
      // تحصيلات هذا الشهر
      const empCollections = payments.filter(p => 
        p.timestamp >= monthStart && 
        !p.isReversed
      );

      // نوزع المبيعات بالتساوي مؤقتاً (يمكن تحسينه لاحقاً بإضافة created_by للمبيعات)
      const salesPerEmployee = empSales.length > 0 ? empSales.length / Math.max(employees.length, 1) : 0;
      const revenuePerEmployee = empSales.reduce((s, v) => s + v.grandTotal, 0) / Math.max(employees.length, 1);
      const collectionsPerEmployee = empCollections.reduce((s, p) => s + p.amount, 0) / Math.max(employees.length, 1);

      // حساب النقاط
      const score = Math.round(
        (revenuePerEmployee * 0.4) + 
        (collectionsPerEmployee * 0.4) + 
        (salesPerEmployee * 100 * 0.2)
      );

      return {
        id: emp.id,
        name: emp.name,
        type: emp.employeeType as EmployeeType,
        totalSales: revenuePerEmployee,
        totalCollections: collectionsPerEmployee,
        salesCount: Math.round(salesPerEmployee),
        collectionsCount: Math.round(empCollections.length / Math.max(employees.length, 1)),
        score
      };
    });

    // ترتيب حسب النقاط
    return performanceData.sort((a, b) => b.score - a.score);
  }, [users, sales, payments]);

  const topPerformer = performance[0];

  if (performance.length === 0) {
    return (
      <div className="bg-card p-6 rounded-[2.5rem] border shadow-sm text-center">
        <Users size={48} className="mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground font-bold">لا يوجد موظفين لعرض أدائهم</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* أفضل موظف */}
      {topPerformer && (
        <div className="bg-gradient-to-br from-primary to-primary/80 p-6 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-4 left-4 opacity-20">
            <Trophy size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <Trophy size={28} className="text-yellow-300" />
              </div>
              <div>
                <p className="text-white/70 text-xs font-bold">موظف الشهر المتميز</p>
                <h3 className="text-2xl font-black">{topPerformer.name}</h3>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 p-3 rounded-xl text-center">
                <p className="text-white/60 text-[9px] font-bold">المبيعات</p>
                <p className="font-black">{topPerformer.totalSales.toLocaleString()}</p>
              </div>
              <div className="bg-white/10 p-3 rounded-xl text-center">
                <p className="text-white/60 text-[9px] font-bold">التحصيلات</p>
                <p className="font-black">{topPerformer.totalCollections.toLocaleString()}</p>
              </div>
              <div className="bg-white/10 p-3 rounded-xl text-center">
                <p className="text-white/60 text-[9px] font-bold">النقاط</p>
                <p className="font-black">{topPerformer.score.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* قائمة الموظفين */}
      <div className="bg-card p-5 rounded-[2.5rem] border shadow-sm">
        <h3 className="font-black text-foreground mb-4 flex items-center gap-2">
          <Target size={20} className="text-primary" />
          ترتيب الموظفين
        </h3>
        <div className="space-y-3">
          {performance.map((emp, index) => (
            <EmployeeCard key={emp.id} employee={emp} rank={index + 1} />
          ))}
        </div>
      </div>

      {/* نصائح تحفيزية */}
      <div className="bg-muted p-5 rounded-[2rem] border">
        <h4 className="font-black text-foreground mb-3 flex items-center gap-2">
          <Star size={18} className="text-warning" />
          معايير التقييم
        </h4>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <DollarSign size={14} className="text-success" />
            <span className="text-muted-foreground">المبيعات (40%)</span>
          </div>
          <div className="flex items-center gap-2">
            <Target size={14} className="text-primary" />
            <span className="text-muted-foreground">التحصيلات (40%)</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-warning" />
            <span className="text-muted-foreground">عدد الفواتير (20%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmployeeCard: React.FC<{ employee: EmployeePerformance; rank: number }> = ({ employee, rank }) => {
  const getRankIcon = () => {
    if (rank === 1) return <Trophy size={20} className="text-yellow-500" />;
    if (rank === 2) return <Medal size={20} className="text-slate-400" />;
    if (rank === 3) return <Award size={20} className="text-amber-600" />;
    return <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-black">{rank}</span>;
  };

  const typeLabel = employee.type === EmployeeType.FIELD_AGENT ? 'موزع ميداني' : 'محاسب';

  return (
    <div className={`p-4 rounded-2xl border ${rank <= 3 ? 'bg-primary/5 border-primary/20' : 'bg-muted border-transparent'}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center">
          {getRankIcon()}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-black text-foreground">{employee.name}</h4>
              <p className="text-[10px] text-muted-foreground font-bold">{typeLabel}</p>
            </div>
            <div className="text-end">
              <p className="text-lg font-black text-primary">{employee.score.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">نقطة</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="text-center">
              <p className="text-[9px] text-muted-foreground font-bold">المبيعات</p>
              <p className="text-xs font-black text-success">{employee.totalSales.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-muted-foreground font-bold">التحصيلات</p>
              <p className="text-xs font-black text-primary">{employee.totalCollections.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-muted-foreground font-bold">الفواتير</p>
              <p className="text-xs font-black">{employee.salesCount}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
