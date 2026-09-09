import React, { useState, useEffect } from 'react';
import { 
  CalendarClock, 
  Search, 
  ChevronRight, 
  MapPin, 
  Calendar, 
  Building2, 
  AlertTriangle,
  RefreshCw,
  Eye,
  FileCheck,
  Package
} from 'lucide-react';
import { api } from '../../../services/api';
import type { CompanyNavTab } from '../components/CompanySidebar';

interface AuditItem {
  id: number;
  case_number: string;
  product_id?: number;
  commodity_name?: string;
  brand_name?: string;
  category_name?: string;
  plant_name?: string;
  audit_type?: string;
  facility_name?: string;
  facility_city?: string;
  facility_state?: string;
  scheduled_date?: string;
  status: string;
  compliance_status?: string;
  compliance_score?: number;
  assigned_officer?: string;
  items_inspected_count?: number;
}

interface CompanyUpcomingAuditsViewProps {
  onSelectAudit: (auditId: number) => void;
  onSelectProduct?: (productId: number) => void;
  onNavigateTab?: (tab: CompanyNavTab) => void;
}

export const CompanyUpcomingAuditsView: React.FC<CompanyUpcomingAuditsViewProps> = ({ 
  onSelectAudit,
  onSelectProduct,
  onNavigateTab
}) => {
  const [audits, setAudits] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUpcomingAudits = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getCompanyAudits();
      if (res && res.audits) {
        setAudits(res.audits || []);
      }
    } catch (err: any) {
      console.error('Failed to load upcoming audits:', err);
      setError(err?.response?.data?.message || 'Failed to load scheduled audits.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpcomingAudits();
  }, []);

  const filteredAudits = audits.filter(a => 
    a.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.commodity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.brand_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.plant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.facility_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.facility_city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
      case 'DRAFT':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
            Scheduled
          </span>
        );
      case 'IN_PROGRESS':
      case 'INSPECTOR_REVIEW':
      case 'ANALYSIS_COMPLETE':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] animate-pulse">
            Inspection Active
          </span>
        );
      case 'RETURNED':
      case 'RETURNED_FOR_CORRECTION':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#FFFBEB] text-[#B45309] border border-[#FCD34D]">
            Action Required
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
            {status.replace('_', ' ')}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#D8DDE3] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1E293B] flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-[#174A7E]" />
            Upcoming & Scheduled Inspections
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            Government Legal Metrology audit schedule for registered manufacturing and packing facilities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('products')}
              className="text-xs font-bold text-[#174A7E] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Registered Products</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={fetchUpcomingAudits}
            disabled={loading}
            className="p-2 text-[#64748B] hover:text-[#174A7E] hover:bg-[#F1F5F9] rounded-xl border border-[#E2E8F0] transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            title="Refresh schedule"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-[#D8DDE3] rounded-2xl p-4 shadow-xs">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by case number, product, facility or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#1E293B] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#174A7E] transition"
          />
        </div>
      </div>

      {/* Content Section */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-[#64748B] bg-white border border-[#D8DDE3] rounded-2xl">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#174A7E] mb-3" />
          Loading inspection schedule...
        </div>
      ) : filteredAudits.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#D8DDE3] rounded-2xl space-y-3">
          <FileCheck className="w-12 h-12 text-[#94A3B8] mx-auto opacity-50" />
          <h3 className="text-sm font-bold text-[#1E293B]">No Scheduled Inspections Found</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            There are currently no pending or upcoming Legal Metrology inspections scheduled for your facilities.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAudits.map((a) => {
            const plantLabel = a.plant_name || a.facility_name || 'Designated Plant';
            const productLabel = a.commodity_name || (a.brand_name ? `Commodity (${a.brand_name})` : 'Packaged Commodity');

            return (
              <div
                key={a.id}
                className="bg-white border border-[#D8DDE3] hover:border-[#174A7E] rounded-2xl p-5 shadow-xs hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span 
                      onClick={() => onSelectAudit(a.id)}
                      className="font-mono font-bold text-sm text-[#174A7E] group-hover:underline cursor-pointer"
                    >
                      #{a.case_number}
                    </span>
                    {getStatusBadge(a.status)}
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#F1F5F9] text-[#475569] rounded-md border border-[#E2E8F0]">
                      {a.category_name || a.audit_type || 'Packaged Commodity'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {/* Clickable Commodity Badge linking to Product */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (a.product_id && onSelectProduct) {
                          onSelectProduct(a.product_id);
                        } else if (onNavigateTab) {
                          onNavigateTab('products');
                        }
                      }}
                      className="font-bold text-[#1E293B] hover:text-[#174A7E] hover:underline flex items-center gap-1.5 cursor-pointer bg-[#F8FAFC] px-2.5 py-1 rounded-lg border border-[#E2E8F0]"
                      title="View Product Specifications"
                    >
                      <Package className="w-3.5 h-3.5 text-[#174A7E]" />
                      <span>{productLabel}</span>
                      {a.brand_name && <span className="font-normal text-[#64748B]">({a.brand_name})</span>}
                    </button>

                    <div className="flex items-center gap-1.5 text-[#64748B] font-medium">
                      <Building2 className="w-3.5 h-3.5 text-[#64748B]" />
                      <span>{plantLabel}</span>
                      {(a.facility_city || a.facility_state) && (
                        <span className="text-[#64748B] font-normal flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {[a.facility_city, a.facility_state].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B]">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#174A7E]" />
                      Audit Date: <strong className="text-[#1E293B]">{a.scheduled_date ? new Date(a.scheduled_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'To be confirmed'}</strong>
                    </span>
                    {a.assigned_officer && (
                      <span className="text-[#64748B]">
                        Designated Inspector: <span className="font-semibold text-[#1E293B]">{a.assigned_officer}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectAudit(a.id)}
                    className="px-4 py-2 bg-[#F8FAFC] group-hover:bg-[#174A7E] group-hover:text-white text-[#174A7E] border border-[#CBD5E1] group-hover:border-[#174A7E] rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
