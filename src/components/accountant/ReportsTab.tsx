import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Wallet,
  Package
} from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { supabase } from '@/integrations/supabase/client';

const ReportsTab: React.FC = () => {
  const { sales, customers, products } = useApp();
  const [purchasesTotal, setPurchasesTotal] = useState(0);
  const [salesReturnsTotal, setSalesReturnsTotal] = useState(0);
  const [purchaseReturnsTotal, setPurchaseReturnsTotal] = useState(0);
  const [collectionsTotal, setCollectionsTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load purchases
      const { data: purchases } = await supabase
        .from('purchases')
        .select('total_price');
      if (purchases) {
        setPurchasesTotal(purchases.reduce((sum, p) => sum + Number(p.total_price), 0));
      }

      // Load sales returns
      const { data: salesReturns } = await supabase
        .from('sales_returns')
        .select('total_amount');
      if (salesReturns) {
        setSalesReturnsTotal(salesReturns.reduce((sum, r) => sum + Number(r.total_amount), 0));
      }

      // Load purchase returns
      const { data: purchaseReturns } = await supabase
        .from('purchase_returns')
        .select('total_amount');
      if (purchaseReturns) {
        setPurchaseReturnsTotal(purchaseReturns.reduce((sum, r) => sum + Number(r.total_amount), 0));
      }

      // Load collections
      const { data: collections } = await supabase
        .from('collections')
        .select('amount, is_reversed')
        .eq('is_reversed', false);
      if (collections) {
        setCollectionsTotal(collections.reduce((sum, c) => sum + Number(c.amount), 0));
      }
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const totalSales = sales.filter(s => !s.isVoided).reduce((sum, s) => sum + Number(s.grandTotal), 0);
  const netSales = totalSales - salesReturnsTotal;
  const netPurchases = purchasesTotal - purchaseReturnsTotal;
  const totalDebt = customers.reduce((sum, c) => sum + Number(c.balance), 0);
  const activeProducts = products.filter(p => !p.isDeleted).length;
  const lowStockProducts = products.filter(p => !p.isDeleted && p.stock <= p.minStock).length;

  // Simple profit estimate (sales - cost of goods sold approximation)
  const estimatedProfit = netSales - netPurchases;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Net Sales */}
        <div className="kpi-card bg-gradient-to-br from-success/10 to-success/5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">صافي المبيعات</span>
            <TrendingUp className="w-6 h-6 text-success" />
          </div>
          <p className="text-3xl font-black text-success">
            {netSales.toLocaleString('ar-SA')}
          </p>
          <p className="text-xs text-muted-foreground">
            إجمالي {totalSales.toLocaleString('ar-SA')} - مرتجعات {salesReturnsTotal.toLocaleString('ar-SA')}
          </p>
        </div>

        {/* Net Purchases */}
        <div className="kpi-card bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">صافي المشتريات</span>
            <ShoppingCart className="w-6 h-6 text-primary" />
          </div>
          <p className="text-3xl font-black text-primary">
            {netPurchases.toLocaleString('ar-SA')}
          </p>
          <p className="text-xs text-muted-foreground">
            إجمالي {purchasesTotal.toLocaleString('ar-SA')} - مرتجعات {purchaseReturnsTotal.toLocaleString('ar-SA')}
          </p>
        </div>

        {/* Estimated Profit */}
        <div className={`kpi-card ${estimatedProfit >= 0 ? 'bg-gradient-to-br from-success/10 to-success/5' : 'bg-gradient-to-br from-destructive/10 to-destructive/5'}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">الربح التقديري</span>
            <DollarSign className={`w-6 h-6 ${estimatedProfit >= 0 ? 'text-success' : 'text-destructive'}`} />
          </div>
          <p className={`text-3xl font-black ${estimatedProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
            {estimatedProfit.toLocaleString('ar-SA')}
          </p>
          <p className="text-xs text-muted-foreground">
            صافي المبيعات - صافي المشتريات
          </p>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Collections */}
        <div className="card-elevated p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-5 h-5 text-success" />
            <span className="text-sm text-muted-foreground">التحصيلات</span>
          </div>
          <p className="text-2xl font-black text-success">
            {collectionsTotal.toLocaleString('ar-SA')}
          </p>
        </div>

        {/* Debts */}
        <div className="card-elevated p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-destructive" />
            <span className="text-sm text-muted-foreground">الديون</span>
          </div>
          <p className="text-2xl font-black text-destructive">
            {totalDebt.toLocaleString('ar-SA')}
          </p>
        </div>

        {/* Active Products */}
        <div className="card-elevated p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">المنتجات</span>
          </div>
          <p className="text-2xl font-black text-primary">
            {activeProducts}
          </p>
        </div>

        {/* Low Stock */}
        <div className="card-elevated p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-warning" />
            <span className="text-sm text-muted-foreground">مخزون منخفض</span>
          </div>
          <p className="text-2xl font-black text-warning">
            {lowStockProducts}
          </p>
        </div>
      </div>

      {/* Summary Table */}
      <div className="card-elevated p-6">
        <h3 className="text-lg font-black mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          ملخص الحركة المالية
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
            <span className="text-muted-foreground">إجمالي المبيعات</span>
            <span className="font-bold text-success">+{totalSales.toLocaleString('ar-SA')}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
            <span className="text-muted-foreground">مرتجعات المبيعات</span>
            <span className="font-bold text-warning">-{salesReturnsTotal.toLocaleString('ar-SA')}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-success/10 rounded-xl">
            <span className="font-bold">صافي المبيعات</span>
            <span className="font-black text-success">{netSales.toLocaleString('ar-SA')}</span>
          </div>
          
          <div className="h-px bg-border my-4"></div>
          
          <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
            <span className="text-muted-foreground">إجمالي المشتريات</span>
            <span className="font-bold text-primary">-{purchasesTotal.toLocaleString('ar-SA')}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
            <span className="text-muted-foreground">مرتجعات المشتريات</span>
            <span className="font-bold text-success">+{purchaseReturnsTotal.toLocaleString('ar-SA')}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-xl">
            <span className="font-bold">صافي المشتريات</span>
            <span className="font-black text-primary">{netPurchases.toLocaleString('ar-SA')}</span>
          </div>
          
          <div className="h-px bg-border my-4"></div>
          
          <div className={`flex items-center justify-between p-4 rounded-xl ${estimatedProfit >= 0 ? 'bg-success/20' : 'bg-destructive/20'}`}>
            <span className="font-black text-lg">الربح التقديري</span>
            <span className={`font-black text-2xl ${estimatedProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {estimatedProfit.toLocaleString('ar-SA')} ر.س
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsTab;
