import React, { useState } from 'react';
import { 
  BookPlus, 
  Eye, 
  Power 
} from 'lucide-react';
import type { RegulatoryRule } from '../../../types';
import { FilterBar, EmptyState } from '../../../components/ui';

interface AdminRulesViewProps {
  rules: RegulatoryRule[];
  onOpenRuleDetail: (rule: RegulatoryRule) => void;
  onNewRule: () => void;
  onToggleStatus: (rule: RegulatoryRule) => void;
}

export const AdminRulesView: React.FC<AdminRulesViewProps> = ({
  rules,
  onOpenRuleDetail,
  onNewRule,
  onToggleStatus
}) => {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'DRAFT' | 'PREVIOUS'>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Group rules to identify latest active vs previous versions
  const ruleCodeGroups = new Map<string, RegulatoryRule[]>();
  for (const r of rules) {
    const list = ruleCodeGroups.get(r.rule_code) || [];
    list.push(r);
    ruleCodeGroups.set(r.rule_code, list);
  }

  const activeRulesList: RegulatoryRule[] = [];
  const draftRulesList: RegulatoryRule[] = [];
  const previousRulesList: RegulatoryRule[] = [];

  for (const [, group] of ruleCodeGroups.entries()) {
    // Sort group by version / created desc
    const sorted = [...group].sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
    const activeRule = sorted.find(r => r.is_active);
    if (activeRule) {
      activeRulesList.push(activeRule);
      const others = sorted.filter(r => r.id !== activeRule.id);
      previousRulesList.push(...others);
    } else if (sorted.length > 0) {
      draftRulesList.push(sorted[0]);
      previousRulesList.push(...sorted.slice(1));
    }
  }

  const displayedRules = (
    activeTab === 'ACTIVE'
      ? activeRulesList
      : activeTab === 'DRAFT'
      ? draftRulesList
      : previousRulesList
  ).filter(r => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = r.rule_code.toLowerCase().includes(q);
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchCitation = r.statutory_citation.toLowerCase().includes(q);
      if (!matchCode && !matchTitle && !matchCitation) return false;
    }
    if (statusFilter === 'ACTIVE' && !r.is_active) return false;
    if (statusFilter === 'INACTIVE' && r.is_active) return false;
    return true;
  });

  return (
    <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <h2 className="text-base font-bold text-[#1E293B]">Legal Metrology Regulatory Rules</h2>
          <p className="text-xs text-[#64748B]">Manage compliance requirements, version history, and statutory citations</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          {/* Tab Switcher */}
          <div className="flex items-center gap-1.5 bg-[#F8F9FA] p-1 rounded-xl border border-[#D8DDE3]">
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'ACTIVE'
                  ? 'bg-[#174A7E] text-white shadow-2xs'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              Active ({activeRulesList.length})
            </button>
            <button
              onClick={() => setActiveTab('DRAFT')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'DRAFT'
                  ? 'bg-[#174A7E] text-white shadow-2xs'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              Draft ({draftRulesList.length})
            </button>
            <button
              onClick={() => setActiveTab('PREVIOUS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'PREVIOUS'
                  ? 'bg-[#174A7E] text-white shadow-2xs'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              Previous Versions ({previousRulesList.length})
            </button>
          </div>

          <button
            onClick={onNewRule}
            className="px-4 py-2 bg-[#174A7E] hover:bg-[#0F3B66] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <BookPlus className="w-4 h-4" />
            <span>Add Rule</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by rule name or code..."
        filters={[
          {
            key: 'status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'ALL', label: 'All Statuses' },
              { value: 'ACTIVE', label: 'Active Rules Only' },
              { value: 'INACTIVE', label: 'Draft / Inactive Rules Only' }
            ]
          }
        ]}
        onClearFilters={() => {
          setSearchQuery('');
          setStatusFilter('ALL');
        }}
      />

      {/* Rules Table */}
      {displayedRules.length === 0 ? (
        <EmptyState
          title="No Regulatory Rules Found"
          description="No requirements match the search query or filter criteria in this tab."
          action={
            <button
              onClick={onNewRule}
              className="px-4 py-2 bg-[#174A7E] text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              Publish New Rule
            </button>
          }
        />
      ) : (
        <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl">
          <table className="w-full text-left text-xs text-[#1E293B]">
            <thead className="bg-[#F8F9FA] text-[#475569] font-bold border-b border-[#E2E8F0]">
              <tr>
                <th className="p-3.5">Rule Name</th>
                <th className="p-3.5">Code</th>
                <th className="p-3.5">Version</th>
                <th className="p-3.5">Effective Date</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] bg-white">
              {displayedRules.map((r) => (
                <tr 
                  key={r.id} 
                  className="hover:bg-[#F8FAFC] transition cursor-pointer"
                  onClick={() => onOpenRuleDetail(r)}
                >
                  <td className="p-3.5">
                    <div className="font-bold text-[#1E293B]">{r.title}</div>
                    <div className="text-[11px] text-[#64748B] line-clamp-1">{r.statutory_citation}</div>
                  </td>
                  <td className="p-3.5 font-mono text-[#174A7E] font-bold">
                    {r.rule_code}
                  </td>
                  <td className="p-3.5">
                    <span className="font-mono text-[11px] font-bold text-[#0369A1] bg-[#E0F2FE] px-2 py-0.5 rounded border border-[#BAE6FD]">
                      {r.version}
                    </span>
                  </td>
                  <td className="p-3.5 text-[#64748B]">
                    {r.effective_from ? new Date(r.effective_from).toLocaleDateString() : 'Active'}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      r.is_active
                        ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                        : 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                    }`}>
                      {r.is_active ? 'Active' : 'Draft / Superseded'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(r)}
                        className={`p-1.5 rounded-lg border transition ${
                          r.is_active ? 'bg-white hover:bg-[#FEE2E2] text-[#B91C1C] border-[#CBD5E1]' : 'bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#15803D] border-[#86EFAC]'
                        }`}
                        title={r.is_active ? 'Deactivate Rule' : 'Activate Rule'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenRuleDetail(r)}
                        className="px-3 py-1.5 bg-white hover:bg-[#F1F5F9] text-[#174A7E] rounded-lg border border-[#CBD5E1] font-bold text-xs shadow-2xs transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
