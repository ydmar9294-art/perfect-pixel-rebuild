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
    <div className="p-4 space-y-4">
      {/* Print Modal */}
      {showPrintModal && selectedInvoice && (
        <InvoiceHistoryPrint
          invoice={selectedInvoice}
          onClose={closePrintModal}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-gray-800">سجل الفواتير</h3>
        <button
          onClick={() => fetchInvoices(true)}
          disabled={refreshing}
          className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="بحث بالعميل أو رقم الفاتورة..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-50 border-none rounded-xl px-12 py-3 font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filterButtons.map((btn) => (
          <button
            key={btn.id}
            onClick={() => setFilter(btn.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
              filter === btn.id
                ? `${btn.color} text-white shadow-md`
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {btn.icon}
            {btn.label}
          </button>
        ))}
      </div>

      {/* Date Filters (Collapsible) */}
      {showFilters && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Calendar className="w-4 h-4" />
            <span className="font-bold">تصفية بالتاريخ</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">من تاريخ</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">إلى تاريخ</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="text-xs text-red-500 hover:text-red-600"
            >
              مسح التاريخ
            </button>
          )}
        </div>
      )}

      {/* Invoice List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-gray-500 font-medium">جارٍ تحميل السجل...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="w-16 h-16 mx-auto mb-3 opacity-30" />
          <p className="font-bold">لا توجد فواتير</p>
          <p className="text-sm mt-1">سيظهر هنا سجل فواتيرك عند إنشائها</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-gray-50 rounded-2xl p-4 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Type Badge & Number */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${getTypeColor(invoice.invoice_type)}`}>
                      {getTypeIcon(invoice.invoice_type)}
                      {getTypeName(invoice.invoice_type)}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">{invoice.invoice_number}</span>
                  </div>
                  
                  {/* Customer Name */}
                  <p className="font-bold text-gray-800 truncate">{invoice.customer_name}</p>
                  
                  {/* Date */}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(invoice.invoice_date).toLocaleDateString('ar-SA')} - {new Date(invoice.invoice_date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  {/* Amount */}
                  <p className={`font-black text-lg ${invoice.invoice_type === 'return' ? 'text-orange-600' : 'text-emerald-600'}`}>
                    {invoice.invoice_type === 'return' ? '-' : ''}{Number(invoice.grand_total).toLocaleString('ar-SA')}
                  </p>
                  <span className="text-xs text-gray-400">{CURRENCY}</span>
                  
                  {/* Payment Status for sales */}
                  {invoice.invoice_type === 'sale' && invoice.payment_type && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      invoice.payment_type === 'CASH' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {invoice.payment_type === 'CASH' ? 'نقداً' : 'آجل'}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                <button
                  onClick={() => handlePrint(invoice)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-100 text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-200 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  طباعة
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvoiceHistoryTab;
