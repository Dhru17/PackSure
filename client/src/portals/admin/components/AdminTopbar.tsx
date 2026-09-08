import React from 'react';
import { Bell, User as UserIcon, UserPlus, Scale, FolderTree } from 'lucide-react';
import { useAuthStore } from '../../../state/authStore';
import type { AdminNavTab } from './AdminSidebar';

interface AdminTopbarProps {
  activeTab: AdminNavTab | 'user_detail' | 'rule_detail' | 'category_detail';
  onOpenNotifications?: () => void;
  onOpenProfile: () => void;
  onNewUser?: () => void;
  onNewRule?: () => void;
  onNewCategory?: () => void;
  pendingAlertsCount?: number;
}

export const AdminTopbar: React.FC<AdminTopbarProps> = ({
  activeTab,
  onOpenNotifications,
  onOpenProfile,
  onNewUser,
  onNewRule,
  onNewCategory,
  pendingAlertsCount = 0
}) => {
  const { user } = useAuthStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.full_name?.split(' ')[0] || 'Administrator';

  return (
    <header className="bg-white border-b border-[#D8DDE3] px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-xs">
      {/* Left Context Header */}
      <div>
        {activeTab === 'home' ? (
          <div>
            <h1 className="text-xl font-bold text-[#1E293B] tracking-tight flex items-center gap-2">
              {getGreeting()}, <span className="text-[#174A7E]">{firstName}!</span>
            </h1>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              Manage users, rules and system configuration.
            </p>
          </div>
        ) : activeTab === 'users' || activeTab === 'user_detail' ? (
          <div>
            <h1 className="text-xl font-bold text-[#1E293B] tracking-tight">
              User Management & Access Control
            </h1>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              Provision officers, assign roles, and configure regional jurisdictions
            </p>
          </div>
        ) : activeTab === 'rules' || activeTab === 'rule_detail' ? (
          <div>
            <h1 className="text-xl font-bold text-[#1E293B] tracking-tight">
              Regulatory Rules & Version Engine
            </h1>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              Statutory requirements, citations, and version progression under LM(PC) Rules
            </p>
          </div>
        ) : activeTab === 'categories' || activeTab === 'category_detail' ? (
          <div>
            <h1 className="text-xl font-bold text-[#1E293B] tracking-tight">
              Product Categories & Applicability
            </h1>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              Commodity taxonomies and category-specific statutory rule mappings
            </p>
          </div>
        ) : activeTab === 'audit' ? (
          <div>
            <h1 className="text-xl font-bold text-[#1E293B] tracking-tight">
              Statutory Audit Logs
            </h1>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              Immutable forensic records of all administrative actions and determinations
            </p>
          </div>
        ) : activeTab === 'settings' ? (
          <div>
            <h1 className="text-xl font-bold text-[#1E293B] tracking-tight">
              System Settings & Configuration
            </h1>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              Department organization profile, inspection engine thresholds, and security
            </p>
          </div>
        ) : activeTab === 'profile' ? (
          <div>
            <h1 className="text-xl font-bold text-[#1E293B] tracking-tight">
              Administrator Profile
            </h1>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              System administrator credentials, governance, and account settings
            </p>
          </div>
        ) : (
          <div>
            <h1 className="text-xl font-bold text-[#1E293B] tracking-tight">
              PackSure Admin Console
            </h1>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              System Foundation & Governance Desk
            </p>
          </div>
        )}
      </div>

      {/* Right Actions & Admin Profile */}
      <div className="flex items-center gap-4">
        {/* Contextual Quick Action */}
        {activeTab === 'users' && onNewUser && (
          <button
            onClick={onNewUser}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-[#174A7E] text-white rounded-lg text-xs font-bold shadow-xs hover:bg-[#133E68] transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        )}

        {activeTab === 'rules' && onNewRule && (
          <button
            onClick={onNewRule}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-[#174A7E] text-white rounded-lg text-xs font-bold shadow-xs hover:bg-[#133E68] transition-all cursor-pointer"
          >
            <Scale className="w-4 h-4" />
            <span>Add Rule</span>
          </button>
        )}

        {activeTab === 'categories' && onNewCategory && (
          <button
            onClick={onNewCategory}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-[#174A7E] text-white rounded-lg text-xs font-bold shadow-xs hover:bg-[#133E68] transition-all cursor-pointer"
          >
            <FolderTree className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        )}

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9] rounded-lg transition-colors border border-transparent hover:border-[#CBD5E1] cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {pendingAlertsCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#DC2626] rounded-full ring-2 ring-white" />
          )}
        </button>

        {/* Officer Profile Card */}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-[#F1F5F9] transition-colors border border-transparent hover:border-[#CBD5E1] text-left cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-[#174A7E] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {user?.full_name ? user.full_name.charAt(0) : <UserIcon className="w-4 h-4" />}
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-bold text-[#1E293B] leading-tight">
              {user?.full_name || 'Administrator'}
            </div>
            <div className="text-[10px] text-[#64748B] font-semibold">
              Administrator
            </div>
          </div>
        </button>
      </div>
    </header>
  );
};
