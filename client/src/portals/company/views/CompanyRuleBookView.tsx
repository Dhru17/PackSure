import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  ShieldCheck, 
  AlertTriangle, 
  Scale, 
  RefreshCw 
} from 'lucide-react';
import { api } from '../../../services/api';

interface RuleVersion {
  id: number;
  version_number: string;
  effective_date?: string;
  is_active: boolean;
}

interface RuleItem {
  id: number;
  rule_code: string;
  rule_title: string;
  rule_category?: string;
  section_reference?: string;
  rule_text?: string;
  interpretation_notes?: string;
  active_version?: RuleVersion;
  categories?: { id: number; name: string; code: string }[];
}

export const CompanyRuleBookView: React.FC = () => {
  const [rules, setRules] = useState<RuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRule, setSelectedRule] = useState<RuleItem | null>(null);

  const fetchRules = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getCompanyRules();
      if (res && res.rules) {
        setRules(res.rules || []);
        if (res.rules.length > 0) {
          setSelectedRule(res.rules[0]);
        }
      }
    } catch (err: any) {
      console.error('Failed to load rules:', err);
      setError(err?.response?.data?.message || 'Failed to load regulatory rules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const filteredRules = rules.filter(r =>
    r.rule_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.rule_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.section_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.rule_category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#D8DDE3] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1E293B] flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#174A7E]" />
            Statutory Rule Book & Standards Reference
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            Government of India — Legal Metrology (Packaged Commodities) Rules, 2011 reference database.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRules}
            disabled={loading}
            className="p-2 text-[#64748B] hover:text-[#174A7E] hover:bg-[#F1F5F9] rounded-xl border border-[#E2E8F0] transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            title="Refresh rules"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Advisory Banner */}
      <div className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded-2xl flex items-start gap-3">
        <Scale className="w-5 h-5 text-[#174A7E] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[#334155] space-y-1">
          <p className="font-bold text-[#1E293B]">Regulatory Compliance Standard</p>
          <p className="text-[11px] leading-relaxed text-[#64748B]">
            This reference manual reflects currently enforced Government gazette notifications, amendment orders, and standard mandatory declaration schedules under Rules 6, 7, and 8. It is provided read-only for internal quality assurance.
          </p>
        </div>
      </div>

      {/* Main Grid: Left Rules List, Right Rule Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search rules, sections or clauses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#1E293B] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#174A7E] transition"
            />
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-[#64748B] bg-white border border-[#D8DDE3] rounded-2xl">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#174A7E] mb-2" />
              Loading rules...
            </div>
          ) : filteredRules.length === 0 ? (
            <div className="p-8 text-center bg-white border border-[#D8DDE3] rounded-2xl text-xs text-[#64748B]">
              No matching statutory rules found.
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredRules.map((rule) => {
                const isSelected = selectedRule?.id === rule.id;
                return (
                  <div
                    key={rule.id}
                    onClick={() => setSelectedRule(rule)}
                    className={`p-4 rounded-2xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#174A7E] text-white border-[#174A7E] shadow-sm'
                        : 'bg-white border-[#D8DDE3] hover:border-[#CBD5E1] text-[#1E293B]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-[#EFF6FF] text-[#1D4ED8]'
                      }`}>
                        {rule.rule_code}
                      </span>
                      {rule.section_reference && (
                        <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-[#64748B]'}`}>
                          {rule.section_reference}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold line-clamp-2">
                      {rule.rule_title}
                    </h4>

                    {rule.rule_category && (
                      <p className={`text-[10px] mt-1.5 ${isSelected ? 'text-white/70' : 'text-[#64748B]'}`}>
                        Category: {rule.rule_category}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Detail Pane */}
        <div className="lg:col-span-7">
          {selectedRule ? (
            <div className="bg-white border border-[#D8DDE3] rounded-2xl p-6 shadow-xs space-y-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                    {selectedRule.rule_code}
                  </span>
                  {selectedRule.section_reference && (
                    <span className="px-2.5 py-1 text-xs font-semibold bg-[#F1F5F9] text-[#475569] rounded-lg border border-[#E2E8F0]">
                      {selectedRule.section_reference}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Enforced Rule
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#1E293B]">
                  {selectedRule.rule_title}
                </h3>
              </div>

              {/* Version and Effectivity */}
              {selectedRule.active_version && (
                <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs">
                  <span className="text-[#64748B]">Active Regulatory Version:</span>
                  <span className="font-mono font-bold text-[#1E293B]">
                    v{selectedRule.active_version.version_number || '1.0'}
                    {selectedRule.active_version.effective_date ? ` (Effective ${new Date(selectedRule.active_version.effective_date).toLocaleDateString('en-IN')})` : ''}
                  </span>
                </div>
              )}

              {/* Rule Text */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Statutory Rule Provision
                </h4>
                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#1E293B] leading-relaxed whitespace-pre-line font-serif">
                  {selectedRule.rule_text || 'Text of the rule is governed by the Legal Metrology (Packaged Commodities) Rules, 2011 as amended.'}
                </div>
              </div>

              {/* Guidance / Interpretation Notes */}
              {selectedRule.interpretation_notes && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                    Compliance Verification Criteria
                  </h4>
                  <div className="p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-xs text-[#92400E] leading-relaxed">
                    {selectedRule.interpretation_notes}
                  </div>
                </div>
              )}

              {/* Applicable Categories */}
              {selectedRule.categories && selectedRule.categories.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
                  <h4 className="text-xs font-bold text-[#64748B]">
                    Applicable Product Categories
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRule.categories.map((c) => (
                      <span
                        key={c.id}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-[#F1F5F9] text-[#475569] rounded-lg border border-[#E2E8F0]"
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-[#D8DDE3] rounded-2xl p-12 text-center text-xs text-[#64748B]">
              Select a rule from the left panel to review statutory details and enforcement guidelines.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
