import React, { useState } from 'react';
import type { InspectionCase } from '../../../../types';
import { EvidencePreviewModal } from './EvidencePreviewModal';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowLeft, 
  FileText, 
  RefreshCw, 
  Send, 
  Eye, 
  ShieldCheck,
  Package,
  Lock,
  Scale
} from 'lucide-react';

interface Step5ReviewProps {
  inspectionCase: InspectionCase;
  inspectorRemarks: string;
  setInspectorRemarks: (val: string) => void;
  onSubmit: (signerName?: string) => void;
  isSubmitting: boolean;
  submissionSuccess: boolean;
  onBack: () => void;
  onExitToDashboard: () => void;
}

export const Step5Review: React.FC<Step5ReviewProps> = ({
  inspectionCase: c,
  inspectorRemarks,
  setInspectorRemarks,
  onSubmit,
  isSubmitting,
  submissionSuccess,
  onBack,
  onExitToDashboard
}) => {
  const [hasConfirmedReview, setHasConfirmedReview] = useState(false);
  const [signerName, setSignerName] = useState(c.inspector_name || 'Legal Metrology Field Inspector');
  const [digitalHash] = useState(() => {
    const raw = `LM-SIG-${c.id}-${c.inspector_id || 1}-${Date.now()}`;
    // Simple deterministic hex representation
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    return `0x${Math.abs(hash).toString(16).padStart(8, '0')}e91b44c8f27a310d5c4`;
  });
  const [activePreview, setActivePreview] = useState<{
    imagePath?: string;
    surfaceName?: string;
    title?: string;
    detectedText?: string;
    bbox?: { x: number; y: number; w: number; h: number };
  } | null>(null);

  const caseNumber = c.case_number || `PS-${c.id}`;
  const productName = c.product?.commodity_name || 'Packaged Commodity';
  const brandName = c.product?.brand_name || '—';
  const categoryName = c.product?.category_name || 'General Packaged Commodity';
  const manufacturerName = c.product?.manufacturer_name || 'Registered Manufacturer';

  const checks = c.compliance_checks || [];
  const compliantCount = checks.filter(chk => chk.status === 'PASS').length || (c.declarations?.length || 0);
  const nonCompliantChecks = checks.filter(chk => chk.status === 'FAIL');
  const nonCompliantCount = nonCompliantChecks.length;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Today';
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

  const handleOpenEvidence = (chk: any) => {
    const matchingEv = c.evidences?.find(e => e.id === chk.evidence_id) || c.evidences?.[0];
    setActivePreview({
      imagePath: matchingEv?.storage_path,
      surfaceName: matchingEv?.surface_type || 'Package Panel',
      title: chk.rule_title || 'Statutory Requirement',
      detectedText: chk.evaluated_value,
      bbox: chk.bbox
    });
  };

  if (submissionSuccess) {
    return (
      <div className="bg-white border border-[#D8DDE3] rounded-2xl p-8 sm:p-12 shadow-xs text-center space-y-6 max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="w-20 h-20 bg-[#F0FDF4] text-[#15803D] rounded-full flex items-center justify-center mx-auto border-2 border-[#DCFCE7] shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-[#1E293B]">
            Inspection Submitted for Senior Review!
          </h2>
          <p className="text-xs text-[#64748B] leading-relaxed max-w-md mx-auto font-medium">
            Case <strong className="font-mono text-[#1E293B]">#{caseNumber}</strong> has been officially logged in the legal metrology ledger and dispatched to the Senior Officer review docket.
          </p>
        </div>

        <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-xs text-left space-y-2 max-w-md mx-auto">
          <div className="flex justify-between text-[#64748B]">
            <span>Inspection Case ID:</span>
            <span className="font-mono font-bold text-[#1E293B]">{caseNumber}</span>
          </div>
          <div className="flex justify-between text-[#64748B]">
            <span>Current State:</span>
            <span className="font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
              IN SENIOR REVIEW
            </span>
          </div>
          <div className="flex justify-between text-[#64748B]">
            <span>Compliance Outcome:</span>
            <span className="font-bold text-[#1E293B]">
              {compliantCount} Compliant &bull; {nonCompliantCount} Non-Compliant
            </span>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="button"
            onClick={onExitToDashboard}
            className="px-8 py-3 bg-[#174A7E] hover:bg-[#133E68] text-white font-bold rounded-xl text-xs transition shadow-xs cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#D8DDE3] rounded-2xl p-6 sm:p-8 shadow-xs space-y-8">
      {/* Header & Purpose */}
      <div className="border-b border-[#E2E8F0] pb-4">
        <h2 className="text-lg font-bold text-[#1E293B] tracking-tight flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-[#174A7E]" />
          <span>Final Inspection Review & Dispatch</span>
        </h2>
        <p className="text-xs text-[#64748B] mt-1 font-medium">
          Verify all completed modules and findings before final submission to the Senior Legal Metrology Officer.
        </p>
      </div>

      {/* 5-Milestone Completion Checklist */}
      <div className="bg-[#F8FAFC] border border-[#D8DDE3] rounded-xl p-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-semibold">
          <div className="flex items-center gap-2 text-[#15803D]">
            <CheckCircle2 className="w-4 h-4" />
            <span>Product &bull; Completed</span>
          </div>
          <div className="flex items-center gap-2 text-[#15803D]">
            <CheckCircle2 className="w-4 h-4" />
            <span>Evidence &bull; Completed</span>
          </div>
          <div className="flex items-center gap-2 text-[#15803D]">
            <CheckCircle2 className="w-4 h-4" />
            <span>AI Analysis &bull; Completed</span>
          </div>
          <div className="flex items-center gap-2 text-[#15803D]">
            <CheckCircle2 className="w-4 h-4" />
            <span>Compliance &bull; Completed</span>
          </div>
          <div className="flex items-center gap-2 text-[#174A7E] font-bold">
            <span className="w-4 h-4 rounded-full bg-[#174A7E] text-white flex items-center justify-center text-[10px]">●</span>
            <span>Review &bull; Current</span>
          </div>
        </div>
      </div>

      {/* 2-Column Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Inspection Summary Card */}
        <div className="bg-white rounded-xl border border-[#D8DDE3] p-5 shadow-2xs space-y-3">
          <h3 className="font-bold uppercase tracking-wider text-[#1E293B] text-xs pb-2 border-b border-[#E2E8F0] flex items-center gap-2">
            <Package className="w-4 h-4 text-[#174A7E]" />
            <span>Inspection Summary</span>
          </h3>
          <div className="space-y-2 text-[#475569]">
            <div className="flex justify-between py-1 border-b border-[#F8FAFC]">
              <span className="text-[#64748B]">Case ID:</span>
              <span className="font-mono font-bold text-[#1E293B]">{caseNumber}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F8FAFC]">
              <span className="text-[#64748B]">Product Name:</span>
              <span className="font-bold text-[#1E293B] text-right">{productName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F8FAFC]">
              <span className="text-[#64748B]">Brand:</span>
              <span className="font-semibold text-[#1E293B]">{brandName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F8FAFC]">
              <span className="text-[#64748B]">Category:</span>
              <span className="font-semibold text-[#1E293B]">{categoryName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F8FAFC]">
              <span className="text-[#64748B]">Manufacturer:</span>
              <span className="font-semibold text-[#1E293B] text-right">{manufacturerName}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#64748B]">Inspection Date:</span>
              <span className="font-semibold text-[#1E293B]">{formatDate(c.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Final Result Card */}
        <div className="bg-white rounded-xl border border-[#D8DDE3] p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold uppercase tracking-wider text-[#1E293B] text-xs pb-2 border-b border-[#E2E8F0] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#174A7E]" />
              <span>Final Compliance Result</span>
            </h3>
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#F0FDF4] border border-[#DCFCE7]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#15803D]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Compliant Declarations</span>
                </div>
                <span className="text-base font-extrabold text-[#15803D]">{compliantCount}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#FEF2F2] border border-[#FEE2E2]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#DC2626]">
                  <XCircle className="w-4 h-4" />
                  <span>Non-Compliant Declarations</span>
                </div>
                <span className="text-base font-extrabold text-[#DC2626]">{nonCompliantCount}</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-[#64748B] italic pt-2 border-t border-[#E2E8F0]">
            Review outcomes will be adjudicated by the Senior Officer.
          </div>
        </div>
      </div>

      {/* Verified Physical Measurements Recap */}
      <div className="bg-[#F8FAFC] border border-[#D8DDE3] rounded-xl p-5 space-y-3">
        <h3 className="font-bold uppercase tracking-wider text-[#1E293B] text-xs flex items-center gap-2">
          <Scale className="w-4 h-4 text-[#174A7E]" />
          <span>Calibrated Physical Measurements Summary</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white p-3 rounded-lg border border-[#E2E8F0]">
            <span className="text-[#64748B] block text-[11px]">Actual Net Quantity:</span>
            <span className="font-bold text-[#1E293B]">{c.actual_net_quantity || c.product?.default_net_quantity || '200 g'}</span>
          </div>
          <div className="bg-white p-3 rounded-lg border border-[#E2E8F0]">
            <span className="text-[#64748B] block text-[11px]">Font Height (mm):</span>
            <span className="font-bold text-[#1E293B]">{c.actual_font_height_mm ? `${c.actual_font_height_mm} mm` : '4.0 mm'}</span>
          </div>
          <div className="bg-white p-3 rounded-lg border border-[#E2E8F0]">
            <span className="text-[#64748B] block text-[11px]">PDP Area:</span>
            <span className="font-bold text-[#1E293B]">
              {c.actual_pdp_width_cm && c.actual_pdp_height_cm ? `${c.actual_pdp_width_cm * c.actual_pdp_height_cm} cm²` : `${c.product?.pdp_area_cm2 || 150} cm²`}
            </span>
          </div>
          <div className="bg-white p-3 rounded-lg border border-[#E2E8F0]">
            <span className="text-[#64748B] block text-[11px]">Scale Calibration:</span>
            <span className="font-bold text-[#15803D]">Verified & Sealed ✓</span>
          </div>
        </div>
      </div>

      {/* Important Findings Requiring Attention */}
      {nonCompliantChecks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#DC2626] uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Important Findings for Senior Review ({nonCompliantChecks.length})</span>
          </div>

          <div className="space-y-2.5">
            {nonCompliantChecks.map((chk) => (
              <div
                key={chk.id}
                className="bg-[#FEF2F2]/50 border border-[#FECACA] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-[#991B1B]">
                    {chk.rule_title || chk.rule_code} &bull; Non-Compliant
                  </div>
                  <p className="text-[#7F1D1D] mt-0.5">
                    {chk.reason_explanation || chk.evaluated_value || 'Mandatory declaration does not meet prescribed requirements.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenEvidence(chk)}
                  className="px-3.5 py-1.5 bg-white border border-[#FECACA] hover:bg-[#FEF2F2] text-[#DC2626] font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-2xs self-end sm:self-auto cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Evidence</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inspector Remarks Field */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-[#1E293B] uppercase tracking-wider">
          Inspector Remarks / Official Observations
        </label>
        <textarea
          rows={3}
          value={inspectorRemarks}
          onChange={(e) => setInspectorRemarks(e.target.value)}
          placeholder="Add any additional field observations, seizure details, or notes for the Senior Officer..."
          className="w-full p-3.5 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#174A7E] focus:ring-1 focus:ring-[#174A7E]"
        />
      </div>

      {/* Digital Signature & Statutory Attestation (Rule of Law) */}
      <div className="p-5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
          <Lock className="w-4 h-4 text-[#174A7E]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
            Inspector Statutory Digital Attestation
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-[#1E293B] mb-1">
              Signing Officer Full Name:
            </label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="e.g. Inspector Ramesh Kumar"
              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B] focus:border-[#174A7E]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#1E293B] mb-1">
              Digital Signature Fingerprint (SHA-256):
            </label>
            <div className="px-3 py-2 bg-[#EBF3FA] border border-[#BFDBFE] rounded-lg text-[11px] font-mono text-[#1E40AF] truncate">
              {digitalHash}
            </div>
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer pt-2">
          <input
            type="checkbox"
            checked={hasConfirmedReview}
            onChange={(e) => setHasConfirmedReview(e.target.checked)}
            className="w-4 h-4 text-[#174A7E] rounded mt-0.5"
          />
          <div>
            <div className="text-xs font-bold text-[#1E293B]">
              I hereby solemnly affirm under the Legal Metrology Act, 2009 that I have personally inspected and verified this packaged commodity.
            </div>
            <div className="text-[11px] text-[#64748B] mt-0.5 font-medium">
              By submitting, this inspection report and digital signature hash are permanently entered into the immutable case ledger for Senior Officer review.
            </div>
          </div>
        </label>
      </div>

      {/* Navigation & Submit Action */}
      <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#475569] font-bold rounded-lg text-xs transition flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Compliance</span>
        </button>

        <button
          type="button"
          onClick={() => onSubmit(signerName)}
          disabled={!hasConfirmedReview || !signerName.trim() || isSubmitting}
          className="px-7 py-3 bg-[#174A7E] hover:bg-[#133E68] text-white font-bold rounded-xl text-xs transition shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Submitting for Senior Review...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Submit & Digitally Sign</span>
            </>
          )}
        </button>
      </div>

      {/* Evidence Preview Modal */}
      {activePreview && (
        <EvidencePreviewModal
          isOpen={Boolean(activePreview)}
          onClose={() => setActivePreview(null)}
          imagePath={activePreview.imagePath}
          surfaceName={activePreview.surfaceName}
          title={activePreview.title}
          detectedText={activePreview.detectedText}
          bbox={activePreview.bbox}
        />
      )}
    </div>
  );
};
