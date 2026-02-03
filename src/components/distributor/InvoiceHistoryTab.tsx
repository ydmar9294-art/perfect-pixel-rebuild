import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  RotateCcw,
  Wallet,
  Search,
  Calendar,
  Filter,
  Printer,
  Loader2,
  X,
  ChevronDown,
  RefreshCw,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CURRENCY } from '@/constants';
import InvoiceHistoryPrint from './InvoiceHistoryPrint';

interface InvoiceSnapshot {
  id: string;
  invoice_type: 'sale' | 'return' | 'collection';
  invoice_number: string;
  reference_id: string;
  customer_id: string | null;
  customer_name: string;
  created_by: string | null;
  created_by_name: string | null;
  grand_total: number;
  paid_amount: number;
  remaining: number;
  payment_type: 'CASH' | 'CREDIT' | null;
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  notes: string | null;
  reason: string | null;
  org_name: string | null;
  legal_info: {
    commercial_registration?: string;
    industrial_registration?: string;
    tax_identification?: string;
    trademark_name?: string;
  } | null;
  invoice_date: string;
  created_at: string;
}

type InvoiceFilter = 'all' | 'sale' | 'return' | 'collection';

const InvoiceHistoryTab: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<InvoiceFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Print state
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceSnapshot | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const fetchInvoices = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('invoice_snapshots')
        .select('*')
        .eq('created_by', user.id)
        .order('invoice_date', { ascending: false })
        .limit(100);

      // Apply type filter
      if (filter !== 'all') {
        query = query.eq('invoice_type', filter);
      }

      // Apply date filters
      if (dateFrom) {
        query = query.gte('invoice_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('invoice_date', dateTo + 'T23:59:59');
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Map and type JSONB fields properly
      const typedData: InvoiceSnapshot[] = (data || []).map(inv => ({
        id: inv.id,
        invoice_type: inv.invoice_type as 'sale' | 'return' | 'collection',
        invoice_number: inv.invoice_number,
        reference_id: inv.reference_id,
        customer_id: inv.customer_id,
        customer_name: inv.customer_name,
        created_by: inv.created_by,
        created_by_name: inv.created_by_name,
        grand_total: inv.grand_total,
        paid_amount: inv.paid_amount || 0,
        remaining: inv.remaining || 0,
        payment_type: inv.payment_type as 'CASH' | 'CREDIT' | null,
        items: Array.isArray(inv.items) 
          ? (inv.items as unknown as InvoiceSnapshot['items'])
          : [],
        notes: inv.notes,
        reason: inv.reason,
        org_name: inv.org_name,
        legal_info: inv.legal_info && typeof inv.legal_info === 'object' && !Array.isArray(inv.legal_info)
          ? (inv.legal_info as unknown as InvoiceSnapshot['legal_info'])
          : null,
        invoice_date: inv.invoice_date,
        created_at: inv.created_at
      }));
      
      setInvoices(typedData);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, dateFrom, dateTo]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sale': return <FileText className="w-4 h-4" />;
      case 'return': return <RotateCcw className="w-4 h-4" />;
      case 'collection': return <Wallet className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sale': return 'bg-blue-100 text-blue-700';
      case 'return': return 'bg-orange-100 text-orange-700';
      case 'collection': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'sale': return 'فاتورة بيع';
      case 'return': return 'مرتجع';
      case 'collection': return 'سند قبض';
      default: return 'مستند';
    }
  };

  const handlePrint = (invoice: InvoiceSnapshot) => {
    setSelectedInvoice(invoice);
    setShowPrintModal(true);
  };

  const closePrintModal = () => {
    setShowPrintModal(false);
    setSelectedInvoice(null);
  };

  // Filter by search query
  const filteredInvoices = invoices.filter(inv => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      inv.customer_name.toLowerCase().includes(query) ||
      inv.invoice_number.toLowerCase().includes(query)
    );
  });

  const filterButtons: { id: InvoiceFilter; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'all', label: 'الكل', icon: <FileText className="w-4 h-4" />, color: 'bg-gray-600' },
    { id: 'sale', label: 'مبيعات', icon: <FileText className="w-4 h-4" />, color: 'bg-blue-600' },
    { id: 'return', label: 'مرتجعات', icon: <RotateCcw className="w-4 h-4" />, color: 'bg-orange-500' },
    { id: 'collection', label: 'تحصيلات', icon: <Wallet className="w-4 h-4" />, color: 'bg-emerald-600' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Print Modal */}
      {showPrintModal && selectedInvoice && (
        <InvoiceHistoryPrint
          invoice={selectedInvoice}
          onClose={closePrintModal}
        />
      )}

      {/* Header - Compact */}
      <div className="shrink-0 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-black text-foreground">سجل الفواتير</h3>
          <button
            onClick={() => fetchInvoices(true)}
            disabled={refreshing}
            className="p-2 bg-muted rounded-xl hover:bg-muted/80 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search - Compact */}
        <div className="relative mb-3">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="بحث بالعميل أو رقم الفاتورة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted border-none rounded-xl pr-10 pl-10 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${showFilters ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Buttons - Horizontal scroll, compact */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {filterButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-all shrink-0 ${
                filter === btn.id
                  ? `${btn.color} text-white shadow-sm`
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {React.cloneElement(btn.icon as React.ReactElement, { className: 'w-3.5 h-3.5' })}
              {btn.label}
            </button>
          ))}
        </div>

        {/* Date Filters (Collapsible) - Compact */}
        {showFilters && (
          <div className="bg-muted rounded-xl p-3 mt-2 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span className="font-bold">تصفية بالتاريخ</span>
              </div>
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => { setDateFrom(''); setDateTo(''); }}
                  className="text-[10px] text-destructive font-bold"
                >
                  مسح
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Invoice List - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground text-sm font-medium">جارٍ تحميل السجل...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="font-bold text-sm">لا توجد فواتير</p>
            <p className="text-xs mt-1">سيظهر هنا سجل فواتيرك عند إنشائها</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="bg-muted rounded-xl p-3 active:scale-[0.99] transition-transform"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Type Badge & Number */}
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${getTypeColor(invoice.invoice_type)}`}>
                        {React.cloneElement(getTypeIcon(invoice.invoice_type), { className: 'w-3 h-3' })}
                        {getTypeName(invoice.invoice_type)}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono truncate">{invoice.invoice_number}</span>
                    </div>
                    
                    {/* Customer Name */}
                    <p className="font-bold text-sm text-foreground truncate">{invoice.customer_name}</p>
                    
                    {/* Date */}
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(invoice.invoice_date).toLocaleDateString('ar-SA')} - {new Date(invoice.invoice_date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {/* Amount */}
                    <p className={`font-black text-base ${invoice.invoice_type === 'return' ? 'text-orange-600' : 'text-emerald-600'}`}>
                      {invoice.invoice_type === 'return' ? '-' : ''}{Number(invoice.grand_total).toLocaleString('ar-SA')}
                    </p>
                    <span className="text-[10px] text-muted-foreground">{CURRENCY}</span>
                    
                    {/* Payment Status for sales */}
                    {invoice.invoice_type === 'sale' && invoice.payment_type && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                        invoice.payment_type === 'CASH' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {invoice.payment_type === 'CASH' ? 'نقداً' : 'آجل'}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Print Button - Compact */}
                <button
                  onClick={() => handlePrint(invoice)}
                  className="w-full flex items-center justify-center gap-1.5 mt-2 py-2 bg-primary/10 text-primary rounded-lg font-bold text-xs hover:bg-primary/20 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  طباعة الفاتورة
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceHistoryTab;
