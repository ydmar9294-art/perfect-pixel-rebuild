import React from 'react';
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

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background md:bg-black/50 md:backdrop-blur-sm md:items-center md:justify-center md:p-6">
      {/* Mobile: Full Screen | Desktop: Large Centered Modal */}
      <div className="flex flex-col w-full h-full md:h-auto md:max-h-[90vh] md:w-full md:max-w-2xl md:rounded-3xl md:shadow-2xl bg-card overflow-hidden animate-fade-in md:animate-zoom-in">
        {/* Header */}
        <div className={`${headerColors[headerColor]} px-5 py-4 md:py-5 flex items-center justify-between shrink-0`}>
          <h2 className="text-lg md:text-xl font-black flex items-center gap-3">
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
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5">
          {children}
        </div>

        {/* Footer - Fixed */}
        {footer && (
          <div className="shrink-0 p-5 md:p-6 pt-0 bg-card border-t border-border safe-area-bottom">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default FullScreenModal;
