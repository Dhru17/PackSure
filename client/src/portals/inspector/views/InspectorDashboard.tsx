import React from 'react';
import type { InspectionCase } from '../../../types';
import { StatusBadge, EmptyState } from '../../../components/ui';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  ArrowRight, 
  AlertTriangle
} from 'lucide-react';

interface InspectorDashboardProps {
  overviewData: {
    workload: {
      total_inspections: number;
      draft_cases: number;
      in_analysis_cases: number;
      awaiting_verification: number;
      submitted_cases: number;
      returned_cases: number;
      finalized_cases: number;
    };
    urgent_actions: any[];
    recent_cases: any[];
  } | null;
  inspectionsList: InspectionCase[];
  onOpenCase: (caseId: number) => void;
  onResumeCase: (caseId: number) => void;
  onViewAllInspections: () => void;
}

export const InspectorDashboard: React.FC<InspectorDashboardProps> = ({
  overviewData,
  inspectionsList,
  onOpenCase,
  onResumeCase,
  onViewAllInspections
}) => {
  // Extract or compute metrics
  const activeCasesCount = overviewData 
    ? (overviewData.workload.draft_cases + overviewData.workload.in_analysis_cases) 
    : inspectionsList.filter(c => ['DRAFT', 'EVIDENCE_PENDING', 'ANALYZING'].includes(c.status)).length;

  const toVerifyCount = overviewData
    ? overviewData.workload.awaiting_verification
    : inspectionsList.filter(c => ['ANALYSIS_COMPLETE', 'INSPECTOR_REVIEW'].includes(c.status)).length;

  const inSeniorReviewCount = overviewData
    ? overviewData.workload.submitted_cases
    : inspectionsList.filter(c => ['SUBMITTED', 'SENIOR_REVIEW'].includes(c.status)).length;

  const returnedCount = overviewData
    ? overviewData.workload.returned_cases
    : inspectionsList.filter(c => c.status === 'RETURNED').length;

  // Filter urgent action cases: Returned, Awaiting Verification, or Drafts
  const actionRequiredCases = inspectionsList.filter(c => 
    c.status === 'RETURNED' || 
    c.status === 'INSPECTOR_REVIEW' || 
    c.status === 'ANALYSIS_COMPLETE' || 
    c.status === 'EVIDENCE_PENDING'
  ).slice(0, 5);

  // Recent inspections (last 5)
  const recentInspections = (overviewData?.recent_cases && overviewData.recent_cases.length > 0)
    ? overviewData.recent_cases.slice(0, 5)
    : inspectionsList.slice(0, 5);

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

  return (
    <div className="space-y-6">
      {/* 4 Compact Telemetry KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 1. Active Cases */}
        <div className="bg-white p-5 rounded-xl border border-[#D8DDE3] shadow-xs flex flex-col justify-between hover:border-[#174A7E] transition-colors">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Cases</span>
            <div className="p-2 bg-[#EBF3FA] text-[#174A7E] rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
              {activeCasesCount}
            </div>
            <div className="text-[11px] text-[#64748B] font-medium mt-1">
              Inspections in progress
            </div>
          </div>
        </div>

        {/* 2. To Verify */}
        <div className="bg-white p-5 rounded-xl border border-[#D8DDE3] shadow-xs flex flex-col justify-between hover:border-[#D97706] transition-colors">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">To Verify</span>
            <div className="p-2 bg-[#FEF3C7] text-[#D97706] rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
              {toVerifyCount}
            </div>
            <div className="text-[11px] text-[#D97706] font-medium mt-1">
              Ready for verification
            </div>
          </div>
        </div>

        {/* 3. In Senior Review */}
        <div className="bg-white p-5 rounded-xl border border-[#D8DDE3] shadow-xs flex flex-col justify-between hover:border-[#2563EB] transition-colors">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">In Senior Review</span>
            <div className="p-2 bg-[#EFF6FF] text-[#2563EB] rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
              {inSeniorReviewCount}
            </div>
            <div className="text-[11px] text-[#64748B] font-medium mt-1">
              Under supervisory review
            </div>
          </div>
        </div>

        {/* 4. Returned */}
        <div className={`p-5 rounded-xl border shadow-xs flex flex-col justify-between transition-colors ${
          returnedCount > 0 
            ? 'bg-[#FEF2F2]/40 border-[#FECACA] hover:border-[#DC2626]' 
            : 'bg-white border-[#D8DDE3]'
        }`}>
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Returned</span>
            <div className="p-2 bg-[#FEE2E2] text-[#DC2626] rounded-lg">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl sm:text-3xl font-extrabold ${returnedCount > 0 ? 'text-[#DC2626]' : 'text-[#1E293B]'}`}>
              {returnedCount}
            </div>
            <div className={`text-[11px] font-medium mt-1 ${returnedCount > 0 ? 'text-[#DC2626]' : 'text-[#64748B]'}`}>
              {returnedCount > 0 ? 'Action required by you' : 'No returned cases'}
            </div>
          </div>
        </div>
      </div>

      {/* Action Required Section */}
      <div className="bg-white rounded-xl border border-[#D8DDE3] shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wide">
              Action Required
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Cases that require your immediate input, verification, or re-inspection
            </p>
          </div>
          {actionRequiredCases.length > 0 && (
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
              {actionRequiredCases.length} pending
            </span>
          )}
        </div>

        {actionRequiredCases.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<CheckCircle2 className="w-6 h-6 text-[#15803D]" />}
              title="All Caught Up"
              description="You have no pending returned cases or urgent verifications requiring action."
            />
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {actionRequiredCases.map((c) => {
              const isReturned = c.status === 'RETURNED';
              const isToVerify = c.status === 'INSPECTOR_REVIEW' || c.status === 'ANALYSIS_COMPLETE';
              const actionLabel = isReturned ? 'Resume' : isToVerify ? 'Review' : 'Open';
              const issueText = isReturned 
                ? (c.senior_remarks || 'Inspection returned for correction by Senior Officer.')
                : isToVerify
                ? 'AI analysis complete. Inspector verification required.'
                : 'Evidence capture incomplete.';

              return (
                <div
                  key={c.id}
                  className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      isReturned ? 'bg-[#FEE2E2] text-[#DC2626]' : 'bg-[#FEF3C7] text-[#D97706]'
                    }`}>
                      {isReturned ? <RotateCcw className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#1E293B]">
                          {c.case_number || `PS-${c.id}`}
                        </span>
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="text-xs text-[#475569] mt-0.5 line-clamp-1 font-medium">
                        {issueText}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <button
                      onClick={() => onResumeCase(c.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                        isReturned
                          ? 'bg-[#DC2626] text-white hover:bg-[#B91C1C]'
                          : 'bg-[#174A7E] text-white hover:bg-[#133E68]'
                      }`}
                    >
                      <span>{actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Inspections Table */}
      <div className="bg-white rounded-xl border border-[#D8DDE3] shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wide">
              Recent Inspections
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Latest inspections recorded across your jurisdiction
            </p>
          </div>
          <button
            onClick={onViewAllInspections}
            className="text-xs font-bold text-[#174A7E] hover:text-[#0F3256] hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentInspections.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<FileText className="w-6 h-6 text-[#94A3B8]" />}
              title="No Recent Inspections"
              description="Start your first legal metrology inspection using the 'New Inspection' button."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1E293B]">
              <thead className="bg-[#F8FAFC] text-[#64748B] font-bold uppercase tracking-wider border-b border-[#E2E8F0] text-[11px]">
                <tr>
                  <th className="px-6 py-3">Case ID</th>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {recentInspections.map((c) => {
                  const caseId = c.id;
                  const caseNumber = c.case_number || `PS-${caseId}`;
                  const productName = c.product_name || c.product?.commodity_name || 'Packaged Commodity';
                  const brandName = c.brand_name || c.product?.brand_name;
                  const dateDisplay = formatDate(c.created_at || c.inspection_date);

                  return (
                    <tr key={caseId} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-3.5 font-bold text-[#1E293B]">
                        {caseNumber}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-[#1E293B]">{productName}</div>
                        {brandName && (
                          <div className="text-[11px] text-[#64748B] font-normal">{brandName}</div>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-6 py-3.5 text-[#64748B] font-medium">
                        {dateDisplay}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => onOpenCase(caseId)}
                          className="px-3 py-1 bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#174A7E] font-bold rounded-md text-xs shadow-2xs transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
