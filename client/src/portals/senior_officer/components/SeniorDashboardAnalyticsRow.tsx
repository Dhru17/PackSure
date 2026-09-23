import React from 'react';
import { PieChart, BarChart3, TrendingUp } from 'lucide-react';
import type { SeniorOfficerDemoAnalytics } from './SeniorAnalyticsData';

interface SeniorDashboardAnalyticsRowProps {
  analytics: SeniorOfficerDemoAnalytics;
}

export const SeniorDashboardAnalyticsRow: React.FC<SeniorDashboardAnalyticsRowProps> = ({ analytics }) => {
  const { complianceOverview, auditStatus, violationTrends } = analytics;

  // Donut calculations
  const size = 120;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Compute stroke offsets for multi-segment SVG donut
  let cumulativePercent = 0;
  const donutSlices = complianceOverview.segments.map((seg) => {
    const strokeLength = (seg.percentage / 100) * circumference;
    const strokeDasharray = `${strokeLength} ${circumference - strokeLength}`;
    const strokeDashoffset = -((cumulativePercent / 100) * circumference);
    cumulativePercent += seg.percentage;
    return {
      ...seg,
      strokeDasharray,
      strokeDashoffset
    };
  });

  const maxAuditCount = Math.max(...auditStatus.map(a => a.count), 1);
  const maxViolCount = Math.max(...violationTrends.map(v => v.count), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. Compliance Overview Donut */}
      <div className="bg-white border border-[#D8DDE3] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#F0FDF4] text-[#15803D] rounded-lg">
                <PieChart className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-[#1E293B]">Compliance Overview</h3>
            </div>
            <span className="text-[10px] font-bold text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded">
              Demonstration Mix
            </span>
          </div>
          <p className="text-[11px] text-[#64748B] mb-4">
            Inspection outcome distribution across reviewed cases.
          </p>

          <div className="flex items-center justify-around gap-2 my-2">
            {/* SVG Donut */}
            <div className="relative flex items-center justify-center shrink-0">
              <svg width={size} height={size} className="rotate-[-90deg]">
                {donutSlices.map((slice, i) => (
                  <circle
                    key={i}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={slice.strokeDasharray}
                    strokeDashoffset={slice.strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-sm font-black text-[#1E293B] leading-none">
                  {complianceOverview.centerText}
                </span>
                <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider mt-0.5">
                  {complianceOverview.centerSubtext}
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-1.5 text-xs">
              {complianceOverview.segments.map((seg, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                    <span className="font-semibold text-[#334155]">{seg.label}</span>
                  </div>
                  <span className="font-mono font-bold text-[#1E293B]">{seg.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#F1F5F9] text-[10px] text-[#94A3B8] flex items-center justify-between">
          <span>Adjudicated Cases Split</span>
          <span>Demo analytics</span>
        </div>
      </div>

      {/* 2. Audit Status Bar Chart */}
      <div className="bg-white border border-[#D8DDE3] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#EFF6FF] text-[#174A7E] rounded-lg">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-[#1E293B]">Audit Status</h3>
            </div>
            <span className="text-[10px] font-bold text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded">
              Workload Split
            </span>
          </div>
          <p className="text-[11px] text-[#64748B] mb-3">
            Current demonstration breakdown of audit workflow states.
          </p>

          <div className="space-y-2">
            {auditStatus.map((item) => {
              const pct = Math.round((item.count / maxAuditCount) * 100);
              return (
                <div key={item.label} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[#334155]">{item.label}</span>
                    <span className="font-mono font-bold text-[#1E293B]">{item.count}</span>
                  </div>
                  <div className="w-full bg-[#F1F5F9] rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: item.color || '#174A7E' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#F1F5F9] text-[10px] text-[#94A3B8] flex items-center justify-between">
          <span>Field & Supervisory Queue</span>
          <span>Demo analytics</span>
        </div>
      </div>

      {/* 3. Violation Trends Horizontal Bar Chart */}
      <div className="bg-white border border-[#D8DDE3] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#FEF2F2] text-[#DC2626] rounded-lg">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-[#1E293B]">Violation Trends</h3>
            </div>
            <span className="text-[10px] font-bold text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded">
              Top Deficiencies
            </span>
          </div>
          <p className="text-[11px] text-[#64748B] mb-3">
            Demonstration distribution of recorded violation types.
          </p>

          <div className="space-y-2">
            {violationTrends.map((item) => {
              const pct = Math.round((item.count / maxViolCount) * 100);
              return (
                <div key={item.label} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[#334155] truncate max-w-[170px]" title={item.label}>
                      {item.label}
                    </span>
                    <span className="font-mono font-bold text-[#DC2626]">{item.count}</span>
                  </div>
                  <div className="w-full bg-[#F1F5F9] rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: item.color || '#DC2626' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#F1F5F9] text-[10px] text-[#94A3B8] flex items-center justify-between">
          <span>Statutory Notice Categorization</span>
          <span>Demo analytics</span>
        </div>
      </div>
    </div>
  );
};
