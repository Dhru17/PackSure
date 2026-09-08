import React, { useState } from 'react';
import { X, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { User, UserRole } from '../../../../types';

interface ChangeRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onConfirmChangeRole: (newRole: UserRole) => Promise<void>;
  isProcessing?: boolean;
}

export const ChangeRoleModal: React.FC<ChangeRoleModalProps> = ({
  isOpen,
  onClose,
  user,
  onConfirmChangeRole,
  isProcessing = false
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user?.role || 'INSPECTOR');

  if (!isOpen || !user) return null;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole === user.role) {
      onClose();
      return;
    }
    await onConfirmChangeRole(selectedRole);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
      <div className="bg-white rounded-2xl max-w-md w-full border border-[#D8DDE3] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-[#D8DDE3] bg-[#FEF3C7] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white text-[#B45309] rounded-xl border border-[#FDE68A]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#92400E]">Change User Access Role</h2>
              <p className="text-xs text-[#B45309]">Modify authorization tier in RBAC hierarchy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#92400E] hover:bg-black/5 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleConfirm} className="p-5 space-y-4 text-xs">
          <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] space-y-1">
            <div className="font-bold text-[#1E293B]">{user.full_name}</div>
            <div className="text-[11px] text-[#64748B] font-mono">{user.email} &bull; Current: <strong className="text-[#174A7E]">{user.role}</strong></div>
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-[#1E293B] uppercase tracking-wider">
              Select New System Role
            </label>

            <label className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
              selectedRole === 'INSPECTOR'
                ? 'bg-[#EBF3FA] border-[#174A7E] ring-1 ring-[#174A7E]'
                : 'bg-white border-[#CBD5E1] hover:bg-[#F8F9FA]'
            }`}>
              <input
                type="radio"
                name="roleOption"
                value="INSPECTOR"
                checked={selectedRole === 'INSPECTOR'}
                onChange={() => setSelectedRole('INSPECTOR')}
                className="mt-0.5 text-[#174A7E]"
              />
              <div>
                <span className="font-bold text-[#1E293B] block">Inspector Officer</span>
                <span className="text-[11px] text-[#64748B]">Performs field inspections, captures evidence, verifies OCR packaging declarations.</span>
              </div>
            </label>

            <label className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
              selectedRole === 'SENIOR_OFFICER'
                ? 'bg-[#FEF3C7] border-[#B45309] ring-1 ring-[#B45309]'
                : 'bg-white border-[#CBD5E1] hover:bg-[#F8F9FA]'
            }`}>
              <input
                type="radio"
                name="roleOption"
                value="SENIOR_OFFICER"
                checked={selectedRole === 'SENIOR_OFFICER'}
                onChange={() => setSelectedRole('SENIOR_OFFICER')}
                className="mt-0.5 text-[#B45309]"
              />
              <div>
                <span className="font-bold text-[#1E293B] block">Senior Officer (Adjudicating Authority)</span>
                <span className="text-[11px] text-[#64748B]">Supervises review queue, adjudicates statutory findings, issues compounding notices or returns cases.</span>
              </div>
            </label>

            <label className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
              selectedRole === 'ADMIN'
                ? 'bg-[#EEF2F6] border-[#174A7E] ring-1 ring-[#174A7E]'
                : 'bg-white border-[#CBD5E1] hover:bg-[#F8F9FA]'
            }`}>
              <input
                type="radio"
                name="roleOption"
                value="ADMIN"
                checked={selectedRole === 'ADMIN'}
                onChange={() => setSelectedRole('ADMIN')}
                className="mt-0.5 text-[#174A7E]"
              />
              <div>
                <span className="font-bold text-[#1E293B] block">Administrator</span>
                <span className="text-[11px] text-[#64748B]">Manages users, regulatory rules, categories, audit records, and system settings.</span>
              </div>
            </label>
          </div>

          <div className="p-3 bg-[#FEF2F2] rounded-xl border border-[#FECACA] flex items-start gap-2 text-[11px] text-[#991B1B]">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Changing this officer&apos;s role will immediately update their navigation and permission tier.</span>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-5 py-2 bg-[#B45309] hover:bg-[#92400E] text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isProcessing ? 'Updating...' : 'Confirm Role Change'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
