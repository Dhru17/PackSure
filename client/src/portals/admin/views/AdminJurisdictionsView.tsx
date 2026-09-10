import React, { useState } from 'react';
import { 
  MapPin, 
  Plus, 
  Search, 
  Edit2, 
  Factory, 
  Users 
} from 'lucide-react';
import type { Jurisdiction } from '../../../types';

interface AdminJurisdictionsViewProps {
  jurisdictions: Jurisdiction[];
  onAddJurisdiction: () => void;
  onEditJurisdiction: (jurisdiction: Jurisdiction) => void;
  onToggleJurisdictionStatus: (jurisdictionId: number) => void;
}

export const AdminJurisdictionsView: React.FC<AdminJurisdictionsViewProps> = ({
  jurisdictions,
  onAddJurisdiction,
  onEditJurisdiction,
  onToggleJurisdictionStatus
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('ALL');

  const states = Array.from(new Set(jurisdictions.map((j) => j.state))).filter(Boolean);

  const filteredJurisdictions = jurisdictions.filter((j) => {
    const matchesSearch =
      j.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (j.district && j.district.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (j.description && j.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesState = stateFilter === 'ALL' || j.state === stateFilter;

    return matchesSearch && matchesState;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#174A7E]/10 text-[#174A7E] rounded-lg">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">
                Statutory Jurisdictions Master Data
              </h2>
              <p className="text-xs text-[#64748B]">
                Territorial authority zones used to determine inspector eligibility and plant licensing
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onAddJurisdiction}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#174A7E] hover:bg-[#123860] rounded-lg transition-colors cursor-pointer shadow-xs self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Configure Jurisdiction</span>
        </button>
      </div>

      {/* Search & State Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#D8DDE3] shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search jurisdiction code, zone, state..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E] bg-white text-[#475569]"
          >
            <option value="ALL">All States / UTs</option>
            {states.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Jurisdictions Table */}
      <div className="bg-white border border-[#D8DDE3] rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
              <th className="p-3.5">Jurisdiction Zone</th>
              <th className="p-3.5">Code</th>
              <th className="p-3.5">State / UT</th>
              <th className="p-3.5 text-center">Registered Plants</th>
              <th className="p-3.5 text-center">Qualified Inspectors</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {filteredJurisdictions.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-xs text-[#94A3B8]">
                  No statutory jurisdictions found.
                </td>
              </tr>
            ) : (
              filteredJurisdictions.map((j) => (
                <tr key={j.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="p-3.5 font-semibold text-[#1E293B]">
                    <div>{j.name}</div>
                    {j.district && <div className="text-[11px] text-[#64748B] font-normal">District: {j.district}</div>}
                    {j.description && <div className="text-[10px] text-[#94A3B8] line-clamp-1 mt-0.5">{j.description}</div>}
                  </td>
                  <td className="p-3.5 font-mono font-bold text-[#174A7E]">
                    {j.code}
                  </td>
                  <td className="p-3.5 font-medium text-[#475569]">
                    {j.state}
                  </td>
                  <td className="p-3.5 text-center">
                    <span className="inline-flex items-center gap-1 font-bold text-[#0F766E]">
                      <Factory className="w-3.5 h-3.5" />
                      <span>{j.plants_count ?? 0}</span>
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <span className="inline-flex items-center gap-1 font-bold text-[#174A7E]">
                      <Users className="w-3.5 h-3.5" />
                      <span>{j.inspectors_count ?? 0}</span>
                    </span>
                  </td>
                  <td className="p-3.5">
                    <button
                      onClick={() => onToggleJurisdictionStatus(j.id)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                        j.is_active
                          ? 'bg-[#DCFCE7] text-[#15803D] hover:bg-[#BBF7D0]'
                          : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                      }`}
                    >
                      {j.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => onEditJurisdiction(j)}
                      className="p-1.5 text-[#64748B] hover:text-[#174A7E] hover:bg-[#F1F5F9] rounded-md transition-colors cursor-pointer"
                      title="Edit Jurisdiction"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
