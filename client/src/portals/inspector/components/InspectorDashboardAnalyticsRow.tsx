import React from 'react';
import { 
  ClipboardList, 
  Layers, 
  Camera, 
  Ruler 
} from 'lucide-react';
import type { InspectorDemoAnalytics } from './InspectorAnalyticsData';

interface InspectorDashboardAnalyticsRowProps {
  analytics: InspectorDemoAnalytics;
}

export const InspectorDashboardAnalyticsRow: React.FC<InspectorDashboardAnalyticsRowProps> = ({
  analytics
}) => {
  const maxAuditCount = Math.max(...analytics.assignedAuditStatus.map(s => s.value), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#174A7E]" />
          <h2 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
            Field Workload & Workflow Analytics
          </h2>
        </div>
        <span className="text-[10px] font-semibold text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0]">
          Demonstration Overview
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 1A. Assigned Audit Status Bar Chart (5 cols) */}
        <div className="lg:col-span-6 xl:col-span-5 bg-white border border-[#D8DDE3] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#EFF6FF] text-[#174A7E] rounded-lg">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#1E293B]">Assigned Audit Status</h3>
                  <p className="text-[11px] text-[#64748B]">Demonstration breakdown of your assigned inspection workload.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {analytics.assignedAuditStatus.map((item) => {
                const percentage = Math.round((item.value / maxAuditCount) * 100);
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#334155]">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#1E293B] font-mono">{item.value}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${item.badgeClass}`}>
                          {item.value} {item.value === 1 ? 'case' : 'cases'}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-[#F1F5F9] h-2.5 rounded-full overflow-hidden">
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
            <span>Total Assigned Caseload</span>
            <span className="font-bold text-[#1E293B] font-mono">
              {analytics.assignedAuditStatus.reduce((acc, curr) => acc + curr.value, 0)} Audits
            </span>
          </div>
        </div>

        {/* 1B. Inspection Progress Workflow (7 cols) */}
        <div className="lg:col-span-6 xl:col-span-7 bg-white border border-[#D8DDE3] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#F0FDF4] text-[#15803D] rounded-lg">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#1E293B]">Inspection Progress</h3>
                  <p className="text-[11px] text-[#64748B]">Typical progress across the inspection workflow.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {analytics.inspectionProgress.map((stage, idx) => (
                <div key={stage.label} className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-white border border-[#CBD5E1] text-[10px] font-bold text-[#475569] flex items-center justify-center font-mono">
                        0{idx + 1}
                      </span>
                      <span className="font-bold text-[#1E293B]">{stage.label}</span>
                      <span className="hidden sm:inline text-[11px] text-[#64748B] truncate max-w-[220px]">
                        &bull; {stage.description}
                      </span>
                    </div>
                    <span className="font-bold text-xs font-mono text-[#174A7E] bg-white px-2 py-0.5 rounded border border-[#CBD5E1]">
                      {stage.value}%
                    </span>
                  </div>
                  <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${stage.color}`}
                      style={{ width: `${stage.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Part 3: Field Evidence Summary mini-pills */}
          <div className="mt-4 pt-3 border-t border-[#F1F5F9] grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-[#EFF6FF] p-2 rounded-lg border border-[#DBEAFE] flex items-center gap-2">
              <Camera className="w-3.5 h-3.5 text-[#1D4ED8]" />
              <div>
                <div className="text-[9px] font-bold text-[#1E40AF] uppercase">Front Panel</div>
                <div className="text-xs font-bold text-[#1E293B] font-mono">{analytics.evidenceSummary.front} image</div>
              </div>
            </div>
            <div className="bg-[#EFF6FF] p-2 rounded-lg border border-[#DBEAFE] flex items-center gap-2">
              <Camera className="w-3.5 h-3.5 text-[#1D4ED8]" />
              <div>
                <div className="text-[9px] font-bold text-[#1E40AF] uppercase">Back Panel</div>
                <div className="text-xs font-bold text-[#1E293B] font-mono">{analytics.evidenceSummary.back} image</div>
              </div>
            </div>
            <div className="bg-[#F8FAFC] p-2 rounded-lg border border-[#E2E8F0] flex items-center gap-2">
              <Camera className="w-3.5 h-3.5 text-[#64748B]" />
              <div>
                <div className="text-[9px] font-bold text-[#475569] uppercase">Additional</div>
                <div className="text-xs font-bold text-[#1E293B] font-mono">{analytics.evidenceSummary.additional} images</div>
              </div>
            </div>
            <div className="bg-[#FEF3C7] p-2 rounded-lg border border-[#FDE68A] flex items-center gap-2">
              <Ruler className="w-3.5 h-3.5 text-[#B45309]" />
              <div>
                <div className="text-[9px] font-bold text-[#92400E] uppercase">Measurements</div>
                <div className="text-xs font-bold text-[#1E293B] font-mono">{analytics.evidenceSummary.measurements} rules</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
