import React, { useState, useMemo } from 'react';
import type { InspectionCase } from '../../../types';
import { EmptyState } from '../../../components/ui';
import { 
  Bell, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  CheckCheck
} from 'lucide-react';

interface NotificationsViewProps {
  inspections: InspectionCase[];
  onOpenCase: (caseId: number) => void;
  onResumeCase: (caseId: number) => void;
}

interface NotificationItem {
  id: string;
  type: 'RETURNED' | 'VERIFICATION_PENDING' | 'SUBMITTED' | 'APPROVED' | 'SYSTEM';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  caseId?: number;
  actionLabel: string;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  inspections,
  onOpenCase,
  onResumeCase
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'updates'>('all');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // Derive real notifications from actual inspections
  const notifications: NotificationItem[] = useMemo(() => {
    const list: NotificationItem[] = [];

    inspections.forEach((c) => {
      const caseNumber = c.case_number || `PS-${c.id}`;

      if (c.status === 'RETURNED') {
        list.push({
          id: `notif-ret-${c.id}`,
          type: 'RETURNED',
          title: 'Inspection Returned',
          description: `Case ${caseNumber} was returned by Senior Officer for reinspection: "${c.senior_remarks || 'Clarification required.'}"`,
          timestamp: c.submitted_at || c.created_at,
          isRead: readIds.has(`notif-ret-${c.id}`),
          caseId: c.id,
          actionLabel: 'Resume Reinspection'
        });
      } else if (c.status === 'INSPECTOR_REVIEW' || c.status === 'ANALYSIS_COMPLETE') {
        list.push({
          id: `notif-ver-${c.id}`,
          type: 'VERIFICATION_PENDING',
          title: 'Verification Pending',
          description: `Case ${caseNumber} AI analysis is complete and waiting for your verification.`,
          timestamp: c.created_at,
          isRead: readIds.has(`notif-ver-${c.id}`),
          caseId: c.id,
          actionLabel: 'Verify Findings'
        });
      } else if (c.status === 'SUBMITTED' || c.status === 'SENIOR_REVIEW') {
        list.push({
          id: `notif-sub-${c.id}`,
          type: 'SUBMITTED',
          title: 'Inspection Submitted',
          description: `Case ${caseNumber} was successfully submitted for Senior Officer adjudication.`,
          timestamp: c.submitted_at || c.created_at,
          isRead: readIds.has(`notif-sub-${c.id}`),
          caseId: c.id,
          actionLabel: 'View Case'
        });
      } else if (c.status === 'FINALIZED') {
        list.push({
          id: `notif-fin-${c.id}`,
          type: 'APPROVED',
          title: 'Inspection Finalized',
          description: `Case ${caseNumber} has been reviewed and finalized by Senior Officer.`,
          timestamp: c.finalized_at || c.created_at,
          isRead: readIds.has(`notif-fin-${c.id}`),
          caseId: c.id,
          actionLabel: 'View Report'
        });
      }
    });

    return list;
  }, [inspections, readIds]);

  const handleMarkAllRead = () => {
    const allIds = new Set(notifications.map(n => n.id));
    setReadIds(allIds);
  };

  const handleNotificationClick = (item: NotificationItem) => {
    setReadIds(prev => new Set(prev).add(item.id));
    if (item.caseId) {
      if (item.type === 'RETURNED' || item.type === 'VERIFICATION_PENDING') {
        onResumeCase(item.caseId);
      } else {
        onOpenCase(item.caseId);
      }
    }
  };

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'unread') {
      return notifications.filter(n => !n.isRead);
    }
    if (activeTab === 'updates') {
      return notifications.filter(n => n.type === 'RETURNED' || n.type === 'APPROVED');
    }
    return notifications;
  }, [notifications, activeTab]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return 'Recently';
    try {
      const date = new Date(timeStr);
      const diffMs = Date.now() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return 'Just now';
      if (diffHours === 1) return '1 hour ago';
      if (diffHours < 24) return `${diffHours} hours ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return '1 day ago';
      return `${diffDays} days ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Tabs */}
      <div className="flex items-center justify-between border-b border-[#D8DDE3] bg-white px-6 pt-3 rounded-t-xl shadow-xs">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'all'
                ? 'border-[#174A7E] text-[#174A7E]'
                : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <span>All Notifications</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              activeTab === 'all' ? 'bg-[#EBF3FA] text-[#174A7E]' : 'bg-[#F1F5F9] text-[#64748B]'
            }`}>
              {notifications.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('unread')}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'unread'
                ? 'border-[#174A7E] text-[#174A7E]'
                : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('updates')}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'updates'
                ? 'border-[#174A7E] text-[#174A7E]'
                : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <span>Inspection Updates</span>
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-semibold text-[#174A7E] hover:underline pb-3 flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-[#D8DDE3] shadow-xs overflow-hidden divide-y divide-[#E2E8F0]">
        {filteredNotifications.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={<Bell className="w-6 h-6 text-[#94A3B8]" />}
              title="No Notifications"
              description="You have no notifications in this category."
            />
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const isReturned = n.type === 'RETURNED';
            const isPending = n.type === 'VERIFICATION_PENDING';
            const isApproved = n.type === 'APPROVED';

            return (
              <div
                key={n.id}
                className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-[#F8FAFC] ${
                  !n.isRead ? 'bg-[#F0F7FF]/40' : ''
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Icon */}
                  <div
                    className={`p-2.5 rounded-xl flex-shrink-0 mt-0.5 ${
                      isReturned
                        ? 'bg-[#FEE2E2] text-[#DC2626]'
                        : isPending
                        ? 'bg-[#FEF3C7] text-[#D97706]'
                        : isApproved
                        ? 'bg-[#DCFCE7] text-[#15803D]'
                        : 'bg-[#EFF6FF] text-[#2563EB]'
                    }`}
                  >
                    {isReturned ? (
                      <RotateCcw className="w-5 h-5" />
                    ) : isPending ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : isApproved ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>

                  {/* Content */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xs font-bold text-[#1E293B]">
                        {n.title}
                      </h2>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#174A7E]" />
                      )}
                    </div>
                    <p className="text-xs text-[#475569] mt-1 font-medium leading-relaxed">
                      {n.description}
                    </p>
                    <span className="text-[11px] text-[#94A3B8] font-medium mt-1.5 inline-block">
                      {formatTime(n.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Direct Action */}
                <div className="self-end sm:self-auto flex-shrink-0">
                  <button
                    onClick={() => handleNotificationClick(n)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all ${
                      isReturned
                        ? 'bg-[#DC2626] text-white hover:bg-[#B91C1C]'
                        : 'bg-white border border-[#CBD5E1] text-[#174A7E] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    <span>{n.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
