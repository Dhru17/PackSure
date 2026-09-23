import React from 'react';
import { TrendingUp, Building2, LineChart as LineChartIcon } from 'lucide-react';
import type { SeniorOfficerDemoAnalytics } from './SeniorAnalyticsData';

interface SystemicPatternAnalyticsRowProps {
  analytics: SeniorOfficerDemoAnalytics;
}

export const SystemicPatternAnalyticsRow: React.FC<SystemicPatternAnalyticsRowProps> = ({ analytics }) => {
  const { systemicRuleTrend, companyPriority, recurringPatternTrend } = analytics;

  const maxRuleCount = Math.max(...systemicRuleTrend.map(r => r.count), 1);
  const maxCompanyCount = Math.max(...companyPriority.map(c => c.count), 1);
  const maxTrendValue = Math.max(...recurringPatternTrend.map(p => p.value), 1);

  // SVG Line Chart coordinates
  const svgWidth = 260;
  const svgHeight = 90;
  const paddingX = 25;
  const paddingY = 15;

  const points = recurringPatternTrend.map((pt, idx) => {
    const x = paddingX + (idx / (recurringPatternTrend.length - 1)) * (svgWidth - 2 * paddingX);
    const y = svgHeight - paddingY - (pt.value / maxTrendValue) * (svgHeight - 2 * paddingY);
    return { ...pt, x, y };
  });

  const polylinePath = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. Rule Trend (Horizontal Bar Chart) */}
      <div className="bg-white border border-[#D8DDE3] rounded-2xl p-4.5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-[#EFF6FF] text-[#174A7E] rounded-lg">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-bold text-[#1E293B]">Rule Trend</h3>
            </div>
            <span className="text-[9px] font-bold text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.5 rounded">
              Recurring Frequency
            </span>
          </div>
          <p className="text-[10px] text-[#64748B] mb-3">
            Recurring violation frequency across inspection history.
          </p>

          <div className="space-y-2">
            {systemicRuleTrend.map((item) => {
              const pct = Math.round((item.count / maxRuleCount) * 100);
              return (
                <div key={item.label} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[#334155] truncate max-w-[170px]" title={item.label}>
                      {item.label}
                    </span>
                    <span className="font-mono font-bold text-[#1E293B]">{item.count}</span>
                  </div>
                  <div className="w-full bg-[#F1F5F9] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: item.color || '#174A7E' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-[#F1F5F9] text-[10px] text-[#94A3B8] flex items-center justify-between">
          <span>Statutory breaches</span>
          <span>Demo data</span>
        </div>
      </div>

      {/* 2. Company / Brand Priority */}
      <div className="bg-white border border-[#D8DDE3] rounded-2xl p-4.5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-[#FEF3C7] text-[#D97706] rounded-lg">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-bold text-[#1E293B]">Company Violation Priority</h3>
            </div>
            <span className="text-[9px] font-bold text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.5 rounded">
              Concentration
            </span>
          </div>
          <p className="text-[10px] text-[#64748B] mb-3">
            Demonstration view of recurring violation concentration by company.
          </p>

          <div className="space-y-2.5">
            {companyPriority.map((item) => {
              const pct = Math.round((item.count / maxCompanyCount) * 100);
              return (
                <div key={item.label} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[#334155]">{item.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-[#1E293B]">{item.count}</span>
                      {item.badge && (
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                          item.badgeType === 'danger' ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]' :
                          item.badgeType === 'warning' ? 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]' :
                          'bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7]'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-[#F1F5F9] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: item.color || '#D97706' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-[#F1F5F9] text-[10px] text-[#94A3B8] flex items-center justify-between">
          <span>Portfolio defect scope</span>
          <span>Demo data</span>
        </div>
      </div>

      {/* 3. Recurring Pattern Trend (Line Chart) */}
      <div className="bg-white border border-[#D8DDE3] rounded-2xl p-4.5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 bg-[#F5F3FF] text-[#7C3AED] rounded-lg">
                <LineChartIcon className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-bold text-[#1E293B]">Recurring Pattern Trend</h3>
            </div>
            <span className="text-[9px] font-bold text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.5 rounded">
              Monthly Evolution
            </span>
          </div>
          <p className="text-[10px] text-[#64748B] mb-2">
            Monthly detected recurring systemic compliance patterns.
          </p>

          {/* SVG Line Chart */}
          <div className="w-full flex flex-col items-center justify-center my-1">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-24 overflow-visible">
              {/* Grid Lines */}
              <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="#E2E8F0" />

              {/* Area fill */}
              <polygon
                points={`${paddingX},${svgHeight - paddingY} ${polylinePath} ${svgWidth - paddingX},${svgHeight - paddingY}`}
                fill="#7C3AED"
                fillOpacity="0.08"
              />

              {/* Polyline */}
              <polyline
                fill="none"
                stroke="#7C3AED"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylinePath}
              />

              {/* Data points */}
              {points.map((pt, i) => (
                <g key={i}>
                  <circle cx={pt.x} cy={pt.y} r="3.5" fill="#7C3AED" stroke="#FFFFFF" strokeWidth="1.5" />
                  <text
                    x={pt.x}
                    y={pt.y - 6}
                    textAnchor="middle"
                    className="text-[9px] font-bold fill-[#7C3AED]"
                  >
                    {pt.value}
                  </text>
                  <text
                    x={pt.x}
                    y={svgHeight - 2}
                    textAnchor="middle"
                    className="text-[9px] font-medium fill-[#94A3B8]"
                  >
                    {pt.month}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-[#F1F5F9] text-[10px] text-[#94A3B8] flex items-center justify-between">
          <span>Systemic pattern aggregation</span>
          <span>Demo data</span>
        </div>
      </div>
    </div>
  );
};
