import React from 'react';
import { 
  Users, 
  UserCheck, 
  Scale, 
  FolderTree, 
  AlertTriangle, 
  ArrowRight, 
  Clock, 
  ChevronRight,
  UserPlus,
  BookPlus,
  Layers
} from 'lucide-react';
import { KpiCard } from '../../../components/ui';
import type { User, RegulatoryRule, ProductCategory, AuditLog } from '../../../types';

interface AdminDashboardProps {
  users: User[];
  rules: RegulatoryRule[];
  categories: ProductCategory[];
  auditLogs: AuditLog[];
  onNavigateTab: (tab: 'users' | 'rules' | 'categories' | 'audit') => void;
  onNewUser: () => void;
  onNewRule: () => void;
  onNewCategory: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  users,
  rules,
  categories,
  auditLogs,
  onNavigateTab,
  onNewUser,
  onNewRule,
  onNewCategory
}) => {
  const activeUsersCount = users.filter(u => u.is_active).length;
  const activeRulesCount = rules.filter(r => r.is_active).length;

  // Administrative Action Required Items
  const actionRequiredItems = [
    {
      id: 1,
      title: `${users.filter(u => !u.is_active).length} inactive user accounts`,
      description: 'Review officer status and provisioned credentials.',
      linkText: 'View Users',
      tab: 'users' as const
    },
    {
      id: 2,
      title: `${rules.filter(r => !r.is_active).length} draft / superseded rules`,
      description: 'Check active rule versions for upcoming amendments.',
      linkText: 'View Rules',
      tab: 'rules' as const
    },
    {
      id: 3,
      title: `${categories.filter(c => (c.rules_count || 0) === 0).length} categories pending rule mapping`,
      description: 'Ensure all commodity groups have applicable requirements.',
      linkText: 'View Categories',
      tab: 'categories' as const
    }
  ].filter(item => {
    if (item.id === 1 && users.filter(u => !u.is_active).length === 0) return false;
    if (item.id === 2 && rules.filter(r => !r.is_active).length === 0) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 4 Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Users"
          value={users.length}
          subtext="Registered PackSure officers"
          icon={<Users className="w-5 h-5 text-[#174A7E]" />}
          variant="primary"
          onClick={() => onNavigateTab('users')}
        />
        <KpiCard
          label="Active Users"
          value={activeUsersCount}
          subtext="Enabled for system access"
          icon={<UserCheck className="w-5 h-5 text-[#16A34A]" />}
          variant="success"
          onClick={() => onNavigateTab('users')}
        />
        <KpiCard
          label="Active Rules"
          value={activeRulesCount}
          subtext="Enforced in compliance engine"
          icon={<Scale className="w-5 h-5 text-[#0369A1]" />}
          variant="default"
          onClick={() => onNavigateTab('rules')}
        />
        <KpiCard
          label="Product Categories"
          value={categories.length}
          subtext="Configured commodity groups"
          icon={<FolderTree className="w-5 h-5 text-[#92400E]" />}
          variant="warning"
          onClick={() => onNavigateTab('categories')}
        />
      </div>

      {/* Quick Administration Actions */}
      <div className="bg-white border border-[#D8DDE3] rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold text-[#475569] uppercase tracking-wider">Quick Actions:</span>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onNewUser}
            className="px-3 py-1.5 bg-[#EBF3FA] hover:bg-[#D9E9F7] text-[#174A7E] rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-[#BDD7EE]"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add User</span>
          </button>
          <button
            onClick={onNewRule}
            className="px-3 py-1.5 bg-[#EBF3FA] hover:bg-[#D9E9F7] text-[#174A7E] rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-[#BDD7EE]"
          >
            <BookPlus className="w-3.5 h-3.5" />
            <span>Create Rule</span>
          </button>
          <button
            onClick={onNewCategory}
            className="px-3 py-1.5 bg-[#EBF3FA] hover:bg-[#D9E9F7] text-[#174A7E] rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-[#BDD7EE]"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Action Required & Recent Administrative Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Action Required (Needs Attention) */}
        <div className="lg:col-span-6 bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#FEF3C7] text-[#B45309] rounded-lg">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                Action Required &bull; Needs Attention
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('rules')}
              className="text-xs text-[#174A7E] hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {actionRequiredItems.length === 0 ? (
              <div className="p-8 text-center text-[#94A3B8] text-xs bg-[#F8F9FA] rounded-xl border border-[#E2E8F0]">
                All administrative configurations and officer accounts are fully synchronized.
              </div>
            ) : (
              actionRequiredItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-[#F8F9FA] hover:bg-[#F1F5F9] border border-[#D8DDE3] hover:border-[#CBD5E1] rounded-xl transition flex items-center justify-between group cursor-pointer shadow-2xs"
                  onClick={() => onNavigateTab(item.tab)}
                >
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-bold text-[#1E293B] group-hover:text-[#174A7E] transition">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-[#64748B]">{item.description}</p>
                  </div>

                  <button
                    type="button"
                    className="px-3 py-1.5 bg-white text-[#174A7E] group-hover:bg-[#174A7E] group-hover:text-white rounded-lg text-xs font-bold border border-[#CBD5E1] group-hover:border-transparent transition flex items-center gap-1 shrink-0 shadow-2xs"
                  >
                    <span>{item.linkText}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Recent Administrative Activity */}
        <div className="lg:col-span-6 bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#EBF3FA] text-[#174A7E] rounded-lg">
                <Clock className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                Recent Administrative Activity
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('audit')}
              className="text-xs text-[#174A7E] hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>View All Logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-[#94A3B8] text-xs bg-[#F8F9FA] rounded-xl border border-[#E2E8F0]">
                No recent activity recorded.
              </div>
            ) : (
              auditLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="p-3 bg-[#F8F9FA] border border-[#D8DDE3] rounded-xl flex items-center justify-between text-xs shadow-2xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1E293B]">{log.action_type.replace(/_/g, ' ')}</span>
                      <span className="font-mono text-[10px] text-[#174A7E] font-semibold bg-white px-1.5 py-0.2 rounded border border-[#CBD5E1]">
                        {log.entity_name}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      By <strong className="text-[#334155]">{log.user_name || 'Admin'}</strong> &bull; {log.justification || 'Administrative update'}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-[#94A3B8] shrink-0">
                    {new Date(log.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
