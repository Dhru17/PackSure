import React from 'react';
import { X, FileText, User, Calendar, Shield } from 'lucide-react';
import type { AuditLog } from '../../../../types';

interface AuditDiffDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  log: AuditLog | null;
}

export const AuditDiffDrawer: React.FC<AuditDiffDrawerProps> = ({
  isOpen,
  onClose,
  log
}) => {
  if (!isOpen || !log) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200 text-xs">
        {/* Header */}
        <div className="p-5 border-b border-[#D8DDE3] bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#EBF3FA] text-[#174A7E] rounded-xl border border-[#CBD5E1]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#174A7E] bg-white px-2 py-0.5 rounded border border-[#CBD5E1]">
                  LOG #{log.id}
                </span>
                <span className="font-mono text-[10px] font-bold text-[#0369A1] bg-[#E0F2FE] px-2 py-0.5 rounded border border-[#BAE6FD]">
                  {log.action_type}
                </span>
              </div>
              <h2 className="text-sm font-bold text-[#1E293B] mt-1">{log.entity_name} #{log.entity_id}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#64748B] hover:text-[#1E293B] hover:bg-[#E2E8F0] rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] space-y-1">
              <span className="text-[10px] text-[#64748B] uppercase font-bold flex items-center gap-1">
                <User className="w-3 h-3 text-[#174A7E]" /> Actor / Officer
              </span>
              <p className="font-bold text-[#1E293B]">{log.user_name || 'System / Auto'}</p>
              <p className="text-[10px] font-mono text-[#64748B]">User ID: {log.user_id || 'N/A'}</p>
            </div>

            <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] space-y-1">
              <span className="text-[10px] text-[#64748B] uppercase font-bold flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#174A7E]" /> Timestamp
              </span>
              <p className="font-bold text-[#1E293B]">{new Date(log.timestamp).toLocaleDateString()}</p>
              <p className="text-[10px] font-mono text-[#64748B]">{new Date(log.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>

          {/* Justification & Notes */}
          <div className="p-4 bg-white rounded-xl border border-[#D8DDE3] space-y-1.5">
            <span className="text-[10px] text-[#64748B] uppercase font-bold block">
              Administrative Justification / Summary
            </span>
            <p className="text-xs text-[#1E293B] leading-relaxed">
              {log.justification || 'System action executed under Legal Metrology compliance framework.'}
            </p>
          </div>

          {/* State Transition Diff */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-[#1E293B] uppercase tracking-wider block">
              Recorded State Transition (Previous &rarr; New)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Previous State */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-[#991B1B] uppercase tracking-wider block">
                  Previous State
                </span>
                <div className="p-3 bg-[#FEF2F2]/50 rounded-xl border border-[#FECACA] font-mono text-[11px] text-[#7F1D1D] overflow-x-auto min-h-[120px]">
                  {log.previous_state ? (
                    <pre className="whitespace-pre-wrap">{JSON.stringify(log.previous_state, null, 2)}</pre>
                  ) : (
                    <span className="italic text-[#991B1B]">None (Initial creation)</span>
                  )}
                </div>
              </div>

              {/* New State */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-[#15803D] uppercase tracking-wider block">
                  New State
                </span>
                <div className="p-3 bg-[#F0FDF4]/50 rounded-xl border border-[#BBF7D0] font-mono text-[11px] text-[#14532D] overflow-x-auto min-h-[120px]">
                  {log.new_state ? (
                    <pre className="whitespace-pre-wrap">{JSON.stringify(log.new_state, null, 2)}</pre>
                  ) : (
                    <span className="italic text-[#15803D]">Deleted / Purged</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Governance Notice */}
          <div className="p-3.5 bg-[#EEF2F6] rounded-xl border border-[#CBD5E1] text-[11px] text-[#334155] flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#174A7E] flex-shrink-0" />
            <span>This log entry is cryptographically sealed and permanently non-editable.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#D8DDE3] bg-[#F8FAFC] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-white hover:bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] rounded-lg font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
