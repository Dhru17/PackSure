import React, { useState } from 'react';
import { 
  Building2, 
  Factory, 
  Plus, 
  Search, 
  Edit2, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';
import type { Company, Plant, Jurisdiction } from '../../../types';

interface AdminCompaniesViewProps {
  companies: Company[];
  plants: Plant[];
  jurisdictions?: Jurisdiction[];
  onAddCompany: () => void;
  onEditCompany: (company: Company) => void;
  onToggleCompanyStatus: (companyId: number) => void;
  onSelectCompany?: (company: Company) => void;
  onAddPlant: (defaultCompanyId?: number) => void;
  onEditPlant: (plant: Plant) => void;
  onTogglePlantStatus: (plantId: number) => void;
}

export const AdminCompaniesView: React.FC<AdminCompaniesViewProps> = ({
  companies,
  plants,
  onAddCompany,
  onEditCompany,
  onToggleCompanyStatus,
  onAddPlant,
  onEditPlant,
  onTogglePlantStatus
}) => {
  const [subTab, setSubTab] = useState<'companies' | 'plants'>('companies');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [companyFilter, setCompanyFilter] = useState<string>('ALL');

  const filteredCompanies = companies.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.legal_entity_name && c.legal_entity_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.registration_number && c.registration_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.city && c.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.state && c.state.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = 
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && c.is_active) ||
      (statusFilter === 'INACTIVE' && !c.is_active);

    return matchesSearch && matchesStatus;
  });

  const filteredPlants = plants.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.plant_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.company_name && p.company_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.city && p.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.state && p.state.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && p.is_active) ||
      (statusFilter === 'INACTIVE' && !p.is_active);

    const matchesCompany =
      companyFilter === 'ALL' || String(p.company_id) === companyFilter;

    return matchesSearch && matchesStatus && matchesCompany;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* View Header */}
      <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#174A7E]/10 text-[#174A7E] rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">
                Enterprise & Facility Master Data
              </h2>
              <p className="text-xs text-[#64748B]">
                Master registry of manufacturers, packers, importers, and production plants
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {subTab === 'companies' ? (
            <button
              onClick={onAddCompany}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#174A7E] hover:bg-[#123860] rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Register Company</span>
            </button>
          ) : (
            <button
              onClick={() => onAddPlant()}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#174A7E] hover:bg-[#123860] rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Facility / Plant</span>
            </button>
          )}
        </div>
      </div>

      {/* Subtabs Bar */}
      <div className="flex border-b border-[#D8DDE3] gap-4">
        <button
          onClick={() => { setSubTab('companies'); setSearchQuery(''); }}
          className={`flex items-center gap-2 pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            subTab === 'companies'
              ? 'border-[#174A7E] text-[#174A7E]'
              : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Companies & Importers ({companies.length})</span>
        </button>
        <button
          onClick={() => { setSubTab('plants'); setSearchQuery(''); }}
          className={`flex items-center gap-2 pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            subTab === 'plants'
              ? 'border-[#174A7E] text-[#174A7E]'
              : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          <Factory className="w-4 h-4" />
          <span>Manufacturing Plants & Locations ({plants.length})</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#D8DDE3] shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={subTab === 'companies' ? 'Search by name, legal entity, city...' : 'Search by plant code, facility name...'}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {subTab === 'plants' && (
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E] bg-white text-[#475569]"
            >
              <option value="ALL">All Companies</option>
              {companies.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1 p-1 bg-[#F1F5F9] rounded-lg border border-[#E2E8F0]">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-white text-[#174A7E] shadow-xs' : 'text-[#64748B]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                statusFilter === 'ACTIVE' ? 'bg-white text-[#15803D] shadow-xs' : 'text-[#64748B]'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('INACTIVE')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                statusFilter === 'INACTIVE' ? 'bg-white text-[#DC2626] shadow-xs' : 'text-[#64748B]'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-[#D8DDE3] rounded-xl overflow-hidden shadow-xs">
        {subTab === 'companies' ? (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                <th className="p-3.5">Company / Enterprise</th>
                <th className="p-3.5">Registration</th>
                <th className="p-3.5">Headquarters</th>
                <th className="p-3.5 text-center">Plants</th>
                <th className="p-3.5 text-center">Products</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-[#94A3B8]">
                    No companies found matching search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-[#1E293B] text-xs">{c.name}</div>
                      <div className="text-[11px] text-[#64748B] font-normal">{c.legal_entity_name || c.name}</div>
                      {c.is_importer && (
                        <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#F3E8FF] text-[#7E22CE]">
                          Importer
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-[#475569]">
                      {c.registration_number || 'N/A'}
                    </td>
                    <td className="p-3.5 text-[#475569]">
                      <div>{c.city || 'N/A'}, {c.state || ''}</div>
                      {c.contact_email && <div className="text-[10px] text-[#94A3B8]">{c.contact_email}</div>}
                    </td>
                    <td className="p-3.5 text-center font-bold text-[#174A7E]">
                      {c.plants_count ?? 0}
                    </td>
                    <td className="p-3.5 text-center font-bold text-[#0F766E]">
                      {c.products_count ?? 0}
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => onToggleCompanyStatus(c.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                          c.is_active
                            ? 'bg-[#DCFCE7] text-[#15803D] hover:bg-[#BBF7D0]'
                            : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                        }`}
                      >
                        {c.is_active ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => onEditCompany(c)}
                          title="Edit Company"
                          className="p-1.5 text-[#64748B] hover:text-[#174A7E] hover:bg-[#F1F5F9] rounded-md transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onAddPlant(c.id)}
                          title="Add Plant for this Company"
                          className="px-2 py-1 text-[10px] font-bold text-[#174A7E] bg-[#EFF6FF] hover:bg-[#DBEAFE] rounded-md transition-colors cursor-pointer"
                        >
                          + Plant
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                <th className="p-3.5">Facility / Plant</th>
                <th className="p-3.5">Parent Company</th>
                <th className="p-3.5">Statutory Jurisdiction</th>
                <th className="p-3.5">Location</th>
                <th className="p-3.5">Contact Person</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredPlants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-[#94A3B8]">
                    No plants found matching search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredPlants.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-[#1E293B] text-xs">{p.name}</div>
                      <div className="font-mono text-[10px] text-[#64748B]">{p.plant_code}</div>
                    </td>
                    <td className="p-3.5 font-semibold text-[#475569]">
                      {p.company_name}
                    </td>
                    <td className="p-3.5 text-[#475569]">
                      <span className="font-medium text-[#174A7E]">{p.jurisdiction_name || 'Unassigned'}</span>
                      {p.jurisdiction_code && (
                        <div className="text-[10px] text-[#64748B] font-mono">{p.jurisdiction_code}</div>
                      )}
                    </td>
                    <td className="p-3.5 text-[#475569]">
                      <div>{p.city || 'N/A'}, {p.state || ''}</div>
                      {p.pin_code && <div className="text-[10px] text-[#94A3B8]">PIN: {p.pin_code}</div>}
                    </td>
                    <td className="p-3.5 text-[#475569]">
                      <div>{p.contact_person || 'N/A'}</div>
                      {p.contact_email && <div className="text-[10px] text-[#94A3B8]">{p.contact_email}</div>}
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => onTogglePlantStatus(p.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                          p.is_active
                            ? 'bg-[#DCFCE7] text-[#15803D] hover:bg-[#BBF7D0]'
                            : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                        }`}
                      >
                        {p.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => onEditPlant(p)}
                        className="p-1.5 text-[#64748B] hover:text-[#174A7E] hover:bg-[#F1F5F9] rounded-md transition-colors cursor-pointer"
                        title="Edit Plant"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
