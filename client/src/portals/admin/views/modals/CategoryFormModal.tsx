import React, { useState, useEffect } from 'react';
import { X, FolderTree, Save } from 'lucide-react';
import type { ProductCategory } from '../../../../types';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: ProductCategory | null; // null for add, object for edit
  parentOptions?: ProductCategory[];
  onSave: (data: any) => Promise<void>;
  isProcessing?: boolean;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  category,
  parentOptions = [],
  onSave,
  isProcessing = false
}) => {
  const isEdit = !!category;

  const [formData, setFormData] = useState({
    category_code: '',
    name: '',
    parent_id: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    if (category) {
      setFormData({
        category_code: category.category_code,
        name: category.name,
        parent_id: category.parent_id ? String(category.parent_id) : '',
        description: category.description || '',
        is_active: category.is_active
      });
    } else {
      setFormData({
        category_code: `CAT-${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        parent_id: '',
        description: '',
        is_active: true
      });
    }
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.category_code.trim()) {
      alert('Please provide Category Name and Code.');
      return;
    }
    await onSave({
      ...formData,
      parent_id: formData.parent_id ? parseInt(formData.parent_id) : null
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
      <div className="bg-white rounded-2xl max-w-md w-full border border-[#D8DDE3] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-[#D8DDE3] bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#EBF3FA] text-[#174A7E] rounded-xl border border-[#CBD5E1]">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1E293B]">
                {isEdit ? 'Edit Product Category' : 'Add Product Category'}
              </h2>
              <p className="text-xs text-[#64748B]">
                Configure packaging category and rule applicability group
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#64748B] hover:text-[#1E293B] hover:bg-[#E2E8F0] rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#475569] uppercase tracking-wider mb-1">
              Category Name <span className="text-[#DC2626]">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Food & Edible Products"
              className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#1E293B] focus:ring-1 focus:ring-[#174A7E] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-[#475569] uppercase tracking-wider mb-1">
              Category Code <span className="text-[#DC2626]">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.category_code}
              onChange={(e) => setFormData({ ...formData, category_code: e.target.value })}
              placeholder="e.g. FOOD"
              className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs font-mono text-[#1E293B] focus:ring-1 focus:ring-[#174A7E] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-[#475569] uppercase tracking-wider mb-1">
              Parent Category Group (Optional)
            </label>
            <select
              value={formData.parent_id}
              onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
              className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#1E293B] focus:ring-1 focus:ring-[#174A7E] focus:outline-none bg-white"
            >
              <option value="">None (Top-Level Root Category)</option>
              {parentOptions.filter(p => p.id !== category?.id).map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.category_code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-[#475569] uppercase tracking-wider mb-1">
              Short Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Pre-packaged food, groceries, edible oils, confectioneries..."
              className="w-full p-3 border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B] focus:ring-1 focus:ring-[#174A7E] focus:outline-none"
            />
          </div>

          <div className="bg-[#F8F9FA] p-3 rounded-xl border border-[#E2E8F0]">
            <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-[#1E293B]">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded text-[#174A7E] focus:ring-[#174A7E]"
              />
              <span>Category is Active for Commodity Classification</span>
            </label>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-5 py-2 bg-[#174A7E] hover:bg-[#0F3B66] text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isProcessing ? 'Saving...' : isEdit ? 'Save Changes' : 'Save Category'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
