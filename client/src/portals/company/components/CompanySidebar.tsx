import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Factory, 
  Package, 
  FileText, 
  CalendarClock, 
  History, 
  Bell, 
  BookOpen, 
  UserCircle 
} from 'lucide-react';

export type CompanyNavTab = 
  | 'dashboard'
  | 'profile'
  | 'plants'
  | 'products'
  | 'documents'
  | 'upcoming'
  | 'history'
  | 'notifications'
  | 'rules';

interface CompanySidebarProps {
  activeTab: CompanyNavTab;
  setActiveTab: (tab: CompanyNavTab) => void;
  pendingDocsCount?: number;
  unreadNotificationsCount?: number;
}

export const CompanySidebar: React.FC<CompanySidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingDocsCount = 0,
  unreadNotificationsCount = 0
}) => {
  const navItems: { id: CompanyNavTab; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'profile', label: 'Company Profile', icon: <Building2 className="w-4 h-4" /> },
    { id: 'plants', label: 'Plants & Facilities', icon: <Factory className="w-4 h-4" /> },
    { id: 'products', label: 'Registered Products', icon: <Package className="w-4 h-4" /> },
    { 
      id: 'documents', 
      label: 'Statutory Documents', 
      icon: <FileText className="w-4 h-4" />, 
      badge: pendingDocsCount,
      badgeColor: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
    },
    { id: 'upcoming', label: 'Upcoming Audits', icon: <CalendarClock className="w-4 h-4" /> },
    { id: 'history', label: 'Audit History', icon: <History className="w-4 h-4" /> },
    { 
      id: 'notifications', 
      label: 'Notifications', 
      icon: <Bell className="w-4 h-4" />,
      badge: unreadNotificationsCount,
      badgeColor: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]'
    },
    { id: 'rules', label: 'Regulatory Rule Book', icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-full lg:w-64 bg-white border border-[#D8DDE3] rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-6">
      <div className="space-y-1.5">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
          Enterprise Compliance Portal
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? 'bg-[#174A7E] text-white shadow-xs'
                    : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-white' : 'text-[#64748B]'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {Boolean(item.badge && item.badge > 0) && (
                  <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full border ${item.badgeColor || 'bg-[#EFF6FF] text-[#1E40AF]'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-[#E2E8F0] space-y-2">
        <div className="px-3 py-2 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-[11px] text-[#64748B] space-y-1">
          <div className="font-bold text-[#1E293B] flex items-center gap-1.5">
            <UserCircle className="w-3.5 h-3.5 text-[#174A7E]" />
            <span>Regulated Entity Account</span>
          </div>
          <p className="text-[10px] leading-relaxed">
            Statutory records and official inspection reports are cryptographically signed and archived.
          </p>
        </div>
      </div>
    </aside>
  );
};
