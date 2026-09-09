import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { Factory, MapPin, Mail, RefreshCw, ShieldCheck, Package, ChevronRight } from 'lucide-react';
import type { CompanyNavTab } from '../components/CompanySidebar';

interface CompanyPlantsViewProps {
  onNavigateTab?: (tab: CompanyNavTab) => void;
}

export const CompanyPlantsView: React.FC<CompanyPlantsViewProps> = ({ onNavigateTab }) => {
  const [plants, setPlants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPlants = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCompanyPlants();
      setPlants(res.plants || []);
    } catch (err) {
      console.error('Error loading plants:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlants();
  }, []);

  return (
    <div className="bg-white border border-[#D8DDE3] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
      <div className="border-b border-[#E2E8F0] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1E293B] tracking-tight flex items-center gap-2.5">
            <Factory className="w-5 h-5 text-[#174A7E]" />
            <span>Registered Plants & Manufacturing Units</span>
          </h2>
          <p className="text-xs text-[#64748B] mt-1 font-medium">
            Authorized manufacturing, packing, and warehouse facilities mapped to Legal Metrology jurisdictions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('products')}
              className="text-xs font-bold text-[#174A7E] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Package className="w-3.5 h-3.5" />
              <span>View Product Catalog</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-xs font-bold text-[#475569] bg-[#F1F5F9] px-3 py-1 rounded-full border border-[#CBD5E1]">
            {plants.length} Units Registered
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-[#64748B] flex flex-col items-center justify-center space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-[#174A7E]" />
          <span className="text-xs font-bold">Loading facility master records...</span>
        </div>
      ) : plants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plants.map((p) => (
            <div
              key={p.id}
              className="p-5 bg-[#F8FAFC] border border-[#D8DDE3] rounded-xl hover:border-[#174A7E] transition space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-[#174A7E] bg-[#EBF3FA] px-2 py-0.5 rounded border border-[#BFDBFE]">
                    {p.plant_code || `PLANT-${p.id}`}
                  </span>
                  <h3 className="font-bold text-sm text-[#1E293B] mt-1">{p.name}</h3>
                </div>
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7]">
                  {p.is_active ? 'Active Unit' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-[#64748B] pt-1 border-t border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#174A7E] flex-shrink-0" />
                  <span className="text-[#1E293B] font-medium">
                    {p.address ? `${p.address}, ${p.city || ''}, ${p.state || ''} ${p.pin_code || ''}` : 'Primary Industrial Area'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#64748B] flex-shrink-0" />
                  <span>
                    Jurisdiction: <strong>{p.jurisdiction_name || 'Central Legal Metrology Division'}</strong>
                  </span>
                </div>

                {p.contact_email && (
                  <div className="flex items-center gap-2 text-[11px]">
                    <Mail className="w-3.5 h-3.5 text-[#64748B] flex-shrink-0" />
                    <span>{p.contact_email}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center text-[#64748B] text-xs border border-dashed border-[#CBD5E1] rounded-xl">
          No registered manufacturing facilities recorded for your enterprise.
        </div>
      )}
    </div>
  );
};
