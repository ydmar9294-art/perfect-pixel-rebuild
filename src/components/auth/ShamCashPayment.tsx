import React, { useState } from 'react';
import { Wallet, Copy, CheckCircle2, X, MessageCircle, Clock, AlertTriangle } from 'lucide-react';

interface ShamCashPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  purpose?: 'activation' | 'renewal';
}

const SHAMCASH_ADDRESS = 'efd5411a5f29e0cdb279363de2dd62b3';
const WHATSAPP_NUMBER = '963947744162';

export const ShamCashPayment: React.FC<ShamCashPaymentProps> = ({ 
  isOpen, 
  onClose,
  purpose = 'activation'
}) => {
  const [copiedAddress, setCopiedAddress] = useState(false);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(SHAMCASH_ADDRESS);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleContactSupport = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      purpose === 'activation' 
        ? 'مرحباً، قمت بدفع رسوم التفعيل عبر شام كاش وأريد تفعيل الترخيص'
        : 'مرحباً، قمت بدفع رسوم التجديد عبر شام كاش وأريد تجديد الترخيص'
    )}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-5 animate-zoom-in" onClick={e => e.stopPropagation()} dir="rtl">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-green-500" />
            الدفع عبر شام كاش
          </h2>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Logo */}
        <div className="flex items-center justify-center py-2">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/ShamCash_logo.svg/1200px-ShamCash_logo.svg.png" 
            alt="ShamCash" 
            className="h-14 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        {/* Important Notice */}
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-800 text-sm mb-1">ملاحظة هامة</h4>
              <p className="text-amber-700 text-xs leading-relaxed">
                الاشتراك لن يتم تفعيله تلقائياً. بعد إجراء الدفع، يجب التواصل مع فريق الدعم المالي لتأكيد عملية الدفع وتفعيل الاشتراك يدوياً.
              </p>
            </div>
          </div>
        </div>

        {/* Pending Status */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-500" />
            <div>
              <h4 className="font-bold text-blue-800 text-sm">حالة الاشتراك</h4>
              <p className="text-blue-600 text-xs">قيد الانتظار - بانتظار تأكيد الدفع</p>
            </div>
          </div>
        </div>
        
        {/* Payment Address */}
        <div className="space-y-2">
          <p className="text-center text-sm text-gray-600 font-medium">عنوان الدفع:</p>
          <div 
            onClick={handleCopyAddress}
            className="bg-gray-50 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors border-2 border-green-200"
          >
            <span className="font-mono text-base text-gray-800 tracking-wide" dir="ltr">{SHAMCASH_ADDRESS}</span>
            {copiedAddress ? (
              <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
            ) : (
              <Copy className="w-6 h-6 text-gray-400 flex-shrink-0" />
            )}
          </div>
          <p className="text-center text-xs text-gray-500">اضغط لنسخ العنوان</p>
        </div>

        {/* Steps */}
        <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
          <h4 className="font-bold text-gray-700 text-sm">خطوات الدفع:</h4>
          <ol className="space-y-2 text-xs text-gray-600">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">1</span>
              <span>انسخ عنوان الدفع أعلاه</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">2</span>
              <span>افتح تطبيق شام كاش وقم بالتحويل للعنوان</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">3</span>
              <span>تواصل مع فريق الدعم المالي عبر واتساب لتأكيد الدفع</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">4</span>
              <span>سيتم تفعيل اشتراكك خلال 24 ساعة</span>
            </li>
          </ol>
        </div>

        {/* Contact Support Button */}
        <button 
          onClick={handleContactSupport}
          className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all active:scale-95"
        >
          <MessageCircle className="w-5 h-5" />
          تواصل مع الدعم المالي عبر واتساب
        </button>
        
        <button 
          onClick={onClose}
          className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
};

export default ShamCashPayment;
