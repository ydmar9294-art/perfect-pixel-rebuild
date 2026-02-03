import React from 'react';
import { useApp } from '@/store/AppContext';
import { Package, Warehouse } from 'lucide-react';

const DistributorInventoryTab: React.FC = () => {
  const { distributorInventory } = useApp();

  const totalItems = distributorInventory.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-black text-lg flex items-center gap-2">
          <Warehouse className="w-5 h-5 text-primary" />
          مخزني
        </h2>
        <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">
          {distributorInventory.length} صنف • {totalItems} قطعة
        </div>
      </div>

      {/* Inventory List */}
      {distributorInventory.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-bold">لا توجد مواد في مخزنك</p>
          <p className="text-muted-foreground/70 text-sm mt-2">
            سيتم إضافة المواد تلقائياً عند استلامها من صاحب المنشأة
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {distributorInventory.map((item) => (
            <div 
              key={item.id} 
              className="bg-muted rounded-2xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-foreground">{item.product_name}</p>
                  <p className="text-xs text-muted-foreground">
                    آخر تحديث: {new Date(item.updated_at).toLocaleDateString('ar-EG')}
                  </p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-2xl font-black text-primary">{item.quantity}</p>
                <p className="text-xs text-muted-foreground">قطعة</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DistributorInventoryTab;