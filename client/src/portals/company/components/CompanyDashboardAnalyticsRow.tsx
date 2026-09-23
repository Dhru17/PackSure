import React from 'react';
import { 
  ClipboardCheck, 
  PieChart, 
  AlertTriangle 
} from 'lucide-react';
import type { CompanyDemoAnalytics } from './CompanyAnalyticsData';

interface CompanyDashboardAnalyticsRowProps {
  analytics: CompanyDemoAnalytics;
}

export const CompanyDashboardAnalyticsRow: React.FC<CompanyDashboardAnalyticsRowProps> = ({
  analytics
}) => {
  const maxAuditCount = Math.max(...analytics.auditStatus.map(s => s.value), 1);
  const maxViolationCount = Math.max(...analytics.violationsByType.map(v => v.value), 1);

  // SVG Donut calculation for 3 segments (72%, 20%, 8%)
  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~238.76

  // Cumulative offsets
  const seg1Pct = analytics.complianceOverview[0].value / 100; // 0.72
  const seg2Pct = analytics.complianceOverview[1].value / 100; // 0.20
  const seg3Pct = analytics.complianceOverview[2].value / 100; // 0.08

  const seg1Len = seg1Pct * circumference;
  const seg2Len = seg2Pct * circumference;
  const seg3Len = seg3Pct * circumference;

  const seg1Offset = 0;
  const seg2Offset = -seg1Len;
  const seg3Offset = -(seg1Len + seg2Len);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#174A7E]" />
          <h2 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
            Organization Compliance & Audit Analytics
          </h2>
        </div>
        <span className="text-[10px] font-semibold text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0]">
          Company-Scoped Demonstration Overview
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1A. Audit Status Bar Chart */}
        <div className="bg-white border border-[#D8DDE3] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#EFF6FF] text-[#174A7E] rounded-lg">
                  <ClipboardCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#1E293B]">Audit Status</h3>
                  <p className="text-[11px] text-[#64748B]">Overview of your organization's audit workflow.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {analytics.auditStatus.map((item) => {
                const percentage = Math.round((item.value / maxAuditCount) * 100);
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#334155]">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#1E293B] font-mono">{item.value}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${item.badgeClass}`}>
                          {item.value} {item.value === 1 ? 'audit' : 'audits'}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
            <span>Total Lifecycle Audits</span>
            <span className="font-bold text-[#1E293B] font-mono">
              {analytics.auditStatus.reduce((acc, curr) => acc + curr.value, 0)} Recorded
            </span>
          </div>
        </div>

        {/* 1B. Product Compliance Overview Donut Chart */}
        <div className="bg-white border border-[#D8DDE3] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#F0FDF4] text-[#15803D] rounded-lg">
                  <PieChart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#1E293B]">Product Compliance Overview</h3>
                  <p className="text-[11px] text-[#64748B]">Demonstration distribution for company products.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 my-2">
              {/* SVG Donut */}
              <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  {/* Background track */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    className="stroke-[#F1F5F9]"
                    strokeWidth="11"
                    fill="transparent"
                  />
                  {/* Segment 1: Compliant (72%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke={analytics.complianceOverview[0].color}
                    strokeWidth="11"
                    strokeDasharray={`${seg1Len} ${circumference}`}
                    strokeDashoffset={seg1Offset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                  {/* Segment 2: Violations (20%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke={analytics.complianceOverview[1].color}
                    strokeWidth="11"
                    strokeDasharray={`${seg2Len} ${circumference}`}
                    strokeDashoffset={seg2Offset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                  {/* Segment 3: Under Review (8%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke={analytics.complianceOverview[2].color}
                    strokeWidth="11"
                    strokeDasharray={`${seg3Len} ${circumference}`}
                    strokeDashoffset={seg3Offset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-base font-extrabold text-[#1E293B]">72%</span>
                  <span className="text-[9px] text-[#15803D] font-bold uppercase tracking-wider">Compliant</span>
                </div>
              </div>

              {/* Donut Legend */}
              <div className="space-y-2 text-xs w-full sm:w-auto">
                {analytics.complianceOverview.map((item) => (
                  <div key={item.label} className="flex items-center justify-between sm:justify-start gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[#475569] font-medium">{item.label}</span>
                    </div>
                    <span className="font-bold text-[#1E293B] font-mono">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
            <span>Compliance Posture</span>
            <span className="font-bold text-[#15803D]">High Statutory Adherence</span>
          </div>
        </div>

        {/* 1C. Violations by Type Bar Chart */}
        <div className="bg-white border border-[#D8DDE3] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#FEF2F2] text-[#DC2626] rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#1E293B]">Violations by Type</h3>
                  <p className="text-[11px] text-[#64748B]">Demonstration distribution of recorded issues.</p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              {analytics.violationsByType.map((item) => {
                const percentage = Math.round((item.value / maxViolationCount) * 100);
                return (
                  <div key={item.label} className="space-y-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#334155] truncate max-w-[180px]">{item.label}</span>
                      <span className="font-bold text-[#1E293B] font-mono">{item.value}</span>
                    </div>
                    <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
            <span>Total Recorded Issues</span>
            <span className="font-bold text-[#1E293B] font-mono">
              {analytics.violationsByType.reduce((acc, curr) => acc + curr.value, 0)} Deficiencies
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
