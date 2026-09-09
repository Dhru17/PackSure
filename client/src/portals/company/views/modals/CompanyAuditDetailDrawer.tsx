import React, { useState, useEffect } from 'react';
import { api } from '../../../../services/api';
import { 
  X, 
  CalendarClock, 
  FileCheck2, 
  Download, 
  RotateCcw,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface CompanyAuditDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  auditId?: number | null;
  audit?: any | null;
}

export const CompanyAuditDetailDrawer: React.FC<CompanyAuditDetailDrawerProps> = ({
  isOpen,
  onClose,
  auditId,
  audit: initialAudit
}) => {
  const [fetchedAudit, setFetchedAudit] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && auditId && !initialAudit) {
      setLoading(true);
      api.getCompanyAuditDetail(auditId)
        .then((res) => setFetchedAudit(res.audit || res.data || res))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setFetchedAudit(null);
    }
  }, [isOpen, auditId, initialAudit]);

  const a = initialAudit || fetchedAudit;

  if (!isOpen) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'DRAFT':
      case 'EVIDENCE_PENDING':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]">Scheduled</span>;
      case 'ANALYZING':
      case 'ANALYSIS_COMPLETE':
      case 'INSPECTOR_REVIEW':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#FEF3C7]">Inspection In Progress</span>;
      case 'SUBMITTED':
      case 'SENIOR_REVIEW':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-[#F5F3FF] text-[#6B21A8] border border-[#DDD6FE]">Under Supervisory Review</span>;
      case 'RETURNED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">Returned for Re-inspection</span>;
      case 'FINALIZED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7]">Finalized</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]">{st}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-[#D8DDE3] animate-in slide-in-from-right duration-200">
        {loading || !a ? (
          <div className="p-12 text-center text-xs text-[#64748B] flex-1 flex flex-col items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-[#174A7E] mb-2" />
            <span>Loading inspection audit details...</span>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#EBF3FA] text-[#174A7E] rounded-xl border border-[#CBD5E1]">
                  <CalendarClock className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[#1E293B]">
                      Inspection Audit #{a.case_number || a.id}
                    </h2>
                    {getStatusBadge(a.status)}
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Scheduled / Logged on {formatDate(a.scheduled_date || a.created_at)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-[#64748B] hover:text-[#1E293B] hover:bg-[#E2E8F0] rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Returned Alert for Company */}
          {a.status === 'RETURNED' && (
            <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xl space-y-2 text-[#991B1B]">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                <RotateCcw className="w-4 h-4 text-[#DC2626]" />
                <span>Supervisory Return Directive (Cycle {a.review_cycle || 1})</span>
              </div>
              <p className="text-xs leading-relaxed italic bg-white p-3 rounded-lg border border-[#FECACA]">
                &ldquo;{a.company_action_required || 'Additional documentation and physical clarification required by Senior Officer.'}&rdquo;
              </p>
            </div>
          )}

          {/* Audit Specifications Card */}
          <div className="bg-[#F8FAFC] border border-[#D8DDE3] rounded-xl p-5 space-y-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Audit Target Details</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-[#64748B] block text-[11px]">Commodity / Product:</span>
                <span className="font-bold text-[#1E293B] text-xs">
                  {a.product?.commodity_name || a.commodity_name || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[11px]">Brand Name:</span>
                <span className="font-bold text-[#1E293B] text-xs">
                  {a.product?.brand_name || a.brand_name || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[11px]">Category:</span>
                <span className="font-bold text-[#1E293B] text-xs">
                  {a.category_name || a.product?.category_name || 'General Commodity'}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[11px]">Manufacturing Facility:</span>
                <span className="font-bold text-[#1E293B] text-xs">{a.plant_name || 'Registered Unit'}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[11px]">Applicable Rule Version:</span>
                <span className="font-mono font-bold text-[#174A7E] text-xs">{a.rule_version || 'v2026.2_GSR312E'}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[11px]">Review Cycle:</span>
                <span className="font-bold text-[#1E293B] text-xs">Cycle {a.review_cycle || 1}</span>
              </div>
            </div>
          </div>

          {/* Final Outcome if Finalized */}
          {a.status === 'FINALIZED' && (
            <div className="p-5 bg-white border border-[#D8DDE3] rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-[#1E293B]">
                  <ShieldCheck className="w-4 h-4 text-[#174A7E]" />
                  <span>Official Final Adjudication</span>
                </div>
                <span className={`px-3 py-1 rounded-full font-extrabold text-xs border ${
                  a.final_decision === 'COMPLIANT' 
                    ? 'bg-[#F0FDF4] text-[#15803D] border-[#DCFCE7]' 
                    : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                }`}>
                  {a.final_decision || 'COMPLIANT'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center py-2 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                <div>
                  <span className="text-[#64748B] text-[10px] block uppercase font-bold">Compliance Score</span>
                  <span className="font-extrabold text-base text-[#1E293B]">{a.compliance_score}%</span>
                </div>
                <div>
                  <span className="text-[#64748B] text-[10px] block uppercase font-bold">Passed Checks</span>
                  <span className="font-extrabold text-base text-[#15803D]">{a.passed_checks}</span>
                </div>
                <div>
                  <span className="text-[#64748B] text-[10px] block uppercase font-bold">Violations</span>
                  <span className="font-extrabold text-base text-[#DC2626]">{a.failed_checks}</span>
                </div>
              </div>

              {a.violations && a.violations.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-bold text-[#DC2626] uppercase">Confirmed Statutory Violations:</div>
                  <div className="space-y-1.5">
                    {a.violations.map((v: any) => (
                      <div key={v.id} className="p-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-xs">
                        <div className="font-bold text-[#991B1B]">{v.rule_code} &bull; {v.violation_title}</div>
                        <p className="text-[#7F1D1D] mt-0.5 text-[11px]">{v.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <a
                  href={api.getCompanyReportDownloadUrl(a.case_number || a.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#174A7E] hover:bg-[#133E68] text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Official Legal Metrology Inspection Report (PDF)</span>
                </a>
              </div>
            </div>
          )}

          {/* Statutory Documents Section for this Audit */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-xs uppercase tracking-wider text-[#1E293B] flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#174A7E]" />
                <span>Statutory Certificates & Verification Status</span>
              </div>
            </div>

            <div className="space-y-2">
              {a.documents && a.documents.length > 0 ? (
                a.documents.map((d: any) => (
                  <div key={d.id} className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="font-bold text-xs text-[#1E293B]">{d.title}</div>
                      <div className="text-[11px] text-[#64748B]">
                        {d.document_type} &bull; <span className="font-mono text-[#475569]">{d.document_number}</span>
                      </div>
                      {d.rejection_reason && (
                        <div className="text-[11px] text-[#DC2626] font-medium pt-1">
                          Rejection Reason: {d.rejection_reason}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        d.status === 'VERIFIED'
                          ? 'bg-[#F0FDF4] text-[#15803D] border-[#DCFCE7]'
                          : d.status === 'REJECTED'
                          ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                          : 'bg-[#FFFBEB] text-[#D97706] border-[#FEF3C7]'
                      }`}>
                        {d.status === 'VERIFIED' ? 'Verified ✓' : d.status === 'REJECTED' ? 'Rejected ✕' : 'Pending Verification ⏳'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-center text-[#64748B] text-xs">
                  No statutory certificates uploaded for this category/plant yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <span className="text-[11px] text-[#64748B]">
            Legal Metrology Portal &bull; Enterprise View
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#475569] font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
        </>
        )}
      </div>
    </div>
  );
};
