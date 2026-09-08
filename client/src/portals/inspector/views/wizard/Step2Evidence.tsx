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
  const [previewEvidence, setPreviewEvidence] = useState<PackageEvidence | null>(null);

  const surfaces: { id: SurfaceType; label: string; isRequired: boolean }[] = [
    { id: 'FRONT', label: 'Front Panel (PDP)', isRequired: true },
    { id: 'BACK', label: 'Back Information Panel (BIP)', isRequired: true },
    { id: 'LEFT', label: 'Left Side Panel', isRequired: false },
    { id: 'RIGHT', label: 'Right Side Panel', isRequired: false },
    { id: 'TOP', label: 'Top Flap', isRequired: false },
    { id: 'BOTTOM', label: 'Bottom / Base', isRequired: false },
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

  // Required surfaces completion check
  const requiredSurfaces = surfaces.filter(s => s.isRequired);
  const uploadedRequiredCount = requiredSurfaces.filter(s => 
    c.evidences?.some(e => e.surface_type.toUpperCase() === s.id.toUpperCase())
  ).length;

  const totalUploaded = c.evidences?.length || 0;
  const isReadyForAnalysis = uploadedRequiredCount >= 1; // At least Front/PDP captured

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
      <div className="border-b border-[#E2E8F0] pb-4">
        <h2 className="text-lg font-bold text-[#1E293B] tracking-tight flex items-center gap-2.5">
          <Camera className="w-5 h-5 text-[#174A7E]" />
          <span>Capture Package Visual Evidence</span>
        </h2>
        <p className="text-xs text-[#64748B] mt-1 font-medium">
          Capture high-clarity photos of the required package surfaces to verify declarations under Legal Metrology Rules.
        </p>
      </div>

      {/* Surface Selection Tabs */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-[#475569] flex items-center justify-between">
          <span>Select Package Surface</span>
          <span className="text-[11px] text-[#64748B] font-normal">
            Evidence Collected: <strong className="text-[#1E293B]">{totalUploaded} surfaces</strong>
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
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between space-y-2 cursor-pointer ${
                  isSelected
                    ? 'bg-[#174A7E] text-white border-[#174A7E] shadow-xs'
                    : hasEvidence
                    ? 'bg-[#F0FDF4] text-[#15803D] border-[#DCFCE7] hover:border-[#15803D]'
                    : 'bg-[#F8FAFC] text-[#475569] border-[#CBD5E1] hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {s.isRequired ? 'Required' : 'Optional'}
                  </span>
                  {hasEvidence && (
                    <CheckCircle2 className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#15803D]'}`} />
                  )}
                </div>
                <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-[#1E293B]'}`}>
                  {s.label.split(' ')[0]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Evidence Card for Selected Surface */}
      <div className="bg-[#F8FAFC] border border-[#D8DDE3] rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
              {surfaces.find(s => s.id === selectedSurface)?.label || selectedSurface}
            </h3>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              {selectedSurface === 'FRONT' 
                ? 'Capture the Principal Display Panel (PDP) showing brand name and net quantity.'
                : selectedSurface === 'BACK'
                ? 'Capture the Back Panel (BIP) showing manufacturer, MRP, manufacturing date, and customer care.'
                : 'Capture secondary declarations and side panels.'}
            </p>
          </div>

          {currentEvidence && (
            <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${getQualityMessage(currentEvidence).style}`}>
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
                  Captured surface for {selectedSurface} panel inspection
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPreviewEvidence(currentEvidence)}
                  className="px-4 py-2 bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#174A7E] font-bold rounded-lg text-xs shadow-2xs transition flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Photo</span>
                </button>

                <label className="px-4 py-2 bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#475569] font-bold rounded-lg text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer">
                  <RotateCcw className="w-4 h-4" />
                  <span>Replace Photo</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-[#CBD5E1] rounded-xl p-10 text-center bg-white space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#EBF3FA] text-[#174A7E] flex items-center justify-center mx-auto border border-[#CBD5E1]">
              <ImageIcon className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#1E293B]">
                No image captured for {selectedSurface} panel
              </div>
              <div className="text-[11px] text-[#64748B] mt-0.5 max-w-sm mx-auto">
                Ensure packaging text is well-lit, non-reflective, and in sharp focus.
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
                <span>Processing & verifying image clarity...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Evidence Completion Summary Banner */}
      <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {isReadyForAnalysis ? (
            <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-[#D97706]" />
          )}
          <span className="font-semibold text-[#1E293B]">
            {isReadyForAnalysis 
              ? 'Required package evidence captured. Ready for AI metrology analysis.'
              : 'Please capture at least the Front Panel (PDP) before continuing.'}
          </span>
        </div>
        <span className="text-[11px] text-[#64748B]">
          {totalUploaded} surface{totalUploaded === 1 ? '' : 's'} recorded
        </span>
      </div>

      {/* Navigation Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#475569] font-bold rounded-lg text-xs transition flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Product</span>
        </button>

        <button
          type="button"
          onClick={onContinue}
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
