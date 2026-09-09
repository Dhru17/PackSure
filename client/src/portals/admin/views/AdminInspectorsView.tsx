import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Settings2, 
  AlertCircle,
  Plus
} from 'lucide-react';
import type { User, ProductCategory, Jurisdiction } from '../../../types';

interface AdminInspectorsViewProps {
  inspectors: User[];
  categories: ProductCategory[];
  jurisdictions: Jurisdiction[];
  onConfigureEligibility: (inspector: User) => void;
  onAddInspectorUser: () => void;
}

export const AdminInspectorsView: React.FC<AdminInspectorsViewProps> = ({
  inspectors,
  categories,
  jurisdictions,
  onConfigureEligibility,
  onAddInspectorUser
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('ALL');
  const [selectedJurFilter, setSelectedJurFilter] = useState<string>('ALL');

  const filteredInspectors = inspectors.filter((insp) => {
    const matchesSearch =
      insp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (insp.badge_number && insp.badge_number.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCatFilter === 'ALL' ||
      (insp.category_eligibilities || []).some(
        (ce) => String(ce.category_id) === selectedCatFilter && ce.is_active
      );

    const matchesJurisdiction =
      selectedJurFilter === 'ALL' ||
      (insp.jurisdiction_eligibilities || []).some(
        (je) => String(je.jurisdiction_id) === selectedJurFilter && je.is_active
      );

    return matchesSearch && matchesCategory && matchesJurisdiction;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#174A7E]/10 text-[#174A7E] rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">
                Inspector Eligibility & Qualification Matrix
              </h2>
              <p className="text-xs text-[#64748B]">
                Admin configuration of permanent category certifications and territorial jurisdictions
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onAddInspectorUser}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#174A7E] hover:bg-[#123860] rounded-lg transition-colors cursor-pointer shadow-xs self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Provision Inspector</span>
        </button>
      </div>

      {/* Governance Principle Banner */}
      <div className="p-4 bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl flex items-start gap-3 text-xs text-[#0369A1]">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#0284C7]" />
        <div>
          <span className="font-bold">Operational Separation of Powers:</span> Admin configures the inspector&apos;s permanent qualification profile (Categories and Jurisdictions). During audit scheduling, Senior Officer is restricted to choosing from automatically filtered inspectors who satisfy the target plant&apos;s category and jurisdiction criteria.
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#D8DDE3] shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search inspector by name, email, badge..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCatFilter}
            onChange={(e) => setSelectedCatFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E] bg-white text-[#475569]"
          >
            <option value="ALL">All Certified Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>

          <select
            value={selectedJurFilter}
            onChange={(e) => setSelectedJurFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E] bg-white text-[#475569]"
          >
            <option value="ALL">All Authorized Jurisdictions</option>
            {jurisdictions.map((j) => (
              <option key={j.id} value={String(j.id)}>{j.name} ({j.code})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Inspectors Matrix Table */}
      <div className="bg-white border border-[#D8DDE3] rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
              <th className="p-3.5">Inspector Officer</th>
              <th className="p-3.5">Badge Number</th>
              <th className="p-3.5">Certified Categories</th>
              <th className="p-3.5">Authorized Jurisdictions</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Configure</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {filteredInspectors.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs text-[#94A3B8]">
                  No inspectors found matching criteria.
                </td>
              </tr>
            ) : (
              filteredInspectors.map((insp) => {
                const cats = insp.category_eligibilities || [];
                const jurs = insp.jurisdiction_eligibilities || [];

                return (
                  <tr key={insp.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-[#1E293B] text-xs">{insp.full_name}</div>
                      <div className="text-[11px] text-[#64748B] font-normal">{insp.email}</div>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-[#174A7E] font-semibold">
                      {insp.badge_number || 'Badge N/A'}
                    </td>
                    <td className="p-3.5 max-w-xs">
                      {cats.length === 0 ? (
                        <span className="text-[10px] text-[#94A3B8] italic">No categories certified</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {cats.slice(0, 3).map((c) => (
                            <span
                              key={c.id}
                              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#EFF6FF] text-[#174A7E] border border-[#BFDBFE]"
                            >
                              {c.category_name || c.category_code}
                            </span>
                          ))}
                          {cats.length > 3 && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#F1F5F9] text-[#64748B]">
                              +{cats.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 max-w-xs">
                      {jurs.length === 0 ? (
                        <span className="text-[10px] text-[#94A3B8] italic">No jurisdictions assigned</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {jurs.slice(0, 2).map((j) => (
                            <span
                              key={j.id}
                              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]"
                            >
                              {j.jurisdiction_name || j.jurisdiction_code}
                            </span>
                          ))}
                          {jurs.length > 2 && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#F1F5F9] text-[#64748B]">
                              +{jurs.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          insp.is_active
                            ? 'bg-[#DCFCE7] text-[#15803D]'
                            : 'bg-[#F1F5F9] text-[#64748B]'
                        }`}
                      >
                        {insp.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => onConfigureEligibility(insp)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#174A7E] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] rounded-lg transition-colors cursor-pointer"
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                        <span>Configure</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
