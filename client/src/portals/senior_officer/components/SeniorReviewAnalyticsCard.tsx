import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import type { DonutSegment, BarMetricItem } from './SeniorAnalyticsData';

interface SeniorReviewAnalyticsCardProps {
  checkBreakdown: DonutSegment[];
  violationSeverity: BarMetricItem[];
}

export const SeniorReviewAnalyticsCard: React.FC<SeniorReviewAnalyticsCardProps> = ({
  checkBreakdown,
  violationSeverity
}) => {
  const totalChecks = checkBreakdown.reduce((acc, c) => acc + (c.count || 0), 0);
  const maxSeverityCount = Math.max(...violationSeverity.map(v => v.count), 1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] my-3">
      {/* 1. Compliance Check Breakdown (Segmented Progress Bar & Legend) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#174A7E]" />
            <h4 className="text-xs font-bold text-[#1E293B]">Compliance Check Breakdown</h4>
          </div>
          <span className="text-[10px] font-bold text-[#64748B] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
            {totalChecks} Total Checks
          </span>
        </div>

        {/* Multi-segmented horizontal bar */}
        <div className="w-full bg-[#E2E8F0] h-3 rounded-full overflow-hidden flex shadow-2xs">
          {checkBreakdown.map((seg, i) => (
            <div
              key={i}
              className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${seg.percentage}%`,
                backgroundColor: seg.color
              }}
              title={`${seg.label}: ${seg.count} (${seg.percentage}%)`}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
          {checkBreakdown.map((seg, i) => (
            <div key={i} className="flex items-center justify-between bg-white px-2 py-1 rounded border border-[#E2E8F0]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="font-semibold text-[#475569]">{seg.label}</span>
              </div>
              <span className="font-mono font-bold text-[#1E293B]">{seg.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Violation Severity */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-[#D97706]" />
            <h4 className="text-xs font-bold text-[#1E293B]">Violation Severity</h4>
          </div>
          <span className="text-[10px] font-bold text-[#64748B] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
            Demonstration Mix
          </span>
        </div>

        <div className="space-y-2 pt-0.5">
          {violationSeverity.map((v) => {
            const pct = Math.round((v.count / maxSeverityCount) * 100);
            return (
              <div key={v.label} className="space-y-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-[#475569]">{v.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-[#1E293B]">{v.count} violations</span>
                  </div>
                </div>
                <div className="w-full bg-[#E2E8F0] rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%`, backgroundColor: v.color || '#DC2626' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
