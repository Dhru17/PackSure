import React from 'react';
import { Bell, Plus, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../../../state/authStore';
import type { InspectorNavTab } from './InspectorSidebar';

interface InspectorTopbarProps {
  activeTab: InspectorNavTab | 'inspection_detail' | 'product_detail' | 'wizard';
  onNewInspection: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  unreadNotificationsCount?: number;
}

export const InspectorTopbar: React.FC<InspectorTopbarProps> = ({
  activeTab,
  onNewInspection,
  onOpenNotifications,
  onOpenProfile,
  unreadNotificationsCount = 0
}) => {
  const { user } = useAuthStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.full_name?.split(' ')[0] || 'Inspector';

  return (
    <header className="bg-white border-b border-[#D8DDE3] px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-xs">
      {/* Left Greeting / Context */}
      <div>
        {activeTab === 'home' ? (
          <div>
            <h1 className="text-xl font-bold text-[#1E293B] tracking-tight flex items-center gap-2">
              {getGreeting()}, <span className="text-[#174A7E]">{firstName}!</span>
            </h1>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              Here&apos;s what needs your attention today
            </p>
          </div>
        ) : activeTab === 'inspections' ? (
          <div>
            <h1 className="text-xl font-bold text-[#1E293B] tracking-tight">
              Inspections
            </h1>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              Manage your active compliance cases and completed inspection history
            </p>
          </div>
        ) : activeTab === 'products' ? (
          <div>
            <h1 className="text-xl font-bold text-[#1E293B] tracking-tight">
              Products Catalog
            </h1>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              Search commodities, verify packaging specifications, and review history
            </p>
          </div>
        ) : activeTab === 'notifications' ? (
          <div>
            <h1 className="text-xl font-bold text-[#1E293B] tracking-tight">
              Notifications
            </h1>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              Stay updated on returned cases, verification requests, and supervisory updates
            </p>
          </div>
        ) : activeTab === 'profile' ? (
          <div>
            <h1 className="text-xl font-bold text-[#1E293B] tracking-tight">
              Inspector Profile
            </h1>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              Officer credentials, jurisdiction assignments, and account settings
            </p>
          </div>
        ) : activeTab === 'wizard' ? (
          <div>
            <h1 className="text-xl font-bold text-[#1E293B] tracking-tight">
              New Inspection
            </h1>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              Legal Metrology Compliance Workflow
            </p>
          </div>
        ) : (
          <div>
            <h1 className="text-xl font-bold text-[#1E293B] tracking-tight">
              PackSure Inspector Portal
            </h1>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              Legal Metrology Division &bull; Inspection Desk
            </p>
          </div>
        )}
      </div>

      {/* Right Actions & Officer Profile */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9] rounded-lg transition-colors border border-transparent hover:border-[#CBD5E1]"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#DC2626] rounded-full ring-2 ring-white" />
          )}
        </button>

        {/* Officer Profile Card */}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-[#F1F5F9] transition-colors border border-transparent hover:border-[#CBD5E1] text-left"
        >
          <div className="w-8 h-8 rounded-full bg-[#174A7E] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {user?.full_name ? user.full_name.charAt(0) : <UserIcon className="w-4 h-4" />}
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-bold text-[#1E293B] leading-tight">
              {user?.full_name || 'Inspector Officer'}
            </div>
            <div className="text-[10px] text-[#64748B] font-semibold">
              Inspector Officer
            </div>
          </div>
        </button>

        {/* Primary CTA: + New Inspection */}
        <button
          onClick={onNewInspection}
          className="flex items-center gap-2 px-4 py-2 bg-[#174A7E] text-white rounded-lg text-xs font-bold shadow-xs hover:bg-[#133E68] active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Inspection</span>
        </button>
      </div>
    </header>
  );
};
