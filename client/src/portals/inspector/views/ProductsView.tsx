import React, { useState, useMemo } from 'react';
import type { Product } from '../../../types';
import { EmptyState } from '../../../components/ui';
import { 
  Search, 
  Package, 
  Filter
} from 'lucide-react';

interface ProductsViewProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onStartInspectionWithProduct?: (product: Product) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  onSelectProduct
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category_name) set.add(p.category_name);
    });
    return Array.from(set);
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        (p.commodity_name && p.commodity_name.toLowerCase().includes(q)) ||
        (p.brand_name && p.brand_name.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.manufacturer_name && p.manufacturer_name.toLowerCase().includes(q));

      const matchCategory = categoryFilter === 'ALL' || p.category_name === categoryFilter;

      return matchSearch && matchCategory;
    });
  }, [products, searchQuery, categoryFilter]);

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="bg-white p-4 rounded-xl border border-[#D8DDE3] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name, brand, barcode, or manufacturer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#174A7E] focus:ring-1 focus:ring-[#174A7E]"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#64748B]" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter products by category"
            className="w-full sm:w-56 px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-[#D8DDE3] shadow-xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={<Package className="w-6 h-6 text-[#94A3B8]" />}
              title="No Products Found"
              description={
                searchQuery
                  ? `No products match the search query "${searchQuery}".`
                  : 'No products are currently registered in the database.'
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1E293B]">
              <thead className="bg-[#F8FAFC] text-[#64748B] font-bold uppercase tracking-wider border-b border-[#E2E8F0] text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">Product</th>
                  <th className="px-6 py-3.5">Brand</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Barcode</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredProducts.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#EBF3FA] text-[#174A7E] flex items-center justify-center font-bold flex-shrink-0 border border-[#CBD5E1]">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-[#1E293B]">{p.commodity_name}</div>
                            {p.manufacturer_name && (
                              <div className="text-[11px] text-[#64748B]">{p.manufacturer_name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#1E293B]">
                        {p.brand_name || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] text-[11px] font-medium text-[#475569]">
                          {p.category_name || 'Packaged Commodity'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-[#1E293B]">
                        {p.barcode || '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => onSelectProduct(p)}
                          className="px-3.5 py-1.5 bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#174A7E] font-bold rounded-md text-xs shadow-2xs transition-colors"
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
