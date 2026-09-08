import React from 'react';
import { 
  ArrowLeft, 
  FolderTree, 
  Layers, 
  Plus, 
  Edit3, 
  Trash2
} from 'lucide-react';
import type { ProductCategory } from '../../../types';

interface AdminCategoryDetailsViewProps {
  category: ProductCategory;
  mappedRules: any[];
  onBack: () => void;
  onEditCategory: (category: ProductCategory) => void;
  onOpenRuleMapModal: () => void;
  onUnmapRule: (ruleId: number) => Promise<void>;
}

export const AdminCategoryDetailsView: React.FC<AdminCategoryDetailsViewProps> = ({
  category,
  mappedRules,
  onBack,
  onEditCategory,
  onOpenRuleMapModal,
  onUnmapRule
}) => {
  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-[#D8DDE3] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-white hover:bg-[#F8FAFC] text-[#475569] rounded-lg border border-[#CBD5E1] transition shadow-2xs cursor-pointer"
            title="Back to Categories"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-bold text-[#1E293B]">Category Details &bull; {category.name}</h1>
            <p className="text-xs text-[#64748B]">Applicable statutory requirements for this commodity group</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenRuleMapModal}
            className="px-3.5 py-2 bg-white hover:bg-[#F8FAFC] text-[#174A7E] rounded-lg text-xs font-bold border border-[#CBD5E1] flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Map Rule</span>
          </button>
          <button
            onClick={() => onEditCategory(category)}
            className="px-4 py-2 bg-[#174A7E] hover:bg-[#0F3B66] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Category</span>
          </button>
        </div>
      </div>

      {/* Category Overview Card */}
      <div className="bg-white rounded-xl border border-[#D8DDE3] shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#EBF3FA] text-[#174A7E] rounded-xl border border-[#CBD5E1]">
              <FolderTree className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#1E293B]">{category.name}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  category.is_active ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]' : 'bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]'
                }`}>
                  {category.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-xs font-mono text-[#64748B] mt-0.5">Code: <strong className="text-[#174A7E]">{category.category_code}</strong> &bull; Parent: {category.parent_name || 'Root Category'}</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-[#475569] leading-relaxed">
          {category.description || 'Pre-packaged commodity group governed under the Legal Metrology (Packaged Commodities) Rules, 2011.'}
        </p>
      </div>

      {/* Mapped Rules Section */}
      <div className="bg-white rounded-xl border border-[#D8DDE3] shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#174A7E]" />
            <h2 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
              Mapped Regulatory Rules ({mappedRules.length})
            </h2>
          </div>
          <button
            onClick={onOpenRuleMapModal}
            className="text-xs text-[#174A7E] hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>+ Map Additional Rule</span>
          </button>
        </div>

        {mappedRules.length === 0 ? (
          <div className="p-8 text-center text-[#94A3B8] bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] text-xs">
            No specific requirements mapped to this category. General metrology rules will apply.
          </div>
        ) : (
          <div className="space-y-2.5">
            {mappedRules.map((m: any) => {
              const rule = m.rule || m;
              return (
                <div
                  key={m.id || rule.id}
                  className="p-3.5 bg-[#F8F9FA] hover:bg-white border border-[#D8DDE3] hover:border-[#174A7E] rounded-xl flex items-center justify-between gap-4 transition shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#174A7E] bg-white px-2 py-0.5 rounded border border-[#CBD5E1]">
                        {rule.rule_code}
                      </span>
                      <span className="font-bold text-xs text-[#1E293B]">{rule.title}</span>
                      <span className="font-mono text-[10px] text-[#0369A1] bg-[#E0F2FE] px-1.5 py-0.2 rounded border border-[#BAE6FD]">
                        {rule.version}
                      </span>
                      {m.is_exempt && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                          EXEMPT
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#64748B] line-clamp-1">{rule.statutory_citation}</p>
                    {m.exception_notes && (
                      <p className="text-[10px] text-[#B45309] italic">Notes: {m.exception_notes}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onUnmapRule(rule.id || m.rule_id)}
                    className="p-2 text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition cursor-pointer"
                    title="Remove Rule Mapping"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
