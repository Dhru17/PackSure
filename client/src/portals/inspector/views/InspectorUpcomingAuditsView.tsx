import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Search,
  RotateCw,
  Building2,
  Clock,
  AlertTriangle,
  ArrowRight,
  MapPin,
  UserCheck,
  Phone,
  Mail,
  Sparkles
} from 'lucide-react';
import { api } from '../../../services/api';
import { StatusBadge, EmptyState } from '../../../components/ui';

interface InspectorUpcomingAuditsViewProps {
  onOpenCase: (caseId: number) => void;
  onResumeCase: (caseId: number) => void;
}

export const InspectorUpcomingAuditsView: React.FC<InspectorUpcomingAuditsViewProps> = ({
  onOpenCase,
  onResumeCase
}) => {
  const [audits, setAudits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'UPCOMING' | 'ACTIVE' | 'RETURNED' | 'ALL'>('UPCOMING');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlantForModal, setSelectedPlantForModal] = useState<any | null>(null);

  const loadAudits = async () => {
    setIsLoading(true);
    try {
      const res = await api.getScheduledAudits({
        status: 'ALL',
        search: searchQuery
      });
      setAudits(res.audits || []);
    } catch (err) {
      console.error('Error loading inspector upcoming audits:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAudits();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadAudits();
  };

  const upcomingAudits = useMemo(() => {
    return audits.filter(
      (a) => a.status === 'DRAFT' || a.status === 'EVIDENCE_PENDING'
    );
  }, [audits]);

  const activeAudits = useMemo(() => {
    return audits.filter(
      (a) =>
        a.status === 'ANALYZING' ||
        a.status === 'ANALYSIS_COMPLETE' ||
        a.status === 'INSPECTOR_REVIEW'
    );
  }, [audits]);

  const returnedAudits = useMemo(() => {
    return audits.filter((a) => a.status === 'RETURNED');
  }, [audits]);

  const displayedAudits = useMemo(() => {
    if (statusFilter === 'UPCOMING') return upcomingAudits;
    if (statusFilter === 'ACTIVE') return activeAudits;
    if (statusFilter === 'RETURNED') return returnedAudits;
    return audits;
  }, [statusFilter, upcomingAudits, activeAudits, returnedAudits, audits]);

  // KPIs
  const kpis = useMemo(() => {
    const upcoming = upcomingAudits.length;
    const active = activeAudits.length;
    const returned = returnedAudits.length;
    const distinctPlants = new Set(
      audits.map((a) => a.plant_id || a.plant_name).filter(Boolean)
    ).size;

    return { upcoming, active, returned, distinctPlants };
  }, [upcomingAudits, activeAudits, returnedAudits, audits]);

  // Format and urgency calculation
  const getScheduleUrgency = (dateStr?: string) => {
    if (!dateStr) return { label: 'Date Not Set', color: 'bg-slate-100 text-slate-700 border-slate-200', isOverdue: false };
    try {
      const targetDate = new Date(dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const targetDay = new Date(targetDate);
      targetDay.setHours(0, 0, 0, 0);

      const diffTime = targetDay.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return {
          label: `Overdue (${Math.abs(diffDays)}d ago)`,
          color: 'bg-red-50 text-red-700 border-red-200 font-semibold',
          isOverdue: true
        };
      } else if (diffDays === 0) {
        return {
          label: 'Scheduled Today',
          color: 'bg-amber-50 text-amber-800 border-amber-300 font-bold animate-pulse',
          isOverdue: false
        };
      } else if (diffDays === 1) {
        return {
          label: 'Tomorrow',
          color: 'bg-blue-50 text-blue-700 border-blue-200 font-semibold',
          isOverdue: false
        };
      } else {
        return {
          label: `In ${diffDays} days`,
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          isOverdue: false
        };
      }
    } catch {
      return { label: 'Scheduled', color: 'bg-slate-100 text-slate-700 border-slate-200', isOverdue: false };
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-[#D8DDE3] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#1E293B]">Upcoming & Assigned Audits</h1>
            <span className="px-2.5 py-0.5 bg-[#174A7E]/10 text-[#174A7E] font-bold text-xs rounded-full">
              {audits.length} Assigned
            </span>
          </div>
          <p className="text-sm text-[#64748B] mt-1">
            Mandated compliance inspections assigned to you by Senior Officers. Review schedules, target plants, and start field capture.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAudits}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-[#CBD5E1] text-[#334155] rounded-lg text-xs font-semibold hover:bg-[#F8FAFC] transition-colors shadow-2xs"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#174A7E]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Pending Field Audits
            </div>
            <div className="text-2xl font-bold text-[#1E293B] mt-1">{kpis.upcoming}</div>
            <div className="text-[11px] text-[#0284C7] font-medium mt-0.5">Ready for label capture</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Under Analysis
            </div>
            <div className="text-2xl font-bold text-[#1E293B] mt-1">{kpis.active}</div>
            <div className="text-[11px] text-[#D97706] font-medium mt-0.5">AI OCR / Verification</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Returned by SO
            </div>
            <div className="text-2xl font-bold text-[#1E293B] mt-1">{kpis.returned}</div>
            <div className="text-[11px] text-[#DC2626] font-medium mt-0.5">Requires clarification</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Target Facilities
            </div>
            <div className="text-2xl font-bold text-[#1E293B] mt-1">{kpis.distinctPlants}</div>
            <div className="text-[11px] text-[#16A34A] font-medium mt-0.5">Manufacturing plants</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#D8DDE3] shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Status Filter Tabs */}
        <div className="flex bg-[#F1F5F9] p-1 rounded-lg w-full md:w-auto">
          {[
            { id: 'UPCOMING', label: `Upcoming Audits (${upcomingAudits.length})` },
            { id: 'ACTIVE', label: `In Verification (${activeAudits.length})` },
            { id: 'RETURNED', label: `Returned (${returnedAudits.length})` },
            { id: 'ALL', label: `All Assigned (${audits.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`flex-1 md:flex-none px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                statusFilter === tab.id
                  ? 'bg-white text-[#174A7E] shadow-2xs font-bold'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search brand, plant, case ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#174A7E]/20 focus:border-[#174A7E]"
          />
        </form>
      </div>

      {/* Audits List */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-xl border border-[#D8DDE3] text-center">
          <RotateCw className="w-8 h-8 text-[#174A7E] animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#1E293B]">Loading assigned audits...</p>
          <p className="text-xs text-[#64748B] mt-1">Retrieving scheduled inspection records from registry</p>
        </div>
      ) : displayedAudits.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-8 h-8 text-[#94A3B8]" />}
          title={
            statusFilter === 'UPCOMING'
              ? 'No Upcoming Audits Found'
              : statusFilter === 'ACTIVE'
              ? 'No Active Inspections Found'
              : statusFilter === 'RETURNED'
              ? 'No Returned Audits'
              : 'No Assigned Audits Found'
          }
          description={
            searchQuery
              ? `No assigned audits matched your search "${searchQuery}".`
              : statusFilter === 'UPCOMING'
              ? 'You do not have any pending field audits awaiting initial scan.'
              : 'You do not have any scheduled audits matching this filter.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {displayedAudits.map((audit) => {
            const urgency = getScheduleUrgency(audit.scheduled_date);
            const isPendingFieldScan = audit.status === 'DRAFT' || audit.status === 'EVIDENCE_PENDING';
            const isReturned = audit.status === 'RETURNED';

            return (
              <div
                key={audit.id}
                className={`bg-white rounded-xl border transition-all duration-200 shadow-xs hover:shadow-md p-5 ${
                  isReturned
                    ? 'border-red-300 bg-red-50/10'
                    : urgency.isOverdue
                    ? 'border-amber-300'
                    : 'border-[#E2E8F0]'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Product & Case Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2.5 py-1 bg-[#174A7E]/10 text-[#174A7E] rounded-md">
                        {audit.case_number}
                      </span>
                      <StatusBadge status={audit.status} />
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full border ${urgency.color}`}>
                        {urgency.label}
                      </span>
                      {audit.product?.category_code && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md">
                          {audit.product.category_code}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-[#1E293B] flex items-center gap-2">
                        {audit.product?.brand_name || 'Generic'} - {audit.product?.commodity_name || 'Packaged Commodity'}
                      </h3>
                      <div className="text-xs text-[#64748B] flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        {audit.product?.barcode && (
                          <span>Barcode: <strong className="text-[#334155]">{audit.product.barcode}</strong></span>
                        )}
                        {audit.product?.default_net_quantity && (
                          <span>Net Qty: <strong className="text-[#334155]">{audit.product.default_net_quantity}</strong></span>
                        )}
                        {audit.product?.default_mrp && (
                          <span>MRP: <strong className="text-[#334155]">₹{audit.product.default_mrp}</strong></span>
                        )}
                        <span>Rule Version: <strong className="text-[#334155]">{audit.rule_version || 'v2022.1'}</strong></span>
                      </div>
                    </div>

                    {/* Facility & Location info */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#475569] pt-1">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Building2 className="w-3.5 h-3.5 text-[#174A7E]" />
                        <span>{audit.plant_name || audit.plant?.name || 'Designated Plant'}</span>
                        {audit.plant && (
                          <button
                            onClick={() => setSelectedPlantForModal(audit.plant)}
                            className="text-[11px] text-[#174A7E] underline hover:text-[#0E355B] ml-1"
                          >
                            (View Facility)
                          </button>
                        )}
                      </div>
                      {(audit.plant_city || audit.plant?.city) && (
                        <div className="flex items-center gap-1 text-[#64748B]">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{audit.plant_city || audit.plant?.city}, {audit.plant?.state || 'Gujarat'}</span>
                        </div>
                      )}
                    </div>

                    {/* Senior Remarks / Special Instructions */}
                    {(audit.senior_remarks || audit.inspector_remarks) && (
                      <div className={`p-2.5 rounded-lg text-xs mt-2 ${
                        isReturned ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]'
                      }`}>
                        <div className="font-semibold flex items-center gap-1.5 mb-0.5">
                          {isReturned ? (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                              <span className="text-red-700">Senior Officer Return Remarks (Cycle #{audit.review_cycle || 2}):</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5 text-[#174A7E]" />
                              <span>Senior Officer Instructions ({audit.scheduled_by_name || 'Senior Officer'}):</span>
                            </>
                          )}
                        </div>
                        <p className="italic">{audit.senior_remarks || audit.inspector_remarks}</p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#E2E8F0]">
                    {isPendingFieldScan ? (
                      <button
                        onClick={() => onResumeCase(audit.id)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#174A7E] text-white rounded-lg text-xs font-bold hover:bg-[#0E355B] transition-all shadow-xs"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Start Field Audit</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : isReturned ? (
                      <button
                        onClick={() => onResumeCase(audit.id)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all shadow-xs"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>Resume Reinspection</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onResumeCase(audit.id)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0284C7] text-white rounded-lg text-xs font-bold hover:bg-[#0369A1] transition-all shadow-xs"
                      >
                        <span>Continue Verification</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => onOpenCase(audit.id)}
                      className="px-4 py-2 bg-white border border-[#CBD5E1] text-[#475569] rounded-lg text-xs font-semibold hover:bg-[#F8FAFC] transition-colors"
                    >
                      View Case Summary
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Facility Quick-Info Modal */}
      {selectedPlantForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-[#D8DDE3] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#174A7E]/10 text-[#174A7E] rounded-lg">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1E293B]">{selectedPlantForModal.name}</h3>
                  <p className="text-xs text-[#64748B]">Plant Code: {selectedPlantForModal.plant_code || 'N/A'}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlantForModal(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                  <div className="text-[11px] font-semibold text-[#64748B]">City & State</div>
                  <div className="font-bold text-[#1E293B] mt-0.5">
                    {selectedPlantForModal.city}, {selectedPlantForModal.state}
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">PIN: {selectedPlantForModal.pin_code || '382110'}</div>
                </div>

                <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                  <div className="text-[11px] font-semibold text-[#64748B]">Jurisdiction Zone</div>
                  <div className="font-bold text-[#174A7E] mt-0.5">
                    {selectedPlantForModal.jurisdiction_name || 'Ahmedabad District'}
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">Enforcement Verified</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-[#1E293B]">Physical Address:</div>
                <p className="text-xs text-[#475569] bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {selectedPlantForModal.address || 'Plot 42, GIDC Industrial Estate, Sanand, Ahmedabad'}
                </p>
              </div>

              {(selectedPlantForModal.contact_person || selectedPlantForModal.contact_phone || selectedPlantForModal.contact_email) && (
                <div className="space-y-2 border-t border-[#E2E8F0] pt-3">
                  <div className="text-xs font-bold text-[#1E293B]">Plant On-Site Contact:</div>
                  <div className="space-y-1.5 text-xs text-[#475569]">
                    {selectedPlantForModal.contact_person && (
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-[#174A7E]" />
                        <span>{selectedPlantForModal.contact_person}</span>
                      </div>
                    )}
                    {selectedPlantForModal.contact_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#174A7E]" />
                        <span>{selectedPlantForModal.contact_phone}</span>
                      </div>
                    )}
                    {selectedPlantForModal.contact_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-[#174A7E]" />
                        <span>{selectedPlantForModal.contact_email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex justify-end">
              <button
                onClick={() => setSelectedPlantForModal(null)}
                className="px-4 py-2 bg-[#174A7E] text-white rounded-lg text-xs font-bold hover:bg-[#0E355B]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
