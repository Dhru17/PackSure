import React, { useState } from 'react';
import { 
  ArrowRight, 
  RefreshCw 
} from 'lucide-react';
import type { InspectionCase } from '../../../types';
import { EmptyState, FilterBar } from '../../../components/ui';

interface SeniorReviewsViewProps {
  queue: InspectionCase[];
  isLoading: boolean;
  onRefresh: () => void;
  onOpenCase: (caseId: number) => void;
}

export const SeniorReviewsView: React.FC<SeniorReviewsViewProps> = ({
  queue,
  isLoading,
  onRefresh,
  onOpenCase
}) => {
  const [activeTab, setActiveTab] = useState<'PENDING' | 'RETURNED' | 'ALL'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  // Filter queue
  const filteredQueue = queue.filter(item => {
    // Tab filter
    if (activeTab === 'PENDING' && item.status !== 'SUBMITTED' && item.status !== 'SENIOR_REVIEW') return false;
    if (activeTab === 'RETURNED' && item.status !== 'RETURNED') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCase = item.case_number.toLowerCase().includes(q);
      const matchBrand = item.product?.brand_name?.toLowerCase().includes(q) || false;
      const matchCommodity = item.product?.commodity_name?.toLowerCase().includes(q) || false;
      const matchInspector = item.inspector_name?.toLowerCase().includes(q) || false;
      if (!matchCase && !matchBrand && !matchCommodity && !matchInspector) return false;
    }

    // Severity filter
    if (severityFilter === 'HIGH' && item.failed_checks === 0) return false;
    if (severityFilter === 'CLEAN' && item.failed_checks > 0) return false;

    return true;
  });

  // Sort queue
  const sortedQueue = [...filteredQueue].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortBy === 'violations') return (b.failed_checks || 0) - (a.failed_checks || 0);
    return 0;
  });

  const pendingCount = queue.filter(i => i.status === 'SUBMITTED' || i.status === 'SENIOR_REVIEW').length;
  const returnedCount = queue.filter(i => i.status === 'RETURNED').length;

  return (
    <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
      {/* Top Header & Tab Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">
            Supervisory Review Queue
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Examine field evidence, verify findings, and issue statutory determinations
          </p>
        </div>

        {/* Tab Switcher & Refresh */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <div className="flex items-center gap-1.5 bg-[#F8F9FA] p-1 rounded-xl border border-[#D8DDE3]">
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'PENDING'
                  ? 'bg-[#174A7E] text-white shadow-2xs'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              Pending Review ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab('RETURNED')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'RETURNED'
                  ? 'bg-[#174A7E] text-white shadow-2xs'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              Returned ({returnedCount})
            </button>
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-[#174A7E] text-white shadow-2xs'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              All ({queue.length})
            </button>
          </div>

          <button
            onClick={onRefresh}
            className="p-2 bg-white hover:bg-[#F8F9FA] text-[#475569] rounded-xl border border-[#CBD5E1] shadow-2xs transition cursor-pointer"
            title="Refresh Queue"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search case #, product, brand, inspector..."
        filters={[
          {
            key: 'severity',
            value: severityFilter,
            onChange: setSeverityFilter,
            options: [
              { value: 'ALL', label: 'All Findings' },
              { value: 'HIGH', label: 'Violations Flagged Only' },
              { value: 'CLEAN', label: 'Clean Scans Only' }
            ]
          },
          {
            key: 'sort',
            value: sortBy,
            onChange: setSortBy,
            options: [
              { value: 'newest', label: 'Newest First' },
              { value: 'violations', label: 'Highest Violations' },
              { value: 'oldest', label: 'Oldest First' }
            ]
          }
        ]}
        onClearFilters={() => {
          setSearchQuery('');
          setSeverityFilter('ALL');
          setSortBy('newest');
        }}
      />

      {/* Review Queue Table View */}
      {sortedQueue.length === 0 ? (
        <EmptyState
          title="No Inspections Matching Criteria"
          description="Try adjusting your search terms or filter selection."
          action={
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 bg-white hover:bg-[#F1F5F9] text-[#174A7E] rounded-lg text-xs font-bold border border-[#CBD5E1] cursor-pointer"
            >
              Refresh Queue
            </button>
          }
        />
      ) : (
        <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl">
          <table className="w-full text-left text-xs text-[#1E293B]">
            <thead className="bg-[#F8F9FA] text-[#475569] font-bold border-b border-[#E2E8F0]">
              <tr>
                <th className="p-3.5">Case Reference</th>
                <th className="p-3.5">Product & Commodity</th>
                <th className="p-3.5">Inspector</th>
                <th className="p-3.5">Compliance Finding</th>
                <th className="p-3.5">Submission Date</th>
                <th className="p-3.5 text-right">Supervisory Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {sortedQueue.map((item) => (
                <tr key={item.id} className="hover:bg-[#F8FAFC] transition">
                  <td className="p-3.5">
                    <span className="font-mono text-xs font-bold text-[#174A7E] bg-[#EBF3FA] px-2 py-0.5 rounded border border-[#CBD5E1]">
                      {item.case_number}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="font-bold text-[#1E293B]">{item.product?.brand_name}</div>
                    <div className="text-[11px] text-[#64748B]">{item.product?.commodity_name}</div>
                  </td>
                  <td className="p-3.5 font-semibold text-[#334155]">
                    {item.inspector_name || 'Field Inspector'}
                  </td>
                  <td className="p-3.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      item.failed_checks > 0
                        ? 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                        : 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                    }`}>
                      {item.failed_checks > 0 ? `${item.failed_checks} Non-Compliant` : 'Compliant'}
                    </span>
                  </td>
                  <td className="p-3.5 text-[#64748B]">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => onOpenCase(item.id)}
                      className="px-3.5 py-1.5 bg-[#174A7E] hover:bg-[#0F3B66] text-white rounded-lg text-xs font-bold shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Review</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
