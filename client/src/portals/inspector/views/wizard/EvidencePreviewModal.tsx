import React from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { api } from '../../../../services/api';

interface EvidencePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imagePath?: string;
  surfaceName?: string;
  title?: string;
  detectedText?: string;
  bbox?: { x: number; y: number; w: number; h: number };
}

export const EvidencePreviewModal: React.FC<EvidencePreviewModalProps> = ({
  isOpen,
  onClose,
  imagePath,
  surfaceName = 'Front Panel',
  title = 'Package Evidence',
  detectedText,
  bbox
}) => {
  const [zoom, setZoom] = React.useState(100);

  if (!isOpen || !imagePath) return null;

  const imageUrl = api.getMediaUrl(imagePath);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-[#CBD5E1] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#1E293B]">{title}</h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EBF3FA] text-[#174A7E] border border-[#CBD5E1]">
                {surfaceName}
              </span>
            </div>
            {detectedText && (
              <p className="text-xs text-[#64748B] mt-0.5">
                Detected: <span className="font-semibold text-[#1E293B]">&ldquo;{detectedText}&rdquo;</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(prev => Math.min(prev + 25, 200))}
              className="p-1.5 rounded-lg bg-white border border-[#CBD5E1] text-[#475569] hover:bg-[#F1F5F9] text-xs"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(prev => Math.max(prev - 25, 50))}
              className="p-1.5 rounded-lg bg-white border border-[#CBD5E1] text-[#475569] hover:bg-[#F1F5F9] text-xs"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(100)}
              className="p-1.5 rounded-lg bg-white border border-[#CBD5E1] text-[#475569] hover:bg-[#F1F5F9] text-xs"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9] transition-colors ml-2"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Container with optional Bounding Box Highlight */}
        <div className="flex-1 bg-[#0F172A] p-6 overflow-auto flex items-center justify-center min-h-[400px]">
          <div className="relative inline-block" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center', transition: 'transform 0.15s ease-out' }}>
            <img
              src={imageUrl}
              alt={title}
              className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-md"
            />
            {bbox && bbox.w > 0 && bbox.h > 0 && (
              <div
                className="absolute border-2 border-[#EAB308] bg-[#EAB308]/20 rounded-xs pointer-events-none ring-2 ring-[#EAB308]/50 animate-pulse"
                style={{
                  left: `${bbox.x * 100}%`,
                  top: `${bbox.y * 100}%`,
                  width: `${bbox.w * 100}%`,
                  height: `${bbox.h * 100}%`,
                }}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
          <span>Zoom: {zoom}%</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#174A7E] text-white font-bold rounded-lg text-xs hover:bg-[#133E68] transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
