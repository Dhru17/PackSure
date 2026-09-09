import React from 'react';
import { 
  Home, 
  Users, 
  Scale, 
  FolderTree, 
  FileText, 
  Settings, 
  User, 
  LogOut, 
  ShieldAlert,
  Building2,
  MapPin,
  ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '../../../state/authStore';

export type AdminNavTab = 
  | 'home' 
  | 'companies'
  | 'jurisdictions'
  | 'inspectors'
  | 'users' 
  | 'rules' 
  | 'categories' 
  | 'audit' 
  | 'settings' 
  | 'profile';

interface AdminSidebarProps {
  activeTab: AdminNavTab;
  onSelectTab: (tab: AdminNavTab) => void;
  pendingRequestsCount?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingRequestsCount = 0
}) => {
  const { logout } = useAuthStore();

  const navItems = [
    { id: 'home' as AdminNavTab, label: 'Overview', icon: Home },
    { id: 'companies' as AdminNavTab, label: 'Companies & Plants', icon: Building2 },
    { id: 'jurisdictions' as AdminNavTab, label: 'Jurisdictions', icon: MapPin },
    { id: 'inspectors' as AdminNavTab, label: 'Inspector Matrix', icon: ShieldCheck },
    { 
      id: 'users' as AdminNavTab, 
      label: 'Users & Roles', 
      icon: Users,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined
    },
    { id: 'rules' as AdminNavTab, label: 'Rule Book & Impact', icon: Scale },
    { id: 'categories' as AdminNavTab, label: 'Categories', icon: FolderTree },
    { id: 'audit' as AdminNavTab, label: 'Audit Logs', icon: FileText },
    { id: 'settings' as AdminNavTab, label: 'Settings', icon: Settings },
    { id: 'profile' as AdminNavTab, label: 'Profile', icon: User },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#D8DDE3] flex flex-col justify-between flex-shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#174A7E] text-white rounded-xl shadow-xs">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-base text-[#1E293B] tracking-tight leading-none">
                PackSure
              </div>
              <div className="text-[11px] text-[#64748B] font-medium mt-1 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-[#174A7E]" />
                <span>Administration Desk</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 text-left cursor-pointer ${
                  isActive
                    ? 'bg-[#174A7E] text-white shadow-xs font-bold'
                    : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#1E293B]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#64748B]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white text-[#174A7E]'
                        : 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout Action at Bottom */}
      <div className="p-4 border-t border-[#E2E8F0]">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-[#DC2626]" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
