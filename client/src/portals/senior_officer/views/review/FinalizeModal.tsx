import React from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { InspectionCase } from '../../../../types';

interface FinalizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspectionCase: InspectionCase | null;
  finalDecisionType: 'APPROVE_COMPLIANT' | 'APPROVE_VIOLATIONS' | 'DISMISS_CASE';
  seniorRemarks?: string;
  onConfirmFinalize: () => Promise<void>;
  isProcessing?: boolean;
}

export const FinalizeModal: React.FC<FinalizeModalProps> = ({
  isOpen,
  onClose,
  inspectionCase,
  finalDecisionType,
  seniorRemarks = '',
  onConfirmFinalize,
  isProcessing = false
}) => {
  if (!isOpen || !inspectionCase) return null;

  const isCompliant = finalDecisionType === 'APPROVE_COMPLIANT';
  const isViolations = finalDecisionType === 'APPROVE_VIOLATIONS';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-[#D8DDE3] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${
          isCompliant 
            ? 'bg-[#F0FDF4] border-[#BBF7D0]' 
            : isViolations 
            ? 'bg-[#FEF2F2] border-[#FECACA]' 
            : 'bg-[#F8FAFC] border-[#D8DDE3]'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isCompliant 
                ? 'bg-white text-[#15803D] border-[#BBF7D0]' 
                : isViolations 
                ? 'bg-white text-[#991B1B] border-[#FECACA]' 
                : 'bg-white text-[#174A7E] border-[#CBD5E1]'
            }`}>
              {isCompliant ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : isViolations ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1E293B]">Finalize Inspection Review</h2>
              <p className="text-xs text-[#64748B]">This will record your statutory decision as the final outcome.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#64748B] hover:text-[#1E293B] hover:bg-black/5 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Disposition Badge */}
          <div className={`p-4 rounded-xl border text-center ${
            isCompliant 
              ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]' 
              : isViolations 
              ? 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]' 
              : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#475569]'
          }`}>
            <span className="text-[10px] uppercase font-bold tracking-wider block">Final Adjudication Outcome</span>
            <span className="text-base font-bold font-mono mt-0.5 block">
              {isCompliant ? 'COMPLIANT — INSPECTION CLOSED' : isViolations ? 'NON-COMPLIANT — STATUTORY NOTICE ISSUED' : 'DISMISSED AS NON-ISSUE'}
            </span>
          </div>

          {/* Case Recap Table */}
          <div className="bg-[#F8F9FA] border border-[#D8DDE3] rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[#64748B]">Case Reference:</span>
              <span className="font-mono font-bold text-[#174A7E]">{inspectionCase.case_number}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#64748B]">Product / Brand:</span>
              <span className="font-bold text-[#1E293B]">{inspectionCase.product?.brand_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#64748B]">Submitting Inspector:</span>
              <span className="font-semibold text-[#334155]">{inspectionCase.inspector_name}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-[#E2E8F0]">
              <span className="text-[#64748B]">Findings Summary:</span>
              <div className="flex gap-2">
                <span className="text-[11px] font-mono text-[#15803D] font-bold">{inspectionCase.passed_checks} Pass</span>
                <span className="text-[11px] font-mono text-[#991B1B] font-bold">{inspectionCase.failed_checks} Non-Compliant</span>
              </div>
            </div>
          </div>

          {/* Senior Remarks */}
          {seniorRemarks && (
            <div className="bg-white border border-[#D8DDE3] rounded-xl p-3 text-xs space-y-1">
              <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block">Recorded Senior Remarks</span>
              <p className="italic text-[#334155]">&ldquo;{seniorRemarks}&rdquo;</p>
            </div>
          )}

          <p className="text-[11px] text-[#64748B] leading-relaxed">
            By finalizing, you confirm that this inspection has been reviewed in accordance with the Legal Metrology (Packaged Commodities) Rules, 2011 and Section 36 of the Legal Metrology Act, 2009. The determination will be permanently committed to the immutable audit log.
          </p>

          {/* Action Footer */}
          <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={onConfirmFinalize}
              className={`px-5 py-2 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer ${
                isCompliant 
                  ? 'bg-[#15803D] hover:bg-[#166534]' 
                  : isViolations 
                  ? 'bg-[#991B1B] hover:bg-[#7F1D1D]' 
                  : 'bg-[#174A7E] hover:bg-[#0F3B66]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isProcessing ? 'Finalizing...' : 'Confirm & Finalize'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
