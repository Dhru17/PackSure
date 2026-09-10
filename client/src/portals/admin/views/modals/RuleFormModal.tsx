import React, { useState, useEffect } from 'react';
import { X, Scale, Save } from 'lucide-react';
import type { RegulatoryRule } from '../../../../types';

interface RuleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  rule: RegulatoryRule | null; // null for new, rule for edit / new version
  isNewVersionMode?: boolean;
  onSave: (data: any) => Promise<void>;
  isProcessing?: boolean;
}

export const RuleFormModal: React.FC<RuleFormModalProps> = ({
  isOpen,
  onClose,
  rule,
  isNewVersionMode = false,
  onSave,
  isProcessing = false
}) => {
  const isEdit = !!rule && !isNewVersionMode;

  const [formData, setFormData] = useState({
    rule_code: '',
    version: 'v1.0',
    title: '',
    description: '',
    statutory_citation: 'Rule 6(1), Legal Metrology (Packaged Commodities) Rules, 2011',
    government_authority: 'Department of Consumer Affairs, Ministry of Consumer Affairs, Food and Public Distribution, Government of India',
    notification_reference: '',
    notification_date: '',
    amendment_title: '',
    official_source: 'The Gazette of India: Extraordinary',
    source_document: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    validation_logic_type: 'MANDATORY_DECLARATIONS',
    effective_from: new Date().toISOString().split('T')[0],
    effective_to: '',
    status: 'ACTIVE',
    is_active: true
  });

  useEffect(() => {
    if (rule) {
      if (isNewVersionMode) {
        // Increment version number e.g. v2 -> v3
        const match = rule.version.match(/v?(\d+)(\.\d+)?/);
        const nextVer = match ? `v${parseInt(match[1]) + 1}.0` : `${rule.version}.1`;
        setFormData({
          rule_code: rule.rule_code,
          version: nextVer,
          title: rule.title,
          description: rule.description,
          statutory_citation: rule.statutory_citation,
          government_authority: rule.government_authority || 'Department of Consumer Affairs, Ministry of Consumer Affairs, Food and Public Distribution, Government of India',
          notification_reference: '',
          notification_date: '',
          amendment_title: '',
          official_source: rule.official_source || 'The Gazette of India: Extraordinary',
          source_document: rule.source_document,
          validation_logic_type: rule.validation_logic_type,
          effective_from: new Date().toISOString().split('T')[0],
          effective_to: '',
          status: 'FUTURE_SCHEDULED',
          is_active: true
        });
      } else {
        setFormData({
          rule_code: rule.rule_code,
          version: rule.version,
          title: rule.title,
          description: rule.description,
          statutory_citation: rule.statutory_citation,
          government_authority: rule.government_authority || 'Department of Consumer Affairs, Ministry of Consumer Affairs, Food and Public Distribution, Government of India',
          notification_reference: rule.notification_reference || '',
          notification_date: rule.notification_date ? rule.notification_date.split('T')[0] : '',
          amendment_title: rule.amendment_title || '',
          official_source: rule.official_source || 'The Gazette of India: Extraordinary',
          source_document: rule.source_document,
          validation_logic_type: rule.validation_logic_type,
          effective_from: rule.effective_from ? rule.effective_from.split('T')[0] : '',
          effective_to: rule.effective_to ? rule.effective_to.split('T')[0] : '',
          status: rule.status || (rule.is_active ? 'ACTIVE' : 'SUPERSEDED'),
          is_active: rule.is_active
        });
      }
    } else {
      setFormData({
        rule_code: `RULE_${Math.floor(100 + Math.random() * 900)}`,
        version: 'v1.0',
        title: '',
        description: '',
        statutory_citation: 'Rule 6(1), Legal Metrology (Packaged Commodities) Rules, 2011',
        government_authority: 'Department of Consumer Affairs, Ministry of Consumer Affairs, Food and Public Distribution, Government of India',
        notification_reference: '',
        notification_date: '',
        amendment_title: '',
        official_source: 'The Gazette of India: Extraordinary',
        source_document: 'Legal Metrology (Packaged Commodities) Rules, 2011',
        validation_logic_type: 'MANDATORY_DECLARATIONS',
        effective_from: new Date().toISOString().split('T')[0],
        effective_to: '',
        status: 'ACTIVE',
        is_active: true
      });
    }
  }, [rule, isNewVersionMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.rule_code.trim()) {
      alert('Please provide Rule Title and Rule Code.');
      return;
    }
    await onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#D8DDE3] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-[#D8DDE3] bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#EBF3FA] text-[#174A7E] rounded-xl border border-[#CBD5E1]">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1E293B]">
                {isNewVersionMode 
                  ? `Create New Version of Rule (${rule?.rule_code})` 
                  : isEdit 
                  ? 'Edit Regulatory Rule' 
                  : 'Add New Regulatory Rule'}
              </h2>
              <p className="text-xs text-[#64748B]">
                {isNewVersionMode 
                  ? 'Publish updated requirement without overwriting historical version'
                  : 'Configure compliance criteria and official statutory citations'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[#475569] uppercase tracking-wider mb-1">
                Rule Code / Identifier <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isEdit || isNewVersionMode}
                value={formData.rule_code}
                onChange={(e) => setFormData({ ...formData, rule_code: e.target.value })}
                placeholder="e.g. RULE_6_1_E"
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs font-mono text-[#1E293B] focus:ring-1 focus:ring-[#174A7E] focus:outline-none disabled:bg-[#F1F5F9]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#475569] uppercase tracking-wider mb-1">
                Version Tag <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="e.g. v2026.1_GSR128E"
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs font-mono text-[#174A7E] font-bold focus:ring-1 focus:ring-[#174A7E] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-[#475569] uppercase tracking-wider mb-1">
                Rule Name / Requirement Title <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Mandatory Declarations on Pre-Packaged Commodities"
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#1E293B] focus:ring-1 focus:ring-[#174A7E] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-[#475569] uppercase tracking-wider mb-1">
                Statutory Requirement Text
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Every package shall bear legible, definite and conspicuous declarations..."
                className="w-full p-3 border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B] focus:ring-1 focus:ring-[#174A7E] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-[#475569] uppercase tracking-wider mb-1">
                Statutory Citation
              </label>
              <input
                type="text"
                value={formData.statutory_citation}
                onChange={(e) => setFormData({ ...formData, statutory_citation: e.target.value })}
                placeholder="Rule 6(1), Legal Metrology (Packaged Commodities) Rules, 2011"
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B] focus:ring-1 focus:ring-[#174A7E] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-[#475569] uppercase tracking-wider mb-1">
                Government Authority
              </label>
              <input
                type="text"
                value={formData.government_authority}
                onChange={(e) => setFormData({ ...formData, government_authority: e.target.value })}
                placeholder="Department of Consumer Affairs, Ministry of Consumer Affairs, Food and Public Distribution, Government of India"
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B] focus:ring-1 focus:ring-[#174A7E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[#475569] uppercase tracking-wider mb-1">
                Gazette Notification Reference
              </label>
              <input
                type="text"
                value={formData.notification_reference}
                onChange={(e) => setFormData({ ...formData, notification_reference: e.target.value })}
                placeholder="e.g. G.S.R. 779(E) / G.S.R. 312(E)"
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs font-mono text-[#1E293B] focus:ring-1 focus:ring-[#174A7E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[#475569] uppercase tracking-wider mb-1">
                Gazette Notification Date
              </label>
              <input
                type="date"
                value={formData.notification_date}
                onChange={(e) => setFormData({ ...formData, notification_date: e.target.value })}
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B] focus:ring-1 focus:ring-[#174A7E] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-[#475569] uppercase tracking-wider mb-1">
                Amendment Title
              </label>
              <input
                type="text"
                value={formData.amendment_title}
                onChange={(e) => setFormData({ ...formData, amendment_title: e.target.value })}
                placeholder="Legal Metrology (Packaged Commodities) Second Amendment Rules, 2026"
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B] focus:ring-1 focus:ring-[#174A7E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[#475569] uppercase tracking-wider mb-1">
                Validation Logic Type
              </label>
              <select
                value={formData.validation_logic_type}
                onChange={(e) => setFormData({ ...formData, validation_logic_type: e.target.value })}
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#1E293B] focus:ring-1 focus:ring-[#174A7E] focus:outline-none bg-white"
              >
                <option value="MANDATORY_DECLARATIONS">Mandatory Declarations (Rule 6)</option>
                <option value="CHARACTER_HEIGHT">Numeral & Letter Height (Rule 7 / Table I & II)</option>
                <option value="SURROUNDING_SPACE">PDP Appearance & Surrounding Space (Rule 8)</option>
                <option value="ECOMMERCE_FILTER">E-Commerce Country of Origin Filter (Rule 6(10A))</option>
                <option value="DATE_VALIDATION">Date & Shelf-Life Format Verification</option>
                <option value="UNIT_VALIDATION">SI Metric Unit Validation</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#475569] uppercase tracking-wider mb-1">
                Effective From Date
              </label>
              <input
                type="date"
                value={formData.effective_from}
                onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B] focus:ring-1 focus:ring-[#174A7E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[#475569] uppercase tracking-wider mb-1">
                Effective To Date (Optional)
              </label>
              <input
                type="date"
                value={formData.effective_to}
                onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B] focus:ring-1 focus:ring-[#174A7E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[#475569] uppercase tracking-wider mb-1">
                Legal Enforcement Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#1E293B] focus:ring-1 focus:ring-[#174A7E] focus:outline-none bg-white"
              >
                <option value="ACTIVE">ACTIVE (Enforced)</option>
                <option value="FUTURE_SCHEDULED">FUTURE_SCHEDULED (Upcoming Gazette)</option>
                <option value="SUPERSEDED">SUPERSEDED (Historical Version)</option>
                <option value="DEPRECATED">DEPRECATED</option>
              </select>
            </div>

            <div className="sm:col-span-2 bg-[#F8F9FA] p-3 rounded-xl border border-[#E2E8F0]">
              <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-[#1E293B]">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded text-[#174A7E] focus:ring-[#174A7E]"
                />
                <span>Enable this rule in statutory compliance scans</span>
              </label>
            </div>
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
              <span>{isProcessing ? 'Saving...' : isNewVersionMode ? 'Publish New Version' : isEdit ? 'Save Changes' : 'Save Rule'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
