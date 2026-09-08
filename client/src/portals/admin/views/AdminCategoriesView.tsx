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
  Package
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
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition ${
                        cat.is_active
                          ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                          : 'bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]'
                      }`}
                    >
                      {cat.is_active ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => onEditCategory(cat)}
                      className="p-1.5 text-[#64748B] hover:text-[#1E293B] hover:bg-[#E2E8F0] rounded-lg transition"
                      title="Edit Category"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteCategory(cat)}
                      className="p-1.5 text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition"
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
    </div>
  );
};
