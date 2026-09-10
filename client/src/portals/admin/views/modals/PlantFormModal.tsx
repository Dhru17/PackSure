import React, { useState, useEffect } from 'react';
import { X, Factory, Save } from 'lucide-react';
import type { Plant, Company, Jurisdiction } from '../../../../types';

interface PlantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  plant: Plant | null;
  companies: Company[];
  jurisdictions: Jurisdiction[];
  defaultCompanyId?: number | null;
  onSave: (data: any) => Promise<void>;
  isProcessing?: boolean;
}

export const PlantFormModal: React.FC<PlantFormModalProps> = ({
  isOpen,
  onClose,
  plant,
  companies = [],
  jurisdictions = [],
  defaultCompanyId = null,
  onSave,
  isProcessing = false
}) => {
  const isEdit = !!plant;

  const [formData, setFormData] = useState({
    company_id: '',
    plant_code: '',
    name: '',
    jurisdiction_id: '',
    address: '',
    city: '',
    state: 'Gujarat',
    pin_code: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    is_active: true
  });

  useEffect(() => {
    if (plant) {
      setFormData({
        company_id: String(plant.company_id),
        plant_code: plant.plant_code,
        name: plant.name,
        jurisdiction_id: plant.jurisdiction_id ? String(plant.jurisdiction_id) : '',
        address: plant.address || '',
        city: plant.city || '',
        state: plant.state || 'Gujarat',
        pin_code: plant.pin_code || '',
        contact_person: plant.contact_person || '',
        contact_email: plant.contact_email || '',
        contact_phone: plant.contact_phone || '',
        is_active: plant.is_active
      });
    } else {
      setFormData({
        company_id: defaultCompanyId ? String(defaultCompanyId) : (companies[0]?.id ? String(companies[0].id) : ''),
        plant_code: `PLT-${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        jurisdiction_id: jurisdictions[0]?.id ? String(jurisdictions[0].id) : '',
        address: '',
        city: '',
        state: 'Gujarat',
        pin_code: '',
        contact_person: '',
        contact_email: '',
        contact_phone: '',
        is_active: true
      });
    }
  }, [plant, isOpen, defaultCompanyId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_id || !formData.name.trim() || !formData.plant_code.trim()) {
      alert('Company, Plant Code, and Plant Name are required.');
      return;
    }
    if (formData.contact_phone && formData.contact_phone.trim().length !== 10) {
      alert('Plant Contact Phone must be exactly 10 digits.');
      return;
    }
    await onSave({
      ...formData,
      company_id: Number(formData.company_id),
      jurisdiction_id: formData.jurisdiction_id ? Number(formData.jurisdiction_id) : null
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-[#D8DDE3] w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#174A7E]/10 text-[#174A7E] rounded-lg">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1E293B]">
                {isEdit ? 'Edit Manufacturing Facility / Plant' : 'Register Plant Location'}
              </h3>
              <p className="text-xs text-[#64748B]">
                Plant entity linked to company and local statutory jurisdiction
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
                Parent Company *
              </label>
              <select
                required
                value={formData.company_id}
                onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E] bg-white"
              >
                <option value="">-- Select Company --</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.city || c.state})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                Plant / Facility Code *
              </label>
              <input
                type="text"
                required
                value={formData.plant_code}
                onChange={(e) => setFormData({ ...formData, plant_code: e.target.value })}
                placeholder="e.g. PLT-AHM-01"
                className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E] uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                Plant Facility Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Sanand Bakery Unit 1"
                className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                Legal Metrology Jurisdiction
              </label>
              <select
                value={formData.jurisdiction_id}
                onChange={(e) => setFormData({ ...formData, jurisdiction_id: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E] bg-white"
              >
                <option value="">-- Select Jurisdiction --</option>
                {jurisdictions.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.code} - {j.name} ({j.state})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1">
              Physical Plant Address
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full plot / survey / street address of plant facility"
              className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                City / Industrial Estate
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Sanand / Ahmedabad"
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
                placeholder="e.g. Gujarat"
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
                placeholder="e.g. 382110"
                className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                Plant Contact Person
              </label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                placeholder="Manager Name"
                className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                Plant Email
              </label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="plant@company.com"
                className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                Plant Phone (10 Digits)
              </label>
              <input
                type="text"
                maxLength={10}
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                placeholder="9876543210"
                className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E] font-mono"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-medium text-[#475569] cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-[#174A7E] rounded border-[#CBD5E1] focus:ring-[#174A7E]"
              />
              <span>Operational / Active Plant</span>
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
              <span>{isProcessing ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Plant')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
