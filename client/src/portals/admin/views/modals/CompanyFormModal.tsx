import React, { useState, useEffect } from 'react';
import { X, Building2, Save } from 'lucide-react';
import type { Company } from '../../../../types';

interface CompanyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
  onSave: (data: any) => Promise<void>;
  isProcessing?: boolean;
}

export const CompanyFormModal: React.FC<CompanyFormModalProps> = ({
  isOpen,
  onClose,
  company,
  onSave,
  isProcessing = false
}) => {
  const isEdit = !!company;

  const [formData, setFormData] = useState({
    name: '',
    legal_entity_name: '',
    registration_number: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    city: '',
    state: 'Gujarat',
    pin_code: '',
    is_importer: false,
    is_active: true
  });

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        legal_entity_name: company.legal_entity_name || company.name,
        registration_number: company.registration_number || '',
        contact_email: company.contact_email || '',
        contact_phone: company.contact_phone || '',
        address: company.address || '',
        city: company.city || '',
        state: company.state || 'Gujarat',
        pin_code: company.pin_code || '',
        is_importer: company.is_importer,
        is_active: company.is_active
      });
    } else {
      setFormData({
        name: '',
        legal_entity_name: '',
        registration_number: '',
        contact_email: '',
        contact_phone: '',
        address: '',
        city: '',
        state: 'Gujarat',
        pin_code: '',
        is_importer: false,
        is_active: true
      });
    }
  }, [company, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Company Name is required.');
      return;
    }
    await onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-[#D8DDE3] w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#174A7E]/10 text-[#174A7E] rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1E293B]">
                {isEdit ? 'Edit Enterprise Entity' : 'Register New Enterprise Entity'}
              </h3>
              <p className="text-xs text-[#64748B]">
                Master enterprise data for PackSure compliance tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#64748B] hover:text-[#1E293B] hover:bg-[#E2E8F0] rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                Commercial Brand / Trade Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Britannia Industries Ltd"
                className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                Registered Legal Entity Name
              </label>
              <input
                type="text"
                value={formData.legal_entity_name}
                onChange={(e) => setFormData({ ...formData, legal_entity_name: e.target.value })}
                placeholder="e.g. Britannia Industries Private Limited"
                className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                LMPC / FSSAI Registration No.
              </label>
              <input
                type="text"
                value={formData.registration_number}
                onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                placeholder="e.g. LMPC-REG-2024-998"
                className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                Contact Official Email
              </label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="compliance@company.com"
                className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                Contact Phone / Helpline
              </label>
              <input
                type="text"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="1800-XXX-XXXX"
                className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1">
              Registered Head Office Address
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full street address of corporate headquarters"
              className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Kolkata / Ahmedabad"
                className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                State
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="e.g. Gujarat / West Bengal"
                className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                PIN Code
              </label>
              <input
                type="text"
                value={formData.pin_code}
                onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })}
                placeholder="e.g. 700017"
                className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E]"
              />
            </div>
          </div>

          {/* Options */}
          <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-medium text-[#475569] cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_importer}
                onChange={(e) => setFormData({ ...formData, is_importer: e.target.checked })}
                className="w-4 h-4 text-[#174A7E] rounded border-[#CBD5E1] focus:ring-[#174A7E]"
              />
              <span>Entity operates as Registered Importer</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-[#475569] cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-[#174A7E] rounded border-[#CBD5E1] focus:ring-[#174A7E]"
              />
              <span>Active in System</span>
            </label>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9] rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#174A7E] hover:bg-[#123860] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Company')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
