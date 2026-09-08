import React from 'react';
import { 
  Home, 
  ClipboardList, 
  Package, 
  Bell, 
  User, 
  LogOut, 
  Scale
} from 'lucide-react';
import { useAuthStore } from '../../../state/authStore';

export type InspectorNavTab = 
  | 'home' 
  | 'inspections' 
  | 'products' 
  | 'notifications' 
  | 'profile';

interface InspectorSidebarProps {
  activeTab: InspectorNavTab;
  onSelectTab: (tab: InspectorNavTab) => void;
  unreadNotificationsCount?: number;
}

export const InspectorSidebar: React.FC<InspectorSidebarProps> = ({
  activeTab,
  onSelectTab,
  unreadNotificationsCount = 0
}) => {
  const { logout } = useAuthStore();

  const navItems = [
    { id: 'home' as InspectorNavTab, label: 'Home', icon: Home },
    { id: 'inspections' as InspectorNavTab, label: 'Inspections', icon: ClipboardList },
    { id: 'products' as InspectorNavTab, label: 'Products', icon: Package },
    { 
      id: 'notifications' as InspectorNavTab, 
      label: 'Notifications', 
      icon: Bell,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined 
    },
    { id: 'profile' as InspectorNavTab, label: 'Profile', icon: User },
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
              <div className="text-[11px] text-[#64748B] font-medium mt-1">
                Safe Products. Healthier Lives.
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
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 text-left ${
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
                        : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
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
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
        >
          <LogOut className="w-4 h-4 text-[#DC2626]" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
