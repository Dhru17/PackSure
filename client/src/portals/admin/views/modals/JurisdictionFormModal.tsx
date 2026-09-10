import React, { useState, useEffect } from 'react';
import { X, MapPin, Save } from 'lucide-react';
import type { Jurisdiction } from '../../../../types';

interface JurisdictionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  jurisdiction: Jurisdiction | null;
  onSave: (data: any) => Promise<void>;
  isProcessing?: boolean;
}

export const JurisdictionFormModal: React.FC<JurisdictionFormModalProps> = ({
  isOpen,
  onClose,
  jurisdiction,
  onSave,
  isProcessing = false
}) => {
  const isEdit = !!jurisdiction;

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    state: 'Gujarat',
    district: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    if (jurisdiction) {
      setFormData({
        code: jurisdiction.code,
        name: jurisdiction.name,
        state: jurisdiction.state || 'Gujarat',
        district: jurisdiction.district || '',
        description: jurisdiction.description || '',
        is_active: jurisdiction.is_active
      });
    } else {
      setFormData({
        code: `JUR-${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        state: 'Gujarat',
        district: '',
        description: '',
        is_active: true
      });
    }
  }, [jurisdiction, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim() || !formData.state.trim()) {
      alert('Jurisdiction Code, Name, and State are required.');
      return;
    }
    await onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-[#D8DDE3] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#174A7E]/10 text-[#174A7E] rounded-lg">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1E293B]">
                {isEdit ? 'Edit Metrology Jurisdiction' : 'Configure Jurisdiction'}
              </h3>
              <p className="text-xs text-[#64748B]">
                Statutory territorial authority for inspector assignment & plants
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
                Jurisdiction Code *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. GUJ-AHM"
                className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E] uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                State / Union Territory *
              </label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="e.g. Gujarat / Delhi / Maharashtra"
                className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1">
              Jurisdiction Name / Zone *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Ahmedabad District / Central Delhi Zone"
              className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1">
              District (Optional)
            </label>
            <input
              type="text"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              placeholder="e.g. Ahmedabad / New Delhi"
              className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1">
              Statutory Description & Boundaries
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Official notification details and geographical boundaries"
              className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E]"
            />
          </div>

          <div className="pt-2 border-t border-[#E2E8F0]">
            <label className="flex items-center gap-2 text-xs font-medium text-[#475569] cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-[#174A7E] rounded border-[#CBD5E1] focus:ring-[#174A7E]"
              />
              <span>Active Statutory Jurisdiction</span>
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
              <span>{isProcessing ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Jurisdiction')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
