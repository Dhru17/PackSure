import React, { useState } from 'react';
import { X, Layers, Plus, Trash2 } from 'lucide-react';
import type { ProductCategory, RegulatoryRule } from '../../../../types';

interface CategoryRuleMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: ProductCategory | null;
  mappedRules: any[];
  allRules: RegulatoryRule[];
  onMapRule: (data: { rule_id: number; is_exempt?: boolean; exception_notes?: string }) => Promise<void>;
  onUnmapRule: (ruleId: number) => Promise<void>;
  isProcessing?: boolean;
}

export const CategoryRuleMapModal: React.FC<CategoryRuleMapModalProps> = ({
  isOpen,
  onClose,
  category,
  mappedRules,
  allRules,
  onMapRule,
  onUnmapRule,
  isProcessing = false
}) => {
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');
  const [isExempt, setIsExempt] = useState<boolean>(false);
  const [exceptionNotes, setExceptionNotes] = useState<string>('');

  if (!isOpen || !category) return null;

  // Filter out rules already mapped
  const mappedRuleIds = new Set(mappedRules.map(m => m.rule_id || m.rule?.id));
  const availableRules = allRules.filter(r => !mappedRuleIds.has(r.id) && r.is_active);

  const handleAddMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRuleId) return;
    await onMapRule({
      rule_id: parseInt(selectedRuleId),
      is_exempt: isExempt,
      exception_notes: exceptionNotes
    });
    setSelectedRuleId('');
    setIsExempt(false);
    setExceptionNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#D8DDE3] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-[#D8DDE3] bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#EBF3FA] text-[#174A7E] rounded-xl border border-[#CBD5E1]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1E293B]">
                Rule Applicability &bull; {category.name}
              </h2>
              <p className="text-xs text-[#64748B]">
                Define which statutory rules apply to commodities under this category
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

        {/* Content */}
        <div className="p-6 space-y-6 text-xs max-h-[80vh] overflow-y-auto">
          {/* Add New Rule Mapping Box */}
          <form onSubmit={handleAddMapping} className="p-4 bg-[#F8F9FA] rounded-xl border border-[#D8DDE3] space-y-3">
            <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-[#174A7E]" />
              <span>Map Additional Regulatory Rule</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-[#475569] mb-1">Select Rule to Apply</label>
                <select
                  required
                  value={selectedRuleId}
                  onChange={(e) => setSelectedRuleId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#1E293B] focus:ring-1 focus:ring-[#174A7E] focus:outline-none bg-white"
                >
                  <option value="">Choose active rule...</option>
                  {availableRules.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.rule_code} &bull; {r.title} ({r.version})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={!selectedRuleId || isProcessing}
                  className="w-full px-4 py-2 bg-[#174A7E] hover:bg-[#0F3B66] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Map Rule</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#475569]">
                <input
                  type="checkbox"
                  checked={isExempt}
                  onChange={(e) => setIsExempt(e.target.checked)}
                  className="rounded text-[#174A7E] focus:ring-[#174A7E]"
                />
                <span>Mark as Statutory Exemption for this Category</span>
              </label>

              {isExempt && (
                <input
                  type="text"
                  value={exceptionNotes}
                  onChange={(e) => setExceptionNotes(e.target.value)}
                  placeholder="e.g. Exempt under Rule 26(a) for small packages"
                  className="flex-1 px-3 py-1.5 border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B] focus:ring-1 focus:ring-[#174A7E] focus:outline-none"
                />
              )}
            </div>
          </form>

          {/* List of Currently Mapped Rules */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center justify-between">
              <span>Currently Applicable Rules ({mappedRules.length})</span>
              <span className="text-[11px] font-normal text-[#64748B]">These requirements will be evaluated during inspection</span>
            </h3>

            {mappedRules.length === 0 ? (
              <div className="p-8 text-center text-[#94A3B8] bg-[#F8F9FA] rounded-xl border border-[#E2E8F0]">
                No specific rules currently mapped. General national metrology defaults apply.
              </div>
            ) : (
              <div className="space-y-2">
                {mappedRules.map((m: any) => {
                  const rule = m.rule || m;
                  return (
                    <div
                      key={m.id || rule.id}
                      className="p-3.5 bg-white border border-[#D8DDE3] rounded-xl flex items-center justify-between gap-4 shadow-2xs hover:border-[#174A7E] transition"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#174A7E] bg-[#EBF3FA] px-2 py-0.5 rounded border border-[#CBD5E1]">
                            {rule.rule_code}
                          </span>
                          <span className="font-bold text-[#1E293B]">{rule.title}</span>
                          <span className="font-mono text-[10px] text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.2 rounded border border-[#E2E8F0]">
                            {rule.version}
                          </span>
                          {m.is_exempt && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                              EXEMPT
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#64748B] line-clamp-1">{rule.statutory_citation}</p>
                        {m.exception_notes && (
                          <p className="text-[10px] text-[#B45309] italic">Notes: {m.exception_notes}</p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onUnmapRule(rule.id || m.rule_id)}
                        className="p-2 text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition cursor-pointer"
                        title="Remove Rule Mapping"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#D8DDE3] bg-[#F8FAFC] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#174A7E] hover:bg-[#0F3B66] text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
