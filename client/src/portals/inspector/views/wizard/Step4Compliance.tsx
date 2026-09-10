import React, { useState } from 'react';
import type { InspectionCase, ComplianceCheck } from '../../../../types';
import { api } from '../../../../services/api';
import { EvidencePreviewModal } from './EvidencePreviewModal';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowLeft, 
  ArrowRight, 
  Eye, 
  Edit3, 
  Check, 
  X,
  FileCheck2,
  Scale
} from 'lucide-react';

interface Step4ComplianceProps {
  inspectionCase: InspectionCase;
  corrections: Record<string, string>;
  setCorrections: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onBack: () => void;
  onContinue: () => void;
}

export const Step4Compliance: React.FC<Step4ComplianceProps> = ({
  inspectionCase: c,
  corrections,
  setCorrections,
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

  // Inspector manual decisions override state
  const [decisions, setDecisions] = useState<Record<string, 'CONFIRMED' | 'CORRECTED' | 'DISMISSED'>>({});
  const [activeCorrectionField, setActiveCorrectionField] = useState<string | null>(null);
  const [dismissReasons, setDismissReasons] = useState<Record<string, string>>({});

  // Physical measurements state
  const [actualNetQty, setActualNetQty] = useState(c.actual_net_quantity || c.product?.default_net_quantity || '');
  const [fontHeight, setFontHeight] = useState<string | number>(c.actual_font_height_mm || 4.0);
  const [pdpWidth, setPdpWidth] = useState<string | number>(c.actual_pdp_width_cm || c.product?.pdp_width_cm || 15.0);
  const [pdpHeight, setPdpHeight] = useState<string | number>(c.actual_pdp_height_cm || c.product?.pdp_height_cm || 10.0);
  const [measurementMethod, setMeasurementMethod] = useState(c.measurement_method || 'Standard Vernier Caliper & Calibrated Balance');
  const [calibratedScale, setCalibratedScale] = useState(c.calibrated_scale_used ?? true);
  const [measurementSaved, setMeasurementSaved] = useState(false);

  const checks = c.compliance_checks || [];
  const declarations = c.declarations || [];

  // Metrics calculation based on inspector verification
  const compliantCount = checks.filter(chk => {
    const dec = decisions[String(chk.id)];
    if (dec === 'DISMISSED') return false;
    return chk.status === 'PASS' || dec === 'CONFIRMED';
  }).length || declarations.length;

  const nonCompliantCount = checks.filter(chk => {
    const dec = decisions[String(chk.id)];
    if (dec === 'DISMISSED') return false;
    return chk.status === 'FAIL' && dec !== 'CORRECTED';
  }).length;

  const needsVerificationCount = checks.filter(chk => {
    const dec = decisions[String(chk.id)];
    return chk.status === 'REVIEW_REQUIRED' && !dec;
  }).length;

  const handleDecision = (key: string, decision: 'CONFIRMED' | 'CORRECTED' | 'DISMISSED') => {
    setDecisions(prev => ({ ...prev, [key]: decision }));
    if (decision === 'CORRECTED') {
      setActiveCorrectionField(key);
    } else {
      if (activeCorrectionField === key) setActiveCorrectionField(null);
    }
  };

  const handleOpenEvidence = (chk: ComplianceCheck) => {
    let matchingEv = c.evidences?.find(e => e.id === chk.evidence_id);
    let bbox = chk.bbox;
    let surfaceName: string | undefined = matchingEv?.surface_type;

    const decl = c.declarations?.find(d => 
      (chk.evaluated_value && d.extracted_value && (d.extracted_value === chk.evaluated_value || d.extracted_value.includes(chk.evaluated_value) || chk.evaluated_value.includes(d.extracted_value))) ||
      (chk.rule_code && d.field_type && chk.rule_code.toLowerCase().includes(d.field_type.toLowerCase()))
    );

    if (decl) {
      if (decl.evidence_id) {
        const evFromDecl = c.evidences?.find(e => e.id === decl.evidence_id);
        if (evFromDecl) matchingEv = evFromDecl;
      }
      if (!bbox || Object.keys(bbox).length === 0 || (bbox.w === 0 && bbox.h === 0)) {
        if (decl.bbox && Object.keys(decl.bbox).length > 0) {
          bbox = decl.bbox;
        }
      }
      if (decl.surface_name) {
        surfaceName = decl.surface_name;
      }
    }

    if (!matchingEv) {
      matchingEv = c.evidences?.[0];
    }

    setActivePreview({
      imagePath: matchingEv?.storage_path,
      surfaceName: surfaceName || matchingEv?.surface_type || 'Package Panel',
      title: chk.expected_condition || chk.rule_title || 'Statutory Requirement',
      detectedText: chk.evaluated_value,
      bbox: bbox
    });
  };

  return (
    <div className="bg-white border border-[#D8DDE3] rounded-2xl p-6 sm:p-8 shadow-xs space-y-8">
      {/* Header & Purpose */}
      <div className="border-b border-[#E2E8F0] pb-4">
        <h2 className="text-lg font-bold text-[#1E293B] tracking-tight flex items-center gap-2.5">
          <FileCheck2 className="w-5 h-5 text-[#174A7E]" />
          <span>Compliance Verification Desk</span>
        </h2>
        <p className="text-xs text-[#64748B] mt-1 font-medium">
          Verify AI findings, record corrections, or confirm compliance decisions under Legal Metrology Rules.
        </p>
      </div>

      {/* Step 4A: Summary Bar */}
      <div className="bg-[#F8FAFC] border border-[#D8DDE3] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Inspection Compliance Summary</div>
          <div className="text-sm font-extrabold text-[#1E293B] mt-0.5">
            {compliantCount} Compliant &bull; {nonCompliantCount} Non-Compliant &bull; {needsVerificationCount} Needs Verification
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7] text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{compliantCount} Compliant</span>
          </span>
          {nonCompliantCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] text-xs font-bold">
              <XCircle className="w-3.5 h-3.5" />
              <span>{nonCompliantCount} Non-Compliant</span>
            </span>
          )}
          {needsVerificationCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FFFBEB] text-[#D97706] border border-[#FEF3C7] text-xs font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{needsVerificationCount} To Verify</span>
            </span>
          )}
        </div>
      </div>

      {/* Step 4B & 4C: Compliance Checklist Matrix */}
      <div className="space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-[#475569]">
          Statutory Verification Checklist
        </div>

        <div className="space-y-4">
          {checks.length > 0 ? (
            checks.map((chk) => {
              const key = String(chk.id);
              const dec = decisions[key];
              const isFail = chk.status === 'FAIL';
              const isReview = chk.status === 'REVIEW_REQUIRED';
              const isPass = chk.status === 'PASS';

              return (
                <div
                  key={chk.id}
                  className={`bg-white rounded-xl border p-5 shadow-xs space-y-4 transition-all ${
                    dec === 'CONFIRMED'
                      ? 'border-[#15803D] bg-[#F0FDF4]/30'
                      : dec === 'CORRECTED'
                      ? 'border-[#2563EB] bg-[#EFF6FF]/30'
                      : dec === 'DISMISSED'
                      ? 'border-[#94A3B8] opacity-75'
                      : isFail
                      ? 'border-[#FECACA]'
                      : isReview
                      ? 'border-[#FEF3C7]'
                      : 'border-[#E2E8F0]'
                  }`}
                >
                  {/* Top Row: Title, Status, Evidence Link */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-sm text-[#1E293B]">
                          {chk.expected_condition || chk.rule_title || chk.rule_code || 'Statutory Requirement'}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          dec === 'CORRECTED'
                            ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                            : dec === 'CONFIRMED'
                            ? 'bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7]'
                            : isPass
                            ? 'bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7]'
                            : isFail
                            ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                            : 'bg-[#FFFBEB] text-[#D97706] border border-[#FEF3C7]'
                        }`}>
                          {dec === 'CORRECTED' ? 'Inspector Corrected' : dec === 'CONFIRMED' ? 'Inspector Confirmed' : isPass ? 'Compliant' : isFail ? 'Non-Compliant' : 'Needs Verification'}
                        </span>
                      </div>
                      <div className="text-xs text-[#64748B]">
                        <strong>Requirement:</strong> {chk.expected_condition || 'Must be declared in prescribed manner under LMPC Rules 2011.'}
                      </div>
                      <div className="text-xs text-[#334155] font-medium">
                        <strong>Package Finding:</strong> {chk.reason_explanation || chk.evaluated_value || 'Declaration verified on package.'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenEvidence(chk)}
                      className="px-3.5 py-1.5 bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#174A7E] font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-2xs self-end sm:self-auto flex-shrink-0 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Evidence</span>
                    </button>
                  </div>

                  {/* Inspector Action Buttons (Confirm, Correct, Dismiss) */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F1F5F9]">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                        Inspector Action:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDecision(key, 'CONFIRMED')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                          dec === 'CONFIRMED'
                            ? 'bg-[#15803D] text-white shadow-xs'
                            : 'bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7] hover:bg-[#DCFCE7]'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        <span>Confirm</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDecision(key, 'CORRECTED')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                          dec === 'CORRECTED'
                            ? 'bg-[#2563EB] text-white shadow-xs'
                            : 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] hover:bg-[#DBEAFE]'
                        }`}
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Correct</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDecision(key, 'DISMISSED')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                          dec === 'DISMISSED'
                            ? 'bg-[#64748B] text-white shadow-xs'
                            : 'bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1] hover:bg-[#E2E8F0]'
                        }`}
                      >
                        <X className="w-3 h-3" />
                        <span>Dismiss</span>
                      </button>
                    </div>

                    <span className="text-[11px] text-[#94A3B8] font-mono">
                      {chk.statutory_citation || 'LMPC 2011'}
                    </span>
                  </div>

                  {/* Inline Correction Input when 'Correct' is active */}
                  {dec === 'CORRECTED' && (
                    <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#BFDBFE] space-y-2 text-xs">
                      <label className="block font-bold text-[#1E293B]">
                        Enter Verified Value / Inspector Rectification:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Verified Net Quantity: 200 g (Font height verified: 4.2 mm)"
                        value={corrections[chk.rule_code || key] || ''}
                        onChange={(e) => setCorrections({ ...corrections, [chk.rule_code || key]: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B] focus:border-[#174A7E]"
                      />
                    </div>
                  )}

                  {/* Inline Dismiss Reason */}
                  {dec === 'DISMISSED' && (
                    <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#CBD5E1] space-y-2 text-xs">
                      <label className="block font-bold text-[#64748B]">
                        Reason for Dismissal / Not Applicable:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Exemption under Rule 26 for small packages"
                        value={dismissReasons[key] || ''}
                        onChange={(e) => setDismissReasons({ ...dismissReasons, [key]: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B]"
                      />
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            declarations.map((decl) => {
              const key = decl.field_type;
              return (
                <div key={decl.id} className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-[#1E293B]">{decl.title || decl.field_type}</div>
                      <div className="text-xs text-[#64748B] mt-0.5">
                        AI Detected Value: <strong className="text-[#1E293B]">{decl.extracted_value}</strong>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7]">
                      Compliant
                    </span>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Enter verified value (if correction is needed)..."
                      value={corrections[key] || ''}
                      onChange={(e) => setCorrections({ ...corrections, [key]: e.target.value })}
                      className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B]"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Step 4C: Calibrated Physical Measurements (Rule 7, 8 & 9) */}
      <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#174A7E]" />
              <span>Calibrated Physical Measurements & Verification</span>
            </h3>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Record physical laboratory/field measurements against packaged commodity standards (Rule 7 font height, Rule 8 PDP area).
            </p>
          </div>

          <button
            type="button"
            onClick={async () => {
              try {
                await api.saveMeasurements(c.id, {
                  actual_net_quantity: actualNetQty,
                  actual_pdp_width_cm: pdpWidth ? Number(pdpWidth) : undefined,
                  actual_pdp_height_cm: pdpHeight ? Number(pdpHeight) : undefined,
                  actual_font_height_mm: fontHeight ? Number(fontHeight) : undefined,
                  measurement_method: measurementMethod,
                  calibrated_scale_used: calibratedScale
                });
                setMeasurementSaved(true);
                setTimeout(() => setMeasurementSaved(false), 3000);
              } catch (err: any) {
                alert(`Failed to save measurements: ${err.message}`);
              }
            }}
            className="px-4 py-1.5 bg-[#174A7E] hover:bg-[#133E68] text-white font-bold rounded-lg text-xs shadow-2xs transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{measurementSaved ? 'Measurements Saved ✓' : 'Save Measurements'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-bold text-[#1E293B] mb-1">
              Actual Net Quantity Measured:
            </label>
            <input
              type="text"
              placeholder="e.g. 200.5 g / 500 ml"
              value={actualNetQty}
              onChange={(e) => setActualNetQty(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B] focus:border-[#174A7E]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#1E293B] mb-1">
              Calibrated Font Height (mm):
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 4.0"
              value={fontHeight}
              onChange={(e) => setFontHeight(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B] focus:border-[#174A7E]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#1E293B] mb-1">
              PDP Width & Height (cm):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                placeholder="W"
                value={pdpWidth}
                onChange={(e) => setPdpWidth(e.target.value)}
                className="w-1/2 px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B]"
              />
              <span className="text-[#64748B] font-bold">&times;</span>
              <input
                type="number"
                step="0.1"
                placeholder="H"
                value={pdpHeight}
                onChange={(e) => setPdpHeight(e.target.value)}
                className="w-1/2 px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#1E293B] mb-1">
              Measurement Tool / Method:
            </label>
            <select
              value={measurementMethod}
              onChange={(e) => setMeasurementMethod(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B]"
            >
              <option value="Standard Vernier Caliper & Calibrated Balance">Standard Vernier & Scale</option>
              <option value="Optical Micrometer & Analytical Balance">Optical Micrometer & Analytical Balance</option>
              <option value="Steel Rule & Electronic Balance">Steel Rule & Electronic Balance</option>
              <option value="Visual Direct Inspection">Visual Direct Inspection</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-[#1E293B] cursor-pointer">
            <input
              type="checkbox"
              checked={calibratedScale}
              onChange={(e) => setCalibratedScale(e.target.checked)}
              className="w-4 h-4 text-[#174A7E] rounded"
            />
            <span>Official Calibrated Instrument / Scale Verified & Valid Calibration Seal Attached</span>
          </label>
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
          <span>Back to AI Analysis</span>
        </button>

        <button
          type="button"
          onClick={onContinue}
          className="px-6 py-2.5 bg-[#174A7E] hover:bg-[#133E68] text-white font-bold rounded-lg text-xs transition shadow-xs flex items-center gap-2 cursor-pointer"
        >
          <span>Continue to Final Review</span>
          <ArrowRight className="w-4 h-4" />
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
