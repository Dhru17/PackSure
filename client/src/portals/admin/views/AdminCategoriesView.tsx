import React, { useState } from 'react';
import { 
  Plus, 
  Layers, 
  Edit3, 
  Trash2, 
  ShoppingBag,
  Coffee,
  Sparkles,
  Home,
  Tv,
  Pill,
  Package,
  AlertTriangle,
  X,
  ShieldAlert,
  PowerOff
} from 'lucide-react';
import type { ProductCategory } from '../../../types';
import { FilterBar, EmptyState } from '../../../components/ui';

interface AdminCategoriesViewProps {
  categories: ProductCategory[];
  onOpenCategoryDetail: (category: ProductCategory) => void;
  onNewCategory: () => void;
  onEditCategory: (category: ProductCategory) => void;
  onToggleStatus: (category: ProductCategory) => void;
  onDeleteCategory: (category: ProductCategory) => void;
  onOpenRuleMappings: (category: ProductCategory) => void;
}

export const AdminCategoriesView: React.FC<AdminCategoriesViewProps> = ({
  categories,
  onOpenCategoryDetail,
  onNewCategory,
  onEditCategory,
  onToggleStatus,
  onDeleteCategory,
  onOpenRuleMappings
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deleteTargetCategory, setDeleteTargetCategory] = useState<ProductCategory | null>(null);

  const getCategoryIcon = (code: string, name: string) => {
    const text = (code + ' ' + name).toLowerCase();
    if (text.includes('food') || text.includes('edible')) return ShoppingBag;
    if (text.includes('bev') || text.includes('drink') || text.includes('tea')) return Coffee;
    if (text.includes('care') || text.includes('cosmetic')) return Sparkles;
    if (text.includes('house') || text.includes('clean')) return Home;
    if (text.includes('elect') || text.includes('tech')) return Tv;
    if (text.includes('pharm') || text.includes('drug') || text.includes('med')) return Pill;
    return Package;
  };

  const filteredCategories = categories.filter(c => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchCode = c.category_code.toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }
    if (statusFilter === 'ACTIVE' && !c.is_active) return false;
    if (statusFilter === 'INACTIVE' && c.is_active) return false;
    return true;
  });

  return (
    <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <h2 className="text-base font-bold text-[#1E293B]">Commodity Categories</h2>
          <p className="text-xs text-[#64748B]">Manage packaged product classifications and rule applicability groups</p>
        </div>

        <button
          onClick={onNewCategory}
          className="px-4 py-2 bg-[#174A7E] hover:bg-[#0F3B66] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by category name or code..."
        filters={[
          {
            key: 'status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'ALL', label: 'All Statuses' },
              { value: 'ACTIVE', label: 'Active Categories' },
              { value: 'INACTIVE', label: 'Inactive Categories' }
            ]
          }
        ]}
        onClearFilters={() => {
          setSearchQuery('');
          setStatusFilter('ALL');
        }}
      />

      {/* Category Cards Grid */}
      {filteredCategories.length === 0 ? (
        <EmptyState
          title="No Categories Found"
          description="No commodity groups match your search query."
          action={
            <button
              onClick={onNewCategory}
              className="px-4 py-2 bg-[#174A7E] text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              Add New Category
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((cat) => {
            const IconComponent = getCategoryIcon(cat.category_code, cat.name);
            return (
              <div
                key={cat.id}
                onClick={() => onOpenCategoryDetail(cat)}
                className="bg-[#F8F9FA] hover:bg-white border border-[#D8DDE3] hover:border-[#174A7E] rounded-xl p-5 space-y-3.5 transition group cursor-pointer shadow-2xs"
              >
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-white group-hover:bg-[#EBF3FA] text-[#174A7E] rounded-xl border border-[#CBD5E1] transition">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onToggleStatus(cat)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                        cat.is_active
                          ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                          : 'bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]'
                      }`}
                    >
                      {cat.is_active ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => onEditCategory(cat)}
                      className="p-1.5 text-[#64748B] hover:text-[#1E293B] hover:bg-[#E2E8F0] rounded-lg transition cursor-pointer"
                      title="Edit Category"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTargetCategory(cat)}
                      className="p-1.5 text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#1E293B] group-hover:text-[#174A7E] transition">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] font-mono text-[#64748B] mt-0.5">{cat.category_code}</p>
                  <p className="text-xs text-[#475569] line-clamp-2 mt-1">
                    {cat.description || 'Pre-packaged commodities group for statutory compliance verification.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onOpenRuleMappings(cat)}
                    className="px-2.5 py-1 bg-white hover:bg-[#EEF2F6] text-[#174A7E] font-bold rounded-lg border border-[#CBD5E1] flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{cat.rules_count || 0} Applicable Rules</span>
                  </button>

                  <span className="text-[11px] font-mono text-[#64748B]">
                    {cat.products_count || 0} Products
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Category Warning & Details Modal */}
      {deleteTargetCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#D8DDE3] space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#FEF2F2] text-[#DC2626] rounded-xl border border-[#FECACA]">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1E293B]">
                    Delete Category Confirmation
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Statutory Commodity Group Governance
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeleteTargetCategory(null)}
                className="p-1 text-[#64748B] hover:text-[#1E293B] rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Details Strip */}
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Category Name:</span>
                <span className="font-bold text-[#1E293B]">{deleteTargetCategory.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Category Code:</span>
                <span className="font-mono font-semibold text-[#174A7E]">{deleteTargetCategory.category_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Mapped Products:</span>
                <span className="font-bold text-[#1E293B]">{deleteTargetCategory.products_count || 0} Registered Items</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Applicable Rules:</span>
                <span className="font-bold text-[#1E293B]">{deleteTargetCategory.rules_count || 0} Statutory Rules</span>
              </div>
            </div>

            {/* Warning Text */}
            {(deleteTargetCategory.products_count || 0) > 0 ? (
              <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-xs text-[#92400E] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-[#D97706]" />
                  <span>Cannot Hard Delete Active Category</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  There are currently <strong>{deleteTargetCategory.products_count} product(s)</strong> assigned to this category. Database integrity prohibits deletion while products exist. You can <strong>Deactivate</strong> this category to prevent future assignments while maintaining compliance audit history.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-[#DC2626] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Permanent Deletion Warning</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Permanently deleting this category will remove it from the system and unlink all its statutory rule mappings. This action cannot be undone.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetCategory(null)}
                className="w-full sm:w-1/3 px-3 py-2 bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#475569] font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  const target = deleteTargetCategory;
                  setDeleteTargetCategory(null);
                  onToggleStatus(target);
                }}
                className="w-full sm:w-1/3 px-3 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#1E293B] font-bold rounded-xl text-xs transition border border-[#CBD5E1] flex items-center justify-center gap-1 cursor-pointer"
              >
                <PowerOff className="w-3.5 h-3.5" />
                <span>{deleteTargetCategory.is_active ? 'Deactivate' : 'Activate'}</span>
              </button>

              {(deleteTargetCategory.products_count || 0) === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const target = deleteTargetCategory;
                    setDeleteTargetCategory(null);
                    onDeleteCategory(target);
                  }}
                  className="w-full sm:w-1/3 px-3 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

