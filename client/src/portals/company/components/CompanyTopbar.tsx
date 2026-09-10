import React from 'react';
import { Building2, ShieldCheck, RefreshCw, Bell } from 'lucide-react';
import type { CompanyNavTab } from './CompanySidebar';

interface CompanyTopbarProps {
  companyName?: string;
  registrationNumber?: string;
  activeTab: CompanyNavTab;
  onRefresh: () => void;
  unreadCount?: number;
  onOpenNotifications: () => void;
}

export const CompanyTopbar: React.FC<CompanyTopbarProps> = ({
  companyName = 'Regulated Enterprise',
  registrationNumber = 'LMPC/REG/2026',
  activeTab,
  onRefresh,
  unreadCount = 0,
  onOpenNotifications
}) => {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Enterprise Compliance Dashboard';
      case 'profile': return 'Company Profile & Registration Details';
      case 'plants': return 'Registered Manufacturing Units & Plants';
      case 'products': return 'Packaged Commodities Catalog';
      case 'documents': return 'Statutory Compliance Certificates & Approvals';
      case 'upcoming': return 'Upcoming Scheduled Audits';
      case 'history': return 'Legal Metrology Audit History';
      case 'notifications': return 'Compliance Notifications & Directives';
      case 'rules': return 'Government Regulatory Rule Book';
      default: return 'Company Compliance Portal';
    }
  };

  return (
    <div className="bg-white border border-[#D8DDE3] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-base sm:text-lg font-bold text-[#1E293B] tracking-tight">
            {getTabTitle()}
          </h1>
          <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7]">
            <ShieldCheck className="w-3 h-3" />
            <span>Regulated Entity</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#64748B] mt-0.5 font-medium">
          <Building2 className="w-3.5 h-3.5 text-[#174A7E]" />
          <span className="font-bold text-[#1E293B]">{companyName}</span>
          <span>&bull;</span>
          <span className="font-mono text-[11px] text-[#475569]">{registrationNumber}</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 self-end sm:self-auto">
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative p-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl text-[#475569] transition cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#DC2626] text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#475569] transition cursor-pointer shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
};
