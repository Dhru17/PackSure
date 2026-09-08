import React, { useState } from 'react';
import { useAuthStore } from '../../../state/authStore';
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Building2, 
  Lock, 
  Bell, 
  LogOut, 
  CheckCircle,
  AlertCircle,
  KeyRound
} from 'lucide-react';

export const AdminProfileView: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [systemAlerts, setSystemAlerts] = useState(true);
  const [userRequestAlerts, setUserRequestAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setPasswordMsg({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }
    setPasswordMsg({ type: 'success', text: 'Password updated successfully.' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Officer Identity Card */}
      <div className="bg-white p-6 rounded-xl border border-[#D8DDE3] shadow-xs flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-[#174A7E] text-white flex items-center justify-center font-extrabold text-2xl shadow-sm flex-shrink-0">
          {user?.full_name ? user.full_name.charAt(0) : <User className="w-8 h-8" />}
        </div>
        <div className="text-center sm:text-left flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h2 className="text-lg font-bold text-[#1E293B]">
              {user?.full_name || 'Administrator'}
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EBF3FA] text-[#174A7E] border border-[#CBD5E1] text-[11px] font-bold w-fit mx-auto sm:mx-0">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>System Administrator</span>
            </span>
          </div>
          <p className="text-xs text-[#64748B] font-medium mt-1">
            Officer ID: <span className="font-mono font-bold text-[#1E293B]">{user?.badge_number || 'AD-0001'}</span> &bull; State Legal Metrology Enforcement Portal
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Personal Information */}
        <div className="bg-white rounded-xl border border-[#D8DDE3] shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-2">
              <User className="w-4 h-4 text-[#174A7E]" />
              <span>Personal Information</span>
            </h2>
          </div>
          <div className="p-6 space-y-4 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-[#64748B] uppercase">Full Name</label>
              <div className="font-bold text-[#1E293B] mt-0.5">{user?.full_name || 'Aditi Sharma'}</div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#64748B] uppercase">Officer / Admin ID</label>
              <div className="font-mono font-bold text-[#1E293B] mt-0.5">{user?.badge_number || 'AD-0001'}</div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#64748B] uppercase">Official Email</label>
              <div className="font-medium text-[#1E293B] mt-0.5 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#64748B]" />
                <span>{user?.email || 'admin@packsure.gov.in'}</span>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#64748B] uppercase">Official Phone</label>
              <div className="font-medium text-[#1E293B] mt-0.5 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#64748B]" />
                <span>{user?.phone_number || '+91 79 1234 5678'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Office & Jurisdiction */}
        <div className="bg-white rounded-xl border border-[#D8DDE3] shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#174A7E]" />
                <span>Office & Governance</span>
              </h2>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-[#64748B] uppercase">Role Assignment</label>
                <div className="font-bold text-[#1E293B] mt-0.5 flex items-center gap-2">
                  <span>Administrator</span>
                  <span className="text-[10px] bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7] px-2 py-0.5 rounded font-bold">Active & Certified</span>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#64748B] uppercase">Assigned Department</label>
                <div className="font-semibold text-[#1E293B] mt-0.5">
                  {user?.jurisdiction_district || 'Food & Drug Department / State Level'}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#64748B] uppercase">Applicable Framework</label>
                <div className="font-medium text-[#475569] mt-0.5">
                  Legal Metrology (Packaged Commodities) Rules, 2011 & RBAC System Administration
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center gap-2 text-[11px] text-[#64748B]">
            <Lock className="w-3.5 h-3.5 flex-shrink-0 text-[#94A3B8]" />
            <span>Root administrative privileges are protected and recorded in the audit trail.</span>
          </div>
        </div>
      </div>

      {/* Section 3: Account & Notification Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Change Password Form */}
        <div className="bg-white rounded-xl border border-[#D8DDE3] shadow-xs p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#174A7E]" />
            <span>Change Password</span>
          </h2>

          {passwordMsg && (
            <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              passwordMsg.type === 'success' 
                ? 'bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7]' 
                : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
            }`}>
              {passwordMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-[#475569] mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs focus:outline-none focus:border-[#174A7E]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#475569] mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs focus:outline-none focus:border-[#174A7E]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#475569] mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs focus:outline-none focus:border-[#174A7E]"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-[#174A7E] text-white font-bold rounded-lg text-xs hover:bg-[#133E68] transition-colors shadow-2xs cursor-pointer"
            >
              Update Password
            </button>
          </form>
        </div>

        {/* Notification Preferences & Logout */}
        <div className="bg-white rounded-xl border border-[#D8DDE3] shadow-xs p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#174A7E]" />
              <span>Notification Preferences</span>
            </h2>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3 rounded-lg border border-[#E2E8F0] cursor-pointer hover:bg-[#F8FAFC]">
                <div>
                  <div className="font-bold text-[#1E293B]">System Alerts</div>
                  <div className="text-[11px] text-[#64748B]">Immediate alerts for rule expiry or category changes</div>
                </div>
                <input
                  type="checkbox"
                  checked={systemAlerts}
                  onChange={(e) => setSystemAlerts(e.target.checked)}
                  className="w-4 h-4 text-[#174A7E] rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-[#E2E8F0] cursor-pointer hover:bg-[#F8FAFC]">
                <div>
                  <div className="font-bold text-[#1E293B]">User Requests</div>
                  <div className="text-[11px] text-[#64748B]">Alerts for officer credential modifications</div>
                </div>
                <input
                  type="checkbox"
                  checked={userRequestAlerts}
                  onChange={(e) => setUserRequestAlerts(e.target.checked)}
                  className="w-4 h-4 text-[#174A7E] rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-[#E2E8F0] cursor-pointer hover:bg-[#F8FAFC]">
                <div>
                  <div className="font-bold text-[#1E293B]">Email Summaries</div>
                  <div className="text-[11px] text-[#64748B]">Daily administrative summaries and audit digests</div>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 text-[#174A7E] rounded"
                />
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E2E8F0]">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] font-bold rounded-lg text-xs hover:bg-[#FEE2E2] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Administrator Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
