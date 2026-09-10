import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Check, Save, AlertCircle, FolderTree, MapPin } from 'lucide-react';
import type { User, ProductCategory, Jurisdiction } from '../../../../types';

interface InspectorEligibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspector: User | null;
  categories: ProductCategory[];
  jurisdictions: Jurisdiction[];
  onSave: (inspectorId: number, data: { category_ids: number[]; jurisdiction_ids: number[] }) => Promise<void>;
  isProcessing?: boolean;
}

export const InspectorEligibilityModal: React.FC<InspectorEligibilityModalProps> = ({
  isOpen,
  onClose,
  inspector,
  categories = [],
  jurisdictions = [],
  onSave,
  isProcessing = false
}) => {
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedJurisdictionIds, setSelectedJurisdictionIds] = useState<number[]>([]);

  useEffect(() => {
    if (inspector) {
      const catIds = (inspector.category_eligibilities || []).map((c) => c.category_id);
      const jurIds = (inspector.jurisdiction_eligibilities || []).map((j) => j.jurisdiction_id);
      setSelectedCategoryIds(catIds);
      setSelectedJurisdictionIds(jurIds);
    }
  }, [inspector, isOpen]);

  if (!isOpen || !inspector) return null;

  const toggleCategory = (id: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleJurisdiction = (id: number) => {
    setSelectedJurisdictionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllCategories = () => {
    setSelectedCategoryIds(categories.map((c) => c.id));
  };

  const clearAllCategories = () => {
    setSelectedCategoryIds([]);
  };

  const selectAllJurisdictions = () => {
    setSelectedJurisdictionIds(jurisdictions.map((j) => j.id));
  };

  const clearAllJurisdictions = () => {
    setSelectedJurisdictionIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(inspector.id, {
      category_ids: selectedCategoryIds,
      jurisdiction_ids: selectedJurisdictionIds
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-[#D8DDE3] w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#174A7E]/10 text-[#174A7E] rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1E293B]">
                Configure Permanent Inspector Eligibility
              </h3>
              <p className="text-xs text-[#64748B]">
                Officer: <span className="font-semibold text-[#1E293B]">{inspector.full_name}</span> ({inspector.badge_number || 'Badge N/A'} • {inspector.email})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#64748B] hover:text-[#1E293B] hover:bg-[#E2E8F0] rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Box */}
        <div className="mx-5 mt-4 p-3 bg-[#F0F9FF] border border-[#BAE6FD] rounded-lg flex items-start gap-2 text-xs text-[#0369A1]">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#0284C7]" />
          <div>
            <span className="font-bold">Architectural Principle:</span> Admin sets permanent statutory qualifications (Categories & Jurisdictions). Senior Officer cannot alter these qualifications and will only be able to assign audits to inspectors matching the target plant&apos;s category and jurisdiction.
          </div>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-6 overflow-y-auto flex-1">
          {/* 1. Category Certifications */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-[#174A7E]" />
                <h4 className="font-bold text-xs text-[#1E293B] uppercase tracking-wider">
                  Category Certifications ({selectedCategoryIds.length} Selected)
                </h4>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllCategories}
                  className="text-[11px] font-semibold text-[#174A7E] hover:underline cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-[#CBD5E1]">•</span>
                <button
                  type="button"
                  onClick={clearAllCategories}
                  className="text-[11px] font-semibold text-[#64748B] hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1 border border-[#E2E8F0] rounded-lg bg-[#FAFAFA]">
              {categories.map((cat) => {
                const isSelected = selectedCategoryIds.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`flex items-start gap-2 p-2.5 rounded-md text-left transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-white border-[#174A7E] shadow-xs text-[#1E293B]'
                        : 'bg-white/60 border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-sm flex items-center justify-center mt-0.5 border ${
                        isSelected
                          ? 'bg-[#174A7E] border-[#174A7E] text-white'
                          : 'border-[#CBD5E1] bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs leading-tight truncate">{cat.name}</div>
                      <div className="text-[10px] text-[#64748B] font-mono mt-0.5">{cat.category_code}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Territorial Jurisdictions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#174A7E]" />
                <h4 className="font-bold text-xs text-[#1E293B] uppercase tracking-wider">
                  Territorial Jurisdictions ({selectedJurisdictionIds.length} Selected)
                </h4>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllJurisdictions}
                  className="text-[11px] font-semibold text-[#174A7E] hover:underline cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-[#CBD5E1]">•</span>
                <button
                  type="button"
                  onClick={clearAllJurisdictions}
                  className="text-[11px] font-semibold text-[#64748B] hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1 border border-[#E2E8F0] rounded-lg bg-[#FAFAFA]">
              {jurisdictions.map((jur) => {
                const isSelected = selectedJurisdictionIds.includes(jur.id);
                return (
                  <button
                    key={jur.id}
                    type="button"
                    onClick={() => toggleJurisdiction(jur.id)}
                    className={`flex items-start gap-2 p-2.5 rounded-md text-left transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-white border-[#174A7E] shadow-xs text-[#1E293B]'
                        : 'bg-white/60 border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-sm flex items-center justify-center mt-0.5 border ${
                        isSelected
                          ? 'bg-[#174A7E] border-[#174A7E] text-white'
                          : 'border-[#CBD5E1] bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs leading-tight truncate">{jur.name}</div>
                      <div className="text-[10px] text-[#64748B] mt-0.5">{jur.code} • {jur.state}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9] rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#174A7E] hover:bg-[#123860] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Saving Qualifications...' : 'Save Permanent Qualifications'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
