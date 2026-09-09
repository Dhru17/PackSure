import React from 'react';
import { useAuthStore } from '../../state/authStore';
import { LogOut, Scale, User as UserIcon } from 'lucide-react';

export const AppHeader: React.FC = () => {
  const { user, logout } = useAuthStore();
  const role = user?.role || 'INSPECTOR';

  const getRoleBadge = () => {
    switch (role) {
      case 'SENIOR_OFFICER':
        return {
          label: 'Senior Legal Metrology Officer',
          tag: 'SENIOR REVIEW',
          style: 'bg-amber-50 text-amber-900 border-amber-300'
        };
      case 'ADMIN':
        return {
          label: 'System Governance Administrator',
          tag: 'ADMIN',
          style: 'bg-slate-100 text-slate-800 border-slate-300'
        };
      case 'COMPANY':
        return {
          label: 'Regulated Entity Representative',
          tag: 'ENTERPRISE',
          style: 'bg-emerald-50 text-emerald-900 border-emerald-300'
        };
      default:
        return {
          label: 'Legal Metrology Inspector',
          tag: 'FIELD ENFORCEMENT',
          style: 'bg-sky-50 text-sky-900 border-sky-300'
        };
    }
  };

  const roleMeta = getRoleBadge();

  return (
    <header className="bg-white border-b border-[#D8DDE3] sticky top-0 z-50 shadow-xs">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="bg-[#174A7E] p-2 rounded-lg text-white shadow-xs">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-[#1E293B] tracking-tight">PACKSURE</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EEF2F6] text-[#174A7E] border border-[#CBD5E1]">
                  COMPLIANCE PLATFORM
                </span>
              </div>
              <div className="text-[11px] text-[#64748B] font-medium hidden sm:block">
                Legal Metrology Compliance Platform
              </div>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="flex items-center gap-2.5 pl-3 border-l border-[#E2E8F0]">
              <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] border border-[#D8DDE3] flex items-center justify-center text-[#475569]">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="text-xs font-bold text-[#1E293B]">{user?.full_name || 'Official Officer'}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${roleMeta.style}`}>
                    {roleMeta.tag}
                  </span>
                </div>
                <span className="text-[10px] text-[#64748B] font-mono">
                  {user?.badge_number || 'PS-LM-2026'} &bull; {user?.jurisdiction_district || 'Enforcement Wing'}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Logout Session"
              aria-label="Logout"
              className="p-2 rounded-lg text-[#64748B] hover:text-[#B91C1C] hover:bg-[#FEF2F2] transition border border-[#D8DDE3] hover:border-[#FECACA] bg-white cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

