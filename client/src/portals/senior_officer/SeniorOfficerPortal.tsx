import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { InspectionCase, PackageEvidence, Declaration, ComplianceCheck, Violation } from '../../types';
import { 
  CheckCircle, XCircle, FileText, ArrowRight, 
  RotateCcw, Download, RefreshCw, Gavel, UserX,
  Search, ZoomIn, ZoomOut, Maximize2,
  Layers, History, AlertTriangle, Shield, Check,
  ChevronRight, X, Clock, Building2, Package
} from 'lucide-react';

type SeniorTab = 'overview' | 'queue' | 'studio' | 'analytics';

export const SeniorOfficerPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SeniorTab>('overview');
  
  // Overview State
  const [overviewData, setOverviewData] = useState<any>(null);

  // Queue State
  const [queue, setQueue] = useState<InspectionCase[]>([]);
  const [queueCount, setQueueCount] = useState(0);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  const [queueSearch, setQueueSearch] = useState('');
  const [queueStatusFilter, setQueueStatusFilter] = useState('ALL');
  const [queueSeverityFilter, setQueueSeverityFilter] = useState('ALL');
  const [queueSortBy, setQueueSortBy] = useState('newest');

  // Adjudication Studio State
  const [selectedCase, setSelectedCase] = useState<InspectionCase | null>(null);
  const [selectedEvidenceIndex, setSelectedEvidenceIndex] = useState(0);
  const [activeHighlightDecl, setActiveHighlightDecl] = useState<Declaration | ComplianceCheck | Violation | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  
  // History Drawer State
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [productHistory, setProductHistory] = useState<any>(null);

  // Adjudication Inputs
  const [overrideReason, setOverrideReason] = useState('');
  const [statutoryJustification, setStatutoryJustification] = useState('');
  const [seniorRemarks, setSeniorRemarks] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [confirmModalAction, setConfirmModalAction] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Analytics State
  const [analyticsSummary, setAnalyticsSummary] = useState<any>(null);
  const [repeatViolators, setRepeatViolators] = useState<any[]>([]);

  // --------------------------------------------------------------------------
  // DATA LOADERS
  // --------------------------------------------------------------------------
  const loadOverview = async () => {
    try {
      const res = await api.getSeniorOverview();
      setOverviewData(res);
    } catch (err) {
      console.error(err);
    }
  };

  const loadQueue = async () => {
    setIsLoadingQueue(true);
    try {
      const res = await api.getReviewQueue({
        search: queueSearch,
        status: queueStatusFilter,
        severity: queueSeverityFilter,
        sortBy: queueSortBy
      });
      setQueue(res.queue || []);
      setQueueCount(res.count || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingQueue(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const [sumRes, violRes] = await Promise.all([
        api.getAnalyticsSummary(),
        api.getRepeatViolators()
      ]);
      setAnalyticsSummary(sumRes);
      setRepeatViolators(violRes.repeat_violators || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadOverview();
    loadQueue();
    loadAnalytics();
  }, []);

  useEffect(() => {
    loadQueue();
  }, [queueSearch, queueStatusFilter, queueSeverityFilter, queueSortBy]);

  // Select Case & Launch Studio
  const handleSelectCase = async (caseId: number) => {
    try {
      const caseData = await api.getInspection(caseId);
      setSelectedCase(caseData);
      setSelectedEvidenceIndex(0);
      setActiveHighlightDecl(null);
      setZoomLevel(1.0);
      setSeniorRemarks(caseData.senior_remarks || '');
      setOverrideReason('');
      setStatutoryJustification('');
      setActiveTab('studio');
      
      // Preload product history
      if (caseData.product_id) {
        api.getProductHistory(caseData.product_id)
          .then(h => setProductHistory(h))
          .catch(console.error);
      }
    } catch (err: any) {
      alert(`Error loading case: ${err.message}`);
    }
  };

  // Senior Officer Adjudication Action
  const handleExecuteAction = async (actionType: string) => {
    if (!selectedCase) return;
    setIsProcessingAction(true);
    try {
      const res = await api.submitSeniorAction(selectedCase.id, {
        action: actionType,
        remarks: seniorRemarks,
        override_reason: overrideReason,
        statutory_justification: statutoryJustification
      });
      setActionNotice(`Case ${selectedCase.case_number} finalized with disposition: [${res.final_decision || actionType}]`);
      setConfirmModalAction(null);
      loadOverview();
      loadQueue();
      loadAnalytics();
      setActiveTab('overview');
      setSelectedCase(null);
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Itemized Finding Action
  const handleItemizedViolationAction = async (violId: number, action: 'CONFIRMED' | 'OVERRIDDEN' | 'DISMISSED') => {
    if (!selectedCase) return;
    const reason = prompt(`Enter reason for marking violation #${violId} as ${action}:`, overrideReason || 'Statutory review verification');
    if (!reason && action !== 'CONFIRMED') {
      alert("A reason is mandatory when overriding or dismissing a finding.");
      return;
    }
    try {
      await api.submitViolationAction(selectedCase.id, violId, {
        action: action,
        override_reason: reason || undefined
      });
      setActionNotice(`Violation #${violId} marked as ${action}.`);
      // Reload current case
      const updated = await api.getInspection(selectedCase.id);
      setSelectedCase(updated);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const currentEvidence: PackageEvidence | undefined = selectedCase?.evidences?.[selectedEvidenceIndex];

  return (
    <div className="space-y-5">
      {/* Top Banner & Executive Tab Switcher */}
      <div className="bg-white border border-[#D8DDE3] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2 bg-[#FEF3C7] text-[#B45309] rounded-lg border border-[#FDE68A]">
            <Gavel className="w-5 h-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-[#1E293B] tracking-tight">Senior Review Console</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">
                SECTION 36 AUTHORITY
              </span>
            </div>
            <p className="text-xs text-[#64748B]">
              Supervisory Review &bull; Legal Metrology (Packaged Commodities) Rules, 2011 and applicable amendments
            </p>
          </div>
        </div>

        {/* 4-Tab Navigation */}
        <div className="flex flex-wrap items-center bg-[#F1F5F9] p-1 rounded-lg border border-[#D8DDE3] gap-1 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('overview'); loadOverview(); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'overview' ? 'bg-[#174A7E] text-white shadow-2xs' : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => { setActiveTab('queue'); loadQueue(); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'queue' ? 'bg-[#174A7E] text-white shadow-2xs' : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Review Queue ({queueCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('studio')}
            disabled={!selectedCase}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'studio' ? 'bg-[#174A7E] text-white shadow-2xs' : 'text-[#94A3B8] disabled:opacity-40'
            }`}
          >
            <Gavel className="w-3.5 h-3.5" />
            <span>Adjudication Studio {selectedCase ? `(${selectedCase.case_number})` : ''}</span>
          </button>
          <button
            onClick={() => { setActiveTab('analytics'); loadAnalytics(); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'analytics' ? 'bg-[#174A7E] text-white shadow-2xs' : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            <span>Violator Intelligence</span>
          </button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="bg-[#EBF3FA] border border-[#CBD5E1] rounded-xl p-3.5 flex items-center justify-between gap-4 text-xs shadow-xs">
          <div className="flex items-center gap-2 text-[#174A7E]">
            <Check className="w-4 h-4 text-[#174A7E] shrink-0" />
            <span className="font-semibold">{actionNotice}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="px-2.5 py-1 bg-white hover:bg-[#F8F9FA] text-[#475569] rounded text-[11px] font-bold border border-[#CBD5E1] cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: SENIOR OVERVIEW DASHBOARD */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Workload Triage KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white border border-[#D8DDE3] rounded-xl p-4 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between text-[#64748B]">
                <span className="text-[10px] font-bold uppercase tracking-wider">Pending Adjudications</span>
                <Clock className="w-3.5 h-3.5 text-[#B45309]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-[#1E293B]">{overviewData?.workload?.pending_adjudications || 0}</span>
                <span className="text-[11px] text-[#B45309] font-bold">In Queue</span>
              </div>
              <p className="text-[10px] text-[#64748B]">Awaiting senior legal determination</p>
            </div>

            <div className="bg-white border border-[#FECACA] rounded-xl p-4 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between text-[#991B1B]">
                <span className="text-[10px] font-bold uppercase tracking-wider">High-Priority Cases</span>
                <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-[#DC2626]">{overviewData?.workload?.high_priority_cases || 0}</span>
                <span className="text-[11px] text-[#991B1B] font-semibold">Violations Flagged</span>
              </div>
              <p className="text-[10px] text-[#64748B]">Mandatory statutory breach inspections</p>
            </div>

            <div className="bg-white border border-[#FED7AA] rounded-xl p-4 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between text-[#C2410C]">
                <span className="text-[10px] font-bold uppercase tracking-wider">Returned to Inspector</span>
                <RotateCcw className="w-3.5 h-3.5 text-[#C2410C]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-[#C2410C]">{overviewData?.workload?.returned_cases || 0}</span>
                <span className="text-[11px] text-[#9A3412] font-semibold">Under Reinspection</span>
              </div>
              <p className="text-[10px] text-[#64748B]">Remanded for additional evidence</p>
            </div>

            <div className="bg-white border border-[#BBF7D0] rounded-xl p-4 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between text-[#166534]">
                <span className="text-[10px] font-bold uppercase tracking-wider">Today's Closed Orders</span>
                <CheckCircle className="w-3.5 h-3.5 text-[#16A34A]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-[#16A34A]">{overviewData?.workload?.today_finalized || 0}</span>
                <span className="text-[11px] text-[#15803D] font-semibold">Finalized</span>
              </div>
              <p className="text-[10px] text-[#64748B]">Completed Reviews & Recommended Enforcement Actions</p>
            </div>
          </div>

          {/* Activity Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Recent Submissions Feed */}
            <div className="lg:col-span-7 bg-white border border-[#D8DDE3] rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#174A7E]" />
                  <h2 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">Submitted Inspections Awaiting Review</h2>
                </div>
                <button
                  onClick={() => { setActiveTab('queue'); loadQueue(); }}
                  className="text-xs text-[#174A7E] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Queue</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2">
                {overviewData?.recent_submissions?.length === 0 ? (
                  <div className="p-8 text-center text-[#94A3B8] text-xs bg-[#F8F9FA] rounded-lg border border-[#E2E8F0]">
                    No pending submissions. All field cases have been adjudicated.
                  </div>
                ) : (
                  overviewData?.recent_submissions?.map((c: any) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCase(c.id)}
                      className="p-3 bg-[#F8F9FA] hover:bg-[#F1F5F9] border border-[#D8DDE3] rounded-lg transition flex items-center justify-between cursor-pointer group shadow-2xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#174A7E] bg-[#EBF3FA] px-2 py-0.5 rounded border border-[#CBD5E1]">
                            {c.case_number}
                          </span>
                          <span className="text-xs font-bold text-[#1E293B]">{c.brand_name}</span>
                          <span className="text-[11px] text-[#64748B]">({c.commodity_name})</span>
                        </div>
                        <p className="text-[11px] text-[#64748B]">
                          Inspector: <strong className="text-[#334155]">{c.inspector_name}</strong> &bull; {new Date(c.submitted_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          c.failed_checks > 0
                            ? 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                            : 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                        }`}>
                          {c.failed_checks > 0 ? `${c.failed_checks} Violations` : 'Clean Scan'}
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#1E293B]" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Senior Decisions Feed */}
            <div className="lg:col-span-5 bg-white border border-[#D8DDE3] rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-1.5">
                <Gavel className="w-4 h-4 text-[#174A7E]" />
                <h2 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">Recent Supervisory Determinations Log</h2>
              </div>

              <div className="space-y-2">
                {overviewData?.recent_decisions?.length === 0 ? (
                  <div className="p-8 text-center text-[#94A3B8] text-xs bg-[#F8F9FA] rounded-lg border border-[#E2E8F0]">
                    No orders issued in this cycle yet.
                  </div>
                ) : (
                  overviewData?.recent_decisions?.map((d: any) => (
                    <div key={d.id} className="p-2.5 bg-[#F8F9FA] border border-[#D8DDE3] rounded-lg space-y-1 text-xs shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-[#174A7E]">{d.case_number}</span>
                        <span className="font-bold text-[10px] text-[#64748B]">
                          {d.timestamp ? new Date(d.timestamp).toLocaleTimeString() : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#1E293B] font-semibold">{d.brand_name}</span>
                        <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          d.action === 'APPROVE_FINAL' || d.action === 'APPROVE_COMPLIANT'
                            ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                            : d.action === 'RETURN_FOR_REINSPECTION'
                            ? 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]'
                            : 'bg-[#EEF2FF] text-[#4338CA] border-[#C7D2FE]'
                        }`}>
                          {d.action}
                        </span>
                      </div>
                      {d.remarks && (
                        <p className="text-[11px] text-[#64748B] italic line-clamp-1">&ldquo;{d.remarks}&rdquo;</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REVIEW QUEUE */}
      {activeTab === 'queue' && (
        <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">Pending Statutory Review Queue</h2>
              <p className="text-xs text-[#64748B]">Filtered live inspections awaiting Senior Officer adjudication</p>
            </div>
            <button
              onClick={loadQueue}
              className="px-2.5 py-1.5 bg-white hover:bg-[#F8F9FA] text-[#475569] rounded-lg text-xs font-medium border border-[#CBD5E1] flex items-center gap-1.5 shadow-2xs self-start md:self-auto cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQueue ? 'animate-spin' : ''}`} />
              <span>Refresh Queue</span>
            </button>
          </div>

          {/* Search, Severity, Status & Sorting Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 bg-[#F8F9FA] p-3 rounded-lg border border-[#D8DDE3]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search case #, brand, inspector..."
                value={queueSearch}
                onChange={(e) => setQueueSearch(e.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded-md pl-8 pr-2.5 py-1.5 text-xs text-[#1E293B]"
              />
            </div>
            <div>
              <select
                value={queueStatusFilter}
                onChange={(e) => setQueueStatusFilter(e.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded-md px-2.5 py-1.5 text-xs text-[#1E293B] cursor-pointer"
              >
                <option value="ALL">All Queue Statuses</option>
                <option value="SUBMITTED">Submitted for Review</option>
                <option value="SENIOR_REVIEW">Under Senior Review</option>
              </select>
            </div>
            <div>
              <select
                value={queueSeverityFilter}
                onChange={(e) => setQueueSeverityFilter(e.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded-md px-2.5 py-1.5 text-xs text-[#1E293B] cursor-pointer"
              >
                <option value="ALL">All Violation Severities</option>
                <option value="HIGH">Violations Flagged Only</option>
                <option value="CLEAN">Clean Scans (0 Violations)</option>
              </select>
            </div>
            <div>
              <select
                value={queueSortBy}
                onChange={(e) => setQueueSortBy(e.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded-md px-2.5 py-1.5 text-xs text-[#1E293B] cursor-pointer"
              >
                <option value="newest">Sort: Newest Submissions First</option>
                <option value="violations">Sort: Highest Violations Count</option>
                <option value="priority">Sort: Highest Risk Priority</option>
                <option value="oldest">Sort: Longest Pending First</option>
              </select>
            </div>
          </div>

          {/* Queue Cards Grid */}
          {queue.length === 0 ? (
            <div className="bg-[#F8F9FA] border border-[#D8DDE3] rounded-xl p-10 text-center text-[#64748B] space-y-2">
              <CheckCircle className="w-8 h-8 text-[#16A34A] mx-auto" />
              <h3 className="text-sm font-bold text-[#1E293B]">All Clear! No Cases Matching Criteria</h3>
              <p className="text-xs text-[#94A3B8]">
                Adjust search filters or check back after field inspectors complete evidence uploads.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {queue.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#F8F9FA] border border-[#D8DDE3] hover:border-[#174A7E] rounded-xl p-4 space-y-3 shadow-2xs transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#174A7E] bg-[#EBF3FA] px-2 py-0.5 rounded border border-[#CBD5E1]">
                        {item.case_number}
                      </span>
                      <h3 className="text-xs font-bold text-[#1E293B] mt-1.5">
                        {item.product?.brand_name} - {item.product?.commodity_name}
                      </h3>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        Inspector: <span className="text-[#334155] font-semibold">{item.inspector_name || 'Inspector'}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        item.failed_checks > 0
                          ? 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                          : 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                      }`}>
                        {item.failed_checks} Violations Flagged
                      </span>
                      <p className="text-[10px] text-[#94A3B8] mt-1">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {item.inspector_remarks && (
                    <div className="bg-white p-2.5 rounded border border-[#E2E8F0] text-xs text-[#475569]">
                      <span className="text-[#64748B] block text-[9px] uppercase font-bold">Inspector Notes:</span>
                      <p className="mt-0.5 line-clamp-2 text-xs">{item.inspector_remarks}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
                    <a
                      href={api.getReportPdfUrl(item.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#174A7E] hover:underline flex items-center gap-1 font-semibold"
                    >
                      <FileText className="w-3.5 h-3.5" /> View PDF Draft
                    </a>

                    <button
                      type="button"
                      onClick={() => handleSelectCase(item.id)}
                      className="px-3 py-1.5 bg-[#174A7E] hover:bg-[#0F3B66] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                    >
                      <span>Open Adjudication Studio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MULTI-SURFACE EVIDENCE & ADJUDICATION STUDIO */}
      {activeTab === 'studio' && selectedCase && (
        <div className="space-y-4">
          {/* Header Bar with Case Context & History Drawer Toggle */}
          <div className="bg-white border border-[#D8DDE3] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#174A7E] bg-[#EBF3FA] px-2.5 py-1 rounded border border-[#CBD5E1]">
                  {selectedCase.case_number}
                </span>
                <span className="text-xs font-bold text-[#1E293B]">
                  &bull; {selectedCase.product?.brand_name} ({selectedCase.product?.commodity_name})
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-1">
                Surfaces: <strong className="text-[#1E293B]">{selectedCase.evidences?.length || 0} Captured</strong> &bull; Compliance Score: <strong className="text-[#15803D]">{selectedCase.compliance_score?.toFixed(0) || 0}%</strong> &bull; Inspector: <strong className="text-[#334155]">{selectedCase.inspector_name}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setHistoryDrawerOpen(true)}
                className="px-3 py-1.5 bg-white hover:bg-[#F8F9FA] text-[#475569] rounded-lg text-xs font-bold border border-[#CBD5E1] flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-[#174A7E]" />
                <span>Product & Mfg History</span>
              </button>
              <a
                href={api.getReportPdfUrl(selectedCase.id)}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-white hover:bg-[#F8F9FA] text-[#174A7E] rounded-lg text-xs font-bold border border-[#CBD5E1] flex items-center gap-1.5 shadow-2xs transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Draft PDF</span>
              </a>
            </div>
          </div>

          {/* 2-Column Multi-Surface Inspection & Adjudication Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Left Column: Multi-Surface Evidence Studio */}
            <div className="lg:col-span-6 space-y-3.5">
              <div className="bg-white border border-[#D8DDE3] rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#174A7E]" />
                    <span>Evidence Packaging Filmstrip ({selectedCase.evidences?.length || 0} Surfaces)</span>
                  </h3>
                  <div className="flex items-center gap-1 bg-[#F8F9FA] px-2 py-0.5 rounded border border-[#E2E8F0]">
                    <button
                      onClick={() => setZoomLevel(prev => Math.max(0.7, prev - 0.2))}
                      className="p-1 hover:text-[#174A7E] text-[#64748B] cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-mono text-[#475569] px-1 font-bold">{(zoomLevel * 100).toFixed(0)}%</span>
                    <button
                      onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.2))}
                      className="p-1 hover:text-[#174A7E] text-[#64748B] cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setZoomLevel(1.0)}
                      className="p-1 hover:text-[#174A7E] text-[#64748B] ml-1 cursor-pointer"
                      title="Reset Zoom"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Surface Filmstrip Selector */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {selectedCase.evidences?.map((ev, idx) => (
                    <button
                      key={ev.id}
                      onClick={() => { setSelectedEvidenceIndex(idx); setActiveHighlightDecl(null); }}
                      className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                        selectedEvidenceIndex === idx
                          ? 'bg-[#EBF3FA] text-[#174A7E] border-[#174A7E] shadow-2xs'
                          : 'bg-[#F8F9FA] text-[#64748B] border-[#D8DDE3] hover:text-[#1E293B]'
                      }`}
                    >
                      <span>{ev.surface_type}</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-white border border-[#CBD5E1] text-[#475569]">
                        {ev.quality_verdict}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Main Interactive Zoom/Pan Image Viewer with Bounding Box Overlay */}
                <div className="relative h-72 bg-[#F8F9FA] rounded-lg overflow-hidden border border-[#D8DDE3] flex items-center justify-center p-2">
                  {currentEvidence ? (
                    <div className="relative max-h-full max-w-full overflow-auto flex items-center justify-center">
                      <img
                        src={api.getMediaUrl(currentEvidence.storage_path)}
                        alt={currentEvidence.surface_type}
                        style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.15s ease-out' }}
                        className="max-h-64 object-contain select-none rounded"
                      />
                      {/* Bounding box highlight indicator badge if active */}
                      {activeHighlightDecl && (
                        <div className="absolute top-2 left-2 bg-[#174A7E] text-white px-2.5 py-1 rounded-md text-[10px] font-bold shadow-xs flex items-center gap-1">
                          <Check className="w-3 h-3 text-white" />
                          <span>Focusing: {(activeHighlightDecl as any).title || (activeHighlightDecl as any).rule_title || (activeHighlightDecl as any).rule_code}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-[#94A3B8]">No evidence photo available for this surface.</div>
                  )}
                </div>

                {/* Evidence Surface Metadata Card */}
                {currentEvidence && (
                  <div className="grid grid-cols-3 gap-2 text-[11px] bg-[#F8F9FA] p-2.5 rounded-lg border border-[#D8DDE3] text-[#64748B]">
                    <div>
                      <span className="text-[#94A3B8] text-[9px] uppercase font-bold">Surface Type</span>
                      <p className="font-bold text-[#1E293B]">{currentEvidence.surface_type}</p>
                    </div>
                    <div>
                      <span className="text-[#94A3B8] text-[9px] uppercase font-bold">Readability</span>
                      <p className="font-bold text-[#15803D]">{currentEvidence.quality_verdict}</p>
                    </div>
                    <div>
                      <span className="text-[#94A3B8] text-[9px] uppercase font-bold">Resolution</span>
                      <p className="font-mono text-[#1E293B]">{currentEvidence.width_px || 0} &times; {currentEvidence.height_px || 0} px</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Extracted Declarations & Human Verification List */}
              <div className="bg-white border border-[#D8DDE3] rounded-xl p-4 shadow-xs space-y-2.5">
                <h4 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                  Extracted Declarations & Inspector Overrides
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedCase.declarations?.map((d) => (
                    <div
                      key={d.id}
                      onClick={() => setActiveHighlightDecl(d)}
                      className={`p-2.5 rounded-lg border transition cursor-pointer text-xs space-y-0.5 shadow-2xs ${
                        activeHighlightDecl?.id === d.id
                          ? 'bg-[#EBF3FA] border-[#174A7E]'
                          : 'bg-[#F8F9FA] border-[#D8DDE3] hover:border-[#CBD5E1]'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-[#174A7E] font-bold">{d.title}</span>
                        {d.font_height_mm && (
                          <span className="text-[10px] text-[#475569] font-mono">
                            Font: {d.font_height_mm.toFixed(1)}mm
                          </span>
                        )}
                      </div>
                      <div className="text-[#1E293B] font-mono text-[11px] flex justify-between">
                        <span>{d.inspector_corrected_value || d.extracted_value || 'N/A'}</span>
                        {d.inspector_corrected_value && (
                          <span className="text-[9px] text-[#B45309] font-bold bg-[#FEF3C7] px-1.5 py-0.2 rounded border border-[#FDE68A]">
                            INSPECTOR CORRECTED
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Itemized Findings & Statutory Adjudication */}
            <div className="lg:col-span-6 space-y-3.5">
              {/* Itemized Findings Examination */}
              <div className="bg-white border border-[#D8DDE3] rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#475569] uppercase tracking-wider">
                    Statutory Compliance Findings ({selectedCase.compliance_checks?.length || 0} Checks)
                  </h3>
                  <span className="text-[10px] text-[#64748B] font-mono">Rule 6 & Schedule II PCR 2011</span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedCase.compliance_checks?.map((check) => (
                    <div
                      key={check.id}
                      onClick={() => setActiveHighlightDecl(check)}
                      className={`p-3 rounded-lg border transition cursor-pointer shadow-2xs ${
                        check.status === 'PASS'
                          ? 'bg-[#F0FDF4] border-[#BBF7D0]'
                          : check.status === 'FAIL'
                          ? 'bg-[#FEF2F2] border-[#FECACA]'
                          : 'bg-[#FFFBEB] border-[#FDE68A]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-[#1E293B]">{check.rule_code}</span>
                            <span className="text-xs font-semibold text-[#334155]">&bull; {check.rule_title}</span>
                          </div>
                          <p className="text-xs text-[#475569] mt-0.5">{check.reason_explanation}</p>
                          <p className="text-[10px] text-[#64748B] mt-0.5">Citation: {check.statutory_citation}</p>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                          check.status === 'PASS' ? 'bg-white text-[#15803D] border-[#BBF7D0]' : 'bg-white text-[#B91C1C] border-[#FECACA]'
                        }`}>
                          {check.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Itemized Violations Management (If Any) */}
              {selectedCase.violations && selectedCase.violations.length > 0 && (
                <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-4 shadow-xs space-y-2.5">
                  <h4 className="text-xs font-bold text-[#991B1B] uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
                    <span>Itemized Rule Violations ({selectedCase.violations.length})</span>
                  </h4>
                  <div className="space-y-2">
                    {selectedCase.violations.map((v) => (
                      <div key={v.id} className="p-3 bg-white rounded-lg border border-[#FECACA] text-xs space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-[#991B1B]">{v.rule_code} - {v.violation_title}</span>
                          <span className="font-mono text-[10px] text-[#B45309] font-bold bg-[#FEF3C7] px-1.5 py-0.2 rounded border border-[#FDE68A]">{v.senior_decision || 'PENDING'}</span>
                        </div>
                        <p className="text-[#475569] text-xs">{v.description}</p>
                        
                        {/* Per-Violation Action Buttons */}
                        <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => handleItemizedViolationAction(v.id, 'CONFIRMED')}
                            className="px-2 py-1 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#991B1B] rounded text-[10px] font-bold border border-[#FECACA] cursor-pointer"
                          >
                            Confirm Breach
                          </button>
                          <button
                            type="button"
                            onClick={() => handleItemizedViolationAction(v.id, 'OVERRIDDEN')}
                            className="px-2 py-1 bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#92400E] rounded text-[10px] font-bold border border-[#FDE68A] cursor-pointer"
                          >
                            Override Finding
                          </button>
                          <button
                            type="button"
                            onClick={() => handleItemizedViolationAction(v.id, 'DISMISSED')}
                            className="px-2 py-1 bg-white hover:bg-[#F8F9FA] text-[#475569] rounded text-[10px] font-bold border border-[#CBD5E1] cursor-pointer"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Statutory Adjudication Decision Console */}
              <div className="bg-white border border-[#D8DDE3] rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
                <h4 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-1.5">
                  <Gavel className="w-3.5 h-3.5 text-[#174A7E]" />
                  <span>Senior Officer Adjudication Orders & Directives</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-[#475569] uppercase tracking-wider mb-1">
                      Statutory Ground / Exemption
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rule 26 Small Package Exemption / Sec 49"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      className="w-full bg-white border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:ring-1 focus:ring-[#174A7E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#475569] uppercase tracking-wider mb-1">
                      Statutory Section Reference
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Section 36(1) Recommended Enforcement Action"
                      value={statutoryJustification}
                      onChange={(e) => setStatutoryJustification(e.target.value)}
                      className="w-full bg-white border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:ring-1 focus:ring-[#174A7E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#475569] uppercase tracking-wider mb-1">
                    Adjudication Directives & Inspector Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={seniorRemarks}
                    onChange={(e) => setSeniorRemarks(e.target.value)}
                    placeholder="Enter formal supervisory directions, compounding fine evaluations, or remand instructions..."
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg p-2.5 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:ring-1 focus:ring-[#174A7E]"
                  />
                </div>

                {/* Finalization Action Triggers */}
                <div className="pt-2 border-t border-[#E2E8F0] grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    disabled={isProcessingAction}
                    onClick={() => setConfirmModalAction('APPROVE_COMPLIANT')}
                    className="px-2.5 py-2 bg-[#15803D] hover:bg-[#166534] text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Approve Compliant</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessingAction}
                    onClick={() => setConfirmModalAction('APPROVE_VIOLATIONS')}
                    className="px-2.5 py-2 bg-[#B91C1C] hover:bg-[#991B1B] text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Recommend Enforcement</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessingAction}
                    onClick={() => setConfirmModalAction('RETURN_FOR_REINSPECTION')}
                    className="px-2.5 py-2 bg-[#B45309] hover:bg-[#92400E] text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Return Case</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessingAction}
                    onClick={() => setConfirmModalAction('DISMISS_CASE')}
                    className="px-2.5 py-2 bg-white hover:bg-[#F8F9FA] text-[#475569] rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 border border-[#CBD5E1] cursor-pointer"
                  >
                    <span>Dismiss</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: VIOLATOR ANALYTICS & SURVEILLANCE HUB */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-[#D8DDE3] rounded-xl p-4 shadow-xs">
              <span className="text-[10px] text-[#64748B] uppercase font-bold">Total Inspections Conducted</span>
              <p className="text-2xl font-bold text-[#1E293B] mt-0.5 font-mono">{analyticsSummary?.total_cases || 0}</p>
            </div>
            <div className="bg-white border border-[#FECACA] rounded-xl p-4 shadow-xs">
              <span className="text-[10px] text-[#991B1B] uppercase font-bold">Total Rule Violations</span>
              <p className="text-2xl font-bold text-[#DC2626] mt-0.5 font-mono">{analyticsSummary?.total_violations || 0}</p>
            </div>
            <div className="bg-white border border-[#BBF7D0] rounded-xl p-4 shadow-xs">
              <span className="text-[10px] text-[#15803D] uppercase font-bold">Overall Compliance Rate</span>
              <p className="text-2xl font-bold text-[#16A34A] mt-0.5 font-mono">
                {analyticsSummary?.compliance_rate ? `${analyticsSummary.compliance_rate.toFixed(1)}%` : '100%'}
              </p>
            </div>
            <div className="bg-white border border-[#FED7AA] rounded-xl p-4 shadow-xs">
              <span className="text-[10px] text-[#C2410C] uppercase font-bold">Repeat Offender Entities</span>
              <p className="text-2xl font-bold text-[#C2410C] mt-0.5 font-mono">{repeatViolators.length}</p>
            </div>
          </div>

          {/* Repeat Violator Table */}
          <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserX className="w-4 h-4 text-[#B91C1C]" />
                <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">Repeat Violators & Multi-Offence Surveillance</h3>
              </div>
              <span className="text-xs text-[#64748B]">Section 36(2) enhanced enforcement tracking</span>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto border border-[#E2E8F0] rounded-lg">
              <table className="w-full text-left text-xs text-[#1E293B]">
                <thead className="bg-[#F8F9FA] text-[#475569] font-semibold border-b border-[#E2E8F0]">
                  <tr>
                    <th className="p-3">Manufacturer / Legal Entity</th>
                    <th className="p-3">Total Inspections</th>
                    <th className="p-3">Violations Recorded</th>
                    <th className="p-3">Non-Compliance Rate</th>
                    <th className="p-3">Surveillance Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {repeatViolators.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-[#94A3B8]">
                        No recurring non-compliant entities in the surveillance window.
                      </td>
                    </tr>
                  ) : (
                    repeatViolators.map((r, idx) => (
                      <tr key={idx} className="hover:bg-[#F8FAFC]">
                        <td className="p-3 font-bold text-[#1E293B]">{r.manufacturer_name}</td>
                        <td className="p-3 font-mono">{r.total_inspections}</td>
                        <td className="p-3 font-mono text-[#DC2626] font-bold">{r.total_violations}</td>
                        <td className="p-3 font-mono">
                          {((r.total_violations / (r.total_inspections || 1)) * 100).toFixed(0)}%
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
                            HIGH RISK REPEAT
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Stack View */}
            <div className="md:hidden space-y-3">
              {repeatViolators.length === 0 ? (
                <div className="p-6 text-center text-[#94A3B8] border border-[#E2E8F0] rounded-lg bg-[#F8F9FA] text-xs">
                  No recurring non-compliant entities in the surveillance window.
                </div>
              ) : (
                repeatViolators.map((r, idx) => (
                  <div key={idx} className="bg-[#F8F9FA] border border-[#D8DDE3] rounded-lg p-3.5 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1E293B]">{r.manufacturer_name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
                        HIGH RISK
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 bg-white p-2 rounded border border-[#E2E8F0] text-xs">
                      <div>
                        <span className="text-[10px] text-[#64748B] block">Inspections</span>
                        <span className="font-mono font-bold text-[#1E293B]">{r.total_inspections}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#64748B] block">Violations</span>
                        <span className="font-mono font-bold text-[#DC2626]">{r.total_violations}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#64748B] block">Failure Rate</span>
                        <span className="font-mono font-bold text-[#1E293B]">
                          {((r.total_violations / (r.total_inspections || 1)) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT & MANUFACTURER HISTORY DRAWER */}
      {historyDrawerOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end">
          <div className="bg-white border-l border-[#D8DDE3] w-full max-w-lg h-full p-6 shadow-xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-[#174A7E]" />
                  <div>
                    <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">Historical Surveillance Context</h3>
                    <p className="text-[11px] text-[#64748B]">Previous inspections for this product & manufacturer</p>
                  </div>
                </div>
                <button onClick={() => setHistoryDrawerOpen(false)} className="text-[#94A3B8] hover:text-[#1E293B] cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Manufacturer Summary Card */}
              <div className="p-3.5 bg-[#F8F9FA] rounded-xl border border-[#D8DDE3] space-y-2">
                <div className="flex items-center gap-2 text-xs text-[#174A7E] font-bold">
                  <Building2 className="w-4 h-4" />
                  <span>Manufacturer: {productHistory?.manufacturer_summary?.name || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#64748B] pt-1">
                  <div>Lifetime Inspections: <strong className="text-[#1E293B]">{productHistory?.manufacturer_summary?.total_inspections || 0}</strong></div>
                  <div>Violations Recorded: <strong className="text-[#DC2626]">{productHistory?.manufacturer_summary?.total_violations || 0}</strong></div>
                </div>
              </div>

              {/* Product Prior Inspections List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[#174A7E]" />
                  <span>Past Product Inspections</span>
                </h4>

                {productHistory?.product_inspections?.length === 0 ? (
                  <p className="text-xs text-[#94A3B8] p-3 bg-[#F8F9FA] rounded-lg border border-[#D8DDE3] text-center">
                    First statutory inspection on record for this specific product.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {productHistory?.product_inspections?.map((c: any) => (
                      <div key={c.case_id} className="p-3 bg-[#F8F9FA] border border-[#D8DDE3] rounded-lg text-xs space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-[#174A7E]">{c.case_number}</span>
                          <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            c.final_decision === 'COMPLIANT'
                              ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                              : 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                          }`}>
                            {c.final_decision}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#64748B]">
                          Score: {c.compliance_score?.toFixed(0)}% &bull; Failed: {c.failed_checks} &bull; {c.finalized_at ? new Date(c.finalized_at).toLocaleDateString() : 'Historical'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E2E8F0]">
              <button
                onClick={() => setHistoryDrawerOpen(false)}
                className="w-full py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] rounded-lg text-xs font-bold cursor-pointer"
              >
                Close History Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FINALIZATION CONFIRMATION MODAL */}
      {confirmModalAction && selectedCase && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-2">
                <Gavel className="w-4 h-4 text-[#174A7E]" />
                <span>Confirm Supervisory Review Determination</span>
              </h3>
              <button onClick={() => setConfirmModalAction(null)} className="text-[#94A3B8] hover:text-[#1E293B] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-[#475569]">
              <p>
                You are about to issue the following determination for <strong>{selectedCase.case_number}</strong>:
              </p>
              <div className="p-3 bg-[#F8F9FA] rounded-lg border border-[#D8DDE3] font-mono text-center font-bold text-[#174A7E] text-xs">
                {confirmModalAction}
              </div>
              <p className="text-[11px] text-[#64748B]">
                This action will finalize the inspection review, record your supervisory determination in the audit trail, and prepare official documentation under the Legal Metrology (Packaged Commodities) Rules, 2011 and applicable amendments.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setConfirmModalAction(null)}
                className="px-3.5 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] rounded-lg text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={() => handleExecuteAction(confirmModalAction)}
                className="px-4 py-1.5 bg-[#174A7E] hover:bg-[#0F3B66] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isProcessingAction && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Determination</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

