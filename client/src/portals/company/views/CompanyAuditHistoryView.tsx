import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  ChevronRight, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Building2, 
  Calendar, 
  RefreshCw,
  Eye,
  Package
} from 'lucide-react';
import { api } from '../../../services/api';
import type { CompanyNavTab } from '../components/CompanySidebar';

interface AuditHistoryItem {
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
  completed_date?: string;
  finalized_at?: string;
  created_at?: string;
  status: string;
  compliance_status?: string;
  compliance_score?: number;
  assigned_officer?: string;
  senior_adjudicator?: string;
  items_inspected_count?: number;
  has_report?: boolean;
}

interface CompanyAuditHistoryViewProps {
  onSelectAudit: (auditId: number) => void;
  onSelectProduct?: (productId: number) => void;
  onNavigateTab?: (tab: CompanyNavTab) => void;
}

export const CompanyAuditHistoryView: React.FC<CompanyAuditHistoryViewProps> = ({ 
  onSelectAudit,
  onSelectProduct,
  onNavigateTab
}) => {
  const [audits, setAudits] = useState<AuditHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const fetchAuditHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getCompanyAudits();
      if (res && res.audits) {
        setAudits(res.audits || []);
      }
    } catch (err: any) {
      console.error('Failed to load audit history:', err);
      setError(err?.response?.data?.message || 'Failed to load audit history records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditHistory();
  }, []);

  const filteredAudits = audits.filter((a) => {
    const matchSearch =
      a.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.facility_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.facility_city?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'FINALIZED' && (a.status === 'FINALIZED' || a.status === 'COMPLETED')) ||
      (filterStatus === 'COMPLIANT' && a.compliance_status === 'COMPLIANT') ||
      (filterStatus === 'NON_COMPLIANT' && (a.compliance_status === 'NON_COMPLIANT' || a.compliance_status === 'DEFICIENT')) ||
      (filterStatus === 'UNDER_REVIEW' && (a.status === 'UNDER_REVIEW' || a.status === 'SUBMITTED'));

    return matchSearch && matchStatus;
  });

  const getComplianceBadge = (complianceStatus?: string, score?: number) => {
    if (complianceStatus === 'COMPLIANT') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Compliant {score !== undefined ? `(${score}%)` : ''}
        </span>
      );
    }
    if (complianceStatus === 'NON_COMPLIANT' || complianceStatus === 'DEFICIENT') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
          <XCircle className="w-3.5 h-3.5" />
          Non-Compliant {score !== undefined ? `(${score}%)` : ''}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]">
        <Clock className="w-3.5 h-3.5" />
        {complianceStatus ? complianceStatus.replace('_', ' ') : 'Under Adjudication'}
      </span>
    );
  };

  const handleDownloadPdf = (e: React.MouseEvent, caseNumber: string) => {
    e.stopPropagation();
    const url = api.getCompanyReportDownloadUrl(caseNumber);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#D8DDE3] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1E293B] flex items-center gap-2">
            <History className="w-6 h-6 text-[#174A7E]" />
            Inspection Records & Statutory History
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            Official archival of finalized Legal Metrology inspections, compliance scorecards, and signed inspection reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('products')}
              className="p-2 text-[#174A7E] hover:bg-[#EFF6FF] rounded-xl border border-[#BFDBFE] transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="View Registered Product Catalog"
            >
              <Package className="w-4 h-4 text-[#174A7E]" />
              <span className="hidden sm:inline">Product Catalog</span>
            </button>
          )}
          <button
            onClick={fetchAuditHistory}
            disabled={loading}
            className="p-2 text-[#64748B] hover:text-[#174A7E] hover:bg-[#F1F5F9] rounded-xl border border-[#E2E8F0] transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            title="Refresh history"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-[#D8DDE3] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by case number, facility or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#1E293B] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#174A7E] transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-[#64748B]" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E] cursor-pointer w-full md:w-48"
          >
            <option value="ALL">All Outcomes</option>
            <option value="FINALIZED">Finalized Records</option>
            <option value="COMPLIANT">Fully Compliant</option>
            <option value="NON_COMPLIANT">Non-Compliant / Actions</option>
            <option value="UNDER_REVIEW">Under Review</option>
          </select>
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
          Loading statutory audit records...
        </div>
      ) : filteredAudits.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#D8DDE3] rounded-2xl space-y-3">
          <History className="w-12 h-12 text-[#94A3B8] mx-auto opacity-50" />
          <h3 className="text-sm font-bold text-[#1E293B]">No Inspection History Found</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            {searchTerm || filterStatus !== 'ALL'
              ? 'No audit records match your selected filter criteria.'
              : 'There are no past inspection records registered for your enterprise.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAudits.map((a) => {
            const productLabel = a.commodity_name || 'Packaged Commodity';
            const plantLabel = a.plant_name || a.facility_name || 'Designated Facility';

            return (
              <div
                key={a.id}
                onClick={() => onSelectAudit(a.id)}
                className="bg-white border border-[#D8DDE3] hover:border-[#174A7E] rounded-2xl p-5 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono font-bold text-sm text-[#174A7E] group-hover:underline">
                      {a.case_number}
                    </span>
                    {getComplianceBadge(a.compliance_status, a.compliance_score)}
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#F8FAFC] text-[#475569] rounded-md border border-[#E2E8F0]">
                      Status: {a.status.replace('_', ' ')}
                    </span>
                    {a.category_name && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#F1F5F9] text-[#475569] rounded-md border border-[#E2E8F0]">
                        {a.category_name}
                      </span>
                    )}
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

                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E293B]">
                      <Building2 className="w-4 h-4 text-[#64748B]" />
                      <span>{plantLabel}</span>
                      {(a.facility_city || a.facility_state) && (
                        <span className="text-[#64748B] font-normal">
                          ({[a.facility_city, a.facility_state].filter(Boolean).join(', ')})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B]">
                    {(() => {
                      const auditDate = a.completed_date || a.finalized_at || a.scheduled_date || a.created_at;
                      return (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          Date: {auditDate ? new Date(auditDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </span>
                      );
                    })()}
                    {a.items_inspected_count !== undefined && (
                      <span>
                        Samples Tested: <strong className="text-[#1E293B]">{a.items_inspected_count}</strong>
                      </span>
                    )}
                    {a.assigned_officer && (
                      <span>
                        Officer: <span className="font-semibold text-[#1E293B]">{a.assigned_officer}</span>
                      </span>
                    )}
                  </div>
                </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 self-end md:self-center flex-shrink-0">
                {a.status === 'FINALIZED' && (
                  <button
                    onClick={(e) => handleDownloadPdf(e, a.case_number || String(a.id))}
                    className="px-3 py-2 bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#059669] border border-[#A7F3D0] rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    title="Download Official Inspection Report PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                )}

                <button
                  type="button"
                  className="px-3.5 py-2 bg-[#F8FAFC] group-hover:bg-[#174A7E] group-hover:text-white text-[#174A7E] border border-[#CBD5E1] group-hover:border-[#174A7E] rounded-xl text-xs font-bold transition flex items-center gap-1"
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
