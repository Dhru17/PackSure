import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Calendar, 
  RefreshCw,
  Info
} from 'lucide-react';
import { api } from '../../../services/api';

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type?: string;
  is_read: boolean;
  created_at: string;
  reference_id?: number;
  reference_type?: string;
}

interface CompanyNotificationsViewProps {
  onRefreshBadge?: () => void;
}

export const CompanyNotificationsView: React.FC<CompanyNotificationsViewProps> = ({ onRefreshBadge }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getCompanyNotifications();
      if (res && res.notifications) {
        setNotifications(res.notifications || []);
      }
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
      setError(err?.response?.data?.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.markCompanyNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
      if (onRefreshBadge) onRefreshBadge();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'AUDIT_SCHEDULED':
      case 'AUDIT':
        return <Calendar className="w-5 h-5 text-[#1D4ED8]" />;
      case 'DOCUMENT_REJECTED':
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-[#DC2626]" />;
      case 'DOCUMENT_VERIFIED':
      case 'SUCCESS':
        return <CheckCircle2 className="w-5 h-5 text-[#059669]" />;
      case 'REPORT_FINALIZED':
        return <FileText className="w-5 h-5 text-[#7C3AED]" />;
      default:
        return <Info className="w-5 h-5 text-[#174A7E]" />;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filterUnreadOnly) return !n.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#D8DDE3] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1E293B] flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#174A7E]" />
            Statutory Notifications & System Alerts
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            Real-time compliance alerts, scheduling announcements, and official document status updates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchNotifications}
            disabled={loading}
            className="p-2 text-[#64748B] hover:text-[#174A7E] hover:bg-[#F1F5F9] rounded-xl border border-[#E2E8F0] transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            title="Refresh notifications"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2">
        <button
          onClick={() => setFilterUnreadOnly(false)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            !filterUnreadOnly
              ? 'bg-[#174A7E] text-white'
              : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]'
          }`}
        >
          <span>All Notifications</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            !filterUnreadOnly ? 'bg-white/20 text-white' : 'bg-[#E2E8F0] text-[#475569]'
          }`}>
            {notifications.length}
          </span>
        </button>

        <button
          onClick={() => setFilterUnreadOnly(true)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            filterUnreadOnly
              ? 'bg-[#174A7E] text-white'
              : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]'
          }`}
        >
          <span>Unread Only</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-bold">
              {unreadCount}
            </span>
          )}
        </button>
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
          Loading notifications...
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#D8DDE3] rounded-2xl space-y-3">
          <Bell className="w-12 h-12 text-[#94A3B8] mx-auto opacity-50" />
          <h3 className="text-sm font-bold text-[#1E293B]">
            {filterUnreadOnly ? 'No Unread Notifications' : 'No Notifications Yet'}
          </h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            You're all caught up! Official updates regarding inspections and certificates will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border transition flex items-start gap-4 ${
                !n.is_read
                  ? 'bg-[#F0F7FF] border-[#BFDBFE] shadow-xs'
                  : 'bg-white border-[#D8DDE3] opacity-85 hover:opacity-100'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs flex-shrink-0">
                {getNotificationIcon(n.type)}
              </div>

              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-[#1E293B]">
                      {n.title}
                    </h4>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[#174A7E]" />
                    )}
                  </div>

                  <span className="text-[10px] text-[#64748B] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(n.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <p className="text-xs text-[#475569] leading-relaxed">
                  {n.message}
                </p>

                {!n.is_read && (
                  <div className="pt-2">
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="text-[11px] font-bold text-[#174A7E] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark as read</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
