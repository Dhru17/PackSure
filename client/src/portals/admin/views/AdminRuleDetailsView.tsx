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
  Power
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
}

export const AdminRuleDetailsView: React.FC<AdminRuleDetailsViewProps> = ({
  rule,
  allRuleVersions,
  categories,
  onBack,
  onEditRule,
  onNewVersion,
  onToggleStatus
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'versions'>('overview');

  // Related versions of this rule code
  const versionHistory = allRuleVersions
    .filter(r => r.rule_code === rule.rule_code)
    .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

  return (
    <div className="space-y-6">
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
            <h1 className="text-base font-bold text-[#1E293B]">Rule Details</h1>
            <p className="text-xs text-[#64748B]">Statutory compliance requirement and automated check configuration</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
      <div className="bg-white rounded-xl border border-[#D8DDE3] shadow-xs p-6 space-y-2">
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
                  {rule.is_active ? 'Active' : 'Draft / Superseded'}
                </span>
              </div>
              <p className="text-xs text-[#64748B] font-mono mt-1">
                Rule Code: <strong className="text-[#174A7E]">{rule.rule_code}</strong> &bull; Version: <strong className="text-[#0369A1]">{rule.version}</strong>
              </p>
            </div>
          </div>

          <div className="text-xs text-[#64748B] text-right space-y-0.5">
            <div>Effective From: <strong className="text-[#1E293B]">{rule.effective_from ? new Date(rule.effective_from).toLocaleDateString() : '01 Jul 2011'}</strong></div>
            <div>Expiry: <span className="text-[#15803D] font-semibold">{rule.effective_to ? new Date(rule.effective_to).toLocaleDateString() : 'No Expiry Date (Permanent)'}</span></div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="bg-white border border-[#D8DDE3] rounded-xl p-1.5 shadow-xs flex items-center gap-1.5">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-[#174A7E] text-white shadow-2xs'
              : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC]'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-[#174A7E] text-white shadow-2xs'
              : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC]'
          }`}
        >
          Applicable Categories
        </button>
        <button
          onClick={() => setActiveTab('versions')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
            activeTab === 'versions'
              ? 'bg-[#174A7E] text-white shadow-2xs'
              : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC]'
          }`}
        >
          Version History ({versionHistory.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Requirement Card */}
          <div className="bg-white rounded-xl border border-[#D8DDE3] shadow-xs p-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
              <FileText className="w-4 h-4 text-[#174A7E]" />
              <span>Human-Readable Requirement</span>
            </h3>
            <p className="text-xs text-[#334155] leading-relaxed bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
              {rule.description || 'Net quantity and mandatory consumer declarations must be clearly marked on the principal display panel in accordance with standard units.'}
            </p>
          </div>

          {/* Check Configuration Card */}
          <div className="bg-white rounded-xl border border-[#D8DDE3] shadow-xs p-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
              <CheckCircle2 className="w-4 h-4 text-[#174A7E]" />
              <span>Automated Check Configuration</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2.5 p-2 bg-[#F0FDF4] text-[#15803D] rounded-lg border border-[#DCFCE7] font-semibold">
                <Check className="w-4 h-4" />
                <span>Declaration Presence & Multi-Surface Detection</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 bg-[#F0FDF4] text-[#15803D] rounded-lg border border-[#DCFCE7] font-semibold">
                <Check className="w-4 h-4" />
                <span>Text Readability & OCR Confidence Verification</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 bg-[#F0FDF4] text-[#15803D] rounded-lg border border-[#DCFCE7] font-semibold">
                <Check className="w-4 h-4" />
                <span>Metric Units Format & Capitalization Standard</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 bg-[#F0FDF4] text-[#15803D] rounded-lg border border-[#DCFCE7] font-semibold">
                <Check className="w-4 h-4" />
                <span>Principal Display Panel Placement & Font Height Ratio</span>
              </div>
            </div>
          </div>

          {/* Applicable Categories */}
          <div className="bg-white rounded-xl border border-[#D8DDE3] shadow-xs p-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
              <FolderTree className="w-4 h-4 text-[#174A7E]" />
              <span>Applicable Commodity Categories</span>
            </h3>
            <div className="flex flex-wrap gap-2 pt-1">
              {categories.slice(0, 5).map((c) => (
                <span
                  key={c.id}
                  className="px-3 py-1.5 bg-[#EBF3FA] text-[#174A7E] font-semibold rounded-lg border border-[#CBD5E1] text-xs"
                >
                  {c.name}
                </span>
              ))}
            </div>
          </div>

          {/* Statutory Reference Card */}
          <div className="bg-white rounded-xl border border-[#D8DDE3] shadow-xs p-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
              <Scale className="w-4 h-4 text-[#174A7E]" />
              <span>Official Statutory Source</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-[#64748B] uppercase">Statutory Citation</label>
                <p className="font-bold text-[#1E293B] mt-0.5">{rule.statutory_citation}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#64748B] uppercase">Source Document</label>
                <p className="text-[#475569] mt-0.5">{rule.source_document || 'Legal Metrology (Packaged Commodities) Rules, 2011'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: APPLICABLE CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-xl border border-[#D8DDE3] shadow-xs p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
            <FolderTree className="w-4 h-4 text-[#174A7E]" />
            <span>Category Mapping Matrix</span>
          </h3>
          <p className="text-xs text-[#64748B]">
            This statutory requirement is enforced on packages categorized under the following commodity classifications:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {categories.map((c) => (
              <div key={c.id} className="p-3.5 bg-[#F8F9FA] border border-[#D8DDE3] rounded-xl flex items-center justify-between text-xs shadow-2xs">
                <div>
                  <div className="font-bold text-[#1E293B]">{c.name}</div>
                  <div className="text-[10px] font-mono text-[#64748B]">{c.category_code}</div>
                </div>
                <span className="px-2 py-0.5 bg-[#DCFCE7] text-[#15803D] font-bold text-[10px] rounded border border-[#86EFAC]">
                  APPLICABLE
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: VERSION HISTORY */}
      {activeTab === 'versions' && (
        <div className="bg-white rounded-xl border border-[#D8DDE3] shadow-xs p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
            <History className="w-4 h-4 text-[#174A7E]" />
            <span>Statutory Version Progression Timeline ({versionHistory.length})</span>
          </h3>

          <div className="space-y-3">
            {versionHistory.map((v) => (
              <div
                key={v.id}
                className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                  v.id === rule.id
                    ? 'bg-[#EBF3FA]/50 border-[#174A7E] shadow-xs ring-1 ring-[#174A7E]'
                    : 'bg-[#F8F9FA] border-[#D8DDE3]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#174A7E] bg-white px-2 py-0.5 rounded border border-[#CBD5E1]">
                      {v.version}
                    </span>
                    <span className="font-bold text-[#1E293B]">{v.title}</span>
                    <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold border ${
                      v.is_active ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]' : 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                    }`}>
                      {v.is_active ? 'Active' : 'Superseded'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B] line-clamp-1">{v.description}</p>
                </div>

                <div className="text-[11px] text-[#64748B] sm:text-right">
                  <div>Effective: <strong>{v.effective_from ? new Date(v.effective_from).toLocaleDateString() : '01 Jul 2011'}</strong></div>
                  <div className="text-[10px] text-[#94A3B8]">Database ID: #{v.id}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
