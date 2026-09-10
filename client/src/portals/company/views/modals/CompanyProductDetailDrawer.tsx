import React, { useState, useEffect } from 'react';
import { api } from '../../../../services/api';
import { 
  X, 
  Package, 
  History, 
  RefreshCw 
} from 'lucide-react';

interface CompanyProductDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number | null;
  onOpenAuditDetail: (caseId: number) => void;
}

export const CompanyProductDetailDrawer: React.FC<CompanyProductDetailDrawerProps> = ({
  isOpen,
  onClose,
  productId,
  onOpenAuditDetail
}) => {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && productId) {
      setIsLoading(true);
      api.getCompanyProductDetail(productId)
        .then((res) => setData(res))
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    } else {
      setData(null);
    }
  }, [isOpen, productId]);

  if (!isOpen) return null;

  const p = data?.product;
  const history = data?.audit_history || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-[#D8DDE3] animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#EBF3FA] text-[#174A7E] rounded-xl border border-[#CBD5E1]">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1E293B]">
                {p?.commodity_name || 'Packaged Commodity'}
              </h2>
              <div className="flex items-center gap-2 text-xs text-[#64748B] mt-0.5">
                <span className="font-bold text-[#174A7E]">{p?.brand_name}</span>
                <span>&bull;</span>
                <span className="font-mono text-[11px]">{p?.barcode || 'No Barcode'}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#64748B] hover:text-[#1E293B] hover:bg-[#E2E8F0] rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#64748B] space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-[#174A7E]" />
              <span>Loading product specifications...</span>
            </div>
          ) : p ? (
            <>
              {/* Product Specs Card */}
              <div className="bg-[#F8FAFC] border border-[#D8DDE3] rounded-xl p-5 space-y-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Packaging Declarations & Specs</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[#64748B] block text-[11px]">Default Net Quantity:</span>
                    <span className="font-bold text-[#1E293B] text-xs">{p.default_net_quantity || '200 g'}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[11px]">Maximum Retail Price (MRP):</span>
                    <span className="font-bold text-[#1E293B] text-xs">₹{p.default_mrp ? p.default_mrp.toFixed(2) : '—'}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[11px]">Package Format:</span>
                    <span className="font-bold text-[#1E293B] text-xs">{p.package_type || 'Box / Pouch'}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[11px]">Principal Display Area (PDP):</span>
                    <span className="font-bold text-[#1E293B] text-xs">{p.pdp_area_cm2 ? `${p.pdp_area_cm2} cm²` : '150 cm²'}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[11px]">PDP Dimensions:</span>
                    <span className="font-bold text-[#1E293B] text-xs">{p.pdp_width_cm || 15} cm &times; {p.pdp_height_cm || 10} cm</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[11px]">Country of Origin:</span>
                    <span className="font-bold text-[#1E293B] text-xs">{p.country_of_origin || 'India'}</span>
                  </div>
                </div>
              </div>

              {/* Product Inspection History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs uppercase tracking-wider text-[#1E293B] flex items-center gap-2">
                    <History className="w-4 h-4 text-[#174A7E]" />
                    <span>Inspection Audit History ({history.length})</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {history.length > 0 ? (
                    history.map((a: any) => (
                      <div
                        key={a.id}
                        className="p-4 bg-white border border-[#E2E8F0] rounded-xl hover:border-[#174A7E] transition flex items-center justify-between gap-3 cursor-pointer shadow-2xs"
                        onClick={() => onOpenAuditDetail(a.id)}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-[#1E293B]">
                              #{a.case_number || a.id}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              a.status === 'FINALIZED'
                                ? 'bg-[#F0FDF4] text-[#15803D] border-[#DCFCE7]'
                                : 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]'
                            }`}>
                              {a.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#64748B]">
                            {a.scheduled_date ? `Scheduled: ${a.scheduled_date}` : `Logged: ${a.created_at?.slice(0, 10)}`} &bull; Compliance Score: <strong>{a.compliance_score}%</strong>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {a.status === 'FINALIZED' && (
                            <span className={`font-bold text-xs px-2.5 py-1 rounded-lg ${
                              a.final_decision === 'COMPLIANT' ? 'bg-[#F0FDF4] text-[#15803D]' : 'bg-[#FEF2F2] text-[#DC2626]'
                            }`}>
                              {a.final_decision || 'COMPLIANT'}
                            </span>
                          )}
                          <span className="text-xs font-bold text-[#174A7E]">&rarr;</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-center text-[#64748B] text-xs">
                      No inspection audits conducted for this commodity yet.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <span className="text-[11px] text-[#64748B]">Commodity Record</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#475569] font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
