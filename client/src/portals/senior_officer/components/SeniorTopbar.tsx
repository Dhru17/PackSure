import React from 'react';
import { Bell, ClipboardCheck, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../../../state/authStore';
import type { SeniorNavTab } from './SeniorSidebar';

interface SeniorTopbarProps {
  activeTab: SeniorNavTab | 'review_workspace';
  onReviewPending: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  pendingReviewsCount?: number;
  unreadNotificationsCount?: number;
}

export const SeniorTopbar: React.FC<SeniorTopbarProps> = ({
  activeTab,
  onReviewPending,
  onOpenNotifications,
  onOpenProfile,
  pendingReviewsCount = 0,
  unreadNotificationsCount = 0
}) => {
  const { user } = useAuthStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.full_name?.split(' ')[0] || 'Senior Officer';

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
              Review queue and statutory oversight overview
            </p>
          </div>
        ) : activeTab === 'reviews' ? (
          <div>
            <h1 className="text-xl font-bold text-[#1E293B] tracking-tight">
              Reviews Queue
            </h1>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              Inspections awaiting senior supervisory review and determination
            </p>
          </div>
        ) : activeTab === 'history' ? (
          <div>
            <h1 className="text-xl font-bold text-[#1E293B] tracking-tight">
              Review History
            </h1>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              Past finalized determinations and adjudicated inspection records
            </p>
          </div>
        ) : activeTab === 'notifications' ? (
          <div>
            <h1 className="text-xl font-bold text-[#1E293B] tracking-tight">
              Notifications
            </h1>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              Updates on case submissions, resubmissions, and inspector verifications
            </p>
          </div>
        ) : activeTab === 'profile' ? (
          <div>
            <h1 className="text-xl font-bold text-[#1E293B] tracking-tight">
              Senior Officer Profile
            </h1>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              Officer credentials, statutory jurisdiction, and governance details
            </p>
          </div>
        ) : activeTab === 'review_workspace' ? (
          <div>
            <h1 className="text-xl font-bold text-[#1E293B] tracking-tight">
              Supervisory Review
            </h1>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              Legal Metrology Compliance Determination Desk
            </p>
          </div>
        ) : (
          <div>
            <h1 className="text-xl font-bold text-[#1E293B] tracking-tight">
              PackSure Senior Officer Desk
            </h1>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              Supervisory Adjudication & Compliance Oversight
            </p>
          </div>
        )}
      </div>

      {/* Right Actions & Officer Profile */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9] rounded-lg transition-colors border border-transparent hover:border-[#CBD5E1] cursor-pointer"
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
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-[#F1F5F9] transition-colors border border-transparent hover:border-[#CBD5E1] text-left cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-[#174A7E] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {user?.full_name ? user.full_name.charAt(0) : <UserIcon className="w-4 h-4" />}
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-bold text-[#1E293B] leading-tight">
              {user?.full_name || 'Senior Officer'}
            </div>
            <div className="text-[10px] text-[#64748B] font-semibold">
              Senior Metrology Officer
            </div>
          </div>
        </button>

        {/* Primary CTA: Review Pending Cases */}
        <button
          onClick={onReviewPending}
          className="flex items-center gap-2 px-4 py-2 bg-[#174A7E] text-white rounded-lg text-xs font-bold shadow-xs hover:bg-[#133E68] active:scale-[0.98] transition-all cursor-pointer"
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Review Pending Cases ({pendingReviewsCount})</span>
        </button>
      </div>
    </header>
  );
};
