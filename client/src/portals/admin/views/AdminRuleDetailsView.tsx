import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Scale, 
  CheckCircle2, 
  FileText, 
  Edit3, 
  History, 
  Check, 
  FolderTree,
  Power,
  TrendingUp,
  Plus,
  Trash2,
  CheckSquare
} from 'lucide-react';
import type { RegulatoryRule, ProductCategory } from '../../../types';

interface AdminRuleDetailsViewProps {
  rule: RegulatoryRule;
  allRuleVersions: RegulatoryRule[];
  categories: ProductCategory[];
  onBack: () => void;
  onEditRule: (rule: RegulatoryRule) => void;
  onNewVersion: (rule: RegulatoryRule) => void;
  onToggleStatus?: (rule: RegulatoryRule) => void;
  onOpenImpactSimulator?: (rule: RegulatoryRule) => void;
  onAddRequirement?: (rule: RegulatoryRule) => void;
  onDeleteRequirement?: (ruleId: number, reqId: number) => void;
}

export const AdminRuleDetailsView: React.FC<AdminRuleDetailsViewProps> = ({
  rule,
  allRuleVersions,
  categories,
  onBack,
  onEditRule,
  onNewVersion,
  onToggleStatus,
  onOpenImpactSimulator,
  onAddRequirement,
  onDeleteRequirement
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'categories' | 'versions'>('overview');

  // Related versions of this rule code
  const versionHistory = allRuleVersions
    .filter((r) => r.rule_code === rule.rule_code)
    .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

  const requirements = rule.requirements || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header & Action Buttons */}
      <div className="bg-white border border-[#D8DDE3] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-white hover:bg-[#F8FAFC] text-[#475569] rounded-lg border border-[#CBD5E1] transition shadow-2xs cursor-pointer"
            title="Back to Rules"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-bold text-[#1E293B]">Rule Specification & Requirements</h1>
            <p className="text-xs text-[#64748B]">Statutory compliance standard, versioning, and inspection checks</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenImpactSimulator && (
            <button
              onClick={() => onOpenImpactSimulator(rule)}
              className="px-3.5 py-2 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0] rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Simulate Impact (#9)</span>
            </button>
          )}

          {onToggleStatus && (
            <button
              onClick={() => onToggleStatus(rule)}
              className={`px-3 py-2 rounded-lg text-xs font-bold border flex items-center gap-1.5 shadow-2xs transition cursor-pointer ${
                rule.is_active
                  ? 'bg-white hover:bg-[#FEE2E2] text-[#991B1B] border-[#CBD5E1]'
                  : 'bg-white hover:bg-[#DCFCE7] text-[#15803D] border-[#CBD5E1]'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{rule.is_active ? 'Deactivate' : 'Activate'}</span>
            </button>
          )}

          <button
            onClick={() => onNewVersion(rule)}
            className="px-3.5 py-2 bg-white hover:bg-[#F8FAFC] text-[#174A7E] rounded-lg text-xs font-bold border border-[#CBD5E1] flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <History className="w-3.5 h-3.5" />
            <span>Create New Version</span>
          </button>

          <button
            onClick={() => onEditRule(rule)}
            className="px-4 py-2 bg-[#174A7E] hover:bg-[#0F3B66] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Rule</span>
          </button>
        </div>
      </div>

      {/* Rule Identity Banner Card */}
      <div className="bg-white rounded-xl border border-[#D8DDE3] shadow-xs p-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#EBF3FA] text-[#174A7E] rounded-xl border border-[#CBD5E1]">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#1E293B]">{rule.title}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  rule.is_active
                    ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                    : 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                }`}>
                  {rule.is_active ? 'Active Version' : 'Draft / Superseded'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#64748B] mt-1">
                <span>Code: <strong className="text-[#1E293B] font-mono">{rule.rule_code}</strong></span>
                <span>•</span>
                <span>Version: <strong className="text-[#0369A1] font-mono">{rule.version}</strong></span>
                <span>•</span>
                <span>Effective From: <strong className="text-[#1E293B]">{rule.effective_from || 'N/A'}</strong></span>
                {rule.effective_to && (
                  <>
                    <span>•</span>
                    <span>To: <strong className="text-[#1E293B]">{rule.effective_to}</strong></span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-[#475569] leading-relaxed pt-2 border-t border-[#F1F5F9]">
          {rule.description}
        </p>
      </div>

      {/* Tab Navigators */}
      <div className="flex border-b border-[#D8DDE3] gap-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-xs font-bold transition border-b-2 cursor-pointer ${
            activeTab === 'overview'
              ? 'border-[#174A7E] text-[#174A7E]'
              : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          Rule Specification & Metadata
        </button>

        <button
          onClick={() => setActiveTab('requirements')}
          className={`pb-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'requirements'
              ? 'border-[#174A7E] text-[#174A7E]'
              : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Statutory Requirements ({requirements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 text-xs font-bold transition border-b-2 cursor-pointer ${
            activeTab === 'categories'
              ? 'border-[#174A7E] text-[#174A7E]'
              : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          Mapped Commodity Categories ({rule.categories_count ?? 0})
        </button>

        <button
          onClick={() => setActiveTab('versions')}
          className={`pb-3 text-xs font-bold transition border-b-2 cursor-pointer ${
            activeTab === 'versions'
              ? 'border-[#174A7E] text-[#174A7E]'
              : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          Version History ({versionHistory.length})
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-[#D8DDE3] shadow-xs p-5 space-y-4">
            <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
              <FileText className="w-4 h-4 text-[#174A7E]" />
              <span>Statutory Authority & Gazette Metadata</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-[#64748B] block mb-1">Government Authority</span>
                <p className="font-medium text-[#1E293B] bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
                  {rule.government_authority || 'Department of Consumer Affairs, Ministry of Consumer Affairs, Food and Public Distribution, Government of India'}
                </p>
              </div>

              <div>
                <span className="font-semibold text-[#64748B] block mb-1">Official Statutory Citation</span>
                <p className="font-medium text-[#1E293B] bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
                  {rule.statutory_citation}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="font-semibold text-[#64748B] block mb-1">Notification Reference</span>
                  <p className="font-mono font-bold text-[#174A7E] bg-[#F8FAFC] p-2 rounded-lg border border-[#E2E8F0]">
                    {rule.notification_reference || 'N/A (Original Act/Rules)'}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-[#64748B] block mb-1">Notification Date</span>
                  <p className="font-medium text-[#1E293B] bg-[#F8FAFC] p-2 rounded-lg border border-[#E2E8F0]">
                    {rule.notification_date || 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <span className="font-semibold text-[#64748B] block mb-1">Amendment Title</span>
                <p className="font-medium text-[#1E293B] bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
                  {rule.amendment_title || 'Legal Metrology (Packaged Commodities) Rules, 2011'}
                </p>
              </div>

              <div>
                <span className="font-semibold text-[#64748B] block mb-1">Official Source</span>
                <p className="font-medium text-[#1E293B] bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
                  {rule.official_source || 'The Gazette of India: Extraordinary'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#D8DDE3] shadow-xs p-5 space-y-4">
            <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
              <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
              <span>Rule Engine Validation Logic & Enforcement</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-[#64748B] block mb-1">Validation Logic Code</span>
                <span className="font-mono text-xs font-bold text-[#0F766E] bg-[#F0FDFA] border border-[#CCFBF1] px-2.5 py-1 rounded-md inline-block">
                  {rule.validation_logic_type}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="font-semibold text-[#64748B] block mb-1">Effective From</span>
                  <p className="font-mono font-bold text-[#1E293B] bg-[#F8FAFC] p-2 rounded-lg border border-[#E2E8F0]">
                    {rule.effective_from || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-[#64748B] block mb-1">Effective To</span>
                  <p className="font-mono font-bold text-[#1E293B] bg-[#F8FAFC] p-2 rounded-lg border border-[#E2E8F0]">
                    {rule.effective_to || 'Indefinite (Current Version)'}
                  </p>
                </div>
              </div>

              <div>
                <span className="font-semibold text-[#64748B] block mb-1">Primary Source Document</span>
                <p className="font-medium text-[#1E293B] bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
                  {rule.source_document}
                </p>
              </div>

              <div>
                <span className="font-semibold text-[#64748B] block mb-1">Applicability Criteria Filter (JSON)</span>
                <pre className="font-mono text-[11px] text-[#475569] bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0] max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {JSON.stringify((rule as any).applicability_criteria || {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Requirements */}
      {activeTab === 'requirements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#1E293B]">
                Statutory Inspection Requirements
              </h3>
              <p className="text-xs text-[#64748B]">
                Individual declaration and physical check parameters evaluated for this rule version
              </p>
            </div>
            {onAddRequirement && (
              <button
                onClick={() => onAddRequirement(rule)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#174A7E] hover:bg-[#123860] rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Requirement</span>
              </button>
            )}
          </div>

          <div className="bg-white border border-[#D8DDE3] rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                  <th className="p-3.5">Requirement Title</th>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Mandatory</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {requirements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-xs text-[#94A3B8]">
                      No individual requirements configured. Click &quot;Add Requirement&quot; to configure parameters.
                    </td>
                  </tr>
                ) : (
                  requirements.map((req) => (
                    <tr key={req.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="p-3.5 font-semibold text-[#1E293B]">
                        <div>{req.title}</div>
                        {req.description && (
                          <div className="text-[11px] text-[#64748B] font-normal mt-0.5">{req.description}</div>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] font-bold text-[#174A7E]">
                        {req.requirement_code}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EFF6FF] text-[#174A7E] border border-[#BFDBFE]">
                          {req.requirement_type}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          req.is_mandatory ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#F1F5F9] text-[#64748B]'
                        }`}>
                          {req.is_mandatory ? 'Mandatory' : 'Optional / Guideline'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {onDeleteRequirement && (
                          <button
                            onClick={() => onDeleteRequirement(rule.id, req.id)}
                            className="p-1.5 text-[#DC2626] hover:bg-[#FEF2F2] rounded-md transition-colors cursor-pointer"
                            title="Remove Requirement"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Categories */}
      {activeTab === 'categories' && (
        <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-[#174A7E]" />
              <span>Applicable Commodity Groups</span>
            </h3>
            <span className="text-xs text-[#64748B]">
              Configure applicability under Category Management
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-xs text-[#1E293B]">{cat.name}</div>
                  <div className="font-mono text-[10px] text-[#64748B]">{cat.category_code}</div>
                </div>
                <Check className="w-4 h-4 text-[#15803D]" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Version History */}
      {activeTab === 'versions' && (
        <div className="bg-white border border-[#D8DDE3] rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                <th className="p-3.5">Version Code</th>
                <th className="p-3.5">Title</th>
                <th className="p-3.5">Effective Period</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {versionHistory.map((v) => (
                <tr key={v.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="p-3.5 font-mono font-bold text-[#174A7E]">
                    {v.version}
                    {v.id === rule.id && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#EFF6FF] text-[#174A7E]">
                        Viewing
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 font-medium text-[#1E293B]">{v.title}</td>
                  <td className="p-3.5 text-[#64748B]">
                    {v.effective_from} {v.effective_to ? `to ${v.effective_to}` : '(Current)'}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      v.is_active ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#FEF3C7] text-[#92400E]'
                    }`}>
                      {v.is_active ? 'Active' : 'Superseded'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    {onOpenImpactSimulator && (
                      <button
                        onClick={() => onOpenImpactSimulator(v)}
                        className="px-2.5 py-1 text-[11px] font-bold text-[#15803D] bg-[#F0FDF4] hover:bg-[#DCFCE7] border border-[#BBF7D0] rounded-md transition-colors cursor-pointer"
                      >
                        Simulate Impact
                      </button>
                    )}
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
