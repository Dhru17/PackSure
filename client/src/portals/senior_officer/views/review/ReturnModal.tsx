import React, { useState } from 'react';
import { X, RotateCcw } from 'lucide-react';
import type { InspectionCase } from '../../../../types';

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspectionCase: InspectionCase | null;
  onConfirmReturn: (data: { reason: string; sections: string[] }) => Promise<void>;
  isProcessing?: boolean;
}

export const ReturnModal: React.FC<ReturnModalProps> = ({
  isOpen,
  onClose,
  inspectionCase,
  onConfirmReturn,
  isProcessing = false
}) => {
  const [reason, setReason] = useState('');
  const [selectedSections, setSelectedSections] = useState<string[]>(['Evidence']);

  if (!isOpen || !inspectionCase) return null;

  const toggleSection = (section: string) => {
    if (selectedSections.includes(section)) {
      setSelectedSections(selectedSections.filter(s => s !== section));
    } else {
      setSelectedSections([...selectedSections, section]);
    }
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide a specific reason for returning this case to the inspector.');
      return;
    }
    if (selectedSections.length === 0) {
      alert('Please select at least one section requiring reinspection.');
      return;
    }
    await onConfirmReturn({
      reason,
      sections: selectedSections
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-[#D8DDE3] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-[#D8DDE3] bg-[#FFFBEB] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#FEF3C7] text-[#B45309] rounded-xl border border-[#FDE68A]">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#92400E]">Return Inspection for Reinspection</h2>
              <p className="text-xs text-[#B45309]">The inspector will be notified to address the specified issues.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#92400E] hover:bg-[#FEF3C7] rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleReturn} className="p-5 space-y-4">
          {/* Case Reference Banner */}
          <div className="bg-[#F8F9FA] border border-[#D8DDE3] rounded-xl p-3.5 flex items-center justify-between text-xs">
            <div>
              <span className="font-mono font-bold text-[#174A7E]">{inspectionCase.case_number}</span>
              <p className="font-bold text-[#1E293B] mt-0.5">{inspectionCase.product?.brand_name} ({inspectionCase.product?.commodity_name})</p>
            </div>
            <div className="text-right text-[#64748B]">
              <span>Inspector:</span>
              <p className="font-bold text-[#334155]">{inspectionCase.inspector_name}</p>
            </div>
          </div>

          {/* Section Checkboxes */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#1E293B] uppercase tracking-wider">
              Sections Requiring Attention <span className="text-[#DC2626]">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 p-2.5 bg-[#F8F9FA] rounded-lg border border-[#CBD5E1] cursor-pointer hover:bg-white text-xs text-[#1E293B]">
                <input
                  type="checkbox"
                  checked={selectedSections.includes('Evidence')}
                  onChange={() => toggleSection('Evidence')}
                  className="rounded text-[#B45309] focus:ring-[#B45309]"
                />
                <span className="font-semibold">Evidence Packaging</span>
                <span className="text-[#64748B] text-[11px]">(Need clearer photos or additional surfaces)</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 bg-[#F8F9FA] rounded-lg border border-[#CBD5E1] cursor-pointer hover:bg-white text-xs text-[#1E293B]">
                <input
                  type="checkbox"
                  checked={selectedSections.includes('Compliance')}
                  onChange={() => toggleSection('Compliance')}
                  className="rounded text-[#B45309] focus:ring-[#B45309]"
                />
                <span className="font-semibold">Compliance Verification</span>
                <span className="text-[#64748B] text-[11px]">(Re-verify specific declarations or calculations)</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 bg-[#F8F9FA] rounded-lg border border-[#CBD5E1] cursor-pointer hover:bg-white text-xs text-[#1E293B]">
                <input
                  type="checkbox"
                  checked={selectedSections.includes('Product Details')}
                  onChange={() => toggleSection('Product Details')}
                  className="rounded text-[#B45309] focus:ring-[#B45309]"
                />
                <span className="font-semibold">Product Specifications</span>
                <span className="text-[#64748B] text-[11px]">(PDP dimensions or commodity categorization incorrect)</span>
              </label>
            </div>
          </div>

          {/* Return Reason Textarea */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#1E293B] uppercase tracking-wider">
              Instructions for Inspector <span className="text-[#DC2626]">*</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Clearly state what the field inspector needs to correct or re-capture before resubmitting..."
              className="w-full bg-white border border-[#CBD5E1] rounded-lg p-3 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:ring-1 focus:ring-[#B45309]"
              required
            />
          </div>

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
              type="submit"
              disabled={isProcessing}
              className="px-5 py-2 bg-[#B45309] hover:bg-[#92400E] text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isProcessing ? 'Returning...' : 'Return Case to Inspector'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
