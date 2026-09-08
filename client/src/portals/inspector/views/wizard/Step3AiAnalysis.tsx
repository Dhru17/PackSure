import React, { useState } from 'react';
import type { InspectionCase, Declaration, ComplianceCheck } from '../../../../types';
import { EvidencePreviewModal } from './EvidencePreviewModal';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight, 
  Eye, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck
} from 'lucide-react';

interface Step3AiAnalysisProps {
  inspectionCase: InspectionCase;
  onBack: () => void;
  onContinue: () => void;
}

export const Step3AiAnalysis: React.FC<Step3AiAnalysisProps> = ({
  inspectionCase: c,
  onBack,
  onContinue
}) => {
  const [activePreview, setActivePreview] = useState<{
    imagePath?: string;
    surfaceName?: string;
    title?: string;
    detectedText?: string;
    bbox?: { x: number; y: number; w: number; h: number };
  } | null>(null);

  const [expandedDetailsId, setExpandedDetailsId] = useState<number | null>(null);

  // Group checks into "Looks Good" (PASS) vs "Needs Attention" (FAIL / REVIEW_REQUIRED)
  const checks = c.compliance_checks || [];
  const passedChecks = checks.filter(chk => chk.status === 'PASS');
  const attentionChecks = checks.filter(chk => chk.status === 'FAIL' || chk.status === 'REVIEW_REQUIRED');

  // Applicable requirement domains
  const applicableRequirementCategories = [
    'Product Identification (Rule 6(1)(a))',
    'Net Quantity & Unit (Rule 6(1)(e))',
    'Maximum Retail Price - MRP (Rule 6(1)(f))',
    'Manufacturer / Packer Details (Rule 6(1)(b))',
    'Date of Manufacture / Packaging (Rule 6(1)(d))',
    'Consumer Care Contact (Rule 6(1)(h))',
    'Country of Origin (For Imported Goods)',
  ];

  const handleOpenEvidence = (chk: ComplianceCheck) => {
    const matchingEv = c.evidences?.find(e => e.id === chk.evidence_id) || c.evidences?.[0];
    setActivePreview({
      imagePath: matchingEv?.storage_path,
      surfaceName: matchingEv?.surface_type || 'Package Panel',
      title: chk.rule_title || 'Declaration Finding',
      detectedText: chk.evaluated_value,
      bbox: chk.bbox
    });
  };

  const handleOpenDeclEvidence = (decl: Declaration) => {
    const matchingEv = c.evidences?.find(e => e.id === decl.evidence_id) || c.evidences?.[0];
    setActivePreview({
      imagePath: matchingEv?.storage_path,
      surfaceName: matchingEv?.surface_type || decl.surface_name || 'Package Panel',
      title: decl.title || decl.field_type,
      detectedText: decl.extracted_value,
      bbox: decl.bbox
    });
  };

  return (
    <div className="bg-white border border-[#D8DDE3] rounded-2xl p-6 sm:p-8 shadow-xs space-y-8">
      {/* Header & Purpose */}
      <div className="border-b border-[#E2E8F0] pb-4">
        <h2 className="text-lg font-bold text-[#1E293B] tracking-tight flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-[#174A7E]" />
          <span>AI Metrology Analysis Findings</span>
        </h2>
        <p className="text-xs text-[#64748B] mt-1 font-medium">
          The system has extracted declarations across captured package panels and evaluated applicable Legal Metrology requirements.
        </p>
      </div>

      {/* Step 3A: Applicable Requirements Context */}
      <div className="bg-[#F8FAFC] border border-[#D8DDE3] rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#1E293B] uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-[#174A7E]" />
          <span>Requirements Checked for This Product</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {applicableRequirementCategories.map((req, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-3 py-1 rounded-lg bg-white border border-[#CBD5E1] text-[11px] font-semibold text-[#334155] shadow-2xs"
            >
              {req}
            </span>
          ))}
        </div>
      </div>

      {/* Step 3B: Overall AI Result Banner */}
      {attentionChecks.length === 0 ? (
        <div className="p-5 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl flex items-center gap-3.5">
          <div className="p-2 bg-[#DCFCE7] text-[#15803D] rounded-xl flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#15803D]">No Obvious Issues Found</div>
            <p className="text-xs text-[#166534] mt-0.5 font-medium">
              All extracted declarations appear to align with standard Legal Metrology requirements. Please review findings and confirm verification in the next step.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-5 bg-[#FFFBEB] border border-[#FEF3C7] rounded-xl flex items-center gap-3.5">
          <div className="p-2 bg-[#FEF3C7] text-[#D97706] rounded-xl flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#92400E]">
              {attentionChecks.length} Item{attentionChecks.length === 1 ? '' : 's'} Need Your Attention
            </div>
            <p className="text-xs text-[#78350F] mt-0.5 font-medium">
              Certain mandatory declarations may be missing, unclear, or non-compliant. Inspect the findings below.
            </p>
          </div>
        </div>
      )}

      {/* Step 3D: What Needs Attention ⚠ */}
      {attentionChecks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#DC2626] uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Needs Attention ({attentionChecks.length})</span>
          </div>

          <div className="space-y-3">
            {attentionChecks.map((chk) => {
              const isExpanded = expandedDetailsId === chk.id;
              const isFail = chk.status === 'FAIL';

              return (
                <div
                  key={chk.id}
                  className="bg-white border border-[#FECACA] rounded-xl p-5 shadow-xs space-y-3 transition-colors hover:border-[#F87171]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#1E293B]">
                          {chk.rule_title || chk.rule_code || 'Statutory Requirement'}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          isFail
                            ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                            : 'bg-[#FFFBEB] text-[#D97706] border border-[#FEF3C7]'
                        }`}>
                          {isFail ? 'Potential Issue' : 'Needs Verification'}
                        </span>
                      </div>
                      <p className="text-xs text-[#475569] font-medium">
                        {chk.reason_explanation || 'System detected a potential non-compliance or unverified declaration.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEvidence(chk)}
                        className="px-3.5 py-1.5 bg-[#EBF3FA] hover:bg-[#D9E9F7] text-[#174A7E] font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View on Package</span>
                      </button>
                    </div>
                  </div>

                  {/* Collapsible Technical Details (tucked away to avoid clutter) */}
                  <div className="border-t border-[#F1F5F9] pt-2">
                    <button
                      type="button"
                      onClick={() => setExpandedDetailsId(isExpanded ? null : chk.id)}
                      className="text-[11px] font-semibold text-[#64748B] hover:text-[#1E293B] flex items-center gap-1"
                    >
                      <span>{isExpanded ? 'Hide Technical Details' : 'View Technical Details'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-2.5 p-3.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-2 text-[11px]">
                        <div>
                          <strong className="text-[#1E293B]">Applicable Rule Citation:</strong>{' '}
                          <span className="font-mono text-[#475569]">{chk.statutory_citation || 'Legal Metrology Rules, 2011'}</span>
                        </div>
                        {chk.evaluated_value && (
                          <div>
                            <strong className="text-[#1E293B]">Raw OCR Detected Value:</strong>{' '}
                            <span className="font-mono text-[#1E293B] bg-white px-2 py-0.5 rounded border border-[#CBD5E1]">
                              {chk.evaluated_value}
                            </span>
                          </div>
                        )}
                        {chk.expected_condition && (
                          <div>
                            <strong className="text-[#1E293B]">Required Statutory Condition:</strong>{' '}
                            <span className="text-[#475569]">{chk.expected_condition}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3C: What Looks Good ✓ */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-[#15803D] uppercase tracking-wider">
          <CheckCircle2 className="w-4 h-4" />
          <span>Looks Good ({passedChecks.length > 0 ? passedChecks.length : (c.declarations?.length || 0)})</span>
        </div>

        <div className="space-y-2.5">
          {passedChecks.length > 0 ? (
            passedChecks.map((chk) => (
              <div
                key={chk.id}
                className="bg-white border border-[#DCFCE7] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#1E293B]">{chk.rule_title || chk.rule_code}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7]">
                      Correct
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {chk.evaluated_value ? `Detected: "${chk.evaluated_value}"` : 'Clearly mentioned and matches statutory requirements.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenEvidence(chk)}
                  className="px-3 py-1 bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#174A7E] font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-2xs self-end sm:self-auto cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View</span>
                </button>
              </div>
            ))
          ) : (
            c.declarations?.map((decl) => (
              <div
                key={decl.id}
                className="bg-white border border-[#DCFCE7] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#1E293B]">{decl.title || decl.field_type}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7]">
                      Detected
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Extracted: <strong className="text-[#1E293B]">&ldquo;{decl.extracted_value}&rdquo;</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenDeclEvidence(decl)}
                  className="px-3 py-1 bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#174A7E] font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-2xs self-end sm:self-auto cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Navigation Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#475569] font-bold rounded-lg text-xs transition flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Evidence</span>
        </button>

        <button
          type="button"
          onClick={onContinue}
          className="px-6 py-2.5 bg-[#174A7E] hover:bg-[#133E68] text-white font-bold rounded-lg text-xs transition shadow-xs flex items-center gap-2 cursor-pointer"
        >
          <span>Continue to Compliance Verification</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Full Size Preview Modal */}
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
