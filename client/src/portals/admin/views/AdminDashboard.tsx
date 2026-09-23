import React from 'react';
import { 
  Scale, 
  AlertTriangle, 
  ArrowRight, 
  Clock, 
  ChevronRight,
  UserPlus,
  BookPlus,
  Building2,
  FolderTree,
  MapPin,
  ShieldCheck,
  LayoutDashboard
} from 'lucide-react';
import type { User, RegulatoryRule, ProductCategory, AuditLog, Company, Plant, Jurisdiction } from '../../../types';
import { staticAdminDashboardAnalytics } from '../components/AdminAnalyticsData';
import { AdminMasterDataCards } from '../components/AdminMasterDataCards';
import { AdminRulesByCategoryChart } from '../components/AdminRulesByCategoryChart';
import { AdminRuleStatusDonutChart } from '../components/AdminRuleStatusDonutChart';

interface AdminDashboardProps {
  users: User[];
  rules: RegulatoryRule[];
  categories: ProductCategory[];
  auditLogs: AuditLog[];
  companies: Company[];
  plants: Plant[];
  jurisdictions: Jurisdiction[];
  onNavigateTab: (tab: 'companies' | 'jurisdictions' | 'inspectors' | 'users' | 'rules' | 'categories' | 'audit') => void;
  onNewCompany: () => void;
  onNewJurisdiction: () => void;
  onNewUser: () => void;
  onNewRule: () => void;
  onNewCategory: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  users,
  rules,
  categories,
  auditLogs,
  companies,
  onNavigateTab,
  onNewCompany,
  onNewJurisdiction,
  onNewUser,
  onNewRule,
  onNewCategory
}) => {
  const inspectors = users.filter(u => u.role === 'INSPECTOR');

  // Administrative Action Required Items
  const actionRequiredItems = [
    {
      id: 1,
      title: `${companies.filter(c => !c.is_active).length} inactive enterprise records`,
      description: 'Review company status and associated production facilities.',
      linkText: 'Manage Companies',
      tab: 'companies' as const
    },
    {
      id: 2,
      title: `${inspectors.filter(i => (i.category_eligibilities || []).length === 0).length} inspectors missing category certification`,
      description: 'Configure permanent qualification matrix so Senior Officers can assign audits.',
      linkText: 'Configure Eligibility',
      tab: 'inspectors' as const
    },
    {
      id: 3,
      title: `${rules.filter(r => !r.is_active).length} draft / superseded statutory rules`,
      description: 'Check active rule versions for upcoming amendments and impact.',
      linkText: 'View Rule Book',
      tab: 'rules' as const
    },
    {
      id: 4,
      title: `${categories.filter(c => (c.rules_count || 0) === 0).length} categories pending rule mapping`,
      description: 'Ensure all commodity groups have applicable legal requirements.',
      linkText: 'View Categories',
      tab: 'categories' as const
    }
  ].filter(item => {
    if (item.id === 1 && companies.filter(c => !c.is_active).length === 0) return false;
    if (item.id === 2 && inspectors.filter(i => (i.category_eligibilities || []).length === 0).length === 0) return false;
    if (item.id === 3 && rules.filter(r => !r.is_active).length === 0) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="flex items-center gap-2 text-[#174A7E] font-bold text-xs uppercase tracking-wider mb-1">
            <LayoutDashboard className="w-4 h-4 text-[#174A7E]" />
            <span>Central Administration</span>
          </div>
          <h2 className="text-xl font-bold text-[#1E293B] tracking-tight">
            Admin Dashboard
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            System administration and regulatory governance overview
          </p>
        </div>
      </div>

      {/* 2. Master Data Overview (5 compact statistic cards) */}
      <div className="space-y-2.5">
        <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider px-0.5">
          Master Data Overview
        </div>
        <AdminMasterDataCards metrics={staticAdminDashboardAnalytics.masterData} />
      </div>

      {/* 3. Analytics Row: Rules by Category & Active vs Inactive Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AdminRulesByCategoryChart
          data={staticAdminDashboardAnalytics.rulesByCategory}
          onCategoryClick={() => onNavigateTab('categories')}
        />
        <AdminRuleStatusDonutChart
          data={staticAdminDashboardAnalytics.ruleStatus}
        />
      </div>

      {/* 4. Main Grid: Action Required, Core Modules & Quick Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action Required & Core Modules Column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Governance & Maintenance Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#1E293B] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                <span>System Governance & Maintenance</span>
              </h3>
              <span className="text-[11px] font-semibold text-[#64748B]">
                {actionRequiredItems.length} items flagged
              </span>
            </div>

            <div className="space-y-2.5">
              {actionRequiredItems.length === 0 ? (
                <div className="bg-white border border-[#D8DDE3] rounded-xl p-6 text-center text-[#64748B] text-xs">
                  All enterprise master data, inspector qualifications, and regulatory rules are fully up to date!
                </div>
              ) : (
                actionRequiredItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-[#D8DDE3] rounded-xl p-4 shadow-xs hover:border-[#174A7E] transition-all flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-[#1E293B]">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        {item.description}
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigateTab(item.tab)}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#EFF6FF] text-[#174A7E] text-xs font-bold rounded-lg hover:bg-[#DBEAFE] transition-colors cursor-pointer"
                    >
                      <span>{item.linkText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick System Navigation Cards */}
          <div className="pt-1">
            <h3 className="text-sm font-bold text-[#1E293B] mb-3">
              Core Architectural Master Modules
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => onNavigateTab('companies')}
                className="p-3.5 bg-white border border-[#D8DDE3] rounded-xl hover:border-[#174A7E] transition-all text-left shadow-xs cursor-pointer group"
              >
                <div className="p-2 bg-[#EFF6FF] text-[#174A7E] rounded-lg w-fit mb-2 group-hover:bg-[#174A7E] group-hover:text-white transition-colors">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-[#1E293B]">Companies & Plants</div>
                <div className="text-[10px] text-[#64748B] mt-0.5">Master enterprise records & facilities</div>
              </button>

              <button
                onClick={() => onNavigateTab('inspectors')}
                className="p-3.5 bg-white border border-[#D8DDE3] rounded-xl hover:border-[#174A7E] transition-all text-left shadow-xs cursor-pointer group"
              >
                <div className="p-2 bg-[#F0FDF4] text-[#15803D] rounded-lg w-fit mb-2 group-hover:bg-[#15803D] group-hover:text-white transition-colors">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-[#1E293B]">Inspector Matrix</div>
                <div className="text-[10px] text-[#64748B] mt-0.5">Permanent category & jurisdiction eligibility</div>
              </button>

              <button
                onClick={() => onNavigateTab('rules')}
                className="p-3.5 bg-white border border-[#D8DDE3] rounded-xl hover:border-[#174A7E] transition-all text-left shadow-xs cursor-pointer group"
              >
                <div className="p-2 bg-[#F5F3FF] text-[#7C3AED] rounded-lg w-fit mb-2 group-hover:bg-[#7C3AED] group-hover:text-white transition-colors">
                  <Scale className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-[#1E293B]">Rule Book & Impact</div>
                <div className="text-[10px] text-[#64748B] mt-0.5">Versioned rules & impact simulator</div>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Operations & Activity Stream */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#1E293B]">
            Administrative Operations
          </h3>

          <div className="bg-white border border-[#D8DDE3] rounded-xl p-4 shadow-xs space-y-2">
            <button
              onClick={onNewCompany}
              className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-[#174A7E] text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-[#174A7E]" />
                <span className="text-xs font-semibold text-[#1E293B]">Register Company</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#174A7E]" />
            </button>

            <button
              onClick={onNewJurisdiction}
              className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-[#174A7E] text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#0F766E]" />
                <span className="text-xs font-semibold text-[#1E293B]">Configure Jurisdiction</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0F766E]" />
            </button>

            <button
              onClick={onNewUser}
              className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-[#174A7E] text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-4 h-4 text-[#174A7E]" />
                <span className="text-xs font-semibold text-[#1E293B]">Provision User Account</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#174A7E]" />
            </button>

            <button
              onClick={onNewRule}
              className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-[#174A7E] text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <BookPlus className="w-4 h-4 text-[#7C3AED]" />
                <span className="text-xs font-semibold text-[#1E293B]">Create Rule / Version</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#7C3AED]" />
            </button>

            <button
              onClick={onNewCategory}
              className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-[#174A7E] text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <FolderTree className="w-4 h-4 text-[#D97706]" />
                <span className="text-xs font-semibold text-[#1E293B]">Add Product Category</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#D97706]" />
            </button>
          </div>

          {/* Forensic Audit Stream Snapshot */}
          <div className="bg-white border border-[#D8DDE3] rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-[#1E293B] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#174A7E]" />
                <span>Recent System Activity</span>
              </h4>
              <button
                onClick={() => onNavigateTab('audit')}
                className="text-[11px] font-bold text-[#174A7E] hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-2.5 max-h-48 overflow-y-auto">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="text-xs border-b border-[#F1F5F9] pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between text-[10px] text-[#94A3B8]">
                    <span className="font-bold text-[#174A7E]">{log.action_type}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="text-[11px] font-medium text-[#1E293B] mt-0.5 line-clamp-1">
                    {log.justification || `${log.entity_name} modified`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
