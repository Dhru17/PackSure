import React, { useState, useEffect } from 'react';
import type { Product } from '../../../types';
import { api } from '../../../services/api';
import { StatusBadge, EmptyState } from '../../../components/ui';
import { 
  ArrowLeft, 
  Package, 
  History, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  PlayCircle
} from 'lucide-react';

interface ProductDetailViewProps {
  product: Product;
  onBack: () => void;
  onOpenCase: (caseId: number) => void;
  onStartInspection?: (product: Product) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product: p,
  onBack,
  onOpenCase,
  onStartInspection
}) => {
  const [historyCases, setHistoryCases] = useState<any[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        if (p.id) {
          const res = await api.getProductHistory(p.id);
          setHistoryCases(res.inspections || []);
        }
      } catch (err) {
        console.error('Error fetching product history:', err);
      }
    };
    fetchHistory();
  }, [p.id]);

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
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#D8DDE3] shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9] rounded-lg transition-colors border border-[#CBD5E1]"
            title="Back to Products"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#1E293B] tracking-tight">
              {p.commodity_name}
            </h1>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              {p.brand_name || 'Brand Unspecified'} &bull; {p.category_name || 'Packaged Commodity'}
            </p>
          </div>
        </div>

        {onStartInspection && (
          <button
            onClick={() => onStartInspection(p)}
            className="flex items-center gap-2 px-4 py-2 bg-[#174A7E] text-white rounded-lg text-xs font-bold shadow-xs hover:bg-[#133E68] transition-all self-end sm:self-auto"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Inspect This Product</span>
          </button>
        )}
      </div>

      {/* Product Information Card */}
      <div className="bg-white rounded-xl border border-[#D8DDE3] shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-2">
            <Package className="w-4 h-4 text-[#174A7E]" />
            <span>Product Information</span>
          </h2>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Product Icon & Packaging Badge */}
          <div className="flex flex-col items-center justify-center p-6 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#EBF3FA] text-[#174A7E] flex items-center justify-center font-bold mb-3 border border-[#CBD5E1] shadow-xs">
              <Package className="w-10 h-10 stroke-[1.5]" />
            </div>
            <div className="font-bold text-sm text-[#1E293B]">{p.commodity_name}</div>
            <div className="text-xs text-[#64748B] mt-1">{p.brand_name || 'Standard Pack'}</div>
            <span className="mt-3 text-[11px] font-bold px-2.5 py-1 rounded-full bg-white border border-[#CBD5E1] text-[#174A7E]">
              {p.package_type || 'Package'}
            </span>
          </div>

          {/* Center Column: Statutory Specifications */}
          <div className="space-y-3.5 text-xs md:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                <div className="text-[11px] text-[#64748B] font-medium">Commodity Name</div>
                <div className="text-xs font-bold text-[#1E293B] mt-0.5">{p.commodity_name}</div>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                <div className="text-[11px] text-[#64748B] font-medium">Brand / Trade Name</div>
                <div className="text-xs font-bold text-[#1E293B] mt-0.5">{p.brand_name || '—'}</div>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                <div className="text-[11px] text-[#64748B] font-medium">Product Category</div>
                <div className="text-xs font-bold text-[#1E293B] mt-0.5">{p.category_name || '—'}</div>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                <div className="text-[11px] text-[#64748B] font-medium">Manufacturer / Packer</div>
                <div className="text-xs font-bold text-[#1E293B] mt-0.5">{p.manufacturer_name || 'Registered Manufacturer'}</div>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                <div className="text-[11px] text-[#64748B] font-medium">Barcode (GTIN / EAN)</div>
                <div className="text-xs font-mono font-bold text-[#1E293B] mt-0.5">{p.barcode || '—'}</div>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                <div className="text-[11px] text-[#64748B] font-medium">Package Quantity / MRP</div>
                <div className="text-xs font-bold text-[#1E293B] mt-0.5">
                  {p.default_net_quantity || '—'} &bull; {p.default_mrp ? `₹${p.default_mrp}` : '—'}
                </div>
              </div>
            </div>

            {/* PDP Dimensions */}
            {(p.pdp_width_cm || p.pdp_height_cm || p.pdp_area_cm2) && (
              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-[#64748B] font-medium">Schedule II PDP Dimensions</div>
                  <div className="text-xs font-bold text-[#1E293B] mt-0.5">
                    {p.pdp_height_cm || 0} cm (H) &times; {p.pdp_width_cm || 0} cm (W)
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-white border border-[#CBD5E1] text-[#1E293B]">
                  Area: {p.pdp_area_cm2 || (Number(p.pdp_height_cm || 0) * Number(p.pdp_width_cm || 0))} cm²
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inspection History Table */}
      <div className="bg-white rounded-xl border border-[#D8DDE3] shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wide flex items-center gap-2">
              <History className="w-4 h-4 text-[#174A7E]" />
              <span>Inspection History</span>
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Historical regulatory inspections recorded for this product
            </p>
          </div>
          {historyCases.length > 0 && (
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EBF3FA] text-[#174A7E] border border-[#CBD5E1]">
              {historyCases.length} inspections
            </span>
          )}
        </div>

        {historyCases.length === 0 ? (
          <div className="p-10">
            <EmptyState
              icon={<History className="w-6 h-6 text-[#94A3B8]" />}
              title="No Inspection History"
              description="This product has not been subjected to previous legal metrology inspections."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1E293B]">
              <thead className="bg-[#F8FAFC] text-[#64748B] font-bold uppercase tracking-wider border-b border-[#E2E8F0] text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Case ID</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Result</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {historyCases.map((c) => {
                  const caseId = c.id;
                  const caseNumber = c.case_number || `PS-${caseId}`;
                  const isPass = c.final_decision === 'COMPLIANT' || c.compliance_score >= 100;
                  const isFail = c.final_decision === 'NON_COMPLIANT' || (c.failed_checks && c.failed_checks > 0);

                  return (
                    <tr key={caseId} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-4 text-[#64748B] font-medium">
                        {formatDate(c.created_at || c.inspection_date)}
                      </td>
                      <td className="px-6 py-4 font-bold text-[#1E293B]">
                        {caseNumber}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                            isPass
                              ? 'bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7]'
                              : isFail
                              ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                              : 'bg-[#FFFBEB] text-[#D97706] border border-[#FEF3C7]'
                          }`}
                        >
                          {isPass && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {isFail && <XCircle className="w-3.5 h-3.5" />}
                          {!isPass && !isFail && <AlertTriangle className="w-3.5 h-3.5" />}
                          <span>{isPass ? 'Compliant' : isFail ? 'Non-Compliant' : 'Needs Verification'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => onOpenCase(caseId)}
                          className="px-3 py-1 bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#174A7E] font-bold rounded-md text-xs shadow-2xs transition-colors"
                        >
                          View
                        </button>
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
