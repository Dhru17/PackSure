import React, { useState } from 'react';
import { 
  Bell, 
  Clock, 
  AlertTriangle, 
  RotateCcw, 
  ArrowRight
} from 'lucide-react';
import type { InspectionCase } from '../../../types';
import { EmptyState } from '../../../components/ui';

interface SeniorNotificationsViewProps {
  inspections: InspectionCase[];
  onOpenCase: (caseId: number) => void;
}

export const SeniorNotificationsView: React.FC<SeniorNotificationsViewProps> = ({
  inspections,
  onOpenCase
}) => {
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'URGENT'>('ALL');

  // Build notifications from inspection events
  const notifications = inspections.map((item) => {
    const isResubmitted = item.status === 'SENIOR_REVIEW' && !!item.senior_remarks;
    const isReturned = item.status === 'RETURNED';
    const isViolations = item.failed_checks > 0;

    let type: 'NEW_SUBMISSION' | 'RESUBMISSION' | 'VIOLATION' | 'RETURNED' = 'NEW_SUBMISSION';
    let title = `Inspection #${item.case_number} Submitted for Review`;
    let message = `Inspector ${item.inspector_name || 'Officer'} submitted ${item.product?.brand_name} (${item.product?.commodity_name}) with ${item.evidences?.length || 0} evidence surfaces.`;
    let isUrgent = isViolations;

    if (isResubmitted) {
      type = 'RESUBMISSION';
      title = `Case #${item.case_number} Resubmitted after Reinspection`;
      message = `Inspector ${item.inspector_name} addressed previous remarks and resubmitted for determination.`;
    } else if (isReturned) {
      type = 'RETURNED';
      title = `Case #${item.case_number} Remanded for Re-inspection`;
      message = `Case currently with inspector for field revisions.`;
    } else if (isViolations) {
      type = 'VIOLATION';
      title = `Urgent: Violations Flagged on #${item.case_number}`;
      message = `${item.failed_checks} statutory non-compliance items detected on ${item.product?.brand_name}.`;
    }

    return {
      id: item.id,
      caseId: item.id,
      caseNumber: item.case_number,
      type,
      title,
      message,
      isUrgent,
      date: item.created_at,
      status: item.status
    };
  });

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'URGENT') return n.isUrgent;
    if (filter === 'UNREAD') return n.status === 'SUBMITTED' || n.status === 'SENIOR_REVIEW';
    return true;
  });

  return (
    <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#174A7E]" />
            <span>Supervisory Notification Center</span>
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Real-time feed of field submissions, resubmissions, and rule violations
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-[#F8F9FA] p-1 rounded-xl border border-[#D8DDE3]">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              filter === 'ALL' ? 'bg-[#174A7E] text-white shadow-2xs' : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            All Updates ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('UNREAD')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              filter === 'UNREAD' ? 'bg-[#174A7E] text-white shadow-2xs' : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setFilter('URGENT')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              filter === 'URGENT' ? 'bg-[#DC2626] text-white shadow-2xs' : 'text-[#DC2626] hover:bg-[#FEF2F2]'
            }`}
          >
            Urgent Violations
          </button>
        </div>
      </div>

      {/* Notifications Feed */}
      {filteredNotifications.length === 0 ? (
        <EmptyState
          title="No Notifications in this Category"
          description="You are fully up to date with all field events."
        />
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => onOpenCase(notif.caseId)}
              className={`p-4 rounded-xl border transition flex items-start justify-between gap-4 cursor-pointer hover:shadow-xs group ${
                notif.isUrgent
                  ? 'bg-[#FEF2F2]/50 border-[#FECACA] hover:border-[#DC2626]'
                  : 'bg-[#F8F9FA] border-[#D8DDE3] hover:border-[#174A7E]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl mt-0.5 ${
                  notif.type === 'VIOLATION'
                    ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                    : notif.type === 'RESUBMISSION'
                    ? 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]'
                    : 'bg-[#EBF3FA] text-[#174A7E] border border-[#CBD5E1]'
                }`}>
                  {notif.type === 'VIOLATION' ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : notif.type === 'RESUBMISSION' ? (
                    <RotateCcw className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#174A7E] bg-white px-2 py-0.5 rounded border border-[#CBD5E1]">
                      {notif.caseNumber}
                    </span>
                    <h3 className="text-xs font-bold text-[#1E293B] group-hover:text-[#174A7E] transition">
                      {notif.title}
                    </h3>
                  </div>
                  <p className="text-xs text-[#475569] leading-relaxed">{notif.message}</p>
                  <span className="text-[10px] text-[#94A3B8] font-semibold block pt-0.5">
                    {new Date(notif.date).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="px-3 py-1.5 bg-white group-hover:bg-[#174A7E] group-hover:text-white text-[#174A7E] border border-[#CBD5E1] group-hover:border-transparent rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 shadow-2xs transition"
              >
                <span>Open Case</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
