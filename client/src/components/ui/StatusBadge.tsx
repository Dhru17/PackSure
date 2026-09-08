import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock, RotateCcw, ShieldCheck } from 'lucide-react';

export type StatusType =
  | 'DRAFT'
  | 'ANALYZING'
  | 'VERIFY'
  | 'AWAITING_VERIFICATION'
  | 'SENIOR_REVIEW'
  | 'SUBMITTED'
  | 'RETURNED'
  | 'PASS'
  | 'FAIL'
  | 'REVIEW'
  | 'FINALIZED'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'COMPLIANT'
  | 'NON_COMPLIANT'
  | 'HIGH_PRIORITY'
  | string;

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className = '' }) => {
  const norm = (status || '').toUpperCase().trim();

  let style = 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]';
  let Icon: React.ElementType | null = null;
  let displayLabel = label || norm.replace(/_/g, ' ');

  switch (norm) {
    case 'PASS':
    case 'COMPLIANT':
    case 'FINALIZED':
    case 'ACTIVE':
      style = 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]';
      Icon = CheckCircle2;
      break;

    case 'FAIL':
    case 'NON_COMPLIANT':
    case 'HIGH_PRIORITY':
    case 'INACTIVE':
      style = 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]';
      Icon = XCircle;
      break;

    case 'RETURNED':
      style = 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]';
      Icon = RotateCcw;
      displayLabel = 'RETURNED';
      break;

    case 'REVIEW':
    case 'AWAITING_VERIFICATION':
    case 'VERIFY':
    case 'PENDING':
      style = 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]';
      Icon = AlertTriangle;
      break;

    case 'SENIOR_REVIEW':
    case 'SUBMITTED':
      style = 'bg-[#EEF2F6] text-[#174A7E] border-[#CBD5E1]';
      Icon = ShieldCheck;
      break;

    case 'DRAFT':
    case 'ANALYZING':
    default:
      style = 'bg-[#F8F9FA] text-[#475569] border-[#D8DDE3]';
      Icon = Clock;
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${style} ${className}`}
    >
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      <span className="tracking-wide uppercase">{displayLabel}</span>
    </span>
  );
};
