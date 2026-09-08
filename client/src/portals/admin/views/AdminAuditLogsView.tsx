import React, { useState } from 'react';
import { 
  Eye, 
  RefreshCw 
} from 'lucide-react';
import type { AuditLog } from '../../../types';
import { FilterBar, EmptyState } from '../../../components/ui';

interface AdminAuditLogsViewProps {
  auditLogs: AuditLog[];
  onOpenDiff: (log: AuditLog) => void;
  onRefresh: () => void;
}

export const AdminAuditLogsView: React.FC<AdminAuditLogsViewProps> = ({
  auditLogs,
  onOpenDiff,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const filteredLogs = auditLogs.filter(log => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchActor = log.user_name?.toLowerCase().includes(q);
      const matchAction = log.action_type.toLowerCase().includes(q);
      const matchEntity = log.entity_name.toLowerCase().includes(q);
      const matchJust = log.justification?.toLowerCase().includes(q);
      if (!matchActor && !matchAction && !matchEntity && !matchJust) return false;
    }
    if (actionFilter !== 'ALL' && log.action_type !== actionFilter) return false;
    return true;
  });

  return (
    <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <h2 className="text-base font-bold text-[#1E293B]">Immutable Statutory Audit Trail</h2>
          <p className="text-xs text-[#64748B]">Cryptographically verifiable forensic trail of all administrative actions and determinations</p>
        </div>

        <button
          onClick={onRefresh}
          className="px-3.5 py-2 bg-white hover:bg-[#F8FAFC] text-[#1E293B] rounded-lg text-xs font-bold border border-[#CBD5E1] flex items-center gap-1.5 shadow-2xs transition self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by user, action or entity..."
        filters={[
          {
            key: 'actionType',
            value: actionFilter,
            onChange: setActionFilter,
            options: [
              { value: 'ALL', label: 'All Actions' },
              { value: 'USER_MODIFIED', label: 'User Modified' },
              { value: 'RULE_MODIFIED', label: 'Rule Modified' },
              { value: 'CATEGORY_MODIFIED', label: 'Category Modified' },
              { value: 'REVIEW_SUBMITTED', label: 'Review Submitted' },
              { value: 'SENIOR_ACTION', label: 'Senior Determination' },
              { value: 'CASE_CREATED', label: 'Case Created' }
            ]
          }
        ]}
        onClearFilters={() => {
          setSearchQuery('');
          setActionFilter('ALL');
        }}
      />

      {/* Audit Logs Table */}
      {filteredLogs.length === 0 ? (
        <EmptyState
          title="No Audit Records Found"
          description="No statutory events match your search query or filter criteria."
        />
      ) : (
        <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl">
          <table className="w-full text-left text-xs text-[#1E293B]">
            <thead className="bg-[#F8F9FA] text-[#475569] font-bold border-b border-[#E2E8F0]">
              <tr>
                <th className="p-3.5">Date & Time</th>
                <th className="p-3.5">User / Actor</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Target Entity</th>
                <th className="p-3.5">Short Description</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] bg-white">
              {filteredLogs.map((log) => (
                <tr 
                  key={log.id} 
                  className="hover:bg-[#F8FAFC] transition cursor-pointer"
                  onClick={() => onOpenDiff(log)}
                >
                  <td className="p-3.5 font-mono text-[#64748B] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-3.5 font-bold text-[#1E293B]">
                    {log.user_name || 'System Auto'}
                  </td>
                  <td className="p-3.5">
                    <span className="font-mono text-[10px] font-bold text-[#0369A1] bg-[#E0F2FE] px-2 py-0.5 rounded border border-[#BAE6FD]">
                      {log.action_type}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-[#174A7E] font-semibold">
                    {log.entity_name} #{log.entity_id}
                  </td>
                  <td className="p-3.5 text-[#475569] max-w-xs truncate">
                    {log.justification || 'Administrative action recorded.'}
                  </td>
                  <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onOpenDiff(log)}
                      className="px-3 py-1.5 bg-white hover:bg-[#F1F5F9] text-[#174A7E] rounded-lg border border-[#CBD5E1] font-bold text-xs shadow-2xs transition inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
