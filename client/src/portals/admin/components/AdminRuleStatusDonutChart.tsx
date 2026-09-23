import React from 'react';
import { Scale } from 'lucide-react';
import type { RuleStatusDistribution } from './AdminAnalyticsData';

interface AdminRuleStatusDonutChartProps {
  data: RuleStatusDistribution;
}

export const AdminRuleStatusDonutChart: React.FC<AdminRuleStatusDonutChartProps> = ({ data }) => {
  // SVG Donut calculation
  const size = 140;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const activeStroke = (data.activePercentage / 100) * circumference;

  return (
    <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 shadow-xs flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#F5F3FF] text-[#7C3AED] rounded-lg">
              <Scale className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#1E293B]">Rule Status</h3>
          </div>
          <span className="text-[10px] font-bold text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded">
            {data.totalCount} total rules
          </span>
        </div>
        <p className="text-xs text-[#64748B] mb-5">
          Current distribution of configured regulatory rules.
        </p>

        {/* Donut Visual & Legend Layout */}
        <div className="flex flex-col sm:flex-row items-center justify-around gap-4 my-2">
          {/* SVG Donut */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg width={size} height={size} className="rotate-[-90deg]">
              {/* Inactive slice (background full circle) */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="#E2E8F0"
                strokeWidth={strokeWidth}
              />
              {/* Active slice */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="#174A7E"
                strokeWidth={strokeWidth}
                strokeDasharray={`${activeStroke} ${circumference}`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>

            {/* Donut Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-black text-[#1E293B] leading-none">
                {data.activePercentage}%
              </span>
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mt-1">
                Active
              </span>
            </div>
          </div>

          {/* Legend Items */}
          <div className="space-y-3 text-xs w-full sm:w-auto">
            <div className="p-2.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] min-w-[140px]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#174A7E] shrink-0" />
                  <span className="font-bold text-[#1E293B]">Active</span>
                </div>
                <span className="font-mono font-bold text-[#174A7E]">{data.activePercentage}%</span>
              </div>
              <div className="text-[11px] text-[#64748B] mt-0.5 pl-4.5">
                {data.activeCount} Enforced Rules
              </div>
            </div>

            <div className="p-2.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] min-w-[140px]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8] shrink-0" />
                  <span className="font-bold text-[#1E293B]">Inactive</span>
                </div>
                <span className="font-mono font-bold text-[#64748B]">{data.inactivePercentage}%</span>
              </div>
              <div className="text-[11px] text-[#64748B] mt-0.5 pl-4.5">
                {data.inactiveCount} Draft / Archived
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#F1F5F9] text-[11px] text-[#94A3B8] flex items-center justify-between">
        <span>Statutory Rule Enforceability</span>
        <span>Demo analytics</span>
      </div>
    </div>
  );
};
