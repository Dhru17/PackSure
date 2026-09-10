import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import type { ComplianceCheck, Violation, Declaration } from '../../../../types';

interface FindingDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  check: ComplianceCheck | null;
  violation: Violation | null;
  declaration?: Declaration | null;
  onSaveAction: (action: 'CONFIRMED' | 'OVERRIDDEN' | 'DISMISSED', remarks: string) => Promise<void>;
  isProcessing?: boolean;
}

export const FindingDetailsDrawer: React.FC<FindingDetailsDrawerProps> = ({
  isOpen,
  onClose,
  check,
  violation,
  declaration,
  onSaveAction,
  isProcessing = false
}) => {
  const [decision, setDecision] = useState<'CONFIRMED' | 'OVERRIDDEN' | 'DISMISSED'>('CONFIRMED');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (violation?.senior_decision) {
      setDecision(violation.senior_decision as any);
    } else if (check?.status === 'PASS') {
      setDecision('CONFIRMED');
    } else {
      setDecision('CONFIRMED');
    }
    setRemarks(violation?.senior_override_reason || '');
  }, [check, violation]);

  if (!isOpen || (!check && !violation)) return null;

  const title = check?.expected_condition || violation?.violation_title || check?.rule_title || 'Statutory Requirement Finding';
  const ruleCode = check?.rule_code || violation?.rule_code || 'RULE';
  const citation = check?.statutory_citation || 'Legal Metrology (Packaged Commodities) Rules, 2011';
  const explanation = check?.reason_explanation || violation?.description || 'Evaluation completed against packaging declaration.';
  const status = check?.status || (violation ? 'FAIL' : 'PASS');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (decision !== 'CONFIRMED' && !remarks.trim()) {
      alert('A justification reason is required when overriding or dismissing a statutory finding.');
      return;
    }
    await onSaveAction(decision, remarks);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Drawer Panel */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#D8DDE3] bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#EBF3FA] text-[#174A7E] rounded-lg border border-[#CBD5E1]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#174A7E] bg-white px-2 py-0.5 rounded border border-[#CBD5E1]">
                  {ruleCode}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  status === 'PASS' 
                    ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]' 
                    : status === 'REVIEW_REQUIRED'
                    ? 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                    : 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                }`}>
                  {status === 'PASS' ? 'COMPLIANT' : status === 'REVIEW_REQUIRED' ? 'REVIEW REQUIRED' : 'NON-COMPLIANT'}
                </span>
              </div>
              <h2 className="text-sm font-bold text-[#1E293B] mt-1">{title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#64748B] hover:text-[#1E293B] hover:bg-[#E2E8F0] rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {/* Statutory Citation Card */}
          <div className="bg-[#F8F9FA] border border-[#D8DDE3] rounded-xl p-4 space-y-2">
            <div className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#174A7E]" />
              <span>Statutory Rule Reference</span>
            </div>
            <p className="text-xs font-semibold text-[#1E293B]">{citation}</p>
            <p className="text-xs text-[#475569] leading-relaxed pt-1 border-t border-[#E2E8F0]">{explanation}</p>
          </div>

          {/* Extracted & Verified Values */}
          {(declaration || check?.evaluated_value) && (
            <div className="bg-white border border-[#D8DDE3] rounded-xl p-4 space-y-3">
              <div className="text-[10px] text-[#475569] font-bold uppercase tracking-wider">
                Extracted Packaging Declaration
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#F8F9FA] p-2.5 rounded-lg border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block font-bold">Field / Title</span>
                  <span className="font-bold text-[#1E293B]">{declaration?.title || title}</span>
                </div>
                <div className="bg-[#F8F9FA] p-2.5 rounded-lg border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block font-bold">Detected Value</span>
                  <span className="font-mono text-[#1E293B]">{declaration?.extracted_value || check?.evaluated_value || 'None'}</span>
                </div>
                {declaration?.font_height_mm && (
                  <div className="bg-[#F8F9FA] p-2.5 rounded-lg border border-[#E2E8F0] col-span-2">
                    <span className="text-[10px] text-[#64748B] block font-bold">Measured Height</span>
                    <span className="font-mono font-bold text-[#174A7E]">{declaration.font_height_mm.toFixed(1)} mm</span>
                  </div>
                )}
                {declaration?.inspector_corrected_value && (
                  <div className="bg-[#FEF3C7] p-2.5 rounded-lg border border-[#FDE68A] col-span-2">
                    <span className="text-[10px] text-[#B45309] block font-bold">Inspector Verified Value</span>
                    <span className="font-mono font-bold text-[#92400E]">{declaration.inspector_corrected_value}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Adjudication Decision Form */}
          <form id="finding-adjudication-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                Supervisory Adjudication Determination
              </label>
              
              <div className="space-y-2">
                <label className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
                  decision === 'CONFIRMED'
                    ? 'bg-[#EBF3FA] border-[#174A7E] ring-1 ring-[#174A7E]'
                    : 'bg-white border-[#CBD5E1] hover:bg-[#F8F9FA]'
                }`}>
                  <input
                    type="radio"
                    name="decision"
                    value="CONFIRMED"
                    checked={decision === 'CONFIRMED'}
                    onChange={() => setDecision('CONFIRMED')}
                    className="mt-0.5 text-[#174A7E] focus:ring-[#174A7E]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#1E293B] block">Confirm Finding</span>
                    <span className="text-[11px] text-[#64748B]">
                      Uphold the inspector and AI evaluation as legally accurate.
                    </span>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
                  decision === 'OVERRIDDEN'
                    ? 'bg-[#FEF3C7] border-[#B45309] ring-1 ring-[#B45309]'
                    : 'bg-white border-[#CBD5E1] hover:bg-[#F8F9FA]'
                }`}>
                  <input
                    type="radio"
                    name="decision"
                    value="OVERRIDDEN"
                    checked={decision === 'OVERRIDDEN'}
                    onChange={() => setDecision('OVERRIDDEN')}
                    className="mt-0.5 text-[#B45309] focus:ring-[#B45309]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#1E293B] block">Override Finding</span>
                    <span className="text-[11px] text-[#64748B]">
                      Modify finding based on exemption, rule interpretation, or physical inspection verification.
                    </span>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
                  decision === 'DISMISSED'
                    ? 'bg-[#F1F5F9] border-[#64748B] ring-1 ring-[#64748B]'
                    : 'bg-white border-[#CBD5E1] hover:bg-[#F8F9FA]'
                }`}>
                  <input
                    type="radio"
                    name="decision"
                    value="DISMISSED"
                    checked={decision === 'DISMISSED'}
                    onChange={() => setDecision('DISMISSED')}
                    className="mt-0.5 text-[#64748B] focus:ring-[#64748B]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#1E293B] block">Dismiss as Non-Issue</span>
                    <span className="text-[11px] text-[#64748B]">
                      Dismiss finding as non-statutory or de minimis variation.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Remarks / Justification Input */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider">
                Senior Remarks / Justification {decision !== 'CONFIRMED' && <span className="text-[#DC2626]">*</span>}
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={
                  decision === 'CONFIRMED'
                    ? 'Optional notes on confirmation...'
                    : 'Mandatory justification under LM(PC) Rules / Section 36...'
                }
                className="w-full bg-white border border-[#CBD5E1] rounded-lg p-3 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:ring-1 focus:ring-[#174A7E]"
              />
            </div>
          </form>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-[#D8DDE3] bg-[#F8FAFC] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] rounded-lg text-xs font-bold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="finding-adjudication-form"
            disabled={isProcessing}
            className="px-5 py-2 bg-[#174A7E] hover:bg-[#0F3B66] text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isProcessing ? 'Saving...' : 'Save Determination'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
