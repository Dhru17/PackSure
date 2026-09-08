import React, { useState } from 'react';
import { 
  Download, 
  Eye, 
  History
} from 'lucide-react';
import type { InspectionCase } from '../../../types';
import { EmptyState, FilterBar } from '../../../components/ui';
import { api } from '../../../services/api';

interface SeniorHistoryViewProps {
  inspections: InspectionCase[];
  onOpenCase: (caseId: number) => void;
}

export const SeniorHistoryView: React.FC<SeniorHistoryViewProps> = ({
  inspections,
  onOpenCase
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('ALL');

  // Filter finalized / past cases
  const finalizedCases = inspections.filter(i => 
    i.status === 'FINALIZED' || i.status === 'RETURNED' || i.status === 'SENIOR_REVIEW'
  );

  const filteredHistory = finalizedCases.filter(item => {
    // Outcome filter
    if (outcomeFilter === 'COMPLIANT' && (item.failed_checks > 0 || item.status !== 'FINALIZED')) return false;
    if (outcomeFilter === 'VIOLATIONS' && (item.failed_checks === 0 || item.status !== 'FINALIZED')) return false;
    if (outcomeFilter === 'RETURNED' && item.status !== 'RETURNED') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCase = item.case_number.toLowerCase().includes(q);
      const matchBrand = item.product?.brand_name?.toLowerCase().includes(q) || false;
      const matchCommodity = item.product?.commodity_name?.toLowerCase().includes(q) || false;
      const matchInspector = item.inspector_name?.toLowerCase().includes(q) || false;
      if (!matchCase && !matchBrand && !matchCommodity && !matchInspector) return false;
    }

    return true;
  });

  return (
    <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-[#174A7E]" />
            <span>Adjudicated Cases History</span>
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Archived record of all supervisory determinations and official notices under LM(PC) Rules
          </p>
        </div>

        <div className="text-xs font-semibold text-[#64748B]">
          Total Historical Determinations: <strong className="text-[#1E293B]">{finalizedCases.length}</strong>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search case #, product, brand, inspector..."
        filters={[
          {
            key: 'outcome',
            value: outcomeFilter,
            onChange: setOutcomeFilter,
            options: [
              { value: 'ALL', label: 'All Adjudications' },
              { value: 'COMPLIANT', label: 'Compliant Orders' },
              { value: 'VIOLATIONS', label: 'Statutory Notice Orders' },
              { value: 'RETURNED', label: 'Returned Inspections' }
            ]
          }
        ]}
        onClearFilters={() => {
          setSearchQuery('');
          setOutcomeFilter('ALL');
        }}
      />

      {/* History Table */}
      {filteredHistory.length === 0 ? (
        <EmptyState
          title="No Historical Records Found"
          description="No finalized cases match your search query."
        />
      ) : (
        <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl">
          <table className="w-full text-left text-xs text-[#1E293B]">
            <thead className="bg-[#F8F9FA] text-[#475569] font-bold border-b border-[#E2E8F0]">
              <tr>
                <th className="p-3.5">Case Reference</th>
                <th className="p-3.5">Product & Commodity</th>
                <th className="p-3.5">Field Inspector</th>
                <th className="p-3.5">Determination Outcome</th>
                <th className="p-3.5">Inspection Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredHistory.map((item) => (
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
                    {item.inspector_name || 'Inspector'}
                  </td>
                  <td className="p-3.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      item.status === 'RETURNED'
                        ? 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]'
                        : item.failed_checks > 0
                        ? 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                        : 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                    }`}>
                      {item.status === 'RETURNED' 
                        ? 'RETURNED' 
                        : item.failed_checks > 0 
                        ? 'NON-COMPLIANT' 
                        : 'COMPLIANT'}
                    </span>
                  </td>
                  <td className="p-3.5 text-[#64748B]">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={api.getReportPdfUrl(item.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 bg-white hover:bg-[#F8F9FA] text-[#174A7E] rounded-lg border border-[#CBD5E1] font-bold flex items-center gap-1 shadow-2xs transition"
                        title="Download PDF Order"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => onOpenCase(item.id)}
                        className="px-3 py-1.5 bg-[#174A7E] hover:bg-[#0F3B66] text-white rounded-lg font-bold shadow-2xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </button>
                    </div>
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
