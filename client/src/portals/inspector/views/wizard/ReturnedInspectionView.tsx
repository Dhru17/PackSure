import React from 'react';
import type { InspectionCase } from '../../../../types';
import { 
  RotateCcw, 
  ArrowRight, 
  ArrowLeft, 
  Camera, 
  FileCheck2
} from 'lucide-react';

interface ReturnedInspectionViewProps {
  inspectionCase: InspectionCase;
  onResume: (targetStep: number) => void;
  onExit: () => void;
}

export const ReturnedInspectionView: React.FC<ReturnedInspectionViewProps> = ({
  inspectionCase: c,
  onResume,
  onExit
}) => {
  const caseNumber = c.case_number || `PS-${c.id}`;
  const productName = c.product?.commodity_name || 'Packaged Commodity';
  const brandName = c.product?.brand_name || '—';
  const seniorNote = c.senior_remarks || 'Please upload a clearer image of the back panel and verify the net quantity declaration.';

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white border border-[#D8DDE3] rounded-2xl p-6 sm:p-8 shadow-xs space-y-8 max-w-3xl mx-auto animate-in fade-in zoom-in-95 duration-150">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#FEF2F2] text-[#DC2626] rounded-xl border border-[#FECACA]">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#991B1B]">Returned for Reinspection</h2>
              <span className="font-mono text-xs font-bold text-[#991B1B] bg-[#FEF2F2] px-2 py-0.5 rounded border border-[#FECACA]">
                #{caseNumber}
              </span>
              <span className="text-xs font-bold text-[#475569] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#CBD5E1]">
                Cycle {c.review_cycle || 1}
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              {productName} ({brandName}) &bull; Returned on {formatDate(c.submitted_at || c.created_at)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onExit}
          className="text-xs font-semibold text-[#64748B] hover:text-[#1E293B] flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Inspections</span>
        </button>
      </div>

      {/* Senior Officer Instruction Blockquote */}
      <div className="bg-[#FEF2F2]/60 border border-[#FECACA] rounded-xl p-5 space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-[#991B1B] flex items-center gap-1.5">
          <span>Senior Officer Directive:</span>
        </div>
        <blockquote className="text-sm font-semibold text-[#7F1D1D] italic bg-white/90 p-4 rounded-lg border border-[#FECACA] leading-relaxed">
          &ldquo;{seniorNote}&rdquo;
        </blockquote>
      </div>

      {/* What Needs Action */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-[#475569]">
          Action Required by Inspector
        </div>

        <div className="space-y-3">
          {/* Action 1: Evidence */}
          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#EBF3FA] text-[#174A7E] rounded-lg">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs text-[#1E293B]">Package Evidence</div>
                <div className="text-[11px] text-[#64748B] mt-0.5">
                  Recapture or replace packaging panel photos if requested.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onResume(2)}
              className="px-3.5 py-1.5 bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#174A7E] font-bold rounded-lg text-xs shadow-2xs transition"
            >
              Update Evidence &rarr;
            </button>
          </div>

          {/* Action 2: Compliance Verification */}
          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#FEF3C7] text-[#D97706] rounded-lg">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs text-[#1E293B]">Compliance Verification</div>
                <div className="text-[11px] text-[#64748B] mt-0.5">
                  Verify or correct statutory declaration values.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onResume(4)}
              className="px-3.5 py-1.5 bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#174A7E] font-bold rounded-lg text-xs shadow-2xs transition"
            >
              Verify Findings &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
        <button
          type="button"
          onClick={onExit}
          className="px-5 py-2.5 bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#475569] font-bold rounded-lg text-xs transition"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={() => onResume(2)}
          className="px-8 py-3 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-xl text-xs transition shadow-md flex items-center gap-2 cursor-pointer"
        >
          <span>Resume Reinspection Workflow</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
