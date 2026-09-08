import React from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'danger' | 'warning' | 'success' | 'primary';
  onClick?: () => void;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subtext,
  icon,
  variant = 'default',
  onClick,
  className = '',
}) => {
  const variantStyles = {
    default: 'bg-white border-[#D8DDE3] text-[#1E293B]',
    primary: 'bg-white border-[#CBD5E1] text-[#174A7E]',
    danger: 'bg-white border-[#FECACA] text-[#991B1B]',
    warning: 'bg-white border-[#FED7AA] text-[#C2410C]',
    success: 'bg-white border-[#BBF7D0] text-[#15803D]',
  };

  const labelStyles = {
    default: 'text-[#64748B]',
    primary: 'text-[#174A7E]',
    danger: 'text-[#991B1B]',
    warning: 'text-[#C2410C]',
    success: 'text-[#166534]',
  };

  const valueStyles = {
    default: 'text-[#1E293B]',
    primary: 'text-[#174A7E]',
    danger: 'text-[#DC2626]',
    warning: 'text-[#C2410C]',
    success: 'text-[#16A34A]',
  };

  return (
    <div
      onClick={onClick}
      className={`border rounded-xl p-4 shadow-xs space-y-1.5 transition ${variantStyles[variant]} ${
        onClick ? 'cursor-pointer hover:border-[#174A7E]' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${labelStyles[variant]}`}>
          {label}
        </span>
        {icon && <span className="shrink-0">{icon}</span>}
      </div>

      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-bold font-mono tracking-tight ${valueStyles[variant]}`}>
          {value}
        </span>
      </div>

      {subtext && <p className="text-[11px] text-[#64748B] truncate">{subtext}</p>}
    </div>
  );
};
