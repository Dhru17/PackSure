import React from 'react';

interface DataRowProps {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  className?: string;
}

export const DataRow: React.FC<DataRowProps> = ({
  label,
  value,
  mono = false,
  className = '',
}) => {
  return (
    <div className={`flex items-baseline justify-between text-xs py-1 border-b border-[#F1F5F9] last:border-0 ${className}`}>
      <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide shrink-0 pr-2">
        {label}
      </span>
      <span className={`text-right text-[#1E293B] font-medium ${mono ? 'font-mono' : ''} truncate`}>
        {value || '—'}
      </span>
    </div>
  );
};
