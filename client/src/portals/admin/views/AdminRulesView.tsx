import React, { useState } from 'react';
import { 
  BookPlus, 
  Eye, 
  Power,
  TrendingUp
} from 'lucide-react';
import type { RegulatoryRule } from '../../../types';
import { FilterBar, EmptyState } from '../../../components/ui';

interface AdminRulesViewProps {
  rules: RegulatoryRule[];
  onOpenRuleDetail: (rule: RegulatoryRule) => void;
  onNewRule: () => void;
  onToggleStatus: (rule: RegulatoryRule) => void;
  onOpenImpactSimulator?: (rule: RegulatoryRule) => void;
}

export const AdminRulesView: React.FC<AdminRulesViewProps> = ({
  rules,
  onOpenRuleDetail,
  onNewRule,
  onToggleStatus,
  onOpenImpactSimulator
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
      return (
        r.rule_code.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.statutory_citation.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'ALL') {
      const isActive = statusFilter === 'ACTIVE';
      return r.is_active === isActive;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-[#D8DDE3] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-[#1E293B]">Regulatory Rule Book</h1>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-[#EFF6FF] text-[#174A7E] border border-[#BFDBFE] rounded-md">
              Versioned Rules
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Legal Metrology (Packaged Commodities) statutory requirements and version governance
          </p>
        </div>
        <div className="flex items-center gap-2">
          {rules.length > 0 && onOpenImpactSimulator && (
            <button
              onClick={() => onOpenImpactSimulator(rules[0])}
              className="px-3.5 py-2 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0] rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Impact Simulator (#9)</span>
            </button>
          )}
          <button
            onClick={onNewRule}
            className="px-4 py-2 bg-[#174A7E] hover:bg-[#0F3B66] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <BookPlus className="w-4 h-4" />
            <span>Publish New Rule</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#D8DDE3] gap-6">
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`pb-3 text-xs font-bold transition border-b-2 cursor-pointer ${
            activeTab === 'ACTIVE'
              ? 'border-[#174A7E] text-[#174A7E]'
              : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          Active Enforced Rules ({activeRulesList.length})
        </button>
        <button
          onClick={() => setActiveTab('DRAFT')}
          className={`pb-3 text-xs font-bold transition border-b-2 cursor-pointer ${
            activeTab === 'DRAFT'
              ? 'border-[#174A7E] text-[#174A7E]'
              : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          Draft / Upcoming Amendments ({draftRulesList.length})
        </button>
        <button
          onClick={() => setActiveTab('PREVIOUS')}
          className={`pb-3 text-xs font-bold transition border-b-2 cursor-pointer ${
            activeTab === 'PREVIOUS'
              ? 'border-[#174A7E] text-[#174A7E]'
              : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          Superseded Historical Versions ({previousRulesList.length})
        </button>
      </div>

      {/* Filter and Search */}
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search rule code, title, statutory citation..."
        filters={[
          {
            key: 'status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Inactive / Superseded', value: 'INACTIVE' }
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
        <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl bg-white shadow-xs">
          <table className="w-full text-left text-xs text-[#1E293B]">
            <thead className="bg-[#F8F9FA] text-[#475569] font-bold border-b border-[#E2E8F0]">
              <tr>
                <th className="p-3.5">Rule Specification</th>
                <th className="p-3.5">Code</th>
                <th className="p-3.5">Version</th>
                <th className="p-3.5">Effective Date</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
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
                      {onOpenImpactSimulator && (
                        <button
                          type="button"
                          onClick={() => onOpenImpactSimulator(r)}
                          className="px-2.5 py-1.5 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#15803D] rounded-lg border border-[#BBF7D0] font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                          title="Simulate Regulatory Change Impact (#9)"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Impact</span>
                        </button>
                      )}
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
