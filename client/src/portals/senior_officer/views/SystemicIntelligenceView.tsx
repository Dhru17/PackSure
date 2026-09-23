import React, { useState, useEffect, useMemo } from 'react';
import {
  RotateCw,
  Search,
  Building2,
  Package,
  Layers,
  Clock,
  ArrowRight,
  X,
  Send,
  Calendar,
  Eye,
  Check,
  TrendingUp,
  Flame,
  FileCheck2
} from 'lucide-react';
import { api } from '../../../services/api';
import type { SystemicPattern, SystemicOverviewData, Company, RegulatoryRule } from '../../../types';
import { ScheduleAuditModal } from '../components/ScheduleAuditModal';
import { SystemicPatternAnalyticsRow } from '../components/SystemicPatternAnalyticsRow';
import { staticSeniorOfficerAnalytics } from '../components/SeniorAnalyticsData';

interface SystemicIntelligenceViewProps {
  onAuditScheduled?: (newCase: any) => void;
  onNavigateToCase?: (caseId: number) => void;
}

export const SystemicIntelligenceView: React.FC<SystemicIntelligenceViewProps> = ({
  onAuditScheduled,
  onNavigateToCase
}) => {
  const [overview, setOverview] = useState<SystemicOverviewData | null>(null);
  const [patterns, setPatterns] = useState<SystemicPattern[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Filter States
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [companyFilter, setCompanyFilter] = useState<string>('ALL');
  const [ruleFilter, setRuleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Options for dropdowns
  const [companies, setCompanies] = useState<Company[]>([]);
  const [rules, setRules] = useState<RegulatoryRule[]>([]);

  // Selected Detail Drawer
  const [selectedPattern, setSelectedPattern] = useState<SystemicPattern | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('CONFIRMED_PATTERN');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Tab mode for pattern list vs smart priority view
  const [activeTab, setActiveTab] = useState<'patterns' | 'priority_dashboard'>('patterns');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [overviewRes, patternsRes, compRes, rulesRes] = await Promise.all([
        api.getSystemicOverview().catch(() => null),
        api.getSystemicPatterns({
          status: statusFilter,
          severity: severityFilter,
          company_id: companyFilter !== 'ALL' ? Number(companyFilter) : undefined,
          rule_code: ruleFilter !== 'ALL' ? ruleFilter : undefined,
          search: searchQuery.trim() || undefined
        }),
        api.getCompanies().catch(() => ({ companies: [] })),
        api.getRules().catch(() => ({ rules: [] }))
      ]);

      if (overviewRes) {
        setOverview(overviewRes);
      }
      setPatterns(patternsRes.patterns || []);
      setCompanies(compRes.companies || []);
      setRules(rulesRes.rules || []);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: 'short', year: 'numeric' }));
    } catch (err) {
      console.error('Error loading systemic intelligence data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, severityFilter, companyFilter, ruleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleSelectPattern = (pat: SystemicPattern) => {
    setSelectedPattern(pat);
    setActionNotes(pat.senior_officer_notes || '');
    setSelectedAction(
      pat.status === 'NEW' ? 'UNDER_REVIEW' :
      pat.status === 'UNDER_REVIEW' ? 'CONFIRMED_PATTERN' :
      pat.status
    );
  };

  const handleSaveDecision = async (overrideStatus?: string) => {
    if (!selectedPattern) return;
    const targetStatus = overrideStatus || selectedAction;
    setIsUpdating(true);
    setActionSuccessMsg(null);
    try {
      const res = await api.updateSystemicPatternAction(selectedPattern.id, {
        status: targetStatus,
        notes: actionNotes
      });
      if (res.pattern) {
        setSelectedPattern(res.pattern);
      }
      setActionSuccessMsg(`Supervisory action [${targetStatus.replace('_', ' ')}] recorded successfully.`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
      loadData();
    } catch (err: any) {
      alert(`Error recording decision: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Filtered patterns in memory if search typed
  const filteredPatterns = useMemo(() => {
    return patterns.filter((p) => {
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (severityFilter !== 'ALL' && p.severity !== severityFilter) return false;
      if (companyFilter !== 'ALL' && String(p.manufacturer_id) !== companyFilter) return false;
      if (ruleFilter !== 'ALL' && p.rule_code !== ruleFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mfg = (p.manufacturer_name || '').toLowerCase();
        const code = p.pattern_code.toLowerCase();
        const title = p.title.toLowerCase();
        const rule = (p.rule_citation || p.rule_code).toLowerCase();
        const prods = (p.affected_products || []).join(' ').toLowerCase();
        if (!mfg.includes(q) && !code.includes(q) && !title.includes(q) && !rule.includes(q) && !prods.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [patterns, statusFilter, severityFilter, companyFilter, ruleFilter, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Workspace */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-slate-800 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Supervisory Compliance Intelligence</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Systemic Violation Intelligence
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Detect recurring compliance patterns across companies, products and inspections. Aggregates multi-product findings to highlight brand-wide packaging defects requiring senior officer investigation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {lastUpdated && (
            <div className="text-[11px] text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 font-mono">
              Last Updated: <span className="text-slate-200">{lastUpdated}</span>
            </div>
          )}
          <button
            onClick={loadData}
            disabled={isLoading}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Refresh analysis"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule Plant Audit</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Detected Patterns */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Detected Patterns
            </div>
            <div className="text-3xl font-black text-slate-900 mt-1">
              {overview?.summary.detected_patterns_count ?? patterns.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Recurring statutory defects</div>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Companies Affected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Companies Affected
            </div>
            <div className="text-3xl font-black text-amber-600 mt-1">
              {overview?.summary.companies_affected_count ?? new Set(patterns.map(p => p.manufacturer_id)).size}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Registered manufacturers</div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Products Affected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Products Affected
            </div>
            <div className="text-3xl font-black text-rose-600 mt-1">
              {overview?.summary.products_affected_count ?? patterns.reduce((acc, p) => acc + (p.affected_products_count || 0), 0)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Impacted commodity SKUs</div>
          </div>
          <div className="p-3 bg-rose-50 text-rose-700 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Under Review */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Under Review
            </div>
            <div className="text-3xl font-black text-indigo-600 mt-1">
              {overview?.summary.under_review_count ?? patterns.filter(p => p.status === 'UNDER_REVIEW' || p.status === 'NEW').length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Awaiting supervisory action</div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Senior Officer Systemic Intelligence Visual Analytics (Demonstration Data) */}
      <SystemicPatternAnalyticsRow analytics={staticSeniorOfficerAnalytics} />

      {/* 3. Section Switcher & Priority Dashboard Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('patterns')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'patterns'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Detected Patterns ({filteredPatterns.length})
          </button>
          <button
            onClick={() => setActiveTab('priority_dashboard')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'priority_dashboard'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Brand Priority & Rule Trends</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Evidence-based statutory aggregation across inspection lifecycle
        </div>
      </div>

      {/* 4. Smart Priority Dashboard View (Sub-view within Systemic Intelligence) */}
      {activeTab === 'priority_dashboard' && overview && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
          {/* Brand / Company Priority */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Brand / Company Violation Priority</h3>
                    <p className="text-[11px] text-slate-500">Manufacturers ranked by aggregated statutory non-compliance findings</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  Live DB Aggregation
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {(overview.brand_priorities || []).map((bp) => (
                  <div key={bp.manufacturer_id} className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-lg transition-colors">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{bp.company_name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{bp.location}</span>
                        <span>•</span>
                        <span>{bp.affected_products_count} Products Scoped</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs font-black text-slate-900">{bp.total_violations} violations</div>
                        <div className="text-[10px] text-slate-400">Total Flagged</div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        bp.priority_level === 'HIGH'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : bp.priority_level === 'MEDIUM'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {bp.priority_level}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
              * Priority calculated deterministically based on recurring violation frequency across product lines.
            </div>
          </div>

          {/* Rule Trend Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Statutory Rule Violation Trends</h3>
                    <p className="text-[11px] text-slate-500">Most frequently breached Legal Metrology sections</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  Occurrences
                </span>
              </div>

              <div className="space-y-4">
                {(overview.rule_trends || []).map((rt) => (
                  <div key={rt.rule_code} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{rt.rule_code}</span>
                        <span>{rt.rule_title}</span>
                      </div>
                      <div className="font-black text-indigo-900">{rt.violation_count} cases</div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(rt.percentage, 8)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Across {rt.companies_count} manufacturers</span>
                      <span>{rt.percentage}% of flagged issues</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
              * Trend data informs statutory amendment recommendations and targeted supervisory plant inspections.
            </div>
          </div>
        </div>
      )}

      {/* 5. Search & Multi-Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company, product name, rule citation, or pattern code..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Company Filter */}
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              aria-label="Filter by Company"
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Companies</option>
              {companies.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>

            {/* Rule Filter */}
            <select
              value={ruleFilter}
              onChange={(e) => setRuleFilter(e.target.value)}
              aria-label="Filter by Statutory Rule"
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Rules</option>
              {rules.map((r) => (
                <option key={r.id} value={r.rule_code}>{r.rule_code} - {r.title.slice(0, 28)}...</option>
              ))}
            </select>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              aria-label="Filter by Severity"
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Severity</option>
              <option value="HIGH">High Severity</option>
              <option value="MEDIUM">Medium Severity</option>
              <option value="LOW">Low Severity</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by Pattern Status"
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">Newly Detected</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="CONFIRMED_PATTERN">Confirmed Defect</option>
              <option value="DISMISSED">Dismissed</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* 6. Main Pattern Hybrid Table / Card List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
          <span>Detected Systemic Patterns ({filteredPatterns.length})</span>
          <span className="text-slate-400 font-normal">Click any record to inspect granular evidence trail & record decision</span>
        </div>

        {isLoading ? (
          <div className="p-16 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
            <RotateCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
            <span>Scanning historical audit records for systemic non-compliance patterns...</span>
          </div>
        ) : filteredPatterns.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-slate-200">
            <FileCheck2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-800">No Recurring Compliance Patterns Detected</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              Inspection records for the selected filters do not exhibit recurring multi-product violations. All verified findings are within expected parameters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredPatterns.map((pat) => {
              const isConfirmed = pat.status === 'CONFIRMED_PATTERN';
              const isUnderReview = pat.status === 'UNDER_REVIEW';
              const isNew = pat.status === 'NEW';

              return (
                <div
                  key={pat.id}
                  onClick={() => handleSelectPattern(pat)}
                  className={`bg-white rounded-2xl border transition-all p-5 shadow-xs hover:shadow-md cursor-pointer ${
                    selectedPattern?.id === pat.id
                      ? 'border-indigo-600 ring-2 ring-indigo-600/10'
                      : 'border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Metadata & Title */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                          {pat.pattern_code}
                        </span>
                        <span className="text-xs font-bold text-indigo-950 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                          {pat.manufacturer_name || 'Enterprise Manufacturer'}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                          isNew
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : isConfirmed
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : isUnderReview
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {pat.status.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          Severity: <strong className={pat.severity === 'HIGH' ? 'text-rose-600' : 'text-amber-600'}>{pat.severity}</strong>
                        </span>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-100">
                          {Math.round(pat.confidence_score * 100)}% Confidence
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-slate-900 tracking-tight">
                          {pat.title}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                          {pat.description}
                        </p>
                      </div>

                      {/* Rule & Occurrences Info */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-700">Statutory Section:</span>
                          <span className="font-medium text-indigo-900">{pat.rule_citation}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-700">Affected SKUs:</span>
                          <span className="font-bold text-rose-600">{pat.affected_products_count} Products</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-700">Audit Violations:</span>
                          <span className="font-bold text-slate-900">{pat.occurrence_count} Total Cases</span>
                        </div>
                      </div>

                      {/* Affected Products tags preview */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(pat.affected_products || []).slice(0, 4).map((pName, i) => (
                          <span
                            key={i}
                            className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium border border-slate-200"
                          >
                            {pName}
                          </span>
                        ))}
                        {(pat.affected_products || []).length > 4 && (
                          <span className="text-[11px] text-slate-400 font-semibold self-center">
                            +{pat.affected_products.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex lg:flex-col items-center justify-end gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPattern(pat);
                        }}
                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer w-full justify-center"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Evidence</span>
                      </button>

                      {pat.status !== 'CONFIRMED_PATTERN' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPattern(pat);
                            handleSaveDecision('CONFIRMED_PATTERN');
                          }}
                          className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer w-full justify-center"
                        >
                          Confirm Defect
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. Comprehensive Pattern Detail Drawer / Investigation Workspace */}
      {selectedPattern && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white h-full w-full max-w-2xl shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                    {selectedPattern.pattern_code}
                  </span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${
                    selectedPattern.status === 'NEW'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : selectedPattern.status === 'CONFIRMED_PATTERN'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-blue-50 text-blue-800 border-blue-200'
                  }`}>
                    {selectedPattern.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    {Math.round(selectedPattern.confidence_score * 100)}% Confidence
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedPattern.title}
                </h3>
              </div>

              <button
                onClick={() => setSelectedPattern(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {actionSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{actionSuccessMsg}</span>
                </div>
              )}

              {/* 1. Pattern Meta Summary */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3 text-xs">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Pattern Summary & Scope
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 font-medium">Company / Manufacturer:</span>
                    <div className="font-bold text-slate-900 mt-0.5">{selectedPattern.manufacturer_name || 'General Manufacturer'}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Statutory Rule:</span>
                    <div className="font-bold text-indigo-900 mt-0.5">{selectedPattern.rule_citation}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Severity Classification:</span>
                    <div className="font-bold text-rose-700 mt-0.5">{selectedPattern.severity}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Affected Scope:</span>
                    <div className="font-bold text-slate-900 mt-0.5">
                      {selectedPattern.affected_products_count} Products • {selectedPattern.occurrence_count} Occurrences
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200 text-slate-600 leading-relaxed">
                  {selectedPattern.description}
                </div>
              </div>

              {/* 2. Compact Pattern Visualization */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Pattern Correlation Architecture
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Deterministic Rule Linkage</span>
                </div>

                {/* Tree Visual */}
                <div className="bg-slate-900 text-white rounded-xl p-4 font-mono text-xs space-y-2.5">
                  <div className="text-center font-bold text-indigo-300">
                    🏢 {selectedPattern.manufacturer_name || 'MANUFACTURER PORTFOLIO'}
                  </div>
                  <div className="text-center text-slate-500 text-[10px]">
                    │ (Multiple product lines evaluated)
                  </div>
                  <div className="flex items-center justify-center gap-2 flex-wrap text-slate-200 text-[11px]">
                    {(selectedPattern.affected_products || []).slice(0, 3).map((pr, idx) => (
                      <span key={idx} className="bg-slate-800 px-2 py-1 rounded border border-slate-700">
                        📦 {pr.length > 20 ? pr.slice(0, 18) + '...' : pr}
                      </span>
                    ))}
                    {(selectedPattern.affected_products || []).length > 3 && (
                      <span className="text-slate-400">+{selectedPattern.affected_products.length - 3}</span>
                    )}
                  </div>
                  <div className="text-center text-slate-500 text-[10px]">
                    ↓ (Same statutory violation identified)
                  </div>
                  <div className="text-center bg-rose-950/80 border border-rose-700/80 text-rose-200 py-1.5 px-3 rounded-lg font-bold">
                    ⚖️ {selectedPattern.rule_code}: {selectedPattern.rule_citation.slice(0, 40)}...
                  </div>
                  <div className="text-center text-slate-500 text-[10px]">
                    ↓
                  </div>
                  <div className="text-center bg-indigo-950/80 border border-indigo-700 text-indigo-200 py-1.5 px-3 rounded-lg font-bold">
                    🔍 SYSTEMIC VIOLATION PATTERN ({selectedPattern.pattern_code})
                  </div>
                </div>
              </div>

              {/* 3. Affected Products & Granular Evidence Trail */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Granular Evidence Trail ({selectedPattern.evidence_trail?.length || selectedPattern.affected_products?.length || 0} Records)
                  </span>
                  <span className="text-[11px] text-slate-400">Historical Inspection Findings</span>
                </div>

                {selectedPattern.evidence_trail && selectedPattern.evidence_trail.length > 0 ? (
                  <div className="space-y-2.5">
                    {selectedPattern.evidence_trail.map((ev, i) => (
                      <div
                        key={i}
                        className="p-3.5 bg-slate-50 hover:bg-indigo-50/40 rounded-xl border border-slate-200 transition-colors text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{ev.product_name}</span>
                          </div>
                          {onNavigateToCase && ev.case_id ? (
                            <button
                              onClick={() => onNavigateToCase(ev.case_id)}
                              className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-100/70 hover:bg-indigo-200 px-2 py-0.5 rounded cursor-pointer flex items-center gap-1"
                            >
                              <span>{ev.case_number}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          ) : (
                            <span className="font-mono text-[10px] text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                              {ev.case_number}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                          <div>
                            <span className="font-medium">Category:</span> {ev.category_name}
                          </div>
                          <div>
                            <span className="font-medium">Officer:</span> {ev.inspector_name}
                          </div>
                          <div>
                            <span className="font-medium">Barcode:</span> <span className="font-mono">{ev.barcode || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium">Audit Date:</span> {ev.case_date ? new Date(ev.case_date).toLocaleDateString() : 'Historical'}
                          </div>
                        </div>

                        {ev.violation_title && (
                          <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-[11px]">
                            <span className="font-bold">Deficiency:</span> {ev.violation_title}
                            {ev.expected_value && (
                              <div className="text-[10px] text-rose-700 mt-0.5">
                                Expected: {ev.expected_value} • Detected: {ev.detected_value || 'Missing'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(selectedPattern.affected_products || []).map((pName, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                        <div className="font-semibold text-slate-800 flex items-center gap-2">
                          <Package className="w-4 h-4 text-indigo-500" />
                          <span>{pName}</span>
                        </div>
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          Violation Flagged
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Senior Supervisory Notes & Action Desk */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3 text-xs">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Supervisory Investigation Notes & Statutory Justification
                </label>
                <textarea
                  rows={3}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Record supervisory notes (e.g. 'Verified recurring omission of USP on 4 biscuits SKUs. Recommend targeted manufacturing plant audit under Rule 6(10A).')..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />

                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Select Supervisory Action
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedAction('UNDER_REVIEW')}
                      className={`p-2 rounded-xl text-xs font-bold border text-left transition-all cursor-pointer ${
                        selectedAction === 'UNDER_REVIEW'
                          ? 'bg-blue-50 text-blue-900 border-blue-400 ring-2 ring-blue-500/20'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      🔍 Mark Under Review
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedAction('CONFIRMED_PATTERN')}
                      className={`p-2 rounded-xl text-xs font-bold border text-left transition-all cursor-pointer ${
                        selectedAction === 'CONFIRMED_PATTERN'
                          ? 'bg-amber-50 text-amber-900 border-amber-400 ring-2 ring-amber-500/20'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ⚠️ Confirm Pattern
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAction('CONFIRMED_PATTERN');
                        setIsScheduleModalOpen(true);
                      }}
                      className="p-2 rounded-xl text-xs font-bold border text-left bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100 transition-all cursor-pointer col-span-2 flex items-center justify-between"
                    >
                      <span>🏭 Confirm & Schedule Plant Audit</span>
                      <Calendar className="w-3.5 h-3.5 text-indigo-700" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedAction('DISMISSED')}
                      className={`p-2 rounded-xl text-xs font-bold border text-left transition-all cursor-pointer col-span-2 ${
                        selectedAction === 'DISMISSED'
                          ? 'bg-slate-200 text-slate-900 border-slate-400'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ❌ Dismiss Pattern (Isolated Deficiency)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedPattern(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Close Drawer
              </button>

              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleSaveDecision()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                {isUpdating ? <RotateCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Save Supervisory Decision</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Plant Audit Modal */}
      <ScheduleAuditModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSuccess={(newCase) => {
          loadData();
          if (onAuditScheduled) {
            onAuditScheduled(newCase);
          }
        }}
      />
    </div>
  );
};
