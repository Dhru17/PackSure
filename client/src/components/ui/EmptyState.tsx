import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'Try changing the search keywords or filter criteria.',
  icon,
  action,
  className = '',
}) => {
  return (
    <div
      className={`p-8 sm:p-12 text-center bg-[#F8F9FA] rounded-xl border border-[#D8DDE3] flex flex-col items-center justify-center space-y-2.5 ${className}`}
    >
      <div className="p-3 bg-white rounded-full border border-[#D8DDE3] text-[#94A3B8] shadow-2xs">
        {icon || <Inbox className="w-6 h-6 text-[#94A3B8]" />}
      </div>
      <h3 className="text-sm font-bold text-[#1E293B]">{title}</h3>
      {description && <p className="text-xs text-[#64748B] max-w-sm">{description}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};
