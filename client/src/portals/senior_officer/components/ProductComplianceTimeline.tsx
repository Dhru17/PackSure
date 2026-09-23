import React from 'react';
import { History, CheckCircle2, AlertTriangle, RotateCcw, ShieldCheck } from 'lucide-react';
import type { TimelineInspectionPoint } from './SeniorAnalyticsData';

interface ProductComplianceTimelineProps {
  timeline: TimelineInspectionPoint[];
  productTitle?: string;
}

export const ProductComplianceTimeline: React.FC<ProductComplianceTimelineProps> = ({
  timeline,
  productTitle = 'Packaged Commodity Historical Lifecycle (Example Product X)'
}) => {
  return (
    <div className="bg-white border border-[#D8DDE3] rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#EFF6FF] text-[#174A7E] rounded-lg">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#1E293B]">Product Compliance History</h3>
            <p className="text-[11px] text-[#64748B]">{productTitle}</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded">
          Demo timeline
        </span>
      </div>

      {/* Horizontal Timeline on Desktop, Vertical on Mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 relative pt-2">
        {timeline.map((point, index) => {
          const isCompliant = point.status === 'Compliant';
          const isViolations = point.status === 'Violations';
          const isReinspection = point.status === 'Reinspection';

          const Icon = isCompliant ? CheckCircle2 :
                       isViolations ? AlertTriangle :
                       isReinspection ? RotateCcw : ShieldCheck;

          const dotColor = isCompliant ? 'bg-[#15803D]' :
                           isViolations ? 'bg-[#DC2626]' :
                           isReinspection ? 'bg-[#D97706]' : 'bg-[#174A7E]';

          return (
            <div key={index} className="relative flex flex-col items-start bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
              <div className="flex items-center justify-between w-full mb-2">
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${isCompliant ? 'text-[#15803D]' : isViolations ? 'text-[#DC2626]' : isReinspection ? 'text-[#D97706]' : 'text-[#174A7E]'}`} />
                  <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                  <span className="text-[11px] font-bold text-[#1E293B]">Inspection {index + 1}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${point.badgeColor}`}>
                  {point.status}
                </span>
              </div>

              <div className="text-xs font-semibold text-[#334155] mb-1">
                {point.inspectionName}
              </div>

              <div className="flex items-center justify-between w-full text-[10px] text-[#64748B] mt-auto pt-2 border-t border-[#E2E8F0]/60">
                <span className="font-mono font-medium">{point.caseRef}</span>
                <span>{point.date}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
