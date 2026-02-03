import React from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';

interface FullScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  headerColor?: 'primary' | 'success' | 'destructive' | 'warning';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const headerColors = {
  primary: 'bg-primary text-primary-foreground',
  success: 'bg-success text-white',
  destructive: 'bg-destructive text-white',
  warning: 'bg-warning text-white'
};

const FullScreenModal: React.FC<FullScreenModalProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  headerColor = 'primary',
  children,
  footer
}) => {
  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-background" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Full Screen Modal */}
      <div className="flex flex-col w-full h-full bg-card overflow-hidden animate-fade-in">
        {/* Header */}
        <div className={`${headerColors[headerColor]} px-5 py-4 flex items-center justify-between shrink-0`}>
          <h2 className="text-lg font-black flex items-center gap-3">
            {icon}
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            aria-label="إغلاق"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {children}
        </div>

        {/* Footer - Fixed */}
        {footer && (
          <div className="shrink-0 p-5 pt-4 bg-card border-t border-border safe-area-bottom">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // Use portal to render modal at document.body level
  return ReactDOM.createPortal(modalContent, document.body);
};

export default FullScreenModal;