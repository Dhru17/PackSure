import React from 'react';
import { CheckCircle2, Clock, Circle, ShieldCheck } from 'lucide-react';

interface StageStatusItem {
  id: number;
  label: string;
  status: 'completed' | 'in_progress' | 'pending';
}

interface InspectionCompletionStatusProps {
  currentStep?: number; // 1 to 5 (from wizard or case progress)
  isLive?: boolean;
}

export const InspectionCompletionStatus: React.FC<InspectionCompletionStatusProps> = ({
  currentStep = 4,
  isLive = false
}) => {
  const stages: StageStatusItem[] = [
    { id: 1, label: 'Product', status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'in_progress' : 'pending' },
    { id: 2, label: 'Evidence', status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'in_progress' : 'pending' },
    { id: 3, label: 'AI Analysis', status: currentStep > 3 ? 'completed' : currentStep === 3 ? 'in_progress' : 'pending' },
    { id: 4, label: 'Compliance', status: currentStep > 4 ? 'completed' : currentStep === 4 ? 'in_progress' : 'pending' },
    { id: 5, label: 'Review', status: currentStep > 5 ? 'completed' : currentStep === 5 ? 'in_progress' : 'pending' },
  ];

  return (
    <div className="bg-white border border-[#D8DDE3] rounded-xl p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#174A7E]" />
          <h3 className="text-xs font-bold text-[#1E293B]">Inspection Completion Status</h3>
        </div>
        <span className="text-[10px] font-semibold text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded">
          {isLive ? 'Live Workflow State' : 'Demonstration Progress'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {stages.map((stage) => {
          const isDone = stage.status === 'completed';
          const isActive = stage.status === 'in_progress';

          return (
            <div
              key={stage.id}
              className={`p-2 rounded-lg border text-xs flex items-center justify-between transition ${
                isDone
                  ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]'
                  : isActive
                  ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1D4ED8] font-bold shadow-2xs'
                  : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8]'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                ) : isActive ? (
                  <Clock className="w-3.5 h-3.5 text-[#2563EB] shrink-0 animate-pulse" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-[#CBD5E1] shrink-0" />
                )}
                <span className="truncate">{stage.label}</span>
              </div>
              <span className="text-[10px] uppercase font-bold ml-1 shrink-0">
                {isDone ? 'Complete' : isActive ? 'In Review' : 'Pending'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
