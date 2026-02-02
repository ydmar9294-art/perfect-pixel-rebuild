import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  FileDown,
  X,
  Loader2,
  Building2,
  Factory,
  Receipt,
  Tag
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CURRENCY } from '@/constants';

interface LegalInfo {
  commercial_registration: string | null;
  industrial_registration: string | null;
  tax_identification: string | null;
  trademark_name: string | null;
}

interface InvoiceItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface InvoicePrintProps {
  invoiceType: 'sale' | 'return' | 'collection';
  invoiceId: string;
  customerName: string;
  date: Date;
  items?: InvoiceItem[];
  grandTotal: number;
  paidAmount?: number;
  remaining?: number;
  notes?: string;
  onClose: () => void;
}

const InvoicePrint: React.FC<InvoicePrintProps> = ({
  invoiceType,
  invoiceId,
  customerName,
  date,
  items = [],
  grandTotal,
  paidAmount,
  remaining,
  notes,
  onClose
}) => {
  const [legalInfo, setLegalInfo] = useState<LegalInfo | null>(null);
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch legal info only when print/PDF is requested
  useEffect(() => {
    const fetchLegalInfo = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get user's organization
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single();

        if (!profile?.organization_id) return;

        // Get organization name
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', profile.organization_id)
          .single();

        if (org) {
          setOrgName(org.name);
        }

        // Get legal info
        const { data: legal } = await supabase
          .from('organization_legal_info')
          .select('commercial_registration, industrial_registration, tax_identification, trademark_name')
          .eq('organization_id', profile.organization_id)
          .maybeSingle();

        if (legal) {
          setLegalInfo(legal);
        }
      } catch (err) {
        console.error('Error fetching legal info:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLegalInfo();
  }, []);

  const getInvoiceTitle = () => {
    switch (invoiceType) {
      case 'sale': return 'فاتورة مبيعات';
      case 'return': return 'إشعار مرتجع';
      case 'collection': return 'سند قبض';
      default: return 'فاتورة';
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${getInvoiceTitle()}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, sans-serif;
            width: 80mm;
            padding: 5mm;
            font-size: 12px;
          }
          .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
          .org-name { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
          .legal-info { font-size: 9px; color: #555; }
          .legal-item { margin: 2px 0; }
          .invoice-title { font-size: 14px; font-weight: bold; margin: 10px 0; text-align: center; }
          .info-row { display: flex; justify-content: space-between; font-size: 11px; margin: 3px 0; }
          .items { margin: 10px 0; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; }
          .item { display: flex; justify-content: space-between; margin: 5px 0; font-size: 11px; }
          .item-name { flex: 1; }
          .item-qty { width: 30px; text-align: center; }
          .item-price { width: 60px; text-align: left; }
          .total { font-size: 14px; font-weight: bold; text-align: center; margin: 10px 0; }
          .footer { text-align: center; font-size: 10px; color: #555; margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px; }
          @media print {
            body { width: 80mm; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  const handleExportPDF = async () => {
    // For PDF, we'll use browser print to PDF
    handlePrint();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-3xl flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="font-bold text-gray-600">جارٍ تحميل بيانات الفاتورة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="p-5 border-b bg-gray-50 flex items-center justify-between">
          <h3 className="font-black text-lg">طباعة / تصدير الفاتورة</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="p-5 space-y-3">
          <button
            onClick={handlePrint}
            className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-blue-700 transition-all"
          >
            <Printer className="w-6 h-6" />
            طباعة (طابعة حرارية)
          </button>
          <button
            onClick={handleExportPDF}
            className="w-full bg-gray-100 text-gray-700 font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-200 transition-all"
          >
            <FileDown className="w-6 h-6" />
            تصدير كـ PDF
          </button>
        </div>

        {/* Preview */}
        <div className="p-5 border-t bg-gray-50">
          <p className="text-sm text-gray-500 text-center mb-3">معاينة الفاتورة</p>
          <div 
            ref={printRef}
            className="bg-white border rounded-xl p-4 text-xs max-h-[50vh] overflow-y-auto"
            style={{ fontFamily: 'Segoe UI, Tahoma, sans-serif' }}
          >
            {/* Header */}
            <div className="header text-center border-b border-dashed pb-3 mb-3">
              <div className="org-name text-base font-bold mb-2">{orgName || 'اسم المنشأة'}</div>
              
              {/* Legal Info */}
              {legalInfo && (
                <div className="legal-info text-[10px] text-gray-500 space-y-1">
                  {legalInfo.trademark_name && (
                    <div className="legal-item flex items-center justify-center gap-1">
                      <span>العلامة التجارية: {legalInfo.trademark_name}</span>
                    </div>
                  )}
                  {legalInfo.commercial_registration && (
                    <div className="legal-item">
                      سجل تجاري: {legalInfo.commercial_registration}
                    </div>
                  )}
                  {legalInfo.industrial_registration && (
                    <div className="legal-item">
                      سجل صناعي: {legalInfo.industrial_registration}
                    </div>
                  )}
                  {legalInfo.tax_identification && (
                    <div className="legal-item">
                      رقم ضريبي: {legalInfo.tax_identification}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Invoice Title */}
            <div className="invoice-title text-center font-bold text-sm mb-3">
              {getInvoiceTitle()}
            </div>

            {/* Invoice Info */}
            <div className="info text-[11px] space-y-1 mb-3">
              <div className="info-row flex justify-between">
                <span>رقم الفاتورة:</span>
                <span dir="ltr">{invoiceId.slice(0, 8)}</span>
              </div>
              <div className="info-row flex justify-between">
                <span>التاريخ:</span>
                <span>{date.toLocaleDateString('ar-SA')}</span>
              </div>
              <div className="info-row flex justify-between">
                <span>الوقت:</span>
                <span>{date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="info-row flex justify-between">
                <span>العميل:</span>
                <span>{customerName}</span>
              </div>
            </div>

            {/* Items */}
            {items.length > 0 && (
              <div className="items border-t border-b border-dashed py-3 my-3">
                <div className="flex justify-between font-bold text-[10px] mb-2 text-gray-500">
                  <span className="flex-1">الصنف</span>
                  <span className="w-8 text-center">الكمية</span>
                  <span className="w-16 text-left">السعر</span>
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className="item flex justify-between text-[11px] py-1">
                    <span className="item-name flex-1">{item.product_name}</span>
                    <span className="item-qty w-8 text-center">{item.quantity}</span>
                    <span className="item-price w-16 text-left">{item.total_price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Totals */}
            <div className="totals text-[11px] space-y-1">
              <div className="total text-center font-bold text-sm py-2">
                {invoiceType === 'collection' ? 'المبلغ المحصّل' : 'الإجمالي'}: {grandTotal.toLocaleString()} {CURRENCY}
              </div>
              {paidAmount !== undefined && invoiceType === 'sale' && (
                <>
                  <div className="flex justify-between">
                    <span>المدفوع:</span>
                    <span>{paidAmount.toLocaleString()} {CURRENCY}</span>
                  </div>
                  <div className="flex justify-between font-bold text-orange-600">
                    <span>المتبقي:</span>
                    <span>{(remaining || 0).toLocaleString()} {CURRENCY}</span>
                  </div>
                </>
              )}
            </div>

            {/* Notes */}
            {notes && (
              <div className="notes mt-3 pt-3 border-t border-dashed text-[10px] text-gray-500">
                ملاحظات: {notes}
              </div>
            )}

            {/* Footer */}
            <div className="footer text-center text-[9px] text-gray-400 mt-4 pt-3 border-t border-dashed">
              <p>شكراً لتعاملكم معنا</p>
              <p className="mt-1">Smart Sales System</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePrint;
