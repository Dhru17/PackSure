import React, { useState } from 'react';
import { X, CheckSquare, Save } from 'lucide-react';
import type { RegulatoryRule } from '../../../../types';

interface RuleRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  rule: RegulatoryRule | null;
  onSave: (ruleId: number, data: any) => Promise<void>;
  isProcessing?: boolean;
}

export const RuleRequirementModal: React.FC<RuleRequirementModalProps> = ({
  isOpen,
  onClose,
  rule,
  onSave,
  isProcessing = false
}) => {
  const [formData, setFormData] = useState({
    requirement_code: '',
    title: '',
    requirement_type: 'MANDATORY_DECLARATION',
    description: '',
    is_mandatory: true
  });

  if (!isOpen || !rule) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.requirement_code.trim() || !formData.title.trim()) {
      alert('Requirement Code and Title are required.');
      return;
    }
    await onSave(rule.id, formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-[#D8DDE3] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#174A7E]/10 text-[#174A7E] rounded-lg">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1E293B]">
                Add Rule Requirement
              </h3>
              <p className="text-xs text-[#64748B]">
                Rule: <span className="font-semibold text-[#1E293B]">{rule.rule_code}</span> ({rule.version})
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
                Requirement Code *
              </label>
              <input
                type="text"
                required
                value={formData.requirement_code}
                onChange={(e) => setFormData({ ...formData, requirement_code: e.target.value })}
                placeholder="e.g. REQ_MRP_INCL_TAX"
                className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E] uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                Requirement Type *
              </label>
              <select
                value={formData.requirement_type}
                onChange={(e) => setFormData({ ...formData, requirement_type: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E] bg-white"
              >
                <option value="MANDATORY_DECLARATION">Mandatory Package Declaration</option>
                <option value="PHYSICAL_MEASUREMENT">Physical Inspection Measurement</option>
                <option value="REQUIRED_DOCUMENT">Statutory Required Document</option>
                <option value="FONT_SPECIFICATION">Font & Dimension Specification</option>
                <option value="PLACEMENT_RULE">PDP Placement Rule</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1">
              Requirement Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Mandatory Tax Inclusivity Declaration"
              className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1">
              Statutory Specification & Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Explain statutory condition evaluated by field officers / rule engine"
              className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#174A7E]"
            />
          </div>

          <div className="pt-2 border-t border-[#E2E8F0]">
            <label className="flex items-center gap-2 text-xs font-medium text-[#475569] cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_mandatory}
                onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.checked })}
                className="w-4 h-4 text-[#174A7E] rounded border-[#CBD5E1] focus:ring-[#174A7E]"
              />
              <span>Mandatory Statutory Requirement (Violation triggers non-compliance)</span>
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
              <span>{isProcessing ? 'Adding...' : 'Add Requirement'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
