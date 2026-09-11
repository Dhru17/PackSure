import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Building2,
  User,
  Tag,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { api } from '../../../services/api';

interface ScheduleAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCase: any) => void;
}

export const ScheduleAuditModal: React.FC<ScheduleAuditModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [plants, setPlants] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [eligibleInspectors, setEligibleInspectors] = useState<any[]>([]);

  const [selectedCompanyId, setSelectedCompanyId] = useState<number | ''>('');
  const [selectedPlantId, setSelectedPlantId] = useState<number | ''>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');
  const [brandName, setBrandName] = useState('');
  const [commodityName, setCommodityName] = useState('');
  const [selectedInspectorId, setSelectedInspectorId] = useState<number | ''>('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [instructions, setInstructions] = useState('');

  const [isLoadingInspectors, setIsLoadingInspectors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Set default tomorrow date
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    setScheduledDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  // Load Companies, Categories on modal open
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      const [compRes, catRes] = await Promise.all([
        api.getCompanies({ status: 'ACTIVE' }),
        api.getCategories()
      ]);
      setCompanies(compRes.companies || []);
      setCategories(catRes.categories || []);
      if (compRes.companies?.length > 0) {
        setSelectedCompanyId(compRes.companies[0].id);
      }
      if (catRes.categories?.length > 0) {
        setSelectedCategoryId(catRes.categories[0].id);
      }
    } catch (err: any) {
      console.error('Error loading schedule metadata:', err);
      setErrorMessage(err.message || 'Failed to load master metadata.');
    }
  };

  // Load Plants when Company changes
  useEffect(() => {
    if (selectedCompanyId) {
      loadPlants(Number(selectedCompanyId));
    } else {
      setPlants([]);
      setSelectedPlantId('');
    }
  }, [selectedCompanyId]);

  const loadPlants = async (companyId: number) => {
    try {
      const res = await api.getPlants({ company_id: companyId });
      setPlants(res.plants || []);
      if (res.plants?.length > 0) {
        setSelectedPlantId(res.plants[0].id);
      } else {
        setSelectedPlantId('');
      }
    } catch (err) {
      console.error('Error loading plants:', err);
    }
  };

  // Fetch Eligible Inspectors whenever Plant or Category changes
  useEffect(() => {
    loadEligibleInspectors();
  }, [selectedPlantId, selectedCategoryId]);

  const loadEligibleInspectors = async () => {
    setIsLoadingInspectors(true);
    try {
      const res = await api.getEligibleInspectorsForAudit({
        plant_id: selectedPlantId ? Number(selectedPlantId) : undefined,
        category_id: selectedCategoryId ? Number(selectedCategoryId) : undefined
      });
      setEligibleInspectors(res.inspectors || []);
      const rec = res.inspectors?.find((i: any) => i.is_recommended);
      if (rec) {
        setSelectedInspectorId(rec.inspector_id);
      } else if (res.inspectors?.length > 0) {
        setSelectedInspectorId(res.inspectors[0].inspector_id);
      } else {
        setSelectedInspectorId('');
      }
    } catch (err: any) {
      console.error('Error loading eligible inspectors:', err);
    } finally {
      setIsLoadingInspectors(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedInspectorId) {
      setErrorMessage('Please select an authorized field inspector.');
      return;
    }
    if (!scheduledDate) {
      setErrorMessage('Please select a target audit date.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedComp = companies.find(c => c.id === Number(selectedCompanyId));
      const selectedCat = categories.find(c => c.id === Number(selectedCategoryId));
      const defaultBrand = selectedComp ? selectedComp.name : 'Target Enterprise SKU';
      const defaultComm = selectedCat ? `${selectedCat.name} Audit Sample` : 'Packaged Commodity SKU';

      const res = await api.scheduleAudit({
        company_id: selectedCompanyId ? Number(selectedCompanyId) : null,
        plant_id: selectedPlantId ? Number(selectedPlantId) : null,
        category_id: selectedCategoryId ? Number(selectedCategoryId) : null,
        brand_name: brandName.trim() || defaultBrand,
        commodity_name: commodityName.trim() || defaultComm,
        inspector_id: Number(selectedInspectorId),
        scheduled_date: scheduledDate,
        instructions: instructions.trim()
      });

      onSuccess(res.case);
      onClose();
    } catch (err: any) {
      console.error('Failed to schedule audit:', err);
      setErrorMessage(err.message || 'Failed to schedule inspection audit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-white">Schedule Official Inspection Audit</h3>
              <p className="text-xs text-slate-300">
                Assign authorized Legal Metrology inspector with jurisdiction & category eligibility
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Target Facility & Organization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Company / Manufacturer *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
                  required
                >
                  <option value="">-- Select Company --</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code || 'Registered'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Plant / Manufacturing Facility
              </label>
              <select
                value={selectedPlantId}
                onChange={(e) => setSelectedPlantId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
              >
                <option value="">-- All / General Facility --</option>
                {plants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.city || p.state || 'Plant'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Commodity Category & Product */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Commodity Category
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
                >
                  <option value="">-- General Packaged Commodity --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.category_code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Brand / Product Name
              </label>
              <input
                type="text"
                placeholder="e.g. Britannia Good Day"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Commodity / SKU
              </label>
              <input
                type="text"
                placeholder="e.g. Butter Cookies 200g"
                value={commodityName}
                onChange={(e) => setCommodityName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Audit Date *
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
                required
              />
            </div>
          </div>

          {/* Inspector Eligibility & Caseload Selection */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-600" />
                  Select Authorized Field Inspector
                </h4>
                <p className="text-xs text-slate-500">
                  Ranked by jurisdiction match, category qualification, and live caseload
                </p>
              </div>
              {isLoadingInspectors && (
                <span className="text-xs text-indigo-600 animate-pulse font-medium">Checking eligibility...</span>
              )}
            </div>

            {eligibleInspectors.length === 0 && !isLoadingInspectors ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs text-center">
                No active inspectors found for the selected criteria.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {eligibleInspectors.map((insp) => (
                  <label
                    key={insp.inspector_id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedInspectorId === insp.inspector_id
                        ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/20'
                        : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="inspector_selection"
                        value={insp.inspector_id}
                        checked={selectedInspectorId === insp.inspector_id}
                        onChange={() => setSelectedInspectorId(insp.inspector_id)}
                        className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-800">{insp.full_name}</span>
                          <span className="text-xs text-slate-500 font-mono">
                            [{insp.badge_number || 'INSP-OFFICER'}]
                          </span>
                          {insp.is_recommended && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle className="w-3 h-3" /> Recommended
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>Jurisdiction: {insp.jurisdiction}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-medium text-slate-600">
                            <Clock className="w-3 h-3" />
                            {insp.active_cases_count} Active Case(s)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-2">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          insp.workload_badge === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : insp.workload_badge === 'warning'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {insp.workload_status}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Supervisory Instructions */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Supervisory Instructions & Specific Directives
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Conduct multi-panel net quantity verification and check mandatory Rule 6(10A) unit sale price on retail shelf units."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Regulatory Version Notice */}
          <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center gap-2.5 text-xs text-indigo-900">
            <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>
              This scheduled audit will automatically bind and enforce the active <strong>Legal Metrology Rule Book Version</strong> (G.S.R. 128(E) / 2026.1).
            </span>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedInspectorId}
              className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-sm shadow-indigo-200 transition-all flex items-center gap-2"
            >
              {isSubmitting ? 'Scheduling Audit...' : 'Confirm & Schedule Audit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
