import React, { useState } from 'react';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Building2, 
  Key, 
  Power, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Lock,
  Clock
} from 'lucide-react';
import type { User as UserType, AuditLog } from '../../../types';
import { ChangeRoleModal } from './modals/ChangeRoleModal';

interface AdminUserDetailsViewProps {
  user: UserType;
  auditLogs: AuditLog[];
  onBack: () => void;
  onEditUser: (user: UserType) => void;
  onChangeRole: (newRole: any) => Promise<void>;
  onToggleStatus: (user: UserType) => Promise<void>;
  onResetPassword: (user: UserType) => void;
  onDeleteUser: (user: UserType) => Promise<void>;
}

export const AdminUserDetailsView: React.FC<AdminUserDetailsViewProps> = ({
  user,
  auditLogs,
  onBack,
  onEditUser,
  onChangeRole,
  onToggleStatus,
  onResetPassword,
  onDeleteUser
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'permissions'>('overview');
  const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter audit logs for this user
  const userAuditLogs = auditLogs.filter(
    log => log.user_id === user.id || log.entity_id === String(user.id) || (log.user_name && log.user_name.toLowerCase() === user.full_name.toLowerCase())
  );

  const handleToggle = async () => {
    setIsProcessing(true);
    try {
      await onToggleStatus(user);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to remove or deactivate officer account "${user.full_name}"?`)) return;
    setIsProcessing(true);
    try {
      await onDeleteUser(user);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Back Navigation */}
      <div className="bg-white border border-[#D8DDE3] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-white hover:bg-[#F8FAFC] text-[#475569] rounded-lg border border-[#CBD5E1] transition shadow-2xs cursor-pointer"
            title="Back to Users"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-bold text-[#1E293B]">User Details</h1>
            <p className="text-xs text-[#64748B]">Manage officer credentials, assigned role, and regional enforcement circle</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEditUser(user)}
            className="px-4 py-2 bg-[#174A7E] hover:bg-[#0F3B66] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit User</span>
          </button>
        </div>
      </div>

      {/* User Identity Banner Card */}
      <div className="bg-white rounded-xl border border-[#D8DDE3] shadow-xs p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-[#174A7E] text-white flex items-center justify-center font-extrabold text-2xl shadow-sm flex-shrink-0">
          {user.full_name ? user.full_name.charAt(0) : <User className="w-8 h-8" />}
        </div>
        <div className="text-center sm:text-left flex-1 space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h2 className="text-lg font-bold text-[#1E293B]">{user.full_name}</h2>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold w-fit mx-auto sm:mx-0 border ${
              user.is_active 
                ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]' 
                : 'bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]'
            }`}>
              <CheckCircle2 className="w-3 h-3" />
              <span>{user.is_active ? 'Active' : 'Inactive'}</span>
            </span>
          </div>
          <p className="text-xs text-[#64748B] font-mono">
            Officer ID: <strong className="text-[#1E293B]">{user.badge_number || 'N/A'}</strong> &bull; Role: <strong className="text-[#174A7E]">{user.role}</strong>
          </p>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="bg-white border border-[#D8DDE3] rounded-xl p-1.5 shadow-xs flex items-center gap-1.5">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-[#174A7E] text-white shadow-2xs'
              : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC]'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
            activeTab === 'activity'
              ? 'bg-[#174A7E] text-white shadow-2xs'
              : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC]'
          }`}
        >
          Activity ({userAuditLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
            activeTab === 'permissions'
              ? 'bg-[#174A7E] text-white shadow-2xs'
              : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC]'
          }`}
        >
          Permissions & Governance
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl border border-[#D8DDE3] shadow-xs p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
              <User className="w-4 h-4 text-[#174A7E]" />
              <span>Personal Information</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-[#64748B] uppercase">Full Name</label>
                <div className="font-bold text-[#1E293B] mt-0.5">{user.full_name}</div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#64748B] uppercase">Officer / Badge ID</label>
                <div className="font-mono font-bold text-[#174A7E] mt-0.5">{user.badge_number || 'N/A'}</div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#64748B] uppercase">Official Email</label>
                <div className="font-medium text-[#1E293B] mt-0.5 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>{user.email}</span>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#64748B] uppercase">Official Phone</label>
                <div className="font-medium text-[#1E293B] mt-0.5 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>{user.phone_number || '+91 98765 43210'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Role & Access */}
          <div className="bg-white rounded-xl border border-[#D8DDE3] shadow-xs p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
              <Shield className="w-4 h-4 text-[#174A7E]" />
              <span>Role & Access Tier</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-[#64748B] uppercase">Role Assignment</label>
                <div className="font-bold text-[#1E293B] mt-0.5 flex items-center gap-2">
                  <span>{user.role === 'ADMIN' ? 'Administrator' : user.role === 'SENIOR_OFFICER' ? 'Senior Metrology Officer' : 'Inspector Officer'}</span>
                  <span className="text-[10px] bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD] px-2 py-0.5 rounded font-bold">
                    {user.role}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#64748B] uppercase">Assigned Jurisdiction / Office</label>
                <div className="font-semibold text-[#1E293B] mt-0.5 flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>{user.jurisdiction_district || 'Regional Division'}</span>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#64748B] uppercase">Account Created Date</label>
                <div className="font-mono text-[#475569] mt-0.5">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active in System'}
                </div>
              </div>
            </div>
          </div>

          {/* Account Status Card */}
          <div className="bg-white rounded-xl border border-[#D8DDE3] shadow-xs p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
              <Clock className="w-4 h-4 text-[#174A7E]" />
              <span>Account Status & Activity</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Authorization State:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  user.is_active ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]' : 'bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]'
                }`}>
                  {user.is_active ? 'ACTIVE & AUTHORIZED' : 'DEACTIVATED'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Last Active:</span>
                <span className="font-mono text-[#1E293B]">Today, Online</span>
              </div>
            </div>
          </div>

          {/* Administrative Actions Card */}
          <div className="bg-white rounded-xl border border-[#D8DDE3] shadow-xs p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
              <Lock className="w-4 h-4 text-[#174A7E]" />
              <span>Administrative Actions</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setIsChangeRoleModalOpen(true)}
                className="px-3.5 py-2.5 bg-white hover:bg-[#F8FAFC] text-[#174A7E] rounded-lg text-xs font-bold border border-[#CBD5E1] transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
              >
                <Shield className="w-4 h-4" />
                <span>Change Role</span>
              </button>

              <button
                type="button"
                onClick={() => onResetPassword(user)}
                className="px-3.5 py-2.5 bg-white hover:bg-[#FEF3C7] text-[#B45309] rounded-lg text-xs font-bold border border-[#CBD5E1] hover:border-[#FDE68A] transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
              >
                <Key className="w-4 h-4" />
                <span>Reset Password</span>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleToggle}
                className={`px-3.5 py-2.5 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer ${
                  user.is_active
                    ? 'bg-white hover:bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]'
                    : 'bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#15803D] border-[#86EFAC]'
                }`}
              >
                <Power className="w-4 h-4" />
                <span>{user.is_active ? 'Deactivate User' : 'Activate User'}</span>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleDelete}
                className="px-3.5 py-2.5 bg-white hover:bg-[#FEF2F2] text-[#64748B] hover:text-[#DC2626] rounded-lg text-xs font-bold border border-[#CBD5E1] transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVITY */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-xl border border-[#D8DDE3] shadow-xs p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
            <Clock className="w-4 h-4 text-[#174A7E]" />
            <span>Audit History & Logged Events ({userAuditLogs.length})</span>
          </h3>

          {userAuditLogs.length === 0 ? (
            <p className="text-xs text-[#94A3B8] p-6 text-center bg-[#F8F9FA] rounded-xl border border-[#E2E8F0]">
              No direct audit logs recorded for this officer account.
            </p>
          ) : (
            <div className="space-y-2.5">
              {userAuditLogs.map((log) => (
                <div key={log.id} className="p-3 bg-[#F8F9FA] border border-[#D8DDE3] rounded-xl flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1E293B]">{log.action_type}</span>
                      <span className="font-mono text-[10px] text-[#174A7E] bg-white px-1.5 py-0.2 rounded border border-[#CBD5E1]">
                        {log.entity_name}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748B]">{log.justification || 'System action executed'}</p>
                  </div>
                  <span className="text-[10px] font-mono text-[#94A3B8]">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PERMISSIONS */}
      {activeTab === 'permissions' && (
        <div className="bg-white rounded-xl border border-[#D8DDE3] shadow-xs p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
            <Lock className="w-4 h-4 text-[#174A7E]" />
            <span>RBAC Authorization Tiers</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] flex items-center justify-between">
              <div>
                <p className="font-bold text-[#1E293B]">Field Inspections & Evidence Capture</p>
                <p className="text-[#64748B] text-[11px]">Capture multi-surface images, run OCR detections, verify compliance</p>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                user.role === 'INSPECTOR' || user.role === 'ADMIN' ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#F1F5F9] text-[#94A3B8]'
              }`}>
                {user.role === 'INSPECTOR' || user.role === 'ADMIN' ? 'AUTHORIZED' : 'LOCKED'}
              </span>
            </div>

            <div className="p-3.5 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] flex items-center justify-between">
              <div>
                <p className="font-bold text-[#1E293B]">Supervisory Adjudication & Notice Issuance</p>
                <p className="text-[#64748B] text-[11px]">Review queue, override findings, issue compounding directives (Section 36)</p>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                user.role === 'SENIOR_OFFICER' || user.role === 'ADMIN' ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#F1F5F9] text-[#94A3B8]'
              }`}>
                {user.role === 'SENIOR_OFFICER' || user.role === 'ADMIN' ? 'AUTHORIZED' : 'LOCKED'}
              </span>
            </div>

            <div className="p-3.5 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] flex items-center justify-between">
              <div>
                <p className="font-bold text-[#1E293B]">System Configuration & Rule Administration</p>
                <p className="text-[#64748B] text-[11px]">Manage users, categories, regulatory rules, and audit logs</p>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                user.role === 'ADMIN' ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#F1F5F9] text-[#94A3B8]'
              }`}>
                {user.role === 'ADMIN' ? 'AUTHORIZED' : 'LOCKED'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      <ChangeRoleModal
        isOpen={isChangeRoleModalOpen}
        onClose={() => setIsChangeRoleModalOpen(false)}
        user={user}
        onConfirmChangeRole={async (newRole) => {
          await onChangeRole(newRole);
          setIsChangeRoleModalOpen(false);
        }}
      />
    </div>
  );
};
