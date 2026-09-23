import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Search,
  Building2,
  Package,
  Layers,
  Calendar,
  AlertCircle,
  Play,
  RotateCw,
  Info,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../../../services/api';
import type { RegulatoryRule, RegulatoryImpactResult } from '../../../types';

interface AdminImpactSimulatorViewProps {
  initialRuleId?: number;
  onNavigateToRule?: (ruleId: number) => void;
}

export const AdminImpactSimulatorView: React.FC<AdminImpactSimulatorViewProps> = ({
  initialRuleId,
  onNavigateToRule
}) => {
  const [rules, setRules] = useState<RegulatoryRule[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState<number | null>(initialRuleId || null);
  const [ruleVersions, setRuleVersions] = useState<any[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('CURRENT');
  const [effectiveDateOverride, setEffectiveDateOverride] = useState<string>('');
  
  const [impactResult, setImpactResult] = useState<RegulatoryImpactResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRules, setIsLoadingRules] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Results Tab
  const [activeTab, setActiveTab] = useState<'products' | 'companies' | 'plants' | 'audits'>('products');
  const [tableSearch, setTableSearch] = useState('');

  // Load Rules list
  useEffect(() => {
    const loadRulesAndCategories = async () => {
      setIsLoadingRules(true);
      try {
        const rulesRes = await api.getRules();
        const rList = rulesRes.rules || [];
        setRules(rList);

        if (initialRuleId) {
          setSelectedRuleId(initialRuleId);
        } else if (rList.length > 0) {
          // Default to first active rule or Rule 6(10A)
          const defRule = rList.find(r => r.rule_code === 'RULE_6_10A') || rList[0];
          setSelectedRuleId(defRule.id);
        }
      } catch (err) {
        console.error('Error loading rules:', err);
      } finally {
        setIsLoadingRules(false);
      }
    };
    loadRulesAndCategories();
  }, [initialRuleId]);

  // When selected rule changes, load its versions
  useEffect(() => {
    if (selectedRuleId) {
      const r = rules.find(x => x.id === selectedRuleId);
      if (r) {
        setEffectiveDateOverride(r.effective_from || '');
      }
      api.getRuleVersions(selectedRuleId)
        .then(res => setRuleVersions(res.versions || []))
        .catch(() => setRuleVersions([]));
    }
  }, [selectedRuleId, rules]);

  // Run Impact Analysis Action
  const handleRunSimulation = async () => {
    if (!selectedRuleId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getRuleImpact(selectedRuleId, undefined, effectiveDateOverride || undefined);
      setImpactResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate regulatory impact.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRule = rules.find(r => r.id === selectedRuleId);

  // Filtered Products
  const filteredProducts = (impactResult?.affected_products || []).filter(p => {
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      const b = (p.brand_name || '').toLowerCase();
      const c = (p.commodity_name || '').toLowerCase();
      const m = (p.company_name || '').toLowerCase();
      const code = (p.barcode || '').toLowerCase();
      const cat = (p.category_name || '').toLowerCase();
      if (!b.includes(q) && !c.includes(q) && !m.includes(q) && !code.includes(q) && !cat.includes(q)) {
        return false;
      }
    }
    return true;
  });

  const filteredCompanies = (impactResult?.affected_companies || []).filter(c => {
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.state && c.state.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const filteredPlants = (impactResult?.affected_plants || []).filter(pl => {
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      return (
        pl.name.toLowerCase().includes(q) ||
        pl.plant_code.toLowerCase().includes(q) ||
        (pl.company_name && pl.company_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const filteredAudits = (impactResult?.affected_audits || []).filter(a => {
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      return (
        a.case_number.toLowerCase().includes(q) ||
        (a.product_name && a.product_name.toLowerCase().includes(q)) ||
        (a.company_name && a.company_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span>Governance & Regulatory Planning Engine</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Regulatory Impact Simulator
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Evaluate the potential effect of a regulatory rule or rule version on existing products and upcoming inspections. Forward-looking deterministic scope discovery across commodity category trees.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToRule && selectedRuleId && (
            <button
              onClick={() => onNavigateToRule(selectedRuleId)}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>View Rule in Rule Book</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Statutory Governance Boundary Banner */}
      <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900 shadow-2xs">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Statutory Governance Boundary:</span> This simulation identifies potentially affected products, manufacturing plants, and active/upcoming audits requiring verification under the selected rule version. It does <strong className="font-semibold">not</strong> automatically declare products non-compliant or modify audit records.
        </div>
      </div>

      {/* 3. Rule Selection & Simulation Control Workspace */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span>Rule Configuration & Scope Target</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-medium">Source: Official PackSure Rule Book</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Rule Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Statutory Rule
            </label>
            <select
              value={selectedRuleId || ''}
              onChange={(e) => setSelectedRuleId(Number(e.target.value))}
              disabled={isLoadingRules}
              className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              {rules.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.rule_code} — {r.title}
                </option>
              ))}
            </select>
          </div>

          {/* Rule Version */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Rule Version
            </label>
            <select
              value={selectedVersionId}
              onChange={(e) => setSelectedVersionId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="CURRENT">
                {selectedRule?.version || 'Active Version'} (Effective {selectedRule?.effective_from || 'Current'})
              </option>
              {ruleVersions.map((v) => (
                <option key={v.id} value={String(v.id)}>
                  Version {v.version} — {v.amendment_title || 'Amendment'} (Eff: {v.effective_from})
                </option>
              ))}
            </select>
          </div>

          {/* Effective Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Effective Date Scope
            </label>
            <input
              type="date"
              value={effectiveDateOverride}
              onChange={(e) => setEffectiveDateOverride(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-semibold border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Read-only Rule Summary Card */}
        {selectedRule && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Statutory Citation</span>
                <div className="font-bold text-indigo-950 mt-0.5">{selectedRule.statutory_citation}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Government Authority</span>
                <div className="font-bold text-slate-800 mt-0.5">{selectedRule.government_authority || 'Ministry of Consumer Affairs'}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Validation Logic</span>
                <div className="font-mono text-slate-700 mt-0.5">{selectedRule.validation_logic_type}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Category Scope</span>
                <div className="font-bold text-slate-800 mt-0.5">{selectedRule.categories_count || 'Category-Specific'} Category Trees</div>
              </div>
            </div>
            <p className="text-slate-600 text-[11px] pt-1 leading-relaxed">
              {selectedRule.description}
            </p>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-500 font-medium">
            Calculates downstream impact across all registered manufacturers, plants, products, and upcoming audits.
          </div>
          <button
            onClick={handleRunSimulation}
            disabled={isLoading || !selectedRuleId}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <RotateCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-white" />
            )}
            <span>Run Impact Analysis</span>
          </button>
        </div>
      </div>

      {/* 4. Simulation Results Workspace */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {isLoading && (
        <div className="p-16 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
          <RotateCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
          <p className="font-bold text-slate-700 text-sm">Evaluating deterministic category applicability...</p>
          <p className="text-slate-400 mt-1">Cross-referencing registered commodities, manufacturing plants, and active audit cases</p>
        </div>
      )}

      {!isLoading && impactResult && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Executive Impact Summary Alert */}
          {impactResult.ai_impact_narrative && (
            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-start gap-3 shadow-2xs">
              <div className="p-2 bg-indigo-600 text-white rounded-xl shrink-0 mt-0.5">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                  Governance Impact Assessment Summary
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {impactResult.ai_impact_narrative}
                </p>
              </div>
            </div>
          )}

          {/* 4 KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Potentially Affected Products */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Potentially Affected Products
                </div>
                <div className="text-3xl font-black text-indigo-900 mt-1">
                  {impactResult.summary.affected_products_count}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">In-scope packaged commodities</div>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
                <Package className="w-6 h-6" />
              </div>
            </div>

            {/* Card 2: Companies (Manufacturers) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Companies
                </div>
                <div className="text-3xl font-black text-teal-700 mt-1">
                  {impactResult.summary.affected_companies_count}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Registered manufacturers</div>
              </div>
              <div className="p-3 bg-teal-50 text-teal-700 rounded-xl">
                <Building2 className="w-6 h-6" />
              </div>
            </div>

            {/* Card 3: Plants */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Plants
                </div>
                <div className="text-3xl font-black text-amber-600 mt-1">
                  {impactResult.summary.affected_plants_count}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Manufacturing facilities</div>
              </div>
              <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
                <Layers className="w-6 h-6" />
              </div>
            </div>

            {/* Card 4: Upcoming Audits */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Upcoming Audits
                </div>
                <div className="text-3xl font-black text-rose-600 mt-1">
                  {impactResult.summary.affected_upcoming_audits_count}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Requiring version alignment</div>
              </div>
              <div className="p-3 bg-rose-50 text-rose-700 rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Category & Company Impact Distributions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Impact Distribution */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Affected Category Trees</span>
                </div>
                <span className="text-[11px] text-slate-400">{impactResult.affected_categories.length} Categories</span>
              </div>

              <div className="space-y-2.5 pt-1">
                {impactResult.affected_categories.map((cat) => (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{cat.name}</span>
                      <span className="font-black text-indigo-900">{cat.products_count} products</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, Math.max(12, (cat.products_count / Math.max(1, impactResult.summary.affected_products_count)) * 100))}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Company / Plant Impact Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  <span>Enterprise Distribution</span>
                </div>
                <span className="text-[11px] text-slate-400">{impactResult.affected_companies.length} Companies</span>
              </div>

              <div className="divide-y divide-slate-100">
                {impactResult.affected_companies.slice(0, 5).map((comp) => (
                  <div key={comp.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{comp.name}</div>
                      <div className="text-[11px] text-slate-400">{comp.city}, {comp.state}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">{comp.products_count} Products</div>
                      <div className="text-[10px] text-slate-400">{comp.plants_count} Facilities</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabbed Detailed Inventory Tables */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Table Navigation & Search */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => { setActiveTab('products'); setTableSearch(''); }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'products'
                      ? 'bg-white text-indigo-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Packaged Products ({filteredProducts.length})
                </button>
                <button
                  onClick={() => { setActiveTab('companies'); setTableSearch(''); }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'companies'
                      ? 'bg-white text-indigo-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Companies ({filteredCompanies.length})
                </button>
                <button
                  onClick={() => { setActiveTab('plants'); setTableSearch(''); }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'plants'
                      ? 'bg-white text-indigo-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Plants ({filteredPlants.length})
                </button>
                <button
                  onClick={() => { setActiveTab('audits'); setTableSearch(''); }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'audits'
                      ? 'bg-white text-indigo-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Upcoming Audits ({filteredAudits.length})
                </button>
              </div>

              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Search in results..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              {activeTab === 'products' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <th className="p-3.5">Product Name</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Company</th>
                      <th className="p-3.5">Barcode</th>
                      <th className="p-3.5">Net Qty / MRP</th>
                      <th className="p-3.5">Potential Impact Assessment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          No matching packaged commodities in scope.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => {
                        const status = p.impact_status || 'PENDING_VERIFICATION';
                        const isExempt = status === 'CONDITIONALLY_EXEMPT';
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/80">
                            <td className="p-3.5 font-bold text-slate-900">
                              <div>{p.brand_name}</div>
                              <div className="text-[11px] text-slate-500 font-normal">{p.commodity_name}</div>
                            </td>
                            <td className="p-3.5 text-slate-700">{p.category_name}</td>
                            <td className="p-3.5 text-slate-800 font-medium">{p.company_name}</td>
                            <td className="p-3.5 font-mono text-slate-500">{p.barcode || 'N/A'}</td>
                            <td className="p-3.5 text-slate-600">
                              {p.default_net_quantity || 'N/A'} • {p.default_mrp ? `₹${p.default_mrp.toFixed(2)}` : 'N/A'}
                            </td>
                            <td className="p-3.5 max-w-xs">
                              <div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border inline-block ${
                                  isExempt
                                    ? 'bg-slate-100 text-slate-600 border-slate-200'
                                    : status === 'REQUIRES_REINSPECTION'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}>
                                  {isExempt ? 'NO IMPACT IDENTIFIED' : 'POTENTIALLY AFFECTED'}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                                {p.reassessment_reason || 'In regulated category; pending verification against new rule standards.'}
                              </p>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}

              {activeTab === 'companies' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <th className="p-3.5">Company Name</th>
                      <th className="p-3.5">Location</th>
                      <th className="p-3.5 text-center">Affected Products</th>
                      <th className="p-3.5 text-center">Registered Plants</th>
                      <th className="p-3.5">Entity Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCompanies.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">
                          No matching companies in scope.
                        </td>
                      </tr>
                    ) : (
                      filteredCompanies.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/80">
                          <td className="p-3.5 font-bold text-slate-900">
                            <div>{c.name}</div>
                            <div className="text-[11px] text-slate-500 font-normal">{c.legal_entity_name}</div>
                          </td>
                          <td className="p-3.5 text-slate-600">{c.city}, {c.state}</td>
                          <td className="p-3.5 text-center font-bold text-indigo-900">{c.products_count}</td>
                          <td className="p-3.5 text-center font-bold text-teal-700">{c.plants_count}</td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.is_importer ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {c.is_importer ? 'Importer' : 'Manufacturer'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {activeTab === 'plants' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <th className="p-3.5">Plant Facility</th>
                      <th className="p-3.5">Company</th>
                      <th className="p-3.5">Jurisdiction</th>
                      <th className="p-3.5">Location</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPlants.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">
                          No matching plant facilities.
                        </td>
                      </tr>
                    ) : (
                      filteredPlants.map((pl) => (
                        <tr key={pl.id} className="hover:bg-slate-50/80">
                          <td className="p-3.5 font-bold text-slate-900">
                            <div>{pl.name}</div>
                            <div className="text-[11px] font-mono text-slate-400">{pl.plant_code}</div>
                          </td>
                          <td className="p-3.5 text-slate-700 font-medium">{pl.company_name}</td>
                          <td className="p-3.5 text-slate-600">{pl.jurisdiction_name || 'Unassigned'}</td>
                          <td className="p-3.5 text-slate-600">{pl.city}, {pl.state}</td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              pl.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {pl.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {activeTab === 'audits' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <th className="p-3.5">Audit Case Number</th>
                      <th className="p-3.5">Target Product</th>
                      <th className="p-3.5">Company</th>
                      <th className="p-3.5">Assigned Inspector</th>
                      <th className="p-3.5">Audit Lifecycle</th>
                      <th className="p-3.5">Simulation Finding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAudits.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          No active or upcoming audits in scope for this rule.
                        </td>
                      </tr>
                    ) : (
                      filteredAudits.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50/80">
                          <td className="p-3.5 font-mono font-bold text-indigo-900">{a.case_number}</td>
                          <td className="p-3.5 font-bold text-slate-900">{a.product_name}</td>
                          <td className="p-3.5 text-slate-700">{a.company_name}</td>
                          <td className="p-3.5 text-slate-600">{a.inspector_name || 'Unassigned'}</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {a.status}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              POTENTIALLY AFFECTED
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
