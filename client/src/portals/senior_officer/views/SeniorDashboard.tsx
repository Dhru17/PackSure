import React, { useState } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  RotateCcw, 
  CheckCircle, 
  ArrowRight, 
  Gavel,
  Calendar,
  Sparkles,
  Activity,
  Plus,
  Flame
} from 'lucide-react';
import { KpiCard, EmptyState } from '../../../components/ui';
import { ScheduleAuditModal } from '../components/ScheduleAuditModal';

interface SeniorDashboardProps {
  overviewData: any;
  onOpenCase: (caseId: number) => void;
  onViewAllReviews: () => void;
  onViewHistory: () => void;
  onViewUpcoming?: () => void;
  onViewIntelligence?: () => void;
  onViewSmartPriority?: () => void;
  onRefreshData?: () => void;
  onAuditScheduled?: (newCase: any) => void;
}

export const SeniorDashboard: React.FC<SeniorDashboardProps> = ({
  overviewData,
  onOpenCase,
  onViewAllReviews,
  onViewHistory,
  onViewUpcoming,
  onViewIntelligence,
  onViewSmartPriority,
  onRefreshData,
  onAuditScheduled
}) => {
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const workload = overviewData?.workload || {
    pending_adjudications: 0,
    high_priority_cases: 0,
    returned_cases: 0,
    scheduled_audits: 0,
    active_in_field: 0,
    today_finalized: 0,
    systemic_patterns: 0
  };

  const recentSubmissions = overviewData?.recent_submissions || [];
  const recentDecisions = overviewData?.recent_decisions || [];
  const recentPatterns = overviewData?.recent_patterns || [];

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <span>Executive Legal Metrology Supervisory Console</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Senior Officer Workstation
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Audit planning, inspector eligibility assignment, evidence adjudication, and brand compliance intelligence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onViewSmartPriority && (
            <button
              onClick={onViewSmartPriority}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Flame className="w-4 h-4 text-amber-300" />
              Smart Priority Radar
            </button>
          )}
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Schedule Inspection Audit
          </button>
        </div>
      </div>

      {/* 6 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <KpiCard
          label="Pending Review"
          value={workload.pending_adjudications}
          subtext="Awaiting determination"
          icon={<Clock className="w-4 h-4 text-[#B45309]" />}
          variant="warning"
          onClick={onViewAllReviews}
        />
        <KpiCard
          label="Rule Violations"
          value={workload.high_priority_cases}
          subtext="Flagged statutory breaches"
          icon={<AlertTriangle className="w-4 h-4 text-[#DC2626]" />}
          variant="danger"
          onClick={onViewAllReviews}
        />
        <KpiCard
          label="Returned for Fix"
          value={workload.returned_cases}
          subtext="Remanded for re-inspection"
          icon={<RotateCcw className="w-4 h-4 text-[#C2410C]" />}
          variant="warning"
          onClick={onViewAllReviews}
        />
        <KpiCard
          label="Upcoming Audits"
          value={workload.scheduled_audits}
          subtext="Scheduled plant audits"
          icon={<Calendar className="w-4 h-4 text-indigo-600" />}
          variant="default"
          onClick={onViewUpcoming}
        />
        <KpiCard
          label="In-Field Active"
          value={workload.active_in_field}
          subtext="Inspections under way"
          icon={<Activity className="w-4 h-4 text-emerald-600" />}
          variant="default"
          onClick={onViewUpcoming}
        />
        <KpiCard
          label="Finalized Today"
          value={workload.today_finalized}
          subtext="Adjudications concluded"
          icon={<CheckCircle className="w-4 h-4 text-[#16A34A]" />}
          variant="success"
          onClick={onViewHistory}
        />
      </div>

      {/* Innovation #5 Systemic Intelligence Alert Banner (if patterns detected) */}
      {recentPatterns.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-transparent border border-amber-300/60 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-sm mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Innovation #5 Intelligence Alert
                </span>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                  {workload.systemic_patterns || recentPatterns.length} Active Systemic Patterns
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                {recentPatterns[0]?.title || 'Recurring Multi-Product Packaging Non-Compliance Detected'}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                {recentPatterns[0]?.description}
              </p>
            </div>
          </div>

          <button
            onClick={onViewIntelligence}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 self-start md:self-center whitespace-nowrap cursor-pointer shadow-sm"
          >
            <span>Explore Systemic Patterns</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Content Grid: Action Required & Recent Decisions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Action Required (Pending Reviews) */}
        <div className="lg:col-span-7 bg-white border border-[#D8DDE3] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
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
        <div className="lg:col-span-5 bg-white border border-[#D8DDE3] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
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

      {/* Schedule Audit Modal */}
      <ScheduleAuditModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSuccess={(newCase) => {
          if (onAuditScheduled) {
            onAuditScheduled(newCase);
          } else {
            if (onRefreshData) onRefreshData();
            if (onViewUpcoming) onViewUpcoming();
          }
        }}
      />
    </div>
  );
};
