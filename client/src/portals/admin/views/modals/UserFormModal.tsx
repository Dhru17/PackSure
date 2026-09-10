import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save } from 'lucide-react';
import type { User, UserRole } from '../../../../types';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null; // null for add, User object for edit
  onSave: (data: any) => Promise<void>;
  isProcessing?: boolean;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
  isProcessing = false
}) => {
  const isEdit = !!user;

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    badge_number: '',
    role: 'INSPECTOR' as UserRole,
    jurisdiction_district: 'Ahmedabad Food & Drug Department',
    is_active: true,
    password: 'Password#2026'
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        badge_number: user.badge_number || '',
        role: user.role || 'INSPECTOR',
        jurisdiction_district: user.jurisdiction_district || 'Ahmedabad Food & Drug Department',
        is_active: user.is_active,
        password: 'Password#2026'
      });
    } else {
      setFormData({
        full_name: '',
        email: '',
        phone_number: '9876543210',
        badge_number: `INS-${Math.floor(1000 + Math.random() * 9000)}`,
        role: 'INSPECTOR',
        jurisdiction_district: 'Ahmedabad Food & Drug Department',
        is_active: true,
        password: 'Password#2026'
      });
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.email.trim()) {
      alert('Please provide Full Name and Official Email.');
      return;
    }
    if (formData.phone_number && formData.phone_number.trim().length !== 10) {
      alert('Official Phone Number must be exactly 10 digits.');
      return;
    }
    await onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-[#D8DDE3] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-[#D8DDE3] bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#EBF3FA] text-[#174A7E] rounded-xl border border-[#CBD5E1]">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1E293B]">
                {isEdit ? 'Edit Officer Profile' : 'Add New Officer'}
              </h2>
              <p className="text-xs text-[#64748B]">
                {isEdit ? 'Update officer credentials and regional jurisdiction' : 'Provision authorized PackSure access'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#64748B] hover:text-[#1E293B] hover:bg-[#E2E8F0] rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-bold text-[#475569] uppercase tracking-wider mb-1">
                Full Name <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="e.g. Rajesh Shah"
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B] focus:ring-1 focus:ring-[#174A7E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[#475569] uppercase tracking-wider mb-1">
                Official Email <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="email"
                required
                disabled={isEdit}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="rajesh.shah@packsure.gov.in"
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B] focus:ring-1 focus:ring-[#174A7E] focus:outline-none disabled:bg-[#F1F5F9]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#475569] uppercase tracking-wider mb-1">
                Officer / Badge ID
              </label>
              <input
                type="text"
                value={formData.badge_number}
                onChange={(e) => setFormData({ ...formData, badge_number: e.target.value })}
                placeholder="e.g. INS-2002"
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B] font-mono focus:ring-1 focus:ring-[#174A7E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[#475569] uppercase tracking-wider mb-1">
                Phone Number (10 Digits)
              </label>
              <input
                type="text"
                maxLength={10}
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                placeholder="9876543210"
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B] focus:ring-1 focus:ring-[#174A7E] focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-[#475569] uppercase tracking-wider mb-1">
                Role & Access
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#1E293B] focus:ring-1 focus:ring-[#174A7E] focus:outline-none bg-white"
              >
                <option value="INSPECTOR">Inspector Officer (Field Inspections)</option>
                <option value="SENIOR_OFFICER">Senior Officer (Adjudication & Reviews)</option>
                <option value="ADMIN">Administrator (System Governance)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-[#475569] uppercase tracking-wider mb-1">
                Department / Regional Jurisdiction
              </label>
              <input
                type="text"
                value={formData.jurisdiction_district}
                onChange={(e) => setFormData({ ...formData, jurisdiction_district: e.target.value })}
                placeholder="e.g. Ahmedabad Regional Circle / West Zone"
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B] focus:ring-1 focus:ring-[#174A7E] focus:outline-none"
              />
            </div>

            {!isEdit && (
              <div className="sm:col-span-2">
                <label className="block font-bold text-[#475569] uppercase tracking-wider mb-1">
                  Temporary Initial Password
                </label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs font-mono text-[#174A7E] focus:ring-1 focus:ring-[#174A7E] focus:outline-none bg-[#F8FAFC]"
                />
              </div>
            )}

            {isEdit && (
              <div className="sm:col-span-2 bg-[#F8F9FA] p-3 rounded-xl border border-[#E2E8F0]">
                <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-[#1E293B]">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded text-[#174A7E] focus:ring-[#174A7E]"
                  />
                  <span>Account is Active & Authorized for System Access</span>
                </label>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between gap-3">
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
              className="px-5 py-2 bg-[#174A7E] hover:bg-[#0F3B66] text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isProcessing ? 'Saving...' : isEdit ? 'Save Changes' : 'Provision User'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
