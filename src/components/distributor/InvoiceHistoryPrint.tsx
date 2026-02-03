import React, { useState, useRef } from 'react';
import {
  Printer,
  FileDown,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { CURRENCY } from '@/constants';

interface LegalInfo {
  commercial_registration?: string;
  industrial_registration?: string;
  tax_identification?: string;
  trademark_name?: string;
}

interface InvoiceItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface InvoiceSnapshot {
  id: string;
  invoice_type: 'sale' | 'return' | 'collection';
  invoice_number: string;
  customer_name: string;
  grand_total: number;
  paid_amount: number;
  remaining: number;
  payment_type: 'CASH' | 'CREDIT' | null;
  items: InvoiceItem[];
  notes: string | null;
  reason: string | null;
  org_name: string | null;
  legal_info: LegalInfo | null;
  invoice_date: string;
}

interface InvoiceHistoryPrintProps {
  invoice: InvoiceSnapshot;
  onClose: () => void;
}

const InvoiceHistoryPrint: React.FC<InvoiceHistoryPrintProps> = ({
  invoice,
  onClose
}) => {
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const getInvoiceTitle = () => {
    switch (invoice.invoice_type) {
      case 'sale': return 'فاتورة مبيعات';
      case 'return': return 'إشعار مرتجع';
      case 'collection': return 'سند قبض';
      default: return 'فاتورة';
    }
  };

  const handlePrint = async () => {
    const printContent = printRef.current;
    if (!printContent) {
      setError('تعذر تحميل محتوى الطباعة');
      return;
    }

    setPrinting(true);
    setError(null);

    try {
      // Wait a moment to ensure content is fully rendered
      await new Promise(resolve => setTimeout(resolve, 100));

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        setError('تم حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة لهذا الموقع.');
        return;
      }

      const invoiceDate = new Date(invoice.invoice_date);

      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>${getInvoiceTitle()} - ${invoice.invoice_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
              width: 80mm;
              padding: 5mm;
              font-size: 12px;
              line-height: 1.4;
            }
            .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .org-name { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
            .legal-info { font-size: 9px; color: #555; }
            .legal-item { margin: 2px 0; }
            .invoice-title { font-size: 14px; font-weight: bold; margin: 10px 0; text-align: center; }
            .invoice-number { font-size: 11px; text-align: center; color: #555; margin-bottom: 10px; font-family: monospace; }
            .info-row { display: flex; justify-content: space-between; font-size: 11px; margin: 3px 0; }
            .items { margin: 10px 0; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; font-size: 11px; }
            .item-name { flex: 1; }
            .item-qty { width: 30px; text-align: center; }
            .item-price { width: 60px; text-align: left; }
            .total { font-size: 14px; font-weight: bold; text-align: center; margin: 10px 0; }
            .payment-status { text-align: center; padding: 5px; margin: 5px 0; font-weight: bold; }
            .payment-cash { background: #d1fae5; color: #047857; }
            .payment-credit { background: #ffedd5; color: #c2410c; }
            .footer { text-align: center; font-size: 10px; color: #555; margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px; }
            @media print {
              body { width: 80mm; }
            }
          </style>
        </head>
        <body>
          <!-- Header -->
          <div class="header">
            <div class="org-name">${invoice.org_name || 'اسم المنشأة'}</div>
            ${invoice.legal_info ? `
              <div class="legal-info">
                ${invoice.legal_info.trademark_name ? `<div class="legal-item">العلامة التجارية: ${invoice.legal_info.trademark_name}</div>` : ''}
                ${invoice.legal_info.commercial_registration ? `<div class="legal-item">سجل تجاري: ${invoice.legal_info.commercial_registration}</div>` : ''}
                ${invoice.legal_info.industrial_registration ? `<div class="legal-item">سجل صناعي: ${invoice.legal_info.industrial_registration}</div>` : ''}
                ${invoice.legal_info.tax_identification ? `<div class="legal-item">رقم ضريبي: ${invoice.legal_info.tax_identification}</div>` : ''}
              </div>
            ` : ''}
          </div>

          <!-- Invoice Title & Number -->
          <div class="invoice-title">${getInvoiceTitle()}</div>
          <div class="invoice-number">${invoice.invoice_number}</div>

          <!-- Invoice Info -->
          <div class="info">
            <div class="info-row">
              <span>التاريخ:</span>
              <span>${invoiceDate.toLocaleDateString('ar-SA')}</span>
            </div>
            <div class="info-row">
              <span>الوقت:</span>
              <span>${invoiceDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div class="info-row">
              <span>العميل:</span>
              <span>${invoice.customer_name}</span>
            </div>
          </div>

          ${invoice.invoice_type === 'sale' && invoice.payment_type ? `
            <div class="payment-status ${invoice.payment_type === 'CASH' ? 'payment-cash' : 'payment-credit'}">
              ${invoice.payment_type === 'CASH' ? '✓ نقداً (مدفوعة)' : '⏳ آجل'}
            </div>
          ` : ''}

          <!-- Items -->
          ${invoice.items && invoice.items.length > 0 ? `
            <div class="items">
              <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 10px; margin-bottom: 5px; color: #555;">
                <span style="flex: 1;">الصنف</span>
                <span style="width: 30px; text-align: center;">الكمية</span>
                <span style="width: 60px; text-align: left;">السعر</span>
              </div>
              ${invoice.items.map(item => `
                <div class="item">
                  <span class="item-name">${item.product_name}</span>
                  <span class="item-qty">${item.quantity}</span>
                  <span class="item-price">${Number(item.total_price).toLocaleString()}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- Totals -->
          <div class="totals">
            <div class="total">
              ${invoice.invoice_type === 'collection' ? 'المبلغ المحصّل' : 'الإجمالي'}: ${Number(invoice.grand_total).toLocaleString()} ${CURRENCY}
            </div>
            ${invoice.invoice_type === 'sale' && invoice.payment_type === 'CREDIT' ? `
              <div class="info-row">
                <span>المدفوع:</span>
                <span>${Number(invoice.paid_amount).toLocaleString()} ${CURRENCY}</span>
              </div>
              <div class="info-row" style="font-weight: bold; color: #c2410c;">
                <span>المتبقي:</span>
                <span>${Number(invoice.remaining).toLocaleString()} ${CURRENCY}</span>
              </div>
            ` : ''}
          </div>

          <!-- Notes/Reason -->
          ${invoice.notes || invoice.reason ? `
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #000; font-size: 10px; color: #555;">
              ${invoice.reason ? `سبب المرتجع: ${invoice.reason}` : ''}
              ${invoice.notes ? `ملاحظات: ${invoice.notes}` : ''}
            </div>
          ` : ''}

          <!-- Footer -->
          <div class="footer">
            <p>شكراً لتعاملكم معنا</p>
            <p style="margin-top: 3px;">Smart Sales System</p>
          </div>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // Wait for content to load before printing
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
      
      // Fallback for browsers that don't trigger onload
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.print();
          printWindow.close();
        }
      }, 500);
      
    } catch (err) {
      console.error('Print error:', err);
      setError('حدث خطأ أثناء الطباعة. يرجى المحاولة مرة أخرى.');
    } finally {
      setPrinting(false);
    }
  };

  const handleExportPDF = async () => {
    // Uses browser's print-to-PDF functionality
    handlePrint();
  };

  const invoiceDate = new Date(invoice.invoice_date);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="p-5 border-b bg-gray-50 flex items-center justify-between">
          <div>
            <h3 className="font-black text-lg">طباعة الفاتورة</h3>
            <p className="text-xs text-gray-500 mt-1">{invoice.invoice_number}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-5 mt-5 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-5 space-y-3">
          <button
            onClick={handlePrint}
            disabled={printing}
            className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {printing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                جارٍ الطباعة...
              </>
            ) : (
              <>
                <Printer className="w-6 h-6" />
                طباعة (طابعة حرارية)
              </>
            )}
          </button>
          <button
            onClick={handleExportPDF}
            disabled={printing}
            className="w-full bg-gray-100 text-gray-700 font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-200 transition-all disabled:opacity-50"
          >
            <FileDown className="w-6 h-6" />
            تصدير كـ PDF
          </button>
        </div>

        {/* Preview - Uses ORIGINAL stored data, no recalculation */}
        <div className="p-5 border-t bg-gray-50">
          <p className="text-sm text-gray-500 text-center mb-3">معاينة الفاتورة (البيانات الأصلية)</p>
          <div 
            ref={printRef}
            className="bg-white border rounded-xl p-4 text-xs max-h-[45vh] overflow-y-auto"
            style={{ fontFamily: 'Segoe UI, Tahoma, sans-serif' }}
          >
            {/* Header */}
            <div className="text-center border-b border-dashed pb-3 mb-3">
              <div className="text-base font-bold mb-2">{invoice.org_name || 'اسم المنشأة'}</div>
              
              {invoice.legal_info && (
                <div className="text-[10px] text-gray-500 space-y-1">
                  {invoice.legal_info.trademark_name && (
                    <div>العلامة التجارية: {invoice.legal_info.trademark_name}</div>
                  )}
                  {invoice.legal_info.commercial_registration && (
                    <div>سجل تجاري: {invoice.legal_info.commercial_registration}</div>
                  )}
                  {invoice.legal_info.industrial_registration && (
                    <div>سجل صناعي: {invoice.legal_info.industrial_registration}</div>
                  )}
                  {invoice.legal_info.tax_identification && (
                    <div>رقم ضريبي: {invoice.legal_info.tax_identification}</div>
                  )}
                </div>
              )}
            </div>

            {/* Invoice Title & Number */}
            <div className="text-center font-bold text-sm mb-1">{getInvoiceTitle()}</div>
            <div className="text-center text-[10px] text-gray-500 font-mono mb-3">{invoice.invoice_number}</div>

            {/* Invoice Info */}
            <div className="text-[11px] space-y-1 mb-3">
              <div className="flex justify-between">
                <span>التاريخ:</span>
                <span>{invoiceDate.toLocaleDateString('ar-SA')}</span>
              </div>
              <div className="flex justify-between">
                <span>الوقت:</span>
                <span>{invoiceDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between">
                <span>العميل:</span>
                <span>{invoice.customer_name}</span>
              </div>
            </div>

            {/* Payment Status */}
            {invoice.invoice_type === 'sale' && invoice.payment_type && (
              <div className={`text-center py-2 rounded-lg font-bold text-xs mb-3 ${
                invoice.payment_type === 'CASH' 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {invoice.payment_type === 'CASH' ? '✓ نقداً (مدفوعة)' : '⏳ آجل'}
              </div>
            )}

            {/* Items */}
            {invoice.items && invoice.items.length > 0 && (
              <div className="border-t border-b border-dashed py-3 my-3">
                <div className="flex justify-between font-bold text-[10px] mb-2 text-gray-500">
                  <span className="flex-1">الصنف</span>
                  <span className="w-8 text-center">الكمية</span>
                  <span className="w-16 text-left">السعر</span>
                </div>
                {invoice.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px] py-1">
                    <span className="flex-1">{item.product_name}</span>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <span className="w-16 text-left">{Number(item.total_price).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Totals */}
            <div className="text-[11px] space-y-1">
              <div className="text-center font-bold text-sm py-2">
                {invoice.invoice_type === 'collection' ? 'المبلغ المحصّل' : 'الإجمالي'}: {Number(invoice.grand_total).toLocaleString()} {CURRENCY}
              </div>
              {invoice.invoice_type === 'sale' && invoice.payment_type === 'CREDIT' && (
                <>
                  <div className="flex justify-between">
                    <span>المدفوع:</span>
                    <span>{Number(invoice.paid_amount).toLocaleString()} {CURRENCY}</span>
                  </div>
                  <div className="flex justify-between font-bold text-orange-600">
                    <span>المتبقي:</span>
                    <span>{Number(invoice.remaining).toLocaleString()} {CURRENCY}</span>
                  </div>
                </>
              )}
            </div>

            {/* Notes/Reason */}
            {(invoice.notes || invoice.reason) && (
              <div className="mt-3 pt-3 border-t border-dashed text-[10px] text-gray-500">
                {invoice.reason && <div>سبب المرتجع: {invoice.reason}</div>}
                {invoice.notes && <div>ملاحظات: {invoice.notes}</div>}
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-[9px] text-gray-400 mt-4 pt-3 border-t border-dashed">
              <p>شكراً لتعاملكم معنا</p>
              <p className="mt-1">Smart Sales System</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceHistoryPrint;
