import React, { useState } from 'react';
import { 
  Building2, 
  Cpu, 
  Bell, 
  ShieldCheck, 
  Save, 
  CheckCircle2 
} from 'lucide-react';

export const AdminSettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'organization' | 'inspection' | 'notifications' | 'security'>('organization');
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Organization settings
  const [orgForm, setOrgForm] = useState({
    department_name: 'Food & Drug Department & Legal Metrology Division',
    office_address: 'Government Complex, Sector 10, Gandhinagar, Gujarat',
    contact_email: 'admin@packsure.gov.in',
    contact_phone: '7912345678'
  });

  // Inspection Engine settings
  const [engineForm, setEngineForm] = useState({
    ocr_confidence: '65.0',
    blur_variance: '100.0',
    max_surfaces: '8',
    max_upload_mb: '15'
  });

  // Notification settings
  const [notifForm, setNotifForm] = useState({
    system_emails: true,
    daily_digest: true,
    sms_alerts: false
  });

  // Security settings
  const [securityForm, setSecurityForm] = useState({
    session_timeout_mins: '60',
    password_expiry_days: '90',
    require_mfa: false
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (orgForm.contact_phone && orgForm.contact_phone.trim().length !== 10) {
      alert('Department Contact Phone must be exactly 10 digits.');
      return;
    }
    setSaveNotice('System configuration updated successfully.');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  return (
    <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#1E293B]">System Settings & Configuration</h2>
          <p className="text-xs text-[#64748B]">Department organization profile, inspection engine thresholds, and security</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-[#F8F9FA] p-1 rounded-xl border border-[#D8DDE3] self-start md:self-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('organization')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTab === 'organization' ? 'bg-[#174A7E] text-white shadow-2xs' : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            Organization
          </button>
          <button
            onClick={() => setActiveTab('inspection')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTab === 'inspection' ? 'bg-[#174A7E] text-white shadow-2xs' : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            Inspection Engine
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTab === 'notifications' ? 'bg-[#174A7E] text-white shadow-2xs' : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTab === 'security' ? 'bg-[#174A7E] text-white shadow-2xs' : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            Security
          </button>
        </div>
      </div>

      {saveNotice && (
        <div className="p-3 bg-[#F0FDF4] border border-[#86EFAC] text-[#15803D] rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* Form Content */}
      <form onSubmit={handleSave} className="space-y-6 text-xs max-w-2xl">
        {/* TAB 1: ORGANIZATION */}
        {activeTab === 'organization' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#174A7E]" />
              <span>Department & Organization Profile</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-[#475569] uppercase tracking-wider mb-1">
                  Department Name
                </label>
                <input
                  type="text"
                  value={orgForm.department_name}
                  onChange={(e) => setOrgForm({ ...orgForm, department_name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B] focus:ring-1 focus:ring-[#174A7E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#475569] uppercase tracking-wider mb-1">
                  Office Address
                </label>
                <input
                  type="text"
                  value={orgForm.office_address}
                  onChange={(e) => setOrgForm({ ...orgForm, office_address: e.target.value })}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B] focus:ring-1 focus:ring-[#174A7E] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#475569] uppercase tracking-wider mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={orgForm.contact_email}
                    onChange={(e) => setOrgForm({ ...orgForm, contact_email: e.target.value })}
                    className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B] focus:ring-1 focus:ring-[#174A7E] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#475569] uppercase tracking-wider mb-1">
                    Contact Phone (10 Digits)
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={orgForm.contact_phone}
                    onChange={(e) => setOrgForm({ ...orgForm, contact_phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B] focus:ring-1 focus:ring-[#174A7E] focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INSPECTION ENGINE */}
        {activeTab === 'inspection' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#174A7E]" />
              <span>Inspection Engine & Computer Vision Thresholds</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] space-y-1.5">
                <label className="font-bold text-[#1E293B] block">OCR Confidence Threshold (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={engineForm.ocr_confidence}
                  onChange={(e) => setEngineForm({ ...engineForm, ocr_confidence: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-xs font-mono font-bold text-[#174A7E]"
                />
                <span className="text-[10px] text-[#64748B]">Minimum detection confidence</span>
              </div>

              <div className="p-3.5 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] space-y-1.5">
                <label className="font-bold text-[#1E293B] block">Blur Variance Cutoff (&sigma;&sup2;)</label>
                <input
                  type="number"
                  step="1.0"
                  value={engineForm.blur_variance}
                  onChange={(e) => setEngineForm({ ...engineForm, blur_variance: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-xs font-mono font-bold text-[#0369A1]"
                />
                <span className="text-[10px] text-[#64748B]">Laplacian blur score cutoff</span>
              </div>

              <div className="p-3.5 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] space-y-1.5">
                <label className="font-bold text-[#1E293B] block">Max Packaging Surfaces</label>
                <input
                  type="number"
                  value={engineForm.max_surfaces}
                  onChange={(e) => setEngineForm({ ...engineForm, max_surfaces: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-xs font-mono font-bold text-[#92400E]"
                />
                <span className="text-[10px] text-[#64748B]">Maximum allowed photos per inspection</span>
              </div>

              <div className="p-3.5 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] space-y-1.5">
                <label className="font-bold text-[#1E293B] block">Max Upload File Size (MB)</label>
                <input
                  type="number"
                  value={engineForm.max_upload_mb}
                  onChange={(e) => setEngineForm({ ...engineForm, max_upload_mb: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-xs font-mono font-bold text-[#15803D]"
                />
                <span className="text-[10px] text-[#64748B]">File size upload ceiling</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#174A7E]" />
              <span>Administrative Notification Dispatch</span>
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8F9FA] cursor-pointer hover:bg-white transition">
                <div>
                  <p className="font-bold text-[#1E293B]">System Email Dispatch</p>
                  <p className="text-[11px] text-[#64748B]">Send official notices and compounding letters via email</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifForm.system_emails}
                  onChange={(e) => setNotifForm({ ...notifForm, system_emails: e.target.checked })}
                  className="w-4 h-4 text-[#174A7E] rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8F9FA] cursor-pointer hover:bg-white transition">
                <div>
                  <p className="font-bold text-[#1E293B]">Daily Executive Digest</p>
                  <p className="text-[11px] text-[#64748B]">Automated daily email digest of inspections and violations</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifForm.daily_digest}
                  onChange={(e) => setNotifForm({ ...notifForm, daily_digest: e.target.checked })}
                  className="w-4 h-4 text-[#174A7E] rounded"
                />
              </label>
            </div>
          </div>
        )}

        {/* TAB 4: SECURITY */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#174A7E]" />
              <span>Authentication & Security Policies</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0]">
                <label className="font-bold text-[#1E293B] block mb-1">Session Inactivity Timeout</label>
                <select
                  value={securityForm.session_timeout_mins}
                  onChange={(e) => setSecurityForm({ ...securityForm, session_timeout_mins: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-xs"
                >
                  <option value="30">30 Minutes</option>
                  <option value="60">60 Minutes (Standard)</option>
                  <option value="120">120 Minutes</option>
                </select>
              </div>

              <div className="p-3.5 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0]">
                <label className="font-bold text-[#1E293B] block mb-1">Password Expiry Policy</label>
                <select
                  value={securityForm.password_expiry_days}
                  onChange={(e) => setSecurityForm({ ...securityForm, password_expiry_days: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-xs"
                >
                  <option value="60">60 Days</option>
                  <option value="90">90 Days (Government Standard)</option>
                  <option value="180">180 Days</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-[#E2E8F0] flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#174A7E] hover:bg-[#0F3B66] text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};
