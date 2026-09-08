import React from 'react';
import { FileText, Layers, ShieldCheck, Gavel, Check } from 'lucide-react';

export type ReviewStage = 'details' | 'evidence' | 'compliance' | 'finalize';

interface ReviewStageIndicatorProps {
  currentStage: ReviewStage;
  onSelectStage: (stage: ReviewStage) => void;
  evidenceCount?: number;
  checksCount?: number;
}

export const ReviewStageIndicator: React.FC<ReviewStageIndicatorProps> = ({
  currentStage,
  onSelectStage,
  evidenceCount = 0,
  checksCount = 0
}) => {
  const stages: { id: ReviewStage; label: string; icon: React.FC<{ className?: string }>; count?: number }[] = [
    { id: 'details', label: '01 Case Details', icon: FileText },
    { id: 'evidence', label: '02 Evidence Review', icon: Layers, count: evidenceCount },
    { id: 'compliance', label: '03 Compliance Review', icon: ShieldCheck, count: checksCount },
    { id: 'finalize', label: '04 Review & Finalize', icon: Gavel },
  ];

  const getStageIndex = (stage: ReviewStage) => {
    switch (stage) {
      case 'details': return 0;
      case 'evidence': return 1;
      case 'compliance': return 2;
      case 'finalize': return 3;
    }
  };

  const currentIndex = getStageIndex(currentStage);

  return (
    <div className="bg-white border border-[#D8DDE3] rounded-xl p-1.5 shadow-xs flex items-center gap-1.5 overflow-x-auto">
      {stages.map((stage, idx) => {
        const Icon = stage.icon;
        const isActive = currentStage === stage.id;
        const isPast = idx < currentIndex;

        return (
          <button
            key={stage.id}
            onClick={() => onSelectStage(stage.id)}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 shrink-0 cursor-pointer ${
              isActive
                ? 'bg-[#174A7E] text-white shadow-2xs'
                : isPast
                ? 'bg-[#F1F5F9] text-[#1E293B] hover:bg-[#E2E8F0]'
                : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8F9FA]'
            }`}
          >
            {isPast ? (
              <Check className="w-3.5 h-3.5 text-[#16A34A]" />
            ) : (
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#64748B]'}`} />
            )}
            <span>{stage.label}</span>
            {stage.count !== undefined && stage.count > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-[#E2E8F0] text-[#475569]'
                }`}
              >
                {stage.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
