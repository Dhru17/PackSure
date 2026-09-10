import React from 'react';
import { 
  CalendarClock, 
  FileText, 
  Activity, 
  ArrowRight, 
  Upload, 
  ShieldCheck,
  Package,
  Layers,
  ChevronRight
} from 'lucide-react';
import type { CompanyNavTab } from '../components/CompanySidebar';

interface CompanyDashboardProps {
  overviewData: any;
  onNavigateTab: (tab: CompanyNavTab) => void;
  onOpenAuditDetail: (caseId: number) => void;
  onOpenProductDetail?: (productId: number) => void;
  onOpenUploadDoc: () => void;
}

export const CompanyDashboard: React.FC<CompanyDashboardProps> = ({
  overviewData: d,
  onNavigateTab,
  onOpenAuditDetail,
  onOpenProductDetail,
  onOpenUploadDoc
}) => {
  const stats = d?.stats || {
    total_products_count: 4,
    total_plants_count: 1,
    upcoming_audits_count: 0,
    active_audits_count: 0,
    finalized_audits_count: 0,
    pending_documents_count: 0,
    rejected_documents_count: 0,
    total_documents_count: 0,
    average_compliance_score: 100.0
  };

  const upcoming = d?.upcoming_audits || [];
  const notifications = d?.notifications || [];

  return (
    <div className="space-y-6">
      {/* KPI Cards Row (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Registered Products (Primary Link) */}
        <div 
          onClick={() => onNavigateTab('products')}
          className="p-5 bg-white border border-[#D8DDE3] rounded-2xl shadow-xs hover:border-[#174A7E] hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Registered Products
            </span>
            <div className="p-2 rounded-xl bg-[#EFF6FF] text-[#174A7E] border border-[#BFDBFE] group-hover:bg-[#174A7E] group-hover:text-white transition">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#1E293B]">
              {stats.total_products_count ?? (d?.company?.products_count || 4)}
            </div>
            <p className="text-[11px] text-[#174A7E] mt-0.5 font-bold flex items-center gap-1">
              <span>View catalog & specs</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
            </p>
          </div>
        </div>

        {/* Card 2: Upcoming Audits */}
        <div 
          onClick={() => onNavigateTab('upcoming')}
          className="p-5 bg-white border border-[#D8DDE3] rounded-2xl shadow-xs hover:border-[#174A7E] transition cursor-pointer flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Upcoming Audits
            </span>
            <div className="p-2 rounded-xl bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
              <CalendarClock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#1E293B]">{stats.upcoming_audits_count}</div>
            <p className="text-[11px] text-[#64748B] mt-0.5 font-medium">Scheduled inspections</p>
          </div>
        </div>

        {/* Card 3: Active / In-Progress */}
        <div 
          onClick={() => onNavigateTab('history')}
          className="p-5 bg-white border border-[#D8DDE3] rounded-2xl shadow-xs hover:border-[#174A7E] transition cursor-pointer flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Active Audits
            </span>
            <div className="p-2 rounded-xl bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#1E293B]">{stats.active_audits_count}</div>
            <p className="text-[11px] text-[#64748B] mt-0.5 font-medium">Under review cycle</p>
          </div>
        </div>

        {/* Card 4: Documents Pending Verification */}
        <div 
          onClick={() => onNavigateTab('documents')}
          className="p-5 bg-white border border-[#D8DDE3] rounded-2xl shadow-xs hover:border-[#174A7E] transition cursor-pointer flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Documents Queue
            </span>
            <div className="p-2 rounded-xl bg-[#F5F3FF] text-[#6B21A8] border border-[#DDD6FE]">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[#1E293B]">{stats.pending_documents_count}</span>
              {stats.rejected_documents_count > 0 && (
                <span className="text-xs font-bold text-[#DC2626] bg-[#FEF2F2] px-2 py-0.5 rounded border border-[#FECACA]">
                  {stats.rejected_documents_count} Req
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5 font-medium">Statutory certificates</p>
          </div>
        </div>

        {/* Card 5: Finalized & Compliance Rate */}
        <div 
          onClick={() => onNavigateTab('history')}
          className="p-5 bg-white border border-[#D8DDE3] rounded-2xl shadow-xs hover:border-[#174A7E] transition cursor-pointer flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Finalized Audits
            </span>
            <div className="p-2 rounded-xl bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7]">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[#1E293B]">{stats.finalized_audits_count}</span>
              <span className="text-xs font-bold text-[#15803D]">
                {stats.average_compliance_score}% Avg
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5 font-medium">Signed records</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Scheduled Audits + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Upcoming Scheduled Audits */}
        <div className="lg:col-span-2 bg-white border border-[#D8DDE3] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <div className="flex items-center gap-2.5">
              <CalendarClock className="w-5 h-5 text-[#174A7E]" />
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">
                Upcoming Scheduled Audits ({upcoming.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('upcoming')}
              className="text-xs font-bold text-[#174A7E] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {upcoming.length > 0 ? (
              upcoming.map((a: any) => (
                <div
                  key={a.id}
                  className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl hover:border-[#174A7E] hover:bg-white transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span 
                        onClick={() => onOpenAuditDetail(a.id)}
                        className="font-mono font-bold text-xs text-[#174A7E] hover:underline cursor-pointer"
                      >
                        #{a.case_number || a.id}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]">
                        {a.status}
                      </span>
                      <span className="text-xs text-[#64748B]">
                        &bull; Plant: <strong className="text-[#1E293B]">{a.plant_name}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (a.product_id && onOpenProductDetail) {
                            onOpenProductDetail(a.product_id);
                          } else {
                            onNavigateTab('products');
                          }
                        }}
                        className="text-xs font-bold text-[#1E293B] hover:text-[#174A7E] hover:underline text-left cursor-pointer flex items-center gap-1.5"
                      >
                        <Package className="w-3.5 h-3.5 text-[#174A7E]" />
                        <span>{a.commodity_name}</span>
                        {a.brand_name && <span className="font-normal text-[#64748B]">({a.brand_name})</span>}
                      </button>
                    </div>

                    <div className="text-[11px] text-[#64748B]">
                      Category: {a.category_name}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-[#64748B]">Scheduled Date</div>
                      <div className="text-xs font-bold text-[#174A7E]">
                        {a.scheduled_date ? a.scheduled_date.slice(0, 10) : 'Upcoming'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenAuditDetail(a.id)}
                      className="p-1.5 rounded-lg bg-[#EBF3FA] hover:bg-[#174A7E] text-[#174A7E] hover:text-white transition cursor-pointer"
                      title="View Audit Case"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-[#64748B] text-xs border border-dashed border-[#CBD5E1] rounded-xl">
                No audits currently scheduled for your company.
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Actions & Registered Products Quick Tile */}
        <div className="space-y-6">
          {/* Quick Tile: Registered Products Catalog */}
          <div 
            onClick={() => onNavigateTab('products')}
            className="bg-white border border-[#D8DDE3] hover:border-[#174A7E] rounded-2xl p-5 shadow-xs hover:shadow-md transition cursor-pointer space-y-2.5 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-[#1E293B]">
                <Package className="w-4 h-4 text-[#174A7E]" />
                <span>Registered Products Catalog</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:translate-x-1 transition" />
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Browse all {stats.total_products_count ?? 4} declared commodities, packaging dimensions, MRPs, and audit track records.
            </p>
            <div className="pt-2 flex items-center justify-between text-[11px] font-bold text-[#174A7E]">
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                <span>Manage SKUs & Specs</span>
              </span>
              <span>Open Catalog &rarr;</span>
            </div>
          </div>

          {/* Quick Certificate Upload Box */}
          <div className="bg-white border border-[#D8DDE3] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-[#1E293B]">
              <FileText className="w-4 h-4 text-[#174A7E]" />
              <span>Statutory Compliance Actions</span>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Upload statutory certificates (Model Approval, Packer Registration, Manufacturing License) to ensure upcoming audits proceed smoothly.
            </p>

            <button
              type="button"
              onClick={onOpenUploadDoc}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#174A7E] hover:bg-[#133E68] text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Statutory Document</span>
            </button>
          </div>

          {/* Compliance Alerts & Notifications */}
          <div className="bg-white border border-[#D8DDE3] rounded-2xl p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                Recent Directives & Alerts
              </span>
              <button
                type="button"
                onClick={() => onNavigateTab('notifications')}
                className="text-[11px] font-bold text-[#174A7E] hover:underline"
              >
                All
              </button>
            </div>

            <div className="space-y-2.5">
              {notifications.length > 0 ? (
                notifications.slice(0, 4).map((n: any) => (
                  <div key={n.id} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs space-y-1">
                    <div className="font-bold text-[#1E293B] flex items-center justify-between">
                      <span>{n.title}</span>
                      <span className="text-[10px] text-[#94A3B8]">
                        {n.created_at ? n.created_at.slice(0, 10) : 'Recent'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748B] leading-relaxed">{n.message}</p>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-[#64748B] text-xs">
                  No active alerts.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
