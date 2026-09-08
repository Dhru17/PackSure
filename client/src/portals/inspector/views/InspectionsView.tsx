import React, { useState, useMemo } from 'react';
import type { InspectionCase } from '../../../types';
import { StatusBadge, EmptyState } from '../../../components/ui';
import { getCaseProgress } from '../components/CaseProgressIndicator';
import { 
  Search, 
  Filter, 
  ClipboardList 
} from 'lucide-react';

interface InspectionsViewProps {
  inspections: InspectionCase[];
  onOpenCase: (caseId: number) => void;
  onResumeCase: (caseId: number) => void;
}

export const InspectionsView: React.FC<InspectionsViewProps> = ({
  inspections,
  onOpenCase,
  onResumeCase
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Categorize Active vs History
  const activeCases = useMemo(() => {
    return inspections.filter(c => c.status !== 'FINALIZED');
  }, [inspections]);

  const historyCases = useMemo(() => {
    return inspections.filter(c => c.status === 'FINALIZED');
  }, [inspections]);

  // Apply search & status filter
  const displayedCases = useMemo(() => {
    const list = activeTab === 'active' ? activeCases : historyCases;
    return list.filter(c => {
      // Search matching: Case ID, Product Name, Brand, Barcode
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        (c.case_number && c.case_number.toLowerCase().includes(q)) ||
        (`PS-${c.id}`.toLowerCase().includes(q)) ||
        (c.product?.commodity_name && c.product.commodity_name.toLowerCase().includes(q)) ||
        (c.product?.brand_name && c.product.brand_name.toLowerCase().includes(q)) ||
        (c.product?.barcode && c.product.barcode.toLowerCase().includes(q));

      // Status filter matching
      if (statusFilter === 'ALL') return matchSearch;
      if (statusFilter === 'DRAFT') return matchSearch && c.status === 'DRAFT';
      if (statusFilter === 'EVIDENCE_PENDING') return matchSearch && c.status === 'EVIDENCE_PENDING';
      if (statusFilter === 'TO_VERIFY') return matchSearch && (c.status === 'INSPECTOR_REVIEW' || c.status === 'ANALYSIS_COMPLETE');
      if (statusFilter === 'IN_REVIEW') return matchSearch && (c.status === 'SUBMITTED' || c.status === 'SENIOR_REVIEW');
      if (statusFilter === 'RETURNED') return matchSearch && c.status === 'RETURNED';
      if (statusFilter === 'COMPLETED') return matchSearch && c.status === 'FINALIZED';

      return matchSearch;
    });
  }, [activeTab, activeCases, historyCases, searchQuery, statusFilter]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Tabs: Active | History */}
      <div className="flex items-center justify-between border-b border-[#D8DDE3] bg-white px-6 pt-3 rounded-t-xl shadow-xs">
        <div className="flex items-center gap-6">
          <button
            onClick={() => { setActiveTab('active'); setStatusFilter('ALL'); }}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'active'
                ? 'border-[#174A7E] text-[#174A7E]'
                : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <span>Active Inspections</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              activeTab === 'active' ? 'bg-[#EBF3FA] text-[#174A7E]' : 'bg-[#F1F5F9] text-[#64748B]'
            }`}>
              {activeCases.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('history'); setStatusFilter('ALL'); }}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-[#174A7E] text-[#174A7E]'
                : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <span>Inspection History</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              activeTab === 'history' ? 'bg-[#EBF3FA] text-[#174A7E]' : 'bg-[#F1F5F9] text-[#64748B]'
            }`}>
              {historyCases.length}
            </span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#D8DDE3] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Case ID, product name, brand, or barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#174A7E] focus:ring-1 focus:ring-[#174A7E]"
          />
        </div>

        {/* Status Filter Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#64748B]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter cases by status"
            className="w-full sm:w-48 px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
          >
            <option value="ALL">All Statuses</option>
            {activeTab === 'active' ? (
              <>
                <option value="DRAFT">Draft</option>
                <option value="EVIDENCE_PENDING">Evidence Pending</option>
                <option value="TO_VERIFY">To Verify</option>
                <option value="IN_REVIEW">In Senior Review</option>
                <option value="RETURNED">Returned for Reinspection</option>
              </>
            ) : (
              <option value="COMPLETED">Completed / Finalized</option>
            )}
          </select>
        </div>
      </div>

      {/* Main Inspections Table */}
      <div className="bg-white rounded-xl border border-[#D8DDE3] shadow-xs overflow-hidden">
        {displayedCases.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={<ClipboardList className="w-6 h-6 text-[#94A3B8]" />}
              title={activeTab === 'active' ? 'No Active Inspections' : 'No Finalized History'}
              description={
                searchQuery
                  ? `No cases match the search criteria "${searchQuery}".`
                  : activeTab === 'active'
                  ? 'You currently have no active inspections in progress.'
                  : 'No completed inspections have been finalized yet.'
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1E293B]">
              <thead className="bg-[#F8FAFC] text-[#64748B] font-bold uppercase tracking-wider border-b border-[#E2E8F0] text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">Case ID</th>
                  <th className="px-6 py-3.5">Product</th>
                  <th className="px-6 py-3.5">Progress</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {displayedCases.map((c) => {
                  const caseId = c.id;
                  const caseNumber = c.case_number || `PS-${caseId}`;
                  const productName = c.product?.commodity_name || 'Packaged Commodity';
                  const brandName = c.product?.brand_name;
                  const { completedSteps } = getCaseProgress(c);
                  const isReturned = c.status === 'RETURNED';

                  return (
                    <tr key={caseId} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-4 font-bold text-[#1E293B]">
                        {caseNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#1E293B]">{productName}</div>
                        {brandName && (
                          <div className="text-[11px] text-[#64748B]">{brandName}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F1F5F9] border border-[#CBD5E1] text-[11px] font-bold text-[#334155]">
                          <span>{completedSteps}/5</span>
                          <span className="text-[10px] text-[#64748B] font-normal">modules</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-6 py-4 text-[#64748B] font-medium">
                        {formatDate(c.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isReturned && (
                            <button
                              onClick={() => onResumeCase(caseId)}
                              className="px-3 py-1 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-md text-xs shadow-2xs transition-colors"
                            >
                              Resume
                            </button>
                          )}
                          <button
                            onClick={() => onOpenCase(caseId)}
                            className="px-3 py-1 bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#174A7E] font-bold rounded-md text-xs shadow-2xs transition-colors"
                          >
                            Open
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
