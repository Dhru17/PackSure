import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  ChevronRight, 
  Layers, 
  Barcode, 
  ShieldCheck, 
  AlertTriangle,
  RefreshCw,
  Scale
} from 'lucide-react';
import { api } from '../../../services/api';

interface Product {
  id: number;
  commodity_name: string;
  product_name?: string;
  brand_name?: string;
  category_id?: number;
  category_name?: string;
  category_code?: string;
  barcode?: string;
  gtin_barcode?: string;
  sku_code?: string;
  default_net_quantity?: string;
  net_quantity?: string;
  default_mrp?: number;
  declared_mrp?: number;
  package_type?: string;
  packaging_type?: string;
  country_of_origin?: string;
  pdp_area_cm2?: number;
  is_imported?: boolean;
  is_active?: boolean;
  total_audits?: number;
  audits_count?: number;
  latest_audit_status?: string;
  latest_audit_decision?: string;
  latest_compliance_score?: number;
}

interface CompanyProductsViewProps {
  onSelectProduct: (productId: number) => void;
}

export const CompanyProductsView: React.FC<CompanyProductsViewProps> = ({ onSelectProduct }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string; category_code?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getCompanyProducts();
      if (res) {
        setProducts(res.products || []);
        setCategories(res.categories || []);
      }
    } catch (err: any) {
      console.error('Failed to load products:', err);
      setError(err?.response?.data?.message || 'Failed to load registered products catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => {
    const nameStr = (p.commodity_name || p.product_name || '').toLowerCase();
    const brandStr = (p.brand_name || '').toLowerCase();
    const barcodeStr = (p.barcode || p.gtin_barcode || p.sku_code || '').toLowerCase();
    const catStr = (p.category_name || '').toLowerCase();
    const qStr = searchTerm.toLowerCase();

    const matchSearch = 
      !searchTerm ||
      nameStr.includes(qStr) ||
      brandStr.includes(qStr) ||
      barcodeStr.includes(qStr) ||
      catStr.includes(qStr);
    
    const matchCategory = 
      selectedCategory === 'ALL' || 
      String(p.category_id) === selectedCategory ||
      (p.category_name && p.category_name.toLowerCase() === selectedCategory.toLowerCase()) ||
      (p.category_code && p.category_code.toLowerCase() === selectedCategory.toLowerCase());

    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#D8DDE3] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1E293B] flex items-center gap-2">
            <Package className="w-6 h-6 text-[#174A7E]" />
            <span>Registered Packaged Commodities</span>
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            Official catalog of declared commodities & SKUs registered under Legal Metrology (Packaged Commodities) Rules, 2011.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#475569] bg-[#F1F5F9] px-3 py-1.5 rounded-xl border border-[#CBD5E1]">
            {products.length} Commodities Registered
          </span>
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="p-2 text-[#64748B] hover:text-[#174A7E] hover:bg-[#F1F5F9] rounded-xl border border-[#E2E8F0] transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-[#D8DDE3] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by commodity name, brand, barcode, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#1E293B] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#174A7E] transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-[#64748B]" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E] cursor-pointer w-full md:w-56"
          >
            <option value="ALL">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content Section */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-[#64748B] bg-white border border-[#D8DDE3] rounded-2xl">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#174A7E] mb-3" />
          Loading registered products...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#D8DDE3] rounded-2xl space-y-3">
          <Package className="w-12 h-12 text-[#94A3B8] mx-auto opacity-50" />
          <h3 className="text-sm font-bold text-[#1E293B]">No Packaged Commodities Found</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            {searchTerm || selectedCategory !== 'ALL'
              ? 'No products match your current search and filter criteria.'
              : 'There are currently no products registered for your enterprise profile.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((p) => {
            const displayName = p.commodity_name || p.product_name || 'Commodity';
            const displayBarcode = p.barcode || p.gtin_barcode || p.sku_code || 'No Barcode Assigned';
            const displayNetQty = p.default_net_quantity || p.net_quantity || '—';
            const displayMrp = p.default_mrp || p.declared_mrp;
            const auditCount = p.total_audits !== undefined ? p.total_audits : (p.audits_count || 0);

            return (
              <div
                key={p.id}
                onClick={() => onSelectProduct(p.id)}
                className="bg-white border border-[#D8DDE3] hover:border-[#174A7E] rounded-2xl p-5 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]">
                      {p.category_name || 'General Commodity'}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-[#059669]">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {p.is_imported ? 'Imported SKU' : 'Registered SKU'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#1E293B] group-hover:text-[#174A7E] transition line-clamp-2">
                    {displayName}
                  </h3>
                  {p.brand_name && (
                    <p className="text-xs text-[#64748B] font-medium mt-0.5">{p.brand_name}</p>
                  )}
                </div>

                <div className="space-y-2 pt-3 border-t border-[#F1F5F9] text-xs">
                  <div className="flex items-center justify-between text-[#64748B]">
                    <span className="flex items-center gap-1.5">
                      <Barcode className="w-3.5 h-3.5 text-[#174A7E]" />
                      GTIN / Barcode:
                    </span>
                    <span className="font-mono font-semibold text-[#1E293B] text-[11px]">
                      {displayBarcode}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[#64748B]">
                    <span className="flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-[#174A7E]" />
                      Declared Net Wt / Qty:
                    </span>
                    <span className="font-semibold text-[#1E293B]">
                      {displayNetQty}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[#64748B]">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#174A7E]" />
                      Standard MRP:
                    </span>
                    <span className="font-semibold text-[#174A7E]">
                      {displayMrp ? `₹${displayMrp.toFixed(2)}` : 'Declared on Pack'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between">
                  <span className="text-[11px] text-[#64748B]">
                    {auditCount > 0 ? `${auditCount} official audit${auditCount === 1 ? '' : 's'}` : 'No audits logged yet'}
                  </span>
                  <span className="text-xs font-bold text-[#174A7E] flex items-center gap-1 group-hover:translate-x-1 transition">
                    View Specifications
                    <ChevronRight className="w-3.5 h-3.5" />
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
export default CompanyProductsView;
