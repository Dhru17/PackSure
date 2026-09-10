import React, { useState, useEffect } from 'react';
import { 
  X, 
  TrendingUp, 
  Search,
  Info
} from 'lucide-react';
import { api } from '../../../../services/api';
import type { RegulatoryRule, RegulatoryImpactResult } from '../../../../types';

interface RuleImpactModalProps {
  isOpen: boolean;
  onClose: () => void;
  rule: RegulatoryRule | null;
}

export const RuleImpactModal: React.FC<RuleImpactModalProps> = ({
  isOpen,
  onClose,
  rule
}) => {
  const [impactResult, setImpactResult] = useState<RegulatoryImpactResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'companies' | 'plants' | 'audits'>('products');
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    if (rule && isOpen) {
      loadImpact(rule.id);
    }
  }, [rule, isOpen]);

  const loadImpact = async (ruleId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getRuleImpact(ruleId);
      setImpactResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate regulatory impact.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !rule) return null;

  const filteredProducts = (impactResult?.affected_products || []).filter(
    (p) =>
      p.brand_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.commodity_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchFilter)) ||
      (p.company_name && p.company_name.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const filteredCompanies = (impactResult?.affected_companies || []).filter(
    (c) =>
      c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (c.city && c.city.toLowerCase().includes(searchFilter.toLowerCase())) ||
      (c.state && c.state.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const filteredPlants = (impactResult?.affected_plants || []).filter(
    (pl) =>
      pl.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      pl.plant_code.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (pl.company_name && pl.company_name.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const filteredAudits = (impactResult?.affected_audits || []).filter(
    (a) =>
      a.case_number.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (a.product_name && a.product_name.toLowerCase().includes(searchFilter.toLowerCase())) ||
      (a.company_name && a.company_name.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-[#D8DDE3] w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#174A7E] text-white rounded-xl shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold bg-[#EFF6FF] text-[#174A7E] border border-[#BFDBFE] rounded-md uppercase tracking-wider">
                  Innovation #9
                </span>
                <h3 className="font-bold text-base text-[#1E293B]">
                  Regulatory Change Impact Simulator
                </h3>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Deterministic scope discovery for <span className="font-semibold text-[#1E293B]">{rule.rule_code}</span> ({rule.version}) • Effective: <span className="font-semibold text-[#1E293B]">{rule.effective_from}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#64748B] hover:text-[#1E293B] hover:bg-[#E2E8F0] rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="px-5 py-3 bg-[#FEF3C7]/60 border-b border-[#FDE68A] flex items-start gap-2.5 text-xs text-[#92400E]">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#D97706]" />
          <div>
            <span className="font-bold">Statutory Governance Boundary:</span> This calculation is deterministic and maps affected enterprise inventory and upcoming audits based on regulatory category trees. It identifies records requiring officer reassessment against the updated rule version; it does not automatically declare products non-compliant.
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-[#64748B]">
              <div className="inline-block w-6 h-6 border-2 border-[#174A7E] border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="font-semibold">Calculating deterministic regulatory impact across repository...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-xs text-[#DC2626]">
              {error}
            </div>
          ) : impactResult ? (
            <>
              {/* Summary Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-center">
                  <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                    Categories
                  </div>
                  <div className="text-2xl font-black text-[#174A7E] mt-1">
                    {impactResult.summary.affected_categories_count}
                  </div>
                  <div className="text-[10px] text-[#64748B] mt-0.5">Applicable Tree</div>
                </div>

                <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-center">
                  <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                    Companies
                  </div>
                  <div className="text-2xl font-black text-[#0F766E] mt-1">
                    {impactResult.summary.affected_companies_count}
                  </div>
                  <div className="text-[10px] text-[#64748B] mt-0.5">Manufacturers</div>
                </div>

                <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-center">
                  <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                    Plants
                  </div>
                  <div className="text-2xl font-black text-[#D97706] mt-1">
                    {impactResult.summary.affected_plants_count}
                  </div>
                  <div className="text-[10px] text-[#64748B] mt-0.5">Facilities</div>
                </div>

                <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-center">
                  <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                    Products
                  </div>
                  <div className="text-2xl font-black text-[#7C3AED] mt-1">
                    {impactResult.summary.affected_products_count}
                  </div>
                  <div className="text-[10px] text-[#64748B] mt-0.5">Packaged Items</div>
                </div>

                <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-center">
                  <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                    Audits
                  </div>
                  <div className="text-2xl font-black text-[#DC2626] mt-1">
                    {impactResult.summary.affected_upcoming_audits_count}
                  </div>
                  <div className="text-[10px] text-[#64748B] mt-0.5">Active / Upcoming</div>
                </div>
              </div>

              {/* Tabs and Search */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5 p-1 bg-[#F1F5F9] rounded-lg border border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('products'); setSearchFilter(''); }}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'products'
                        ? 'bg-white text-[#174A7E] shadow-xs'
                        : 'text-[#64748B] hover:text-[#1E293B]'
                    }`}
                  >
                    Affected Products ({impactResult.affected_products.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('companies'); setSearchFilter(''); }}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'companies'
                        ? 'bg-white text-[#174A7E] shadow-xs'
                        : 'text-[#64748B] hover:text-[#1E293B]'
                    }`}
                  >
                    Companies ({impactResult.affected_companies.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('plants'); setSearchFilter(''); }}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'plants'
                        ? 'bg-white text-[#174A7E] shadow-xs'
                        : 'text-[#64748B] hover:text-[#1E293B]'
                    }`}
                  >
                    Plants ({impactResult.affected_plants.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('audits'); setSearchFilter(''); }}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'audits'
                        ? 'bg-white text-[#174A7E] shadow-xs'
                        : 'text-[#64748B] hover:text-[#1E293B]'
                    }`}
                  >
                    Upcoming Audits ({impactResult.affected_audits.length})
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-[#94A3B8] absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search affected records..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E]"
                  />
                </div>
              </div>

              {/* Table Renderings */}
              <div className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-white shadow-xs">
                {activeTab === 'products' && (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Company</th>
                        <th className="p-3">Barcode</th>
                        <th className="p-3">Net Qty / MRP</th>
                        <th className="p-3">Scope Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-xs text-[#94A3B8]">
                            No matching affected products found.
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((p) => (
                          <tr key={p.id} className="hover:bg-[#F8FAFC]">
                            <td className="p-3 font-semibold text-[#1E293B]">
                              <div>{p.brand_name}</div>
                              <div className="text-[11px] text-[#64748B] font-normal">{p.commodity_name}</div>
                            </td>
                            <td className="p-3 text-[#475569]">{p.category_name}</td>
                            <td className="p-3 text-[#475569] font-medium">{p.company_name}</td>
                            <td className="p-3 font-mono text-[11px] text-[#64748B]">{p.barcode || 'N/A'}</td>
                            <td className="p-3 text-[#475569]">
                              {p.default_net_quantity || 'N/A'} • {p.default_mrp ? `₹${p.default_mrp.toFixed(2)}` : 'N/A'}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                p.impact_status === 'POTENTIALLY_AFFECTED'
                                  ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                                  : 'bg-[#F1F5F9] text-[#64748B]'
                              }`}>
                                {p.impact_status || 'POTENTIALLY_AFFECTED'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'companies' && (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                        <th className="p-3">Company Name</th>
                        <th className="p-3">Location</th>
                        <th className="p-3 text-center">Affected Products</th>
                        <th className="p-3 text-center">Registered Plants</th>
                        <th className="p-3">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {filteredCompanies.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-xs text-[#94A3B8]">
                            No matching companies found.
                          </td>
                        </tr>
                      ) : (
                        filteredCompanies.map((c) => (
                          <tr key={c.id} className="hover:bg-[#F8FAFC]">
                            <td className="p-3 font-semibold text-[#1E293B]">
                              <div>{c.name}</div>
                              <div className="text-[11px] text-[#64748B] font-normal">{c.legal_entity_name}</div>
                            </td>
                            <td className="p-3 text-[#475569]">{c.city}, {c.state}</td>
                            <td className="p-3 text-center font-bold text-[#174A7E]">{c.products_count}</td>
                            <td className="p-3 text-center font-bold text-[#0F766E]">{c.plants_count}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                c.is_importer ? 'bg-[#F3E8FF] text-[#7E22CE]' : 'bg-[#F1F5F9] text-[#475569]'
                              }`}>
                                {c.is_importer ? 'Importer' : 'Domestic Mfr'}
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
                      <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                        <th className="p-3">Plant Facility</th>
                        <th className="p-3">Company</th>
                        <th className="p-3">Jurisdiction</th>
                        <th className="p-3">Location</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {filteredPlants.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-xs text-[#94A3B8]">
                            No matching plants found.
                          </td>
                        </tr>
                      ) : (
                        filteredPlants.map((pl) => (
                          <tr key={pl.id} className="hover:bg-[#F8FAFC]">
                            <td className="p-3 font-semibold text-[#1E293B]">
                              <div>{pl.name}</div>
                              <div className="text-[11px] font-mono text-[#64748B]">{pl.plant_code}</div>
                            </td>
                            <td className="p-3 text-[#475569] font-medium">{pl.company_name}</td>
                            <td className="p-3 text-[#475569]">{pl.jurisdiction_name || 'Unassigned'}</td>
                            <td className="p-3 text-[#475569]">{pl.city}, {pl.state}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                pl.is_active ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#F1F5F9] text-[#64748B]'
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
                      <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                        <th className="p-3">Audit Case Number</th>
                        <th className="p-3">Target Product</th>
                        <th className="p-3">Company</th>
                        <th className="p-3">Assigned Inspector</th>
                        <th className="p-3">Audit Lifecycle</th>
                        <th className="p-3">Regulatory Impact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {filteredAudits.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-xs text-[#94A3B8]">
                            No active or upcoming audits in scope.
                          </td>
                        </tr>
                      ) : (
                        filteredAudits.map((a) => (
                          <tr key={a.id} className="hover:bg-[#F8FAFC]">
                            <td className="p-3 font-mono font-bold text-[#174A7E]">{a.case_number}</td>
                            <td className="p-3 font-semibold text-[#1E293B]">{a.product_name}</td>
                            <td className="p-3 text-[#475569]">{a.company_name}</td>
                            <td className="p-3 text-[#475569]">{a.inspector_name || 'Unassigned'}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                                {a.status}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                                REQUIRES REASSESSMENT
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="text-[11px] text-[#64748B]">
            Regulatory Impact simulation run on: {impactResult?.simulation_timestamp ? new Date(impactResult.simulation_timestamp).toLocaleString() : 'N/A'}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-[#174A7E] hover:bg-[#123860] rounded-lg transition-colors cursor-pointer"
          >
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
};
