import React, { useState } from 'react';
import type { InspectionCase, SurfaceType, PackageEvidence } from '../../../../types';
import { api } from '../../../../services/api';
import { EvidencePreviewModal } from './EvidencePreviewModal';
import { 
  Camera, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight, 
  Eye, 
  RotateCcw, 
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';

interface Step2EvidenceProps {
  inspectionCase: InspectionCase;
  onEvidenceUpdated: (updatedCase: InspectionCase) => void;
  onBack: () => void;
  onContinue: () => void;
  isAnalyzing: boolean;
}

export const Step2Evidence: React.FC<Step2EvidenceProps> = ({
  inspectionCase: c,
  onEvidenceUpdated,
  onBack,
  onContinue,
  isAnalyzing
}) => {
  const [selectedSurface, setSelectedSurface] = useState<SurfaceType>('FRONT');
  const [isUploading, setIsUploading] = useState(false);
  const [isReassigning, setIsReassigning] = useState(false);
  const [previewEvidence, setPreviewEvidence] = useState<PackageEvidence | null>(null);
  const [showMissingBackModal, setShowMissingBackModal] = useState(false);

  const surfaces: { id: SurfaceType; label: string; shortLabel: string; isRequired: boolean; desc: string }[] = [
    { id: 'FRONT', label: 'Front Panel (PDP)', shortLabel: 'Front', isRequired: true, desc: 'Principal Display Panel: Brand name, product title, net quantity' },
    { id: 'BACK', label: 'Back Information Panel (BIP)', shortLabel: 'Back', isRequired: true, desc: 'Information Panel: MRP, Mfg Date, Address, Consumer Care, FSSAI' },
    { id: 'LEFT', label: 'Left Side Panel', shortLabel: 'Left', isRequired: false, desc: 'Side declarations, bar code, story/instructions' },
    { id: 'RIGHT', label: 'Right Side Panel', shortLabel: 'Right', isRequired: false, desc: 'Nutritional chart, ingredients, importer info' },
    { id: 'TOP', label: 'Top Flap / Seal', shortLabel: 'Top', isRequired: false, desc: 'Crimp seal, batch stamping, expiry stamp' },
    { id: 'BOTTOM', label: 'Bottom / Base', shortLabel: 'Bottom', isRequired: false, desc: 'Base, container recycling codes, disposal icons' },
  ];

  const currentEvidence = c.evidences?.find(
    e => e.surface_type.toUpperCase() === selectedSurface.toUpperCase()
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);
    formData.append('surface_type', selectedSurface);

    setIsUploading(true);
    try {
      await api.uploadEvidence(c.id, formData);
      const updated = await api.getInspection(c.id);
      onEvidenceUpdated(updated);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReassignSurface = async (evidenceId: number, targetSurface: SurfaceType) => {
    setIsReassigning(true);
    try {
      await api.reassignEvidenceSurface(c.id, evidenceId, targetSurface);
      const updated = await api.getInspection(c.id);
      onEvidenceUpdated(updated);
      setSelectedSurface(targetSurface);
    } catch (err: any) {
      alert(`Could not reassign surface: ${err.message}`);
    } finally {
      setIsReassigning(false);
    }
  };

  // Status checks across all panels
  const hasFront = Boolean(c.evidences?.some(e => e.surface_type.toUpperCase() === 'FRONT'));
  const hasBack = Boolean(c.evidences?.some(e => e.surface_type.toUpperCase() === 'BACK'));
  const totalUploaded = c.evidences?.length || 0;
  const isReadyForAnalysis = totalUploaded >= 1;

  const handleContinueClick = () => {
    if (hasFront && !hasBack) {
      setShowMissingBackModal(true);
    } else {
      onContinue();
    }
  };

  const getQualityMessage = (ev: PackageEvidence) => {
    if (ev.quality_verdict === 'READABLE') {
      return { text: 'Image looks clear ✓', style: 'text-[#15803D] bg-[#F0FDF4] border-[#DCFCE7]' };
    }
    if (ev.quality_verdict === 'BORDERLINE') {
      return { text: 'Some text may be difficult to read ⚠', style: 'text-[#D97706] bg-[#FFFBEB] border-[#FEF3C7]' };
    }
    return { text: 'Image may be too blurry or unclear ⚠', style: 'text-[#DC2626] bg-[#FEF2F2] border-[#FECACA]' };
  };

  return (
    <div className="bg-white border border-[#D8DDE3] rounded-2xl p-6 sm:p-8 shadow-xs space-y-8">
      {/* Header & Purpose */}
      <div className="border-b border-[#E2E8F0] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-[#1E293B] tracking-tight flex items-center gap-2.5">
            <Camera className="w-5 h-5 text-[#174A7E]" />
            <span>Capture Package Visual Evidence</span>
          </h2>
          <p className="text-xs text-[#64748B] mt-1 font-medium">
            Capture photos of package panels (Front PDP, Back BIP, and optional sides/flaps) for automated compliance inspection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
            hasFront && hasBack 
              ? 'bg-[#F0FDF4] text-[#15803D] border-[#DCFCE7]' 
              : hasFront 
              ? 'bg-[#FFFBEB] text-[#D97706] border-[#FEF3C7]' 
              : 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'
          }`}>
            {hasFront && hasBack 
              ? '✓ Front & Back Captured' 
              : hasFront 
              ? '⚠ Front Only (Back Missing)' 
              : 'Capture Evidence'}
          </span>
        </div>
      </div>

      {/* Surface Selection Tabs (All 6 Packaging Sides) */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-[#475569] flex items-center justify-between">
          <span>Select Package Panel ({totalUploaded}/6 Captured)</span>
          <span className="text-[11px] text-[#64748B] font-normal">
            Click a panel to view, capture or reassign
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          {surfaces.map((s) => {
            const isSelected = selectedSurface === s.id;
            const ev = c.evidences?.find(e => e.surface_type.toUpperCase() === s.id.toUpperCase());
            const hasEvidence = Boolean(ev);

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSurface(s.id)}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between space-y-2 cursor-pointer relative ${
                  isSelected
                    ? 'bg-[#174A7E] text-white border-[#174A7E] shadow-sm ring-2 ring-[#174A7E]/20'
                    : hasEvidence
                    ? 'bg-[#F0FDF4] text-[#15803D] border-[#DCFCE7] hover:border-[#15803D]'
                    : 'bg-[#F8FAFC] text-[#475569] border-[#CBD5E1] hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                    {s.isRequired ? 'Mandatory' : 'Side/Flap'}
                  </span>
                  {hasEvidence ? (
                    <CheckCircle2 className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#15803D]'}`} />
                  ) : null}
                </div>
                <div>
                  <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-[#1E293B]'}`}>
                    {s.shortLabel}
                  </div>
                  <div className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-[#64748B]'}`}>
                    {hasEvidence ? '✓ Photo Ready' : 'Empty'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Evidence Card for Selected Surface */}
      <div className="bg-[#F8FAFC] border border-[#D8DDE3] rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E2E8F0] pb-3 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                {surfaces.find(s => s.id === selectedSurface)?.label || selectedSurface}
              </h3>
              {surfaces.find(s => s.id === selectedSurface)?.isRequired && (
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                  Mandatory for Digital Sign
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              {surfaces.find(s => s.id === selectedSurface)?.desc}
            </p>
          </div>

          {currentEvidence && (
            <span className={`text-[11px] font-bold px-3 py-1 rounded-full border self-start sm:self-auto ${getQualityMessage(currentEvidence).style}`}>
              {getQualityMessage(currentEvidence).text}
            </span>
          )}
        </div>

        {/* Evidence Display / Upload Area */}
        {currentEvidence ? (
          <div className="flex flex-col md:flex-row items-center gap-6 bg-white p-5 rounded-xl border border-[#E2E8F0]">
            {/* Image Preview with Click to Zoom */}
            <div className="relative group rounded-lg overflow-hidden border border-[#CBD5E1] bg-black/5 flex-shrink-0">
              <img
                src={api.getMediaUrl(currentEvidence.storage_path)}
                alt={selectedSurface}
                className="w-48 h-48 sm:w-60 sm:h-60 object-contain bg-white"
              />
              <button
                type="button"
                onClick={() => setPreviewEvidence(currentEvidence)}
                className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 font-bold text-xs"
              >
                <Eye className="w-4 h-4" />
                <span>View Full Size</span>
              </button>
            </div>

            {/* Evidence Actions & Information */}
            <div className="space-y-4 flex-1 text-xs">
              <div>
                <div className="font-bold text-[#1E293B] text-sm">{currentEvidence.original_filename}</div>
                <div className="text-[#64748B] text-[11px] mt-0.5">
                  Currently assigned to <strong>{selectedSurface}</strong> panel
                </div>
              </div>

              {/* OpenCV Quality Metrics Strip */}
              <div className="grid grid-cols-3 gap-2 bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0] text-[11px]">
                <div>
                  <span className="text-[#64748B] block">Focus / Sharpness:</span>
                  <span className="font-bold text-[#1E293B]">
                    {currentEvidence.blur_score ? `${Math.round(currentEvidence.blur_score)} (Laplacian)` : 'Adequate'}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Brightness:</span>
                  <span className="font-bold text-[#1E293B]">
                    {currentEvidence.brightness_score ? `${Math.round(currentEvidence.brightness_score)} / 255` : 'Balanced'}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Readability:</span>
                  <span className={`font-bold ${currentEvidence.quality_verdict === 'READABLE' ? 'text-[#15803D]' : currentEvidence.quality_verdict === 'BORDERLINE' ? 'text-[#D97706]' : 'text-[#DC2626]'}`}>
                    {currentEvidence.quality_verdict || 'READABLE'}
                  </span>
                </div>
              </div>

              {/* Reassign Panel Selector dropdown */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setPreviewEvidence(currentEvidence)}
                  className="px-3.5 py-2 bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#174A7E] font-bold rounded-lg text-xs shadow-2xs transition flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Photo</span>
                </button>

                <label className="px-3.5 py-2 bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#475569] font-bold rounded-lg text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer">
                  <RotateCcw className="w-4 h-4" />
                  <span>Replace Photo</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>

                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-[11px] text-[#64748B] font-medium">Reassign to:</span>
                  <select
                    value={selectedSurface}
                    onChange={(e) => handleReassignSurface(currentEvidence.id, e.target.value as SurfaceType)}
                    disabled={isReassigning}
                    aria-label="Reassign to panel"
                    className="px-2.5 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#1E293B] cursor-pointer"
                  >
                    {surfaces.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-[#CBD5E1] rounded-xl p-8 text-center bg-white space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#EBF3FA] text-[#174A7E] flex items-center justify-center mx-auto border border-[#CBD5E1]">
              <ImageIcon className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#1E293B]">
                No photo uploaded for {surfaces.find(s => s.id === selectedSurface)?.label}
              </div>
              <div className="text-[11px] text-[#64748B] mt-0.5 max-w-sm mx-auto">
                Ensure packaging text is well-lit, non-reflective, and in sharp focus for RapidOCR extraction.
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <label className="px-5 py-2.5 bg-[#174A7E] hover:bg-[#133E68] text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Upload Image</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} disabled={isUploading} className="hidden" />
              </label>

              <label className="px-5 py-2.5 bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#174A7E] font-bold rounded-lg text-xs shadow-2xs transition flex items-center gap-2 cursor-pointer">
                <Camera className="w-4 h-4" />
                <span>Capture Photo</span>
                <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} disabled={isUploading} className="hidden" />
              </label>
            </div>

            {isUploading && (
              <div className="text-xs text-[#174A7E] font-bold flex items-center justify-center gap-2 animate-pulse pt-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing image & checking visual clarity...</span>
              </div>
            )}
          </div>
        )}

        {/* Legal Metrology Statutory Requirements Alert Banner */}
        <div className={`p-4 rounded-xl text-xs flex items-start gap-3 border ${
          !hasBack && hasFront
            ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
            : 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]'
        }`}>
          <div className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${
            !hasBack && hasFront ? 'bg-[#FEF3C7] text-[#B45309]' : 'bg-[#DBEAFE] text-[#1E40AF]'
          }`}>
            {!hasBack && hasFront ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          </div>
          <div className="space-y-1">
            <div className="font-bold">
              Mandatory Surfaces under Legal Metrology Rules (Rule 6, PCR 2011)
            </div>
            <div className="text-[11px] leading-relaxed">
              {!hasBack && hasFront ? (
                <>
                  <strong>Back Information Panel (BIP) missing:</strong> MRP, Date of Packaging, Manufacturer Details, and Consumer Care are on the Back Panel. You can continue to AI analysis, but the system will require the Back Panel before final Digital Signature approval.
                </>
              ) : (
                <>
                  Both <strong>Front Panel (PDP)</strong> and <strong>Back Panel (BIP)</strong> are required for complete statutory compliance verification.
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#475569] font-bold rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Product</span>
        </button>

        <button
          type="button"
          onClick={handleContinueClick}
          disabled={!isReadyForAnalysis || isAnalyzing}
          className="px-6 py-2.5 bg-[#174A7E] hover:bg-[#133E68] text-white font-bold rounded-lg text-xs transition shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing Package...</span>
            </>
          ) : (
            <>
              <span>Continue to AI Analysis</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Missing Back Panel Warning Modal */}
      {showMissingBackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#D8DDE3] space-y-5">
            <div className="w-12 h-12 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center mx-auto border border-[#FDE68A]">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-[#1E293B]">
                Back Panel (BIP) Not Captured
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Under the <strong>Legal Metrology Packaged Commodities Rules (Rule 6)</strong>, mandatory declarations such as <strong>MRP, Manufacturing Date, Customer Care, and Manufacturer Address</strong> are located on the Back Information Panel.
              </p>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs space-y-1 text-[#475569]">
              <div className="font-semibold text-[#1E293B]">What will happen:</div>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                <li>AI will analyze the Front Panel declarations (Net Qty, Brand, Commodity).</li>
                <li>At Step 5 (Sign & Approve), you will be prompted to supply the Back photo to complete statutory sign-off.</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowMissingBackModal(false);
                  setSelectedSurface('BACK');
                }}
                className="w-full sm:w-1/2 px-4 py-2.5 bg-[#174A7E] hover:bg-[#133E68] text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Capture Back Panel</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMissingBackModal(false);
                  onContinue();
                }}
                className="w-full sm:w-1/2 px-4 py-2.5 bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#475569] font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Proceed with Front Only</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Size Preview Modal */}
      {previewEvidence && (
        <EvidencePreviewModal
          isOpen={Boolean(previewEvidence)}
          onClose={() => setPreviewEvidence(null)}
          imagePath={previewEvidence.storage_path}
          surfaceName={previewEvidence.surface_type}
          title={`${previewEvidence.surface_type} Panel Evidence`}
        />
      )}
    </div>
  );
};

