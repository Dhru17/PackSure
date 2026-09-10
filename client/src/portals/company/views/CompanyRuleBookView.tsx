import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  ShieldCheck, 
  AlertTriangle, 
  Scale, 
  RefreshCw,
  HelpCircle,
  CheckCircle2,
  XCircle,
  FileText,
  Globe,
  Info,
  Tag
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
  title?: string;
  rule_title?: string;
  description?: string;
  rule_text?: string;
  statutory_citation?: string;
  section_reference?: string;
  what_it_is_for?: string;
  statutory_purpose?: string;
  enforcement_guidance?: string;
  interpretation_notes?: string;
  statutory_penalties?: string;
  practical_examples?: {
    compliant?: string[];
    non_compliant?: string[];
  };
  applicability_criteria?: {
    what_it_is_for?: string;
    statutory_purpose?: string;
    applicability_summary?: string;
    enforcement_guidance?: string;
    statutory_penalties?: string;
    examples?: {
      compliant?: string[];
      non_compliant?: string[];
    };
  };
  rule_category?: string;
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
          // If a rule was already selected, keep it selected, else select first
          setSelectedRule((prev) => {
            if (prev) {
              const matched = res.rules.find((r: RuleItem) => r.id === prev.id || r.rule_code === prev.rule_code);
              return matched || res.rules[0];
            }
            return res.rules[0];
          });
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

  const getRuleTitle = (rule: RuleItem) => {
    return rule.rule_title || rule.title || rule.rule_code;
  };

  const getRuleCitation = (rule: RuleItem) => {
    return rule.section_reference || rule.statutory_citation || '';
  };

  const getRuleText = (rule: RuleItem) => {
    return rule.rule_text || rule.description || 'Text of the rule is governed by the Legal Metrology (Packaged Commodities) Rules, 2011 as amended.';
  };

  const getWhatItIsFor = (rule: RuleItem) => {
    return rule.what_it_is_for || rule.applicability_criteria?.what_it_is_for || '';
  };

  const getStatutoryPurpose = (rule: RuleItem) => {
    return rule.statutory_purpose || rule.applicability_criteria?.statutory_purpose || '';
  };

  const getEnforcementGuidance = (rule: RuleItem) => {
    return rule.enforcement_guidance || rule.interpretation_notes || rule.applicability_criteria?.enforcement_guidance || '';
  };

  const getStatutoryPenalties = (rule: RuleItem) => {
    return rule.statutory_penalties || rule.applicability_criteria?.statutory_penalties || 'Legal Metrology Act, 2009 — Section 36(1): Fine up to ₹25,000 for first offence, up to ₹50,000 for second offence, and non-compliant package seizure.';
  };

  const getExamples = (rule: RuleItem) => {
    return rule.practical_examples || rule.applicability_criteria?.examples || null;
  };

  const getRuleBadgeScope = (code: string) => {
    switch (code) {
      case 'RULE_6_10':
        return { text: 'Imported Goods Mandatory • Domestic Exempt', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'RULE_6_11':
        return { text: 'Unit Sale Price • Anti-Shrinkflation', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'RULE_6_1_A':
        return { text: 'Full Traceability • PIN Code Required', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'RULE_6_1_B':
        return { text: 'Generic Commodity Identifier', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'RULE_6_1_C':
        return { text: 'Metric SI Units (g/kg/ml/l)', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'RULE_6_1_D':
        return { text: 'Month & Year Timestamp', color: 'bg-sky-50 text-sky-700 border-sky-200' };
      case 'RULE_6_1_E':
        return { text: 'Ceiling Price • All Taxes Inclusive', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'RULE_6_1_N':
        return { text: 'Consumer Care (Phone, Email, Postal)', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
      case 'RULE_7':
        return { text: 'Font Height • Schedule II Table 1', color: 'bg-teal-50 text-teal-700 border-teal-200' };
      default:
        return { text: 'Mandatory Declaration Standard', color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const filteredRules = rules.filter((r) => {
    const code = (r.rule_code || '').toLowerCase();
    const title = getRuleTitle(r).toLowerCase();
    const ref = getRuleCitation(r).toLowerCase();
    const cat = (r.rule_category || '').toLowerCase();
    const purpose = getWhatItIsFor(r).toLowerCase();
    const s = searchTerm.toLowerCase();
    return code.includes(s) || title.includes(s) || ref.includes(s) || cat.includes(s) || purpose.includes(s);
  });

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
            Government of India — Legal Metrology (Packaged Commodities) Rules, 2011 official statutory database & enforcement guide.
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
            <span className="hidden sm:inline">Refresh Standards</span>
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
          <p className="font-bold text-[#1E293B]">Enforced Regulatory Standards & Inspection Rationale</p>
          <p className="text-[11px] leading-relaxed text-[#64748B]">
            This reference manual reflects currently enforced Government gazette notifications, amendment orders, and mandatory packaging schedules under Rules 6, 7, and 8. Click any rule below to review what the rule is for, its statutory objectives, and compliance verification criteria.
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
              placeholder="Search rules, sections (e.g. 6(10), USP, MRP)..."
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
            <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
              {filteredRules.map((rule) => {
                const isSelected = selectedRule?.id === rule.id || selectedRule?.rule_code === rule.rule_code;
                const title = getRuleTitle(rule);
                const citation = getRuleCitation(rule);
                const whatItIsFor = getWhatItIsFor(rule);
                const scope = getRuleBadgeScope(rule.rule_code);

                return (
                  <div
                    key={rule.id || rule.rule_code}
                    onClick={() => setSelectedRule(rule)}
                    className={`p-4 rounded-2xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#174A7E] text-white border-[#174A7E] shadow-md'
                        : 'bg-white border-[#D8DDE3] hover:border-[#94A3B8] hover:bg-[#F8FAFC] text-[#1E293B]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-[#EFF6FF] text-[#1D4ED8]'
                      }`}>
                        {rule.rule_code}
                      </span>
                      {citation && (
                        <span className={`text-[10px] font-medium ${isSelected ? 'text-white/80' : 'text-[#64748B]'}`}>
                          {citation}
                        </span>
                      )}
                    </div>

                    <h4 className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-[#1E293B]'}`}>
                      {title}
                    </h4>

                    {/* Scope Pill */}
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${
                        isSelected 
                          ? 'bg-white/10 text-white/90 border-white/20' 
                          : scope.color
                      }`}>
                        {scope.text}
                      </span>
                    </div>

                    {/* What It Is For Brief Summary */}
                    {whatItIsFor && (
                      <p className={`text-[11px] mt-2 line-clamp-2 leading-relaxed ${
                        isSelected ? 'text-blue-100' : 'text-[#64748B]'
                      }`}>
                        {whatItIsFor}
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
              {/* Header Details */}
              <div className="space-y-2 border-b border-[#E2E8F0] pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                    {selectedRule.rule_code}
                  </span>
                  {getRuleCitation(selectedRule) && (
                    <span className="px-2.5 py-1 text-xs font-semibold bg-[#F1F5F9] text-[#475569] rounded-lg border border-[#E2E8F0]">
                      {getRuleCitation(selectedRule)}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Enforced Mandatory Standard
                  </span>
                </div>

                <h3 className="text-xl font-bold text-[#1E293B]">
                  {getRuleTitle(selectedRule)}
                </h3>
                <p className="text-xs text-[#64748B]">
                  Legal Metrology (Packaged Commodities) Rules, 2011 — Ministry of Consumer Affairs, Government of India.
                </p>
              </div>

              {/* ⭐ FEATURED SECTION: WHAT IS THIS RULE FOR? (STATUTORY PURPOSE) */}
              <div className="p-5 bg-gradient-to-br from-[#EFF6FF] to-[#F0FDF4] border border-[#BFDBFE] rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-[#1E40AF]">
                  <HelpCircle className="w-5 h-5 text-[#1D4ED8] flex-shrink-0" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    What This Rule is For (Statutory Purpose & Rationale)
                  </h4>
                </div>

                <p className="text-xs leading-relaxed text-[#1E3A8A] font-medium">
                  {getWhatItIsFor(selectedRule) || (
                    selectedRule.rule_code === 'RULE_6_10' 
                      ? 'Rule 6(10) mandates that every imported pre-packaged commodity sold in India must conspicuously state the country of origin or manufacture on the Principal Display Panel (PDP). It protects consumers by providing clear origin transparency and prevents misleading provenance claims. For domestic commodities manufactured in India, this rule evaluates as NOT APPLICABLE (Compliant by default).'
                      : 'Governs statutory package declarations under the Legal Metrology Act, 2009 to protect consumer welfare, measurement accuracy, and price transparency.'
                  )}
                </p>

                {/* Specific Callout for RULE_6_10 */}
                {selectedRule.rule_code === 'RULE_6_10' && (
                  <div className="mt-3 pt-3 border-t border-[#BFDBFE]/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-white/80 rounded-xl border border-blue-200/60 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[#1E40AF]">
                        <Globe className="w-4 h-4 text-blue-600" />
                        <span>For Imported Goods</span>
                      </div>
                      <p className="text-[11px] text-[#334155] leading-relaxed">
                        Mandatory declaration: Must print <span className="font-semibold">"Country of Origin: [Country]"</span> or <span className="font-semibold">"Made in [Country]"</span> on PDP alongside importer name & address.
                      </p>
                    </div>

                    <div className="p-3 bg-white/80 rounded-xl border border-emerald-200/60 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[#065F46]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>For Domestic Goods (India)</span>
                      </div>
                      <p className="text-[11px] text-[#334155] leading-relaxed">
                        <span className="font-semibold text-emerald-700">NOT APPLICABLE (Compliant)</span>: Registered Indian manufacturer facility address under Rule 6(1)(a) already satisfies legal origin traceability.
                      </p>
                    </div>
                  </div>
                )}

                {/* Specific Callout for RULE_6_11 */}
                {selectedRule.rule_code === 'RULE_6_11' && (
                  <div className="mt-3 pt-3 border-t border-[#BFDBFE]/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-white/80 rounded-xl border border-emerald-200/60 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[#065F46]">
                        <Tag className="w-4 h-4 text-emerald-600" />
                        <span>Anti-Shrinkflation Defense</span>
                      </div>
                      <p className="text-[11px] text-[#334155] leading-relaxed">
                        Prevents stealth down-sizing. Consumers can compare cost per gram or per kg directly across varied pack sizes and competing brands.
                      </p>
                    </div>

                    <div className="p-3 bg-white/80 rounded-xl border border-blue-200/60 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[#1E40AF]">
                        <Scale className="w-4 h-4 text-blue-600" />
                        <span>Standard Denominators</span>
                      </div>
                      <p className="text-[11px] text-[#334155] leading-relaxed">
                        Packs &gt; 1 kg or 1 L must state price per kg / per L. Smaller packages state price per g or ml in Rupees and Paise.
                      </p>
                    </div>
                  </div>
                )}

                {getStatutoryPurpose(selectedRule) && (
                  <div className="pt-2 text-[11px] text-[#1E40AF] font-semibold flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    <span>Statutory Objective: {getStatutoryPurpose(selectedRule)}</span>
                  </div>
                )}
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

              {/* Rule Text / Statutory Provision */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#174A7E]" />
                  Statutory Rule Provision
                </h4>
                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#1E293B] leading-relaxed whitespace-pre-line font-serif">
                  {getRuleText(selectedRule)}
                </div>
              </div>

              {/* Guidance / Inspection Verification Criteria */}
              {getEnforcementGuidance(selectedRule) && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-[#B45309]" />
                    Compliance & Inspection Verification Criteria
                  </h4>
                  <div className="p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-xs text-[#92400E] leading-relaxed whitespace-pre-line">
                    {getEnforcementGuidance(selectedRule)}
                  </div>
                </div>
              )}

              {/* Statutory Legal Penalties */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                  Statutory Penalties & Enforcement Provisions
                </h4>
                <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-[#991B1B] leading-relaxed">
                  {getStatutoryPenalties(selectedRule)}
                </div>
              </div>

              {/* Declaration Examples (Compliant vs Non-Compliant) */}
              {(() => {
                const examples = getExamples(selectedRule);
                if (!examples || (!examples.compliant && !examples.non_compliant)) return null;

                return (
                  <div className="space-y-3 pt-2 border-t border-[#F1F5F9]">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                      Packaging Declaration Demonstration
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {examples.compliant && examples.compliant.length > 0 && (
                        <div className="p-3.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl space-y-2">
                          <div className="flex items-center gap-1.5 font-bold text-[#166534]">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Compliant Declaration Example</span>
                          </div>
                          <ul className="space-y-1 text-[11px] text-[#14532D]">
                            {examples.compliant.map((ex, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="font-mono text-emerald-600 font-bold">•</span>
                                <span>{ex}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {examples.non_compliant && examples.non_compliant.length > 0 && (
                        <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl space-y-2">
                          <div className="flex items-center gap-1.5 font-bold text-[#991B1B]">
                            <XCircle className="w-4 h-4 text-rose-600" />
                            <span>Non-Compliant Violation Example</span>
                          </div>
                          <ul className="space-y-1 text-[11px] text-[#7F1D1D]">
                            {examples.non_compliant.map((ex, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="font-mono text-rose-600 font-bold">•</span>
                                <span>{ex}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

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
              Select a rule from the left panel to review statutory details, purpose rationale, and enforcement guidelines.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
