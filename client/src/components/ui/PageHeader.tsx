import React from 'react';

interface PageHeaderProps {
  sectionLabel?: string;
  title: string;
  purpose?: string;
  badge?: string;
  badgeVariant?: 'default' | 'amber' | 'blue' | 'green' | 'red';
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  sectionLabel,
  title,
  purpose,
  badge,
  badgeVariant = 'default',
  action,
}) => {
  const badgeStyles = {
    default: 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]',
    amber: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
    blue: 'bg-[#EEF2F6] text-[#174A7E] border-[#CBD5E1]',
    green: 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]',
    red: 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]',
  };

  return (
    <div className="bg-white border border-[#D8DDE3] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1">
        {sectionLabel && (
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
            {sectionLabel}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl font-bold text-[#1E293B] tracking-tight">{title}</h1>
          {badge && (
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeStyles[badgeVariant]}`}
            >
              {badge}
            </span>
          )}
        </div>
        {purpose && <p className="text-xs text-[#64748B] max-w-2xl">{purpose}</p>}
      </div>

      {action && <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">{action}</div>}
    </div>
  );
};
