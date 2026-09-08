import React from 'react';
import { X } from 'lucide-react';

interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  context?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'md' | 'lg' | 'xl';
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  isOpen,
  onClose,
  title,
  context,
  children,
  footer,
  width = 'lg',
}) => {
  if (!isOpen) return null;

  const widthStyles = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end">
      <div
        className={`bg-white border-l border-[#D8DDE3] w-full ${widthStyles[width]} h-full p-5 sm:p-6 shadow-xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#1E293B]">{title}</h3>
              {context && <p className="text-[11px] text-[#64748B] mt-0.5">{context}</p>}
            </div>
            <button
              onClick={onClose}
              className="text-[#94A3B8] hover:text-[#1E293B] cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">{children}</div>
        </div>

        <div className="pt-4 border-t border-[#E2E8F0]">
          {footer || (
            <button
              onClick={onClose}
              className="w-full py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
