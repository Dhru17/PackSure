import React, { useState, useEffect } from 'react';
import { api } from '../../../../services/api';
import type { InspectionCase, PackageEvidence, ComplianceCheck, Violation } from '../../../../types';
import { 
  ArrowLeft, ArrowRight, Download, History,
  ZoomIn, ZoomOut, Maximize2, Layers,
  FileText, ShieldCheck, Gavel, CheckCircle2,
  AlertTriangle, RotateCcw, Building2, Package, Check, ChevronRight
} from 'lucide-react';
import { StatusBadge, DetailDrawer } from '../../../../components/ui';
import { ReviewStageIndicator, type ReviewStage } from '../../components/ReviewStageIndicator';
import { FindingDetailsDrawer } from './FindingDetailsDrawer';
import { ReturnModal } from './ReturnModal';
import { FinalizeModal } from './FinalizeModal';

interface SeniorReviewWorkspaceProps {
  inspectionCase: InspectionCase;
  onBack: () => void;
  onFinalizeComplete: () => void;
}

export const SeniorReviewWorkspace: React.FC<SeniorReviewWorkspaceProps> = ({
  inspectionCase: initialCase,
  onBack,
  onFinalizeComplete
}) => {
  const [currentCase, setCurrentCase] = useState<InspectionCase>(initialCase);
  const [currentStage, setCurrentStage] = useState<ReviewStage>('details');
  const [selectedEvidenceIndex, setSelectedEvidenceIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1.0);

  // Compliance Filter in Stage 3
  const [complianceFilter, setComplianceFilter] = useState<'ALL' | 'PASS' | 'FAIL' | 'REVIEW_REQUIRED'>('ALL');

  // Drawer & Modal States
  const [selectedCheckForDrawer, setSelectedCheckForDrawer] = useState<ComplianceCheck | null>(null);
  const [selectedViolationForDrawer, setSelectedViolationForDrawer] = useState<Violation | null>(null);
  const [isFindingDrawerOpen, setIsFindingDrawerOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [productHistory, setProductHistory] = useState<any>(null);

  // Review & Finalize inputs
  const [seniorRemarks, setSeniorRemarks] = useState(initialCase.senior_remarks || '');
  const [overrideReason, setOverrideReason] = useState('');
  const [statutoryJustification, setStatutoryJustification] = useState('');
  const [confirmedReviewCheckbox, setConfirmedReviewCheckbox] = useState(false);
  const [finalizeDecisionType, setFinalizeDecisionType] = useState<'APPROVE_COMPLIANT' | 'APPROVE_VIOLATIONS' | 'DISMISS_CASE'>('APPROVE_COMPLIANT');

  // Loading states
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Load product history on mount
  useEffect(() => {
    if (currentCase.product_id) {
      api.getProductHistory(currentCase.product_id)
        .then(h => setProductHistory(h))
        .catch(console.error);
    }
  }, [currentCase.product_id]);

  // Refresh case data
  const refreshCase = async () => {
    try {
      const updated = await api.getInspection(currentCase.id);
      setCurrentCase(updated);
    } catch (err) {
      console.error('Error refreshing case:', err);
    }
  };

  // Handle Finding Action from Drawer or Quick Action
  const handleSaveFindingAction = async (action: 'CONFIRMED' | 'OVERRIDDEN' | 'DISMISSED', remarks: string) => {
    if (!selectedViolationForDrawer && !selectedCheckForDrawer) return;
    setIsProcessingAction(true);
    try {
      if (selectedViolationForDrawer) {
        await api.submitViolationAction(currentCase.id, selectedViolationForDrawer.id, {
          action,
          override_reason: remarks || undefined
        });
      } else if (selectedCheckForDrawer) {
        await api.submitCheckAction(currentCase.id, selectedCheckForDrawer.id, {
          action,
          override_reason: remarks || undefined
        });
      }
      setActionNotice(`Finding adjudication saved: ${action}`);
      await refreshCase();
      setIsFindingDrawerOpen(false);
      setSelectedViolationForDrawer(null);
      setSelectedCheckForDrawer(null);
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Open Drawer for a Check or Violation
  const handleOpenFindingDrawer = (check: ComplianceCheck) => {
    setSelectedCheckForDrawer(check);
    const cleanCCode = (check.rule_code || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const relatedViolation = currentCase.violations?.find(v => {
      const cleanVCode = v.rule_code.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      return cleanVCode === cleanCCode || cleanVCode.includes(cleanCCode) || cleanCCode.includes(cleanVCode);
    }) || null;
    setSelectedViolationForDrawer(relatedViolation);
    setIsFindingDrawerOpen(true);
  };

  // Handle Return for Reinspection
  const handleConfirmReturn = async (data: { reason: string; sections: string[] }) => {
    setIsProcessingAction(true);
    try {
      await api.returnCaseForReinspection(currentCase.id, {
        reason: data.reason,
        remarks: `[Sections: ${data.sections.join(', ')}] ${data.reason}`,
        statutory_citation: data.sections.join(', ')
      });
      setIsReturnModalOpen(false);
      onFinalizeComplete();
    } catch (err: any) {
      alert(`Return failed: ${err.message}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle Finalize Inspection
  const handleConfirmFinalize = async () => {
    setIsProcessingAction(true);
    try {
      await api.finalizeCaseReview(currentCase.id, {
        action: finalizeDecisionType,
        remarks: seniorRemarks,
        override_reason: overrideReason,
        statutory_justification: statutoryJustification
      });
      setIsFinalizeModalOpen(false);
      onFinalizeComplete();
    } catch (err: any) {
      alert(`Finalize failed: ${err.message}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const currentEvidence: PackageEvidence | undefined = currentCase.evidences?.[selectedEvidenceIndex];

  const filteredComplianceChecks = currentCase.compliance_checks?.filter(c => {
    if (complianceFilter === 'ALL') return true;
    if (complianceFilter === 'PASS') return c.status === 'PASS';
    if (complianceFilter === 'FAIL') return c.status === 'FAIL';
    if (complianceFilter === 'REVIEW_REQUIRED') return c.status === 'REVIEW_REQUIRED';
    return true;
  }) || [];

  return (
    <div className="space-y-4">
      {/* Workspace Header Bar */}
      <div className="bg-white border border-[#D8DDE3] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#174A7E] bg-[#EBF3FA] px-2.5 py-1 rounded border border-[#CBD5E1]">
              {currentCase.case_number}
            </span>
            <span className="text-xs font-bold text-[#1E293B]">
              &bull; {currentCase.product?.brand_name} ({currentCase.product?.commodity_name})
            </span>
            <StatusBadge status={currentCase.status} />
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Inspector: <strong className="text-[#334155]">{currentCase.inspector_name}</strong> &bull; Surfaces: <strong className="text-[#1E293B]">{currentCase.evidences?.length || 0}</strong> &bull; Compliance Score: <strong className="text-[#15803D]">{currentCase.compliance_score?.toFixed(0) || 0}%</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setHistoryDrawerOpen(true)}
            className="px-3 py-1.5 bg-white hover:bg-[#F8F9FA] text-[#475569] rounded-lg text-xs font-bold border border-[#CBD5E1] flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-[#174A7E]" />
            <span>Product History</span>
          </button>
          <a
            href={api.getReportPdfUrl(currentCase.id)}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-white hover:bg-[#F8F9FA] text-[#174A7E] rounded-lg text-xs font-bold border border-[#CBD5E1] flex items-center gap-1.5 shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Draft PDF</span>
          </a>
          <button
            onClick={onBack}
            className="px-3 py-1.5 bg-white hover:bg-[#F8F9FA] text-[#475569] rounded-lg text-xs font-bold border border-[#CBD5E1] flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Reviews</span>
          </button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="bg-[#EBF3FA] border border-[#CBD5E1] rounded-xl p-3.5 flex items-center justify-between gap-4 text-xs shadow-xs">
          <div className="flex items-center gap-2 text-[#174A7E]">
            <Check className="w-4 h-4 text-[#174A7E] shrink-0" />
            <span className="font-semibold">{actionNotice}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="px-2.5 py-1 bg-white hover:bg-[#F8F9FA] text-[#475569] rounded text-[11px] font-bold border border-[#CBD5E1] cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4 Review Stages Switcher */}
      <ReviewStageIndicator
        currentStage={currentStage}
        onSelectStage={setCurrentStage}
        evidenceCount={currentCase.evidences?.length || 0}
        checksCount={currentCase.compliance_checks?.length || 0}
      />

      {/* STAGE 1: CASE DETAILS (OVERVIEW) */}
      {currentStage === 'details' && (
        <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-6">
          <div className="border-b border-[#E2E8F0] pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#174A7E]" /> Case Identity & Inspector Submission
              </h3>
              <p className="text-xs text-[#64748B]">
                Review commodity specifications, verification notes, and field timeline.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Product Specifications */}
            <div className="bg-[#F8F9FA] border border-[#D8DDE3] rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-[#174A7E]" />
                <span>Product Specifications</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block font-bold">Brand</span>
                  <span className="font-bold text-[#1E293B]">{currentCase.product?.brand_name || 'N/A'}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block font-bold">Commodity</span>
                  <span className="font-bold text-[#1E293B]">{currentCase.product?.commodity_name || 'N/A'}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block font-bold">Barcode (GTIN)</span>
                  <span className="font-mono font-bold text-[#174A7E]">{currentCase.product?.barcode || 'N/A'}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block font-bold">Package Type</span>
                  <span className="font-semibold text-[#1E293B]">{currentCase.product?.package_type || 'BOX'}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-[#E2E8F0] col-span-2">
                  <span className="text-[10px] text-[#64748B] block font-bold">Principal Display Panel (PDP)</span>
                  <span className="font-mono font-bold text-[#1E293B]">
                    {currentCase.product?.pdp_width_cm || 0} &times; {currentCase.product?.pdp_height_cm || 0} cm ({currentCase.product?.pdp_area_cm2 || 0} cm²)
                  </span>
                </div>
              </div>
            </div>

            {/* Inspector Notes & Submission Profile */}
            <div className="bg-[#F8F9FA] border border-[#D8DDE3] rounded-xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#174A7E]" />
                  <span>Field Inspector Verification</span>
                </h4>
                <div className="bg-white p-3 rounded-lg border border-[#E2E8F0] text-xs space-y-2">
                  <div className="flex justify-between items-center text-[11px] text-[#64748B]">
                    <span>Inspector: <strong className="text-[#1E293B]">{currentCase.inspector_name}</strong></span>
                    <span>Date: <strong className="text-[#1E293B]">{new Date(currentCase.created_at).toLocaleDateString()}</strong></span>
                  </div>
                  <div className="pt-1.5 border-t border-[#F1F5F9]">
                    <span className="text-[10px] text-[#64748B] font-bold block uppercase">Inspector Notes:</span>
                    <p className="italic text-xs text-[#1E293B] mt-0.5">
                      {currentCase.inspector_remarks || 'Field inspection completed with digital evidence uploads.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Inspection Summary Card */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2">
                <div className="bg-white p-2 rounded-lg border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block font-bold">Surfaces</span>
                  <span className="font-mono font-bold text-[#174A7E]">{currentCase.evidences?.length || 0}</span>
                </div>
                <div className="bg-[#F0FDF4] p-2 rounded-lg border border-[#BBF7D0]">
                  <span className="text-[10px] text-[#15803D] block font-bold">Compliant</span>
                  <span className="font-mono font-bold text-[#16A34A]">{currentCase.passed_checks}</span>
                </div>
                <div className="bg-[#FEF2F2] p-2 rounded-lg border border-[#FECACA]">
                  <span className="text-[10px] text-[#991B1B] block font-bold">Non-Compliant</span>
                  <span className="font-mono font-bold text-[#DC2626]">{currentCase.failed_checks}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Resubmission Diff Notice (If Case Was Resubmitted) */}
          {currentCase.status === 'SENIOR_REVIEW' && currentCase.senior_remarks && (
            <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-xl p-4 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-[#92400E] font-bold">
                <RotateCcw className="w-4 h-4" />
                <span>Changes Since Previous Review (Resubmission)</span>
              </div>
              <p className="text-[#78350F]">
                Previous senior instructions: &ldquo;{currentCase.senior_remarks}&rdquo;
              </p>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex justify-end pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setCurrentStage('evidence')}
              className="px-5 py-2.5 bg-[#174A7E] hover:bg-[#0F3B66] text-white rounded-lg font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <span>Next: Review Evidence Surfaces</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: EVIDENCE REVIEW */}
      {currentStage === 'evidence' && (
        <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-[#E2E8F0] pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#174A7E]" /> Evidence Packaging Filmstrip ({currentCase.evidences?.length || 0} Surfaces)
              </h3>
              <p className="text-xs text-[#64748B]">
                Inspect high-resolution packaging surfaces captured during field verification.
              </p>
            </div>
            <div className="flex items-center gap-1 bg-[#F8F9FA] px-2 py-0.5 rounded border border-[#E2E8F0]">
              <button
                onClick={() => setZoomLevel(prev => Math.max(0.7, prev - 0.2))}
                className="p-1 hover:text-[#174A7E] text-[#64748B] cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono text-[#475569] px-1 font-bold">{(zoomLevel * 100).toFixed(0)}%</span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.2))}
                className="p-1 hover:text-[#174A7E] text-[#64748B] cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(1.0)}
                className="p-1 hover:text-[#174A7E] text-[#64748B] ml-1 cursor-pointer"
                title="Reset Zoom"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Surface Filmstrip Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {currentCase.evidences?.map((ev, idx) => (
              <button
                key={ev.id}
                onClick={() => setSelectedEvidenceIndex(idx)}
                className={`shrink-0 px-3 py-2 rounded-lg text-xs font-bold border transition flex items-center gap-2 cursor-pointer ${
                  selectedEvidenceIndex === idx
                    ? 'bg-[#EBF3FA] text-[#174A7E] border-[#174A7E] shadow-2xs'
                    : 'bg-[#F8F9FA] text-[#64748B] border-[#D8DDE3] hover:text-[#1E293B]'
                }`}
              >
                <span>{ev.surface_type}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${
                  ev.quality_verdict === 'READABLE' ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]' : 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                }`}>
                  {ev.quality_verdict}
                </span>
              </button>
            ))}
          </div>

          {/* Interactive Zoom/Pan Image Viewer */}
          <div className="relative h-96 bg-[#F8F9FA] rounded-xl overflow-hidden border border-[#D8DDE3] flex items-center justify-center p-3">
            {currentEvidence ? (
              <div className="relative max-h-full max-w-full overflow-auto flex items-center justify-center">
                <img
                  src={api.getMediaUrl(currentEvidence.storage_path)}
                  alt={currentEvidence.surface_type}
                  style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.15s ease-out' }}
                  className="max-h-84 object-contain select-none rounded"
                />
              </div>
            ) : (
              <div className="text-xs text-[#94A3B8]">No evidence photo available for this surface.</div>
            )}
          </div>

          {/* Evidence Surface Metadata Card */}
          {currentEvidence && (
            <div className="grid grid-cols-3 gap-3 text-xs bg-[#F8F9FA] p-3 rounded-xl border border-[#D8DDE3] text-[#64748B]">
              <div>
                <span className="text-[#94A3B8] text-[10px] uppercase font-bold block">Surface Type</span>
                <p className="font-bold text-[#1E293B]">{currentEvidence.surface_type}</p>
              </div>
              <div>
                <span className="text-[#94A3B8] text-[10px] uppercase font-bold block">Quality Verdict</span>
                <p className="font-bold text-[#15803D]">{currentEvidence.quality_verdict}</p>
              </div>
              <div>
                <span className="text-[#94A3B8] text-[10px] uppercase font-bold block">Resolution</span>
                <p className="font-mono text-[#1E293B]">{currentEvidence.width_px || 0} &times; {currentEvidence.height_px || 0} px</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setCurrentStage('details')}
              className="px-3.5 py-2 bg-white hover:bg-[#F8F9FA] text-[#475569] rounded-lg text-xs font-bold border border-[#CBD5E1] flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Case Details
            </button>

            <button
              type="button"
              onClick={() => setCurrentStage('compliance')}
              className="px-5 py-2.5 bg-[#174A7E] hover:bg-[#0F3B66] text-white rounded-lg font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <span>Next: Review Compliance Findings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 3: COMPLIANCE REVIEW */}
      {currentStage === 'compliance' && (
        <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="border-b border-[#E2E8F0] pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#174A7E]" /> Compliance Findings & Declarations
              </h3>
              <p className="text-xs text-[#64748B]">
                Verify AI detections and human verifications against statutory rules. Click any item for details.
              </p>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 bg-[#F8F9FA] p-1 rounded-lg border border-[#D8DDE3] overflow-x-auto">
              <button
                onClick={() => setComplianceFilter('ALL')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                  complianceFilter === 'ALL' ? 'bg-[#174A7E] text-white' : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                All ({currentCase.compliance_checks?.length || 0})
              </button>
              <button
                onClick={() => setComplianceFilter('PASS')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                  complianceFilter === 'PASS' ? 'bg-[#15803D] text-white' : 'text-[#15803D] hover:bg-[#F0FDF4]'
                }`}
              >
                Compliant ({currentCase.passed_checks})
              </button>
              <button
                onClick={() => setComplianceFilter('FAIL')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                  complianceFilter === 'FAIL' ? 'bg-[#991B1B] text-white' : 'text-[#991B1B] hover:bg-[#FEF2F2]'
                }`}
              >
                Non-Compliant ({currentCase.failed_checks})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left Column: Verified Declarations */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#475569] uppercase tracking-wider">
                Extracted Declarations ({currentCase.declarations?.length || 0})
              </h4>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {currentCase.declarations?.map((d) => (
                  <div
                    key={d.id}
                    className="bg-[#F8F9FA] border border-[#D8DDE3] rounded-lg p-3 space-y-1.5 shadow-2xs text-xs"
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-[#174A7E] font-bold">{d.title}</span>
                      {d.font_height_mm && (
                        <span className="text-[10px] text-[#475569] font-mono bg-white px-1.5 py-0.2 rounded border border-[#CBD5E1]">
                          Font: {d.font_height_mm.toFixed(1)} mm
                        </span>
                      )}
                    </div>
                    <div className="text-[#1E293B] font-mono text-xs flex justify-between items-center bg-white p-2 rounded border border-[#E2E8F0]">
                      <div>
                        <span className="text-[10px] text-[#64748B] block uppercase font-bold">Value</span>
                        <span>{d.inspector_corrected_value || d.extracted_value || 'N/A'}</span>
                      </div>
                      {d.inspector_corrected_value && (
                        <span className="text-[9px] text-[#B45309] font-bold bg-[#FEF3C7] px-1.5 py-0.5 rounded border border-[#FDE68A]">
                          INSPECTOR VERIFIED
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Rule Compliance Checks */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#475569] uppercase tracking-wider">
                Statutory Rule Evaluations ({filteredComplianceChecks.length})
              </h4>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {filteredComplianceChecks.map((check) => (
                  <div
                    key={check.id}
                    onClick={() => handleOpenFindingDrawer(check)}
                    className={`p-3 rounded-lg border transition shadow-2xs text-xs space-y-1 cursor-pointer hover:shadow-xs ${
                      check.status === 'PASS'
                        ? 'bg-[#F0FDF4] border-[#BBF7D0]'
                        : check.status === 'FAIL'
                        ? 'bg-[#FEF2F2] border-[#FECACA]'
                        : 'bg-[#FFFBEB] border-[#FDE68A]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-[#1E293B]">{check.rule_code}</span>
                          <span className="text-xs font-semibold text-[#334155]">&bull; {check.expected_condition || check.rule_title}</span>
                        </div>
                        <p className="text-xs text-[#475569] mt-0.5">{check.reason_explanation}</p>
                        <p className="text-[10px] text-[#64748B] mt-0.5">Citation: <strong>{check.statutory_citation}</strong></p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={check.status} />
                        <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Itemized Violations Requiring Action */}
          {currentCase.violations && currentCase.violations.length > 0 && (
            <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-4 shadow-xs space-y-2.5">
              <h4 className="text-xs font-bold text-[#991B1B] uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>Flagged Violations ({currentCase.violations.length})</span>
              </h4>
              <div className="space-y-2">
                {currentCase.violations.map((v) => (
                  <div key={v.id} className="p-3 bg-white rounded-lg border border-[#FECACA] text-xs space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#991B1B]">{v.rule_code} - {v.violation_title}</span>
                      <span className="font-mono text-[10px] text-[#B45309] font-bold bg-[#FEF3C7] px-1.5 py-0.2 rounded border border-[#FDE68A]">{v.senior_decision || 'PENDING'}</span>
                    </div>
                    <p className="text-[#475569] text-xs">{v.description}</p>
                    
                    {/* Per-Violation Action Buttons */}
                    <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedViolationForDrawer(v);
                          const cleanVCode = v.rule_code.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                          const check = currentCase.compliance_checks?.find(c => {
                            const cleanCCode = (c.rule_code || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                            return cleanCCode === cleanVCode || cleanCCode.includes(cleanVCode) || cleanVCode.includes(cleanCCode);
                          }) || null;
                          setSelectedCheckForDrawer(check);
                          setIsFindingDrawerOpen(true);
                        }}
                        className="px-2.5 py-1 bg-[#174A7E] hover:bg-[#0F3B66] text-white rounded text-[11px] font-bold cursor-pointer"
                      >
                        Adjudicate Finding &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setCurrentStage('evidence')}
              className="px-3.5 py-2 bg-white hover:bg-[#F8F9FA] text-[#475569] rounded-lg text-xs font-bold border border-[#CBD5E1] flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Evidence
            </button>

            <button
              type="button"
              onClick={() => setCurrentStage('finalize')}
              className="px-5 py-2.5 bg-[#174A7E] hover:bg-[#0F3B66] text-white rounded-lg font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <span>Next: Review & Finalize</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 4: REVIEW & FINALIZE */}
      {currentStage === 'finalize' && (
        <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-6">
          <div className="border-b border-[#E2E8F0] pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-2">
                <Gavel className="w-4 h-4 text-[#174A7E]" /> Supervisory Determination & Section 36 Directives
              </h3>
              <p className="text-xs text-[#64748B]">
                Issue final statutory determinations, compounding directives, or return case for field re-inspection.
              </p>
            </div>
          </div>

          {/* Case Findings Summary Banner */}
          <div className="bg-[#F8F9FA] border border-[#D8DDE3] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs">
              <span className="font-mono text-xs font-bold text-[#174A7E] bg-white px-2.5 py-1 rounded border border-[#CBD5E1]">
                {currentCase.case_number}
              </span>
              <span className="font-bold text-[#1E293B]">{currentCase.product?.brand_name} &bull; {currentCase.product?.commodity_name}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#15803D] bg-[#F0FDF4] px-2.5 py-1 rounded border border-[#BBF7D0]">
                {currentCase.passed_checks} Compliant
              </span>
              <span className="text-xs font-mono font-bold text-[#B91C1C] bg-[#FEF2F2] px-2.5 py-1 rounded border border-[#FECACA]">
                {currentCase.failed_checks} Non-Compliant
              </span>
            </div>
          </div>

          {/* Statutory Inputs */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">
                  Statutory Ground / Exemption
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rule 26 Exemption / Compoundable under Section 49"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:ring-1 focus:ring-[#174A7E]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">
                  Statutory Section Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Section 36(1) / Schedule II Font Height Violation"
                  value={statutoryJustification}
                  onChange={(e) => setStatutoryJustification(e.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:ring-1 focus:ring-[#174A7E]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">
                Senior Remarks & Directions
              </label>
              <textarea
                rows={3}
                value={seniorRemarks}
                onChange={(e) => setSeniorRemarks(e.target.value)}
                placeholder="Enter formal supervisory directions, compounding notice orders, or re-inspection remand instructions..."
                className="w-full bg-white border border-[#CBD5E1] rounded-lg p-3 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:ring-1 focus:ring-[#174A7E]"
              />
            </div>

            {/* Confirmation Checkbox */}
            <div className="bg-[#F8F9FA] p-3 rounded-xl border border-[#CBD5E1]">
              <label className="flex items-center gap-3 text-xs font-semibold text-[#1E293B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmedReviewCheckbox}
                  onChange={(e) => setConfirmedReviewCheckbox(e.target.checked)}
                  className="rounded text-[#174A7E] focus:ring-[#174A7E]"
                />
                <span>I have reviewed the packaging evidence, OCR extractions, and compliance findings for this case.</span>
              </label>
            </div>
          </div>

          {/* Determination Action Buttons */}
          <div className="pt-4 border-t border-[#E2E8F0] space-y-2">
            <span className="text-[10px] text-[#64748B] uppercase font-bold block">Final Statutory Determination</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                disabled={!confirmedReviewCheckbox || isProcessingAction}
                onClick={() => {
                  setFinalizeDecisionType(currentCase.failed_checks > 0 ? 'APPROVE_VIOLATIONS' : 'APPROVE_COMPLIANT');
                  setIsFinalizeModalOpen(true);
                }}
                className={`py-3 px-4 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-40 ${
                  currentCase.failed_checks > 0
                    ? 'bg-[#B91C1C] hover:bg-[#991B1B]'
                    : 'bg-[#15803D] hover:bg-[#166534]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {currentCase.failed_checks > 0 ? 'Finalize & Issue Notice' : 'Finalize & Approve Compliant'}
                </span>
              </button>

              <button
                type="button"
                disabled={isProcessingAction}
                onClick={() => setIsReturnModalOpen(true)}
                className="py-3 px-4 bg-[#B45309] hover:bg-[#92400E] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Return for Reinspection</span>
              </button>

              <button
                type="button"
                disabled={!confirmedReviewCheckbox || isProcessingAction}
                onClick={() => {
                  setFinalizeDecisionType('DISMISS_CASE');
                  setIsFinalizeModalOpen(true);
                }}
                className="py-3 px-4 bg-white hover:bg-[#F8F9FA] text-[#475569] rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-[#CBD5E1] cursor-pointer disabled:opacity-40"
              >
                <span>Dismiss Case</span>
              </button>
            </div>
          </div>

          {/* Back Button */}
          <div className="flex justify-start pt-2">
            <button
              type="button"
              onClick={() => setCurrentStage('compliance')}
              className="px-3.5 py-2 bg-white hover:bg-[#F8F9FA] text-[#475569] rounded-lg text-xs font-bold border border-[#CBD5E1] flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Compliance Review
            </button>
          </div>
        </div>
      )}

      {/* Drawer: Individual Finding Details & Adjudication */}
      <FindingDetailsDrawer
        isOpen={isFindingDrawerOpen}
        onClose={() => {
          setIsFindingDrawerOpen(false);
          setSelectedCheckForDrawer(null);
          setSelectedViolationForDrawer(null);
        }}
        check={selectedCheckForDrawer}
        violation={selectedViolationForDrawer}
        declaration={currentCase.declarations?.find(d => 
          (selectedCheckForDrawer?.evaluated_value && d.extracted_value === selectedCheckForDrawer.evaluated_value) ||
          (selectedCheckForDrawer?.expected_condition && d.title.toLowerCase().includes(selectedCheckForDrawer.expected_condition.toLowerCase())) ||
          (selectedCheckForDrawer?.rule_title && d.title.toLowerCase().includes(selectedCheckForDrawer.rule_title.toLowerCase()))
        )}
        onSaveAction={handleSaveFindingAction}
        isProcessing={isProcessingAction}
      />

      {/* Modal: Return for Reinspection */}
      <ReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        inspectionCase={currentCase}
        onConfirmReturn={handleConfirmReturn}
        isProcessing={isProcessingAction}
      />

      {/* Modal: Finalize Review Confirmation */}
      <FinalizeModal
        isOpen={isFinalizeModalOpen}
        onClose={() => setIsFinalizeModalOpen(false)}
        inspectionCase={currentCase}
        finalDecisionType={finalizeDecisionType}
        seniorRemarks={seniorRemarks}
        onConfirmFinalize={handleConfirmFinalize}
        isProcessing={isProcessingAction}
      />

      {/* Product History Drawer */}
      <DetailDrawer
        isOpen={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        title="Historical Product & Mfg Surveillance"
        context="Previous statutory inspections for this product & manufacturer"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-[#F8F9FA] rounded-xl border border-[#D8DDE3] space-y-2">
            <div className="flex items-center gap-2 text-xs text-[#174A7E] font-bold">
              <Building2 className="w-4 h-4" />
              <span>Manufacturer: {productHistory?.manufacturer_summary?.name || 'N/A'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-[#64748B] pt-1">
              <div>Lifetime Inspections: <strong className="text-[#1E293B]">{productHistory?.manufacturer_summary?.total_inspections || 0}</strong></div>
              <div>Violations Recorded: <strong className="text-[#DC2626]">{productHistory?.manufacturer_summary?.total_violations || 0}</strong></div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-[#174A7E]" />
              <span>Past Product Inspections</span>
            </h4>

            {productHistory?.product_inspections?.length === 0 ? (
              <p className="text-xs text-[#94A3B8] p-3 bg-[#F8F9FA] rounded-lg border border-[#D8DDE3] text-center">
                First statutory inspection on record for this product.
              </p>
            ) : (
              <div className="space-y-2">
                {productHistory?.product_inspections?.map((c: any) => (
                  <div key={c.case_id} className="p-3 bg-[#F8F9FA] border border-[#D8DDE3] rounded-lg text-xs space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#174A7E]">{c.case_number}</span>
                      <StatusBadge
                        status={c.final_decision === 'COMPLIANT' ? 'PASS' : 'FAIL'}
                        label={c.final_decision}
                      />
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      Score: {c.compliance_score?.toFixed(0)}% &bull; Failed: {c.failed_checks} &bull; {c.finalized_at ? new Date(c.finalized_at).toLocaleDateString() : 'Historical'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DetailDrawer>
    </div>
  );
};
