import React from 'react';
import { 
  Clock, 
  AlertTriangle, 
  RotateCcw, 
  CheckCircle, 
  ArrowRight, 
  Gavel
} from 'lucide-react';
import { KpiCard, EmptyState } from '../../../components/ui';

interface SeniorDashboardProps {
  overviewData: any;
  onOpenCase: (caseId: number) => void;
  onViewAllReviews: () => void;
  onViewHistory: () => void;
}

export const SeniorDashboard: React.FC<SeniorDashboardProps> = ({
  overviewData,
  onOpenCase,
  onViewAllReviews,
  onViewHistory
}) => {
  const workload = overviewData?.workload || {
    pending_adjudications: 0,
    high_priority_cases: 0,
    returned_cases: 0,
    today_finalized: 0
  };

  const recentSubmissions = overviewData?.recent_submissions || [];
  const recentDecisions = overviewData?.recent_decisions || [];

  return (
    <div className="space-y-6">
      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Pending Review"
          value={workload.pending_adjudications}
          subtext="Awaiting senior determination"
          icon={<Clock className="w-5 h-5 text-[#B45309]" />}
          variant="warning"
          onClick={onViewAllReviews}
        />
        <KpiCard
          label="High Priority / Violations"
          value={workload.high_priority_cases}
          subtext="Flagged rule breaches"
          icon={<AlertTriangle className="w-5 h-5 text-[#DC2626]" />}
          variant="danger"
          onClick={onViewAllReviews}
        />
        <KpiCard
          label="Returned to Inspector"
          value={workload.returned_cases}
          subtext="Remanded for re-inspection"
          icon={<RotateCcw className="w-5 h-5 text-[#C2410C]" />}
          variant="warning"
          onClick={onViewAllReviews}
        />
        <KpiCard
          label="Finalized Determinations"
          value={workload.today_finalized}
          subtext="Completed supervisory reviews"
          icon={<CheckCircle className="w-5 h-5 text-[#16A34A]" />}
          variant="success"
          onClick={onViewHistory}
        />
      </div>

      {/* Main Content Grid: Action Required & Recent Decisions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Action Required (Pending Reviews) */}
        <div className="lg:col-span-7 bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#EBF3FA] text-[#174A7E] rounded-lg">
                <Clock className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                Action Required &bull; Pending Inspections
              </h2>
            </div>
            <button
              onClick={onViewAllReviews}
              className="text-xs text-[#174A7E] hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>View All Queue ({workload.pending_adjudications})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentSubmissions.length === 0 ? (
              <EmptyState
                title="Review Queue Clear"
                description="No inspections currently awaiting supervisory determination."
              />
            ) : (
              recentSubmissions.map((c: any) => (
                <div
                  key={c.id}
                  className="p-3.5 bg-[#F8F9FA] hover:bg-[#F1F5F9] border border-[#D8DDE3] hover:border-[#174A7E] rounded-xl transition flex items-center justify-between group shadow-2xs cursor-pointer"
                  onClick={() => onOpenCase(c.id)}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#174A7E] bg-[#EBF3FA] px-2 py-0.5 rounded border border-[#CBD5E1]">
                        {c.case_number}
                      </span>
                      <span className="text-xs font-bold text-[#1E293B]">{c.brand_name}</span>
                      <span className="text-[11px] text-[#64748B]">({c.commodity_name})</span>
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      Inspector: <strong className="text-[#334155]">{c.inspector_name}</strong> &bull; Submitted: {new Date(c.submitted_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      c.failed_checks > 0
                        ? 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                        : 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                    }`}>
                      {c.failed_checks > 0 ? `${c.failed_checks} Violations` : 'Clean Scan'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenCase(c.id);
                      }}
                      className="px-3 py-1.5 bg-[#174A7E] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs hover:bg-[#0F3B66] transition cursor-pointer"
                    >
                      <span>Review &rarr;</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Recent Supervisory Decisions Log */}
        <div className="lg:col-span-5 bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#EBF3FA] text-[#174A7E] rounded-lg">
                <Gavel className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                Recent Supervisory Determinations
              </h2>
            </div>
            <button
              onClick={onViewHistory}
              className="text-xs text-[#174A7E] hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentDecisions.length === 0 ? (
              <div className="p-8 text-center text-[#94A3B8] text-xs bg-[#F8F9FA] rounded-xl border border-[#E2E8F0]">
                No determinations issued in the current cycle yet.
              </div>
            ) : (
              recentDecisions.map((d: any) => (
                <div key={d.id} className="p-3 bg-[#F8F9FA] border border-[#D8DDE3] rounded-xl space-y-1.5 text-xs shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#174A7E]">{d.case_number}</span>
                    <span className="font-bold text-[10px] text-[#64748B]">
                      {d.timestamp ? new Date(d.timestamp).toLocaleTimeString() : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#1E293B] font-semibold">{d.brand_name}</span>
                    <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                      d.action === 'APPROVE_FINAL' || d.action === 'APPROVE_COMPLIANT'
                        ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                        : d.action === 'RETURN_FOR_REINSPECTION'
                        ? 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]'
                        : 'bg-[#EEF2FF] text-[#4338CA] border-[#C7D2FE]'
                    }`}>
                      {d.action}
                    </span>
                  </div>
                  {d.remarks && (
                    <p className="text-[11px] text-[#64748B] italic line-clamp-1 border-t border-[#E2E8F0] pt-1">
                      &ldquo;{d.remarks}&rdquo;
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
