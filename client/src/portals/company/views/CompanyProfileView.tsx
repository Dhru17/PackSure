import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { 
  Building2, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Lock
} from 'lucide-react';

import type { CompanyNavTab } from '../components/CompanySidebar';

interface CompanyProfileViewProps {
  onNavigateTab?: (tab: CompanyNavTab) => void;
}

export const CompanyProfileView: React.FC<CompanyProfileViewProps> = ({ onNavigateTab }) => {
  const [company, setCompany] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Editable fields
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCompanyProfile();
      const c = res.company;
      setCompany(c);
      setAddress(c.address || '');
      setCity(c.city || '');
      setState(c.state || '');
      setPinCode(c.pin_code || '');
      setContactEmail(c.contact_email || '');
      setContactPhone(c.contact_phone || '');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load company profile.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await api.updateCompanyProfile({
        address,
        city,
        state,
        pin_code: pinCode,
        contact_email: contactEmail,
        contact_phone: contactPhone
      });
      setSuccessMsg('Company contact information updated successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
      loadProfile();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update contact information.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-[#D8DDE3] rounded-2xl p-12 text-center text-[#64748B] flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin text-[#174A7E]" />
        <span className="text-xs font-bold">Loading official enterprise registration...</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#D8DDE3] rounded-2xl p-6 sm:p-8 shadow-xs space-y-8">
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1E293B] tracking-tight flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-[#174A7E]" />
            <span>Company Profile & Registration Information</span>
          </h2>
          <p className="text-xs text-[#64748B] mt-1 font-medium">
            Official enterprise profile under the Legal Metrology (Packaged Commodities) Rules, 2011.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7] text-xs font-bold rounded-full">
            {company?.is_active ? 'Active Regulated Entity' : 'Suspended Account'}
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl text-xs text-[#15803D] flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-[#991B1B] flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Government Master Data (Read-Only Section) */}
      <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
          <Lock className="w-4 h-4 text-[#174A7E]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
            Government-Controlled Registration Data (Read-Only)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 text-xs">
          <div>
            <span className="text-[#64748B] block text-[11px]">Legal Entity Name:</span>
            <span className="font-bold text-[#1E293B] text-xs">{company?.legal_entity_name || company?.name}</span>
          </div>
          <div>
            <span className="text-[#64748B] block text-[11px]">Registration Number:</span>
            <span className="font-mono font-bold text-[#174A7E] text-xs">{company?.registration_number || 'LMPC/WB/2021/8832'}</span>
          </div>
          <div>
            <span className="text-[#64748B] block text-[11px]">Enterprise Type:</span>
            <span className="font-bold text-[#1E293B] text-xs">
              {company?.is_importer ? 'Registered Importer & Packer' : 'Manufacturer & Packer'}
            </span>
          </div>
          <div 
            onClick={() => onNavigateTab && onNavigateTab('plants')}
            className={onNavigateTab ? 'cursor-pointer group' : ''}
          >
            <span className="text-[#64748B] block text-[11px]">Registered Plants:</span>
            <span className="font-bold text-[#174A7E] text-xs group-hover:underline">
              {company?.plants_count || 1} Facilities &rarr;
            </span>
          </div>
          <div 
            onClick={() => onNavigateTab && onNavigateTab('products')}
            className={onNavigateTab ? 'cursor-pointer group' : ''}
          >
            <span className="text-[#64748B] block text-[11px]">Registered Commodities:</span>
            <span className="font-bold text-[#174A7E] text-xs group-hover:underline">
              {company?.products_count || 4} SKUs Catalog &rarr;
            </span>
          </div>
        </div>
      </div>

      {/* Editable Contact Information Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] pb-2 border-b border-[#E2E8F0]">
            Enterprise Contact & Registered Office Address
          </h3>
          <p className="text-[11px] text-[#64748B] mt-1">
            Keep your official contact details up to date for inspection notifications and statutory compliance notices.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="sm:col-span-2">
            <label className="block font-bold text-[#1E293B] uppercase tracking-wider text-[10px] mb-1">
              Registered Office Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 5/1A, Hungerford Street"
              className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E293B] focus:border-[#174A7E]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#1E293B] uppercase tracking-wider text-[10px] mb-1">
              City
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Kolkata"
              className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E293B] focus:border-[#174A7E]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#1E293B] uppercase tracking-wider text-[10px] mb-1">
              State / Union Territory
            </label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="e.g. West Bengal"
              className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E293B] focus:border-[#174A7E]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#1E293B] uppercase tracking-wider text-[10px] mb-1">
              PIN Code
            </label>
            <input
              type="text"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              placeholder="e.g. 700017"
              className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E293B] focus:border-[#174A7E]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#1E293B] uppercase tracking-wider text-[10px] mb-1">
              Official Compliance Email
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="e.g. compliance@britannia.co.in"
              className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E293B] focus:border-[#174A7E]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#1E293B] uppercase tracking-wider text-[10px] mb-1">
              Customer Care / Regulatory Helpline Phone
            </label>
            <input
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="e.g. 1800-425-4449"
              className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#1E293B] focus:border-[#174A7E]"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#174A7E] hover:bg-[#133E68] text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Save Contact Information</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
