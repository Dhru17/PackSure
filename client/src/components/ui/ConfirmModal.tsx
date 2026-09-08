import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  explanation?: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'danger' | 'warning' | 'success';
  cancelLabel?: string;
  isProcessing?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  explanation,
  children,
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  cancelLabel = 'Cancel',
  isProcessing = false,
}) => {
  if (!isOpen) return null;

  const btnStyles = {
    primary: 'bg-[#174A7E] hover:bg-[#0F3B66] text-white',
    danger: 'bg-[#B91C1C] hover:bg-[#991B1B] text-white',
    warning: 'bg-[#B45309] hover:bg-[#92400E] text-white',
    success: 'bg-[#15803D] hover:bg-[#166534] text-white',
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 max-w-md w-full shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <h3 className="text-sm font-bold text-[#1E293B] flex items-center gap-2">
            {confirmVariant === 'danger' && <AlertTriangle className="w-4 h-4 text-[#B91C1C]" />}
            <span>{title}</span>
          </h3>
          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#1E293B] cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {explanation && <p className="text-xs text-[#475569]">{explanation}</p>}

        {children}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-3.5 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] rounded-lg text-xs font-bold transition cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer ${btnStyles[confirmVariant]} ${
              isProcessing ? 'opacity-70' : ''
            }`}
          >
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
