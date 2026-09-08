import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { InspectionCase, Product, SurfaceType, PackageEvidence, Declaration } from '../../types';
import { 
  Scan, Camera, CheckCircle, AlertTriangle, XCircle, FileText, ArrowRight, ArrowLeft, 
  Upload, ShieldCheck, RefreshCw, Sparkles, Barcode, ChevronRight, Download,
  ZoomIn, ZoomOut, RotateCcw, AlertCircle, Clock, PlayCircle, Eye, Search
} from 'lucide-react';

export const InspectorPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'wizard' | 'registry' | 'products'>('overview');
  const [wizardStep, setWizardStep] = useState<number>(1);
  
  // Overview Dashboard State
  const [overviewData, setOverviewData] = useState<{
    workload: {
      total_inspections: number;
      draft_cases: number;
      in_analysis_cases: number;
      awaiting_verification: number;
      submitted_cases: number;
      returned_cases: number;
      finalized_cases: number;
    };
    urgent_actions: any[];
    recent_cases: any[];
  } | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);

  // Inspection State
  const [activeCase, setActiveCase] = useState<InspectionCase | null>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [productForm, setProductForm] = useState({
    brand_name: 'Britannia',
    commodity_name: 'Good Day Butter Cookies',
    package_type: 'BOX',
    default_net_quantity: '200 g',
    default_mrp: 40.0,
    is_imported: false,
    country_of_origin: 'India',
    pdp_width_cm: 15.0,
    pdp_height_cm: 10.0,
    pdp_area_cm2: 150.0,
  });

  // Evidence state
  const [selectedSurface, setSelectedSurface] = useState<SurfaceType>('FRONT');
  const [activeStudioSurface, setActiveStudioSurface] = useState<string>('FRONT');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [studioActivePanel, setStudioActivePanel] = useState<'EVIDENCE' | 'DECLARATIONS'>('EVIDENCE');

  // Inspector Corrections & Remarks
  const [corrections, setCorrections] = useState<Record<string, string>>({});
  const [inspectorRemarks, setInspectorRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Registry & Products state
  const [inspectionsList, setInspectionsList] = useState<InspectionCase[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [registrySearch, setRegistrySearch] = useState('');
  const [registryStatusFilter, setRegistryStatusFilter] = useState('ALL');
  const [isLoadingRegistry, setIsLoadingRegistry] = useState(false);

  // Selected BBox highlight in step 3
  const [highlightedBbox, setHighlightedBbox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [expandedCheckId, setExpandedCheckId] = useState<number | null>(null);
  const [expandedUrgentId, setExpandedUrgentId] = useState<number | null>(null);
  const [activeDiagnosticsEvidence, setActiveDiagnosticsEvidence] = useState<PackageEvidence | null>(null);
  const [activeDeclDetails, setActiveDeclDetails] = useState<Declaration | null>(null);

  // Load Overview Data
  const loadOverview = async () => {
    setIsLoadingOverview(true);
    try {
      const res = await api.getInspectorOverview();
      setOverviewData(res);
    } catch (err) {
      console.error('Error loading inspector overview:', err);
    } finally {
      setIsLoadingOverview(false);
    }
  };

  // Load registry data
  const loadRegistry = async () => {
    setIsLoadingRegistry(true);
    try {
      const res = await api.getInspections(registryStatusFilter, registrySearch);
      setInspectionsList(res.inspections || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingRegistry(false);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await api.getProducts();
      setProductsList(res.products || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadOverview();
    loadRegistry();
    loadProducts();
  }, []);

  useEffect(() => {
    loadRegistry();
  }, [registryStatusFilter, registrySearch]);

  // Step 1: Barcode Lookup
  const handleBarcodeLookup = async () => {
    if (!barcodeInput) return;
    try {
      const res = await api.lookupBarcode(barcodeInput);
      if (res.found && res.product) {
        setProductForm({
          brand_name: res.product.brand_name,
          commodity_name: res.product.commodity_name,
          package_type: res.product.package_type || 'BOX',
          default_net_quantity: res.product.default_net_quantity || '',
          default_mrp: res.product.default_mrp || 0,
          is_imported: res.product.is_imported || false,
          country_of_origin: res.product.country_of_origin || 'India',
          pdp_width_cm: res.product.pdp_width_cm || 10,
          pdp_height_cm: res.product.pdp_height_cm || 10,
          pdp_area_cm2: res.product.pdp_area_cm2 || 100,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Step 1: Initialize Case
  const handleCreateCase = async () => {
    try {
      const prodRes = await api.createProduct({
        barcode: barcodeInput || `GEN-${Date.now()}`,
        ...productForm,
        pdp_area_cm2: productForm.pdp_width_cm * productForm.pdp_height_cm
      });

      const caseRes = await api.createInspection({
        product_id: prodRes.product.id,
        location_name: 'Regional Surveillance Point, Commercial Hub',
        source_type: 'RETAIL_SURVEILLANCE'
      });

      const fullCase = await api.getInspection(caseRes.inspection.id);
      setActiveCase(fullCase);
      setWizardStep(2);
      loadOverview();
    } catch (err: any) {
      alert(`Error initializing inspection: ${err.message}`);
    }
  };

  // Resume Existing Case into Wizard
  const handleResumeCase = async (caseId: number) => {
    try {
      const c = await api.getInspection(caseId);
      setActiveCase(c);
      if (c.inspector_remarks) setInspectorRemarks(c.inspector_remarks);

      if (c.status === 'DRAFT' || c.status === 'EVIDENCE_PENDING') {
        setWizardStep(2);
      } else if (c.status === 'ANALYZING' || c.status === 'ANALYSIS_COMPLETE' || c.status === 'INSPECTOR_REVIEW' || c.status === 'RETURNED') {
        if (!c.evidences || c.evidences.length === 0) {
          setWizardStep(2);
        } else if (!c.declarations || c.declarations.length === 0) {
          setWizardStep(2);
        } else {
          setWizardStep(3);
        }
      } else if (c.status === 'SUBMITTED' || c.status === 'SENIOR_REVIEW' || c.status === 'FINALIZED') {
        setWizardStep(5);
      } else {
        setWizardStep(2);
      }

      if (c.evidences && c.evidences.length > 0) {
        setActiveStudioSurface(c.evidences[0].surface_type);
      }

      setActiveTab('wizard');
    } catch (err: any) {
      alert(`Failed to load case #${caseId}: ${err.message}`);
    }
  };

  // Step 2: Upload Evidence File
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !activeCase) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);
    formData.append('surface_type', selectedSurface);

    setIsUploading(true);
    try {
      await api.uploadEvidence(activeCase.id, formData);
      const updatedCase = await api.getInspection(activeCase.id);
      setActiveCase(updatedCase);
      setActiveStudioSurface(selectedSurface);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Step 2 -> Step 3: Run AI Metrology Extraction
  const handleRunAnalysis = async () => {
    if (!activeCase) return;
    setIsAnalyzing(true);
    try {
      await api.runAnalysis(activeCase.id);
      const updatedCase = await api.getInspection(activeCase.id);
      setActiveCase(updatedCase);
      if (updatedCase.evidences && updatedCase.evidences.length > 0) {
        setActiveStudioSurface(updatedCase.evidences[0].surface_type);
      }
      setWizardStep(3);
      loadOverview();
    } catch (err: any) {
      alert(`Analysis failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Step 3 -> 4: Proceed to Compliance
  const handleProceedToCompliance = () => {
    setWizardStep(4);
  };

  // Step 5: Submit for Senior Review
  const handleSubmitReview = async () => {
    if (!activeCase) return;
    setIsSubmitting(true);
    try {
      await api.submitInspectorReview(activeCase.id, {
        remarks: inspectorRemarks,
        corrections: corrections
      });
      setSubmissionSuccess(true);
      loadRegistry();
      loadOverview();
    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset wizard
  const resetWizard = () => {
    setActiveCase(null);
    setWizardStep(1);
    setSubmissionSuccess(false);
    setInspectorRemarks('');
    setCorrections({});
    setZoomLevel(100);
  };

  // Find active studio evidence
  const currentStudioEvidence = activeCase?.evidences?.find(
    (e) => e.surface_type.toUpperCase() === activeStudioSurface.toUpperCase()
  ) || activeCase?.evidences?.[0];

  return (
    <div className="space-y-5">
      {/* Top Banner & Tab Navigation */}
      <div className="bg-white border border-[#D8DDE3] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 bg-[#EBF3FA] text-[#174A7E] rounded-lg border border-[#CBD5E1]">
              <Scan className="w-5 h-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold text-[#1E293B] tracking-tight">Inspector Workstation</h1>
                <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] rounded text-[10px] font-mono font-bold">
                  Rule 6 & Schedule II
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                Field Verification &bull; Legal Metrology (Packaged Commodities) Rules, 2011 and applicable amendments
              </p>
            </div>
          </div>
        </div>

        {/* 4-Tab Navigation */}
        <div className="flex items-center bg-[#F1F5F9] p-1 rounded-lg border border-[#D8DDE3] overflow-x-auto">
          <button
            onClick={() => { setActiveTab('overview'); loadOverview(); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'overview' ? 'bg-[#174A7E] text-white shadow-xs' : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Overview</span>
            {overviewData?.urgent_actions && overviewData.urgent_actions.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('wizard')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'wizard' ? 'bg-[#174A7E] text-white shadow-xs' : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{activeCase ? `Case (${activeCase.case_number})` : 'New Inspection'}</span>
          </button>
          <button
            onClick={() => { setActiveTab('registry'); loadRegistry(); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'registry' ? 'bg-[#174A7E] text-white shadow-xs' : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Registry ({inspectionsList.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('products'); loadProducts(); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'products' ? 'bg-[#174A7E] text-white shadow-xs' : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <Barcode className="w-3.5 h-3.5" />
            <span>Products</span>
          </button>
        </div>
      </div>

      {/* TAB 1: INSPECTOR OVERVIEW DASHBOARD */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#475569]">Workload & Triage</h2>
            <button
              type="button"
              onClick={loadOverview}
              className="px-2.5 py-1 bg-white hover:bg-[#F8F9FA] text-[#475569] rounded-lg text-xs font-medium border border-[#D8DDE3] flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingOverview ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Workload KPI Tiles - Scan-First Hierarchy */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white border border-[#BAE6FD] rounded-xl p-3.5 space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-[#0369A1] uppercase tracking-wider">DRAFTS</span>
              <div className="text-2xl font-bold font-mono text-[#0284C7]">
                {overviewData?.workload.draft_cases ?? 0}
              </div>
              <p className="text-[10px] text-[#64748B]">Pending Evidence</p>
            </div>

            <div className="bg-white border border-[#FDE68A] rounded-xl p-3.5 space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-[#B45309] uppercase tracking-wider">VERIFY</span>
              <div className="text-2xl font-bold font-mono text-[#D97706]">
                {overviewData?.workload.awaiting_verification ?? 0}
              </div>
              <p className="text-[10px] text-[#64748B]">AI Ready</p>
            </div>

            <div className="bg-white border border-[#C7D2FE] rounded-xl p-3.5 space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-[#4338CA] uppercase tracking-wider">SENIOR REVIEW</span>
              <div className="text-2xl font-bold font-mono text-[#4F46E5]">
                {overviewData?.workload.submitted_cases ?? 0}
              </div>
              <p className="text-[10px] text-[#64748B]">In Queue</p>
            </div>

            <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-xl p-3.5 space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-[#C2410C] uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>RETURNED</span>
              </span>
              <div className="text-2xl font-bold font-mono text-[#C2410C]">
                {overviewData?.workload.returned_cases ?? 0}
              </div>
              <p className="text-[10px] text-[#9A3412] font-semibold">Action Required</p>
            </div>

            <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-3.5 space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-[#15803D] uppercase tracking-wider">FINALIZED</span>
              <div className="text-2xl font-bold font-mono text-[#16A34A]">
                {overviewData?.workload.finalized_cases ?? 0}
              </div>
              <p className="text-[10px] text-[#166534] font-medium">Completed</p>
            </div>

            <div className="bg-white border border-[#D8DDE3] rounded-xl p-3.5 space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">TOTAL</span>
              <div className="text-2xl font-bold font-mono text-[#1E293B]">
                {overviewData?.workload.total_inspections ?? 0}
              </div>
              <p className="text-[10px] text-[#94A3B8]">All Records</p>
            </div>
          </div>

          {/* URGENT ACTIONS: RETURNED CASES BANNER */}
          {overviewData?.urgent_actions && overviewData.urgent_actions.length > 0 && (
            <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-[#FEF3C7] text-[#B45309] rounded-md border border-[#FDE68A]">
                    <AlertCircle className="w-4 h-4" />
                  </span>
                  <h2 className="text-xs font-bold text-[#92400E] uppercase tracking-wider">
                    Returned Cases ({overviewData.urgent_actions.length})
                  </h2>
                </div>
                <span className="text-[11px] text-[#78350F]">Senior re-inspection directives</span>
              </div>

              <div className="space-y-2">
                {overviewData.urgent_actions.map((uc: any) => (
                  <div
                    key={uc.id}
                    className="bg-white border border-[#FDE68A] rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#92400E] bg-[#FEF3C7] px-2 py-0.5 rounded border border-[#FDE68A]">
                          {uc.case_number}
                        </span>
                        <span className="text-xs font-bold text-[#1E293B]">
                          {uc.brand_name} &bull; {uc.commodity_name}
                        </span>
                        {uc.failed_checks > 0 && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] rounded font-semibold">
                            {uc.failed_checks} Non-Compliant
                          </span>
                        )}
                      </div>

                      {expandedUrgentId === uc.id ? (
                        <div className="text-xs text-[#475569] bg-[#F8F9FA] p-2 rounded border border-[#E2E8F0] mt-1">
                          <strong className="text-[#B45309] block text-[10px] uppercase">Senior Directive:</strong>
                          <p className="mt-0.5 italic">{uc.senior_remarks || 'Re-evaluate declarations and upload clear evidence.'}</p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-[#64748B] truncate">
                          {uc.senior_remarks ? uc.senior_remarks.slice(0, 80) + '...' : 'Evidence re-evaluation requested.'}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setExpandedUrgentId(expandedUrgentId === uc.id ? null : uc.id)}
                        className="px-2.5 py-1.5 bg-[#F8F9FA] hover:bg-[#EEF2F6] text-[#475569] rounded-lg text-xs font-semibold border border-[#CBD5E1] cursor-pointer"
                      >
                        {expandedUrgentId === uc.id ? 'Hide Directive' : 'View Directive'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleResumeCase(uc.id)}
                        className="px-3 py-1.5 bg-[#B45309] hover:bg-[#92400E] text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Resume</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Action & Recent Inspections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Quick Action Launcher Card */}
            <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-[#EBF3FA] text-[#174A7E] rounded-lg border border-[#CBD5E1]">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">New Inspection</h3>
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Start an inspection by scanning the EAN-13 barcode or calibrating package dimensions.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    resetWizard();
                    setActiveTab('wizard');
                    setWizardStep(1);
                  }}
                  className="w-full py-2.5 bg-[#174A7E] hover:bg-[#0F3B66] text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <Barcode className="w-4 h-4" />
                  <span>Start Inspection</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Recent Inspections Table */}
            <div className="lg:col-span-2 bg-white border border-[#D8DDE3] rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#174A7E]" />
                  <span>Recent Inspections</span>
                </h3>
                <button
                  onClick={() => { setActiveTab('registry'); loadRegistry(); }}
                  className="text-xs text-[#174A7E] hover:underline font-bold cursor-pointer"
                >
                  View Registry &rarr;
                </button>
              </div>

              <div className="overflow-x-auto border border-[#E2E8F0] rounded-lg">
                <table className="w-full text-left text-xs text-[#1E293B]">
                  <thead className="bg-[#F8F9FA] text-[#475569] font-semibold border-b border-[#E2E8F0]">
                    <tr>
                      <th className="p-2.5">Case ID</th>
                      <th className="p-2.5">Commodity</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Score</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {(!overviewData?.recent_cases || overviewData.recent_cases.length === 0) ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-[#94A3B8]">
                          No recent inspection cases found.
                        </td>
                      </tr>
                    ) : (
                      overviewData.recent_cases.map((rc: any) => (
                        <tr key={rc.id} className="hover:bg-[#F8FAFC] transition">
                          <td className="p-2.5 font-mono font-bold text-[#174A7E]">{rc.case_number}</td>
                          <td className="p-2.5 font-medium text-[#1E293B] truncate max-w-[160px]">
                            {rc.brand_name} {rc.commodity_name}
                          </td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              rc.status === 'FINALIZED'
                                ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                                : rc.status === 'RETURNED'
                                ? 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]'
                                : rc.status === 'SUBMITTED' || rc.status === 'SENIOR_REVIEW'
                                ? 'bg-[#EEF2FF] text-[#4338CA] border-[#C7D2FE]'
                                : 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]'
                            }`}>
                              {rc.status}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono font-bold text-[#1E293B]">
                            {rc.compliance_score ? `${rc.compliance_score.toFixed(0)}%` : '--'}
                          </td>
                          <td className="p-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleResumeCase(rc.id)}
                              className="px-2 py-1 bg-white hover:bg-[#F1F5F9] text-[#174A7E] rounded text-[11px] font-bold border border-[#CBD5E1] inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" /> Open
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GUIDED INSPECTION WIZARD */}
      {activeTab === 'wizard' && (
        <div className="space-y-5">
          {/* 5-Step Stepper Header */}
          <div className="bg-white border border-[#D8DDE3] rounded-xl p-3 sm:p-4 shadow-xs">
            {/* Desktop / Tablet Stepper */}
            <div className="hidden sm:grid grid-cols-5 gap-2 text-center text-xs font-medium">
              {[
                { step: 1, label: '01 Product' },
                { step: 2, label: '02 Evidence' },
                { step: 3, label: '03 AI Studio' },
                { step: 4, label: '04 Compliance' },
                { step: 5, label: '05 Submit' },
              ].map((s) => (
                <div
                  key={s.step}
                  className={`p-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                    wizardStep === s.step
                      ? 'bg-[#EBF3FA] text-[#174A7E] border border-[#174A7E] font-bold shadow-2xs'
                      : wizardStep > s.step
                      ? 'bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]'
                      : 'bg-[#F8F9FA] text-[#94A3B8] border border-[#E2E8F0]'
                  }`}
                >
                  {wizardStep > s.step ? (
                    <CheckCircle className="w-3.5 h-3.5 text-[#16A34A]" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-white border border-current flex items-center justify-center text-[10px] font-bold">
                      {s.step}
                    </span>
                  )}
                  <span>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Mobile Stepper */}
            <div className="sm:hidden flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#174A7E] text-white flex items-center justify-center text-[10px] font-bold">
                  {wizardStep}
                </span>
                <span className="font-bold text-[#1E293B]">
                  {wizardStep === 1 && '01 Product & Dimensions'}
                  {wizardStep === 2 && '02 Evidence Capture'}
                  {wizardStep === 3 && '03 AI Studio'}
                  {wizardStep === 4 && '04 Compliance Checks'}
                  {wizardStep === 5 && '05 Review & Submit'}
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#64748B]">STEP {wizardStep} / 5</span>
            </div>
          </div>

          {/* STEP 1: PRODUCT & DIMENSIONS */}
          {wizardStep === 1 && (
            <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
              <div className="border-b border-[#E2E8F0] pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-2">
                    <Barcode className="w-4 h-4 text-[#174A7E]" /> 01 Product & Dimensions
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Scan barcode or enter commodity details with physical dimensions.
                  </p>
                </div>
              </div>

              {/* Barcode Search Bar */}
              <div className="bg-[#F8F9FA] p-3 rounded-lg border border-[#D8DDE3] flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="flex items-center gap-2 flex-1">
                  <Barcode className="w-4 h-4 text-[#64748B]" />
                  <input
                    type="text"
                    placeholder="Scan / Enter Barcode (e.g. 8901030914101)..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className="bg-transparent flex-1 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleBarcodeLookup}
                  className="px-3 py-1.5 bg-white hover:bg-[#F1F5F9] text-[#174A7E] rounded-md text-xs font-bold border border-[#CBD5E1] shadow-2xs transition cursor-pointer"
                >
                  Lookup
                </button>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={productForm.brand_name}
                    onChange={(e) => setProductForm({ ...productForm, brand_name: e.target.value })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1E293B] focus:ring-1 focus:ring-[#174A7E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">
                    Commodity Name
                  </label>
                  <input
                    type="text"
                    value={productForm.commodity_name}
                    onChange={(e) => setProductForm({ ...productForm, commodity_name: e.target.value })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1E293B] focus:ring-1 focus:ring-[#174A7E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">
                    Package Type
                  </label>
                  <select
                    value={productForm.package_type}
                    onChange={(e) => setProductForm({ ...productForm, package_type: e.target.value })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1E293B] focus:ring-1 focus:ring-[#174A7E]"
                  >
                    <option value="BOX">Box / Carton</option>
                    <option value="POUCH">Flexible Pouch</option>
                    <option value="BOTTLE">Bottle / Jar</option>
                    <option value="CAN">Canister</option>
                    <option value="WRAPPER">Flow Wrapper</option>
                  </select>
                </div>
              </div>

              {/* Physical Dimension Calibration for Schedule II */}
              <div className="bg-[#F8F9FA] border border-[#D8DDE3] rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#174A7E]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                    PDP Dimensions (Schedule II)
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-[#64748B] mb-1">Width (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={productForm.pdp_width_cm}
                      onChange={(e) => {
                        const w = parseFloat(e.target.value) || 0;
                        setProductForm({ ...productForm, pdp_width_cm: w, pdp_area_cm2: w * productForm.pdp_height_cm });
                      }}
                      className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1E293B]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#64748B] mb-1">Height (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={productForm.pdp_height_cm}
                      onChange={(e) => {
                        const h = parseFloat(e.target.value) || 0;
                        setProductForm({ ...productForm, pdp_height_cm: h, pdp_area_cm2: productForm.pdp_width_cm * h });
                      }}
                      className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1E293B]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#64748B] mb-1">Area & Min Font</label>
                    <div className="bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#174A7E] font-mono flex items-center justify-between">
                      <span className="font-bold">{productForm.pdp_width_cm * productForm.pdp_height_cm} cm²</span>
                      <span className="text-[11px] px-2 py-0.5 bg-[#EBF3FA] rounded text-[#174A7E] font-sans font-bold border border-[#CBD5E1]">
                        Min Font: {productForm.pdp_width_cm * productForm.pdp_height_cm <= 50 ? '1.0mm' : productForm.pdp_width_cm * productForm.pdp_height_cm <= 100 ? '1.5mm' : productForm.pdp_width_cm * productForm.pdp_height_cm <= 500 ? '2.0mm' : '4.0mm'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={handleCreateCase}
                  className="px-5 py-2.5 bg-[#174A7E] hover:bg-[#0F3B66] text-white rounded-lg font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <span>Next: Evidence Capture</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: MULTI-SURFACE EVIDENCE & OPENCV QUALITY GATE */}
          {wizardStep === 2 && activeCase && (
            <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
              <div className="border-b border-[#E2E8F0] pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#174A7E]" /> 02 Evidence Capture
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Case: <span className="font-mono font-bold text-[#174A7E]">{activeCase.case_number}</span> &bull; <span className="text-[#1E293B] font-semibold">{activeCase.product?.brand_name} - {activeCase.product?.commodity_name}</span>
                  </p>
                </div>
              </div>

              {/* Surface Selector & Upload Panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider">
                    Select Surface
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['FRONT', 'BACK', 'TOP', 'BOTTOM', 'LEFT', 'RIGHT'] as SurfaceType[]).map((surf) => (
                      <button
                        key={surf}
                        type="button"
                        onClick={() => setSelectedSurface(surf)}
                        className={`p-2.5 rounded-lg border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                          selectedSurface === surf
                            ? 'bg-[#EBF3FA] border-[#174A7E] text-[#174A7E]'
                            : 'bg-[#F8F9FA] border-[#D8DDE3] text-[#64748B] hover:text-[#1E293B]'
                        }`}
                      >
                        <span>{surf}</span>
                        {activeCase.evidences?.some((e) => e.surface_type === surf) && (
                          <CheckCircle className="w-3.5 h-3.5 text-[#16A34A]" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Upload Dropzone */}
                  <div className="border-2 border-dashed border-[#CBD5E1] hover:border-[#174A7E] rounded-xl p-5 text-center bg-[#F8F9FA] transition cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <Upload className="w-7 h-7 text-[#174A7E] mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-[#1E293B]">Upload {selectedSurface}</p>
                    <p className="text-[11px] text-[#64748B] mt-0.5">JPEG, PNG up to 10MB</p>
                    {isUploading && (
                      <div className="mt-2.5 text-xs text-[#174A7E] font-medium flex items-center justify-center gap-1.5">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Processing image...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Evidence List & Compact Quality Cards */}
                <div className="md:col-span-2 space-y-3">
                  <h3 className="text-xs font-bold text-[#475569] uppercase tracking-wider">
                    Surfaces ({activeCase.evidences?.length || 0})
                  </h3>

                  {(!activeCase.evidences || activeCase.evidences.length === 0) ? (
                    <div className="bg-[#F8F9FA] border border-[#D8DDE3] rounded-xl p-8 text-center text-[#94A3B8] text-xs">
                      No surfaces captured yet. Upload at least FRONT surface to proceed.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeCase.evidences.map((ev) => (
                        <div key={ev.id} className="bg-[#F8F9FA] border border-[#D8DDE3] rounded-lg overflow-hidden p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#174A7E] bg-[#EBF3FA] px-2 py-0.5 rounded border border-[#CBD5E1]">
                              {ev.surface_type}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              ev.quality_verdict === 'READABLE' 
                                ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]' 
                                : 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                            }`}>
                              {ev.quality_verdict === 'READABLE' ? '✓ READABLE' : '⚠ REVIEW'}
                            </span>
                          </div>

                          <div className="h-32 bg-white rounded border border-[#E2E8F0] overflow-hidden flex items-center justify-center">
                            <img
                              src={api.getMediaUrl(ev.storage_path)}
                              alt={ev.surface_type}
                              className="h-full object-contain"
                            />
                          </div>

                          {/* Progressive Disclosure: Compact Summary + Diagnostics Action */}
                          <div className="flex items-center justify-between pt-1 border-t border-[#E2E8F0] text-xs">
                            <span className="text-[11px] font-mono text-[#64748B]">{ev.width_px} &times; {ev.height_px} px</span>
                            <button
                              type="button"
                              onClick={() => setActiveDiagnosticsEvidence(ev)}
                              className="text-[11px] font-bold text-[#174A7E] hover:underline cursor-pointer"
                            >
                              Diagnostics
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="px-3.5 py-2 bg-white hover:bg-[#F8F9FA] text-[#475569] rounded-lg text-xs font-bold border border-[#CBD5E1] flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>

                <button
                  type="button"
                  onClick={handleRunAnalysis}
                  disabled={!activeCase.evidences || activeCase.evidences.length === 0 || isAnalyzing}
                  className="px-5 py-2.5 bg-[#174A7E] hover:bg-[#0F3B66] text-white rounded-lg font-bold text-xs flex items-center gap-2 shadow-xs disabled:opacity-40 transition cursor-pointer"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Running AI Extraction...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Run AI Extraction</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: AI EXTRACTION STUDIO & MULTI-SURFACE INTERACTIVE CANVAS */}
          {wizardStep === 3 && activeCase && (
            <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="border-b border-[#E2E8F0] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#174A7E]" /> 03 AI Studio
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Hover findings to highlight bounding boxes. Verify AI values on the right.
                  </p>
                </div>

                {/* Surface Filmstrip Selector */}
                {activeCase.evidences && activeCase.evidences.length > 0 && (
                  <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-lg border border-[#D8DDE3] shrink-0 overflow-x-auto">
                    {activeCase.evidences.map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => setActiveStudioSurface(ev.surface_type)}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
                          activeStudioSurface.toUpperCase() === ev.surface_type.toUpperCase()
                            ? 'bg-[#174A7E] text-white shadow-2xs'
                            : 'text-[#64748B] hover:text-[#1E293B]'
                        }`}
                      >
                        <span>{ev.surface_type}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Tablet/Mobile Panel Toggle */}
              <div className="lg:hidden flex items-center bg-[#F1F5F9] p-1 rounded-lg border border-[#D8DDE3]">
                <button
                  type="button"
                  onClick={() => setStudioActivePanel('EVIDENCE')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded text-center transition ${
                    studioActivePanel === 'EVIDENCE' ? 'bg-white text-[#174A7E] shadow-2xs' : 'text-[#64748B]'
                  }`}
                >
                  Evidence
                </button>
                <button
                  type="button"
                  onClick={() => setStudioActivePanel('DECLARATIONS')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded text-center transition ${
                    studioActivePanel === 'DECLARATIONS' ? 'bg-white text-[#174A7E] shadow-2xs' : 'text-[#64748B]'
                  }`}
                >
                  Findings ({activeCase.declarations?.length || 0})
                </button>
              </div>

              {/* Split Screen Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Panel: Image Canvas */}
                <div className={`lg:col-span-6 bg-[#F8F9FA] border border-[#D8DDE3] rounded-xl p-3.5 flex flex-col justify-between space-y-2.5 ${
                  studioActivePanel === 'DECLARATIONS' ? 'hidden lg:flex' : 'flex'
                }`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#1E293B] flex items-center gap-1.5">
                      <span>Surface:</span>
                      <span className="text-[#174A7E] font-mono font-bold bg-[#EBF3FA] px-2 py-0.2 rounded border border-[#CBD5E1]">
                        {activeStudioSurface}
                      </span>
                    </span>

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-[#D8DDE3] shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setZoomLevel(Math.max(70, zoomLevel - 20))}
                        className="p-0.5 hover:text-[#174A7E] text-[#64748B] cursor-pointer"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono text-[11px] text-[#475569] w-9 text-center font-bold">{zoomLevel}%</span>
                      <button
                        type="button"
                        onClick={() => setZoomLevel(Math.min(250, zoomLevel + 20))}
                        className="p-0.5 hover:text-[#174A7E] text-[#64748B] cursor-pointer"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoomLevel(100)}
                        className="p-0.5 hover:text-[#174A7E] text-[#64748B] ml-1 cursor-pointer"
                        title="Reset Zoom"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Image Viewport */}
                  <div className="relative bg-white rounded-lg overflow-auto flex items-center justify-center min-h-[340px] max-h-[420px] border border-[#D8DDE3] p-2">
                    {currentStudioEvidence ? (
                      <div
                        className="relative transition-transform duration-150 max-w-full"
                        style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                      >
                        <img
                          src={api.getMediaUrl(currentStudioEvidence.storage_path)}
                          alt={currentStudioEvidence.surface_type}
                          className="max-h-[380px] w-auto object-contain rounded"
                        />
                        {highlightedBbox && (
                          <div
                            className="absolute border-2 border-amber-600 bg-amber-500/20 rounded pointer-events-none transition-all duration-200"
                            style={{
                              left: `${highlightedBbox.x * 100}%`,
                              top: `${highlightedBbox.y * 100}%`,
                              width: `${highlightedBbox.w * 100}%`,
                              height: `${highlightedBbox.h * 100}%`,
                            }}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-[#94A3B8]">No image available for this surface.</div>
                    )}
                  </div>
                </div>

                {/* Right Panel: Compact Findings List */}
                <div className={`lg:col-span-6 space-y-3 ${
                  studioActivePanel === 'EVIDENCE' ? 'hidden lg:block' : 'block'
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[#475569] uppercase tracking-wider">
                      Findings (Rule 6)
                    </h3>
                    <span className="text-[11px] text-[#15803D] font-mono font-semibold">
                      {activeCase.declarations?.length || 0} Declarations &bull; AI vs Verified
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
                    {(!activeCase.declarations || activeCase.declarations.length === 0) ? (
                      <div className="p-8 text-center text-xs text-[#94A3B8] bg-[#F8F9FA] rounded-xl border border-[#D8DDE3]">
                        No declarations extracted yet.
                      </div>
                    ) : (
                      activeCase.declarations.map((decl) => (
                        <div
                          key={decl.id}
                          onMouseEnter={() => {
                            if (decl.bbox) setHighlightedBbox(decl.bbox);
                            if (decl.surface_name) setActiveStudioSurface(decl.surface_name);
                          }}
                          onMouseLeave={() => setHighlightedBbox(null)}
                          className="bg-[#F8F9FA] border border-[#D8DDE3] hover:border-[#174A7E] rounded-lg p-3 space-y-2 transition shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#1E293B] flex items-center gap-1.5">
                              <span>{decl.title}</span>
                              {decl.surface_name && (
                                <span className="text-[9px] px-1.5 py-0.2 bg-[#EBF3FA] text-[#174A7E] rounded border border-[#CBD5E1]">
                                  {decl.surface_name}
                                </span>
                              )}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {decl.font_height_mm && (
                                <span className="text-[10px] px-1.5 py-0.2 bg-[#F1F5F9] border border-[#CBD5E1] text-[#334155] rounded font-mono">
                                  Font: {decl.font_height_mm.toFixed(1)}mm
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => setActiveDeclDetails(decl)}
                                className="text-[10px] text-[#174A7E] font-bold hover:underline cursor-pointer"
                              >
                                Details
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            {/* Raw AI Extraction Readout */}
                            <div className="bg-white p-2 rounded border border-[#E2E8F0]">
                              <span className="text-[9px] text-[#64748B] block font-bold uppercase">AI Detected</span>
                              <span className="text-[#1E293B] font-mono font-semibold break-all text-xs">
                                {decl.raw_ocr_text || decl.extracted_value || 'None'}
                              </span>
                            </div>

                            {/* Inspector Verified Input */}
                            <div>
                              <span className="text-[9px] text-[#64748B] block font-bold uppercase mb-0.5">Verified</span>
                              <input
                                type="text"
                                placeholder={decl.extracted_value || "Enter verified value..."}
                                defaultValue={decl.inspector_corrected_value || ''}
                                onChange={(e) => {
                                  setCorrections({ ...corrections, [decl.field_type]: e.target.value });
                                }}
                                className="w-full bg-white border border-[#CBD5E1] rounded px-2.5 py-1.5 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:ring-1 focus:ring-[#174A7E]"
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="px-3.5 py-2 bg-white hover:bg-[#F8F9FA] text-[#475569] rounded-lg text-xs font-bold border border-[#CBD5E1] flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>

                <button
                  type="button"
                  onClick={handleProceedToCompliance}
                  className="px-5 py-2.5 bg-[#174A7E] hover:bg-[#0F3B66] text-white rounded-lg font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <span>Next: Compliance Checks</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: COMPLIANCE ENGINE & PROGRESSIVE DETAILS */}
          {wizardStep === 4 && activeCase && (
            <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="border-b border-[#E2E8F0] pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#174A7E]" /> 04 Compliance Checks
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Automated rule engine evaluation under Legal Metrology Rules.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-[#174A7E] bg-[#EBF3FA] px-2.5 py-1 rounded border border-[#CBD5E1]">
                    Score: {activeCase.compliance_score ? `${activeCase.compliance_score.toFixed(0)}%` : '--'}
                  </span>
                </div>
              </div>

              {/* Compliance Summary Strip */}
              <div className="bg-[#F8F9FA] p-3 rounded-lg border border-[#D8DDE3] flex items-center justify-between text-xs font-bold">
                <span className="text-[#475569] uppercase tracking-wider">Compliance Summary</span>
                <div className="flex items-center gap-2">
                  <span className="text-[#15803D] bg-[#F0FDF4] px-2 py-0.5 rounded border border-[#BBF7D0]">
                    {activeCase.passed_checks} PASS
                  </span>
                  <span className="text-[#B91C1C] bg-[#FEF2F2] px-2 py-0.5 rounded border border-[#FECACA]">
                    {activeCase.failed_checks} FAIL
                  </span>
                </div>
              </div>

              {/* Compliance Checks List with Progressive Details */}
              <div className="space-y-2">
                {(!activeCase.compliance_checks || activeCase.compliance_checks.length === 0) ? (
                  <div className="p-8 text-center text-[#94A3B8] text-xs bg-[#F8F9FA] rounded-xl border border-[#D8DDE3]">
                    No compliance checks evaluated.
                  </div>
                ) : (
                  activeCase.compliance_checks.map((check) => (
                    <div
                      key={check.id}
                      className={`p-3 rounded-lg border transition ${
                        check.status === 'PASS'
                          ? 'bg-[#F0FDF4] border-[#BBF7D0]'
                          : check.status === 'FAIL'
                          ? 'bg-[#FEF2F2] border-[#FECACA]'
                          : 'bg-[#FFFBEB] border-[#FDE68A]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          {check.status === 'PASS' && <CheckCircle className="w-4 h-4 text-[#16A34A] shrink-0" />}
                          {check.status === 'FAIL' && <XCircle className="w-4 h-4 text-[#DC2626] shrink-0" />}
                          {check.status === 'REVIEW_REQUIRED' && <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />}
                          <span className="font-mono text-xs font-bold text-[#1E293B]">{check.rule_code}</span>
                          <span className="text-xs font-semibold text-[#334155] truncate">{check.rule_title}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setExpandedCheckId(expandedCheckId === check.id ? null : check.id)}
                            className="text-[11px] text-[#174A7E] font-bold hover:underline cursor-pointer"
                          >
                            {expandedCheckId === check.id ? 'Hide Details' : 'Details'}
                          </button>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              check.status === 'PASS'
                                ? 'bg-white text-[#15803D] border-[#BBF7D0]'
                                : check.status === 'FAIL'
                                ? 'bg-white text-[#B91C1C] border-[#FECACA]'
                                : 'bg-white text-[#B45309] border-[#FDE68A]'
                            }`}
                          >
                            {check.status}
                          </span>
                        </div>
                      </div>

                      {/* Expandable Statutory Details */}
                      {expandedCheckId === check.id && (
                        <div className="mt-2.5 pt-2 border-t border-black/5 text-xs text-[#475569] space-y-1 bg-white/60 p-2 rounded">
                          <p>{check.reason_explanation}</p>
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#64748B] pt-1">
                            <span>Citation: <strong className="text-[#334155]">{check.statutory_citation || 'PCR 2011'}</strong></span>
                            {check.evaluated_value && <span>Value: <code className="text-[#174A7E] font-mono">{check.evaluated_value}</code></span>}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setWizardStep(3)}
                  className="px-3.5 py-2 bg-white hover:bg-[#F8F9FA] text-[#475569] rounded-lg text-xs font-bold border border-[#CBD5E1] flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>

                <button
                  type="button"
                  onClick={() => setWizardStep(5)}
                  className="px-5 py-2.5 bg-[#174A7E] hover:bg-[#0F3B66] text-white rounded-lg font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <span>Next: Review & Submit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & SUBMIT */}
          {wizardStep === 5 && activeCase && (
            <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
              <div className="border-b border-[#E2E8F0] pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#174A7E]" /> 05 Review & Submit
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Review findings, enter inspector remarks, and submit for supervisory review.
                  </p>
                </div>
              </div>

              {submissionSuccess ? (
                <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-6 sm:p-8 text-center space-y-3">
                  <div className="w-12 h-12 bg-white text-[#16A34A] rounded-full flex items-center justify-center mx-auto border border-[#BBF7D0] shadow-xs">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-[#1E293B]">Case Submitted</h3>
                  <p className="text-xs text-[#475569] max-w-md mx-auto">
                    Case <span className="font-mono font-bold text-[#174A7E]">{activeCase.case_number}</span> transferred to Senior Officer queue.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                    <a
                      href={api.getReportPdfUrl(activeCase.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 bg-white hover:bg-[#F8F9FA] text-[#174A7E] rounded-lg text-xs font-bold border border-[#CBD5E1] flex items-center gap-1.5 shadow-xs transition"
                    >
                      <Download className="w-3.5 h-3.5" /> Download PDF
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        resetWizard();
                        setActiveTab('overview');
                        loadOverview();
                      }}
                      className="px-4 py-2 bg-[#174A7E] hover:bg-[#0F3B66] text-white rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Return to Overview
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Case Summary Pill Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-[#F8F9FA] p-3 rounded-lg border border-[#D8DDE3]">
                      <span className="text-[9px] text-[#64748B] uppercase font-bold">Case ID</span>
                      <p className="text-xs font-mono font-bold text-[#1E293B] mt-0.5">{activeCase.case_number}</p>
                    </div>
                    <div className="bg-[#F8F9FA] p-3 rounded-lg border border-[#D8DDE3]">
                      <span className="text-[9px] text-[#64748B] uppercase font-bold">Commodity</span>
                      <p className="text-xs font-bold text-[#1E293B] mt-0.5 truncate">{activeCase.product?.commodity_name}</p>
                    </div>
                    <div className="bg-[#F0FDF4] p-3 rounded-lg border border-[#BBF7D0]">
                      <span className="text-[9px] text-[#15803D] uppercase font-bold">Passed</span>
                      <p className="text-xs font-bold text-[#16A34A] mt-0.5">{activeCase.passed_checks} / {activeCase.total_checks}</p>
                    </div>
                    <div className="bg-[#FEF2F2] p-3 rounded-lg border border-[#FECACA]">
                      <span className="text-[9px] text-[#991B1B] uppercase font-bold">Failed</span>
                      <p className="text-xs font-bold text-[#DC2626] mt-0.5">{activeCase.failed_checks}</p>
                    </div>
                  </div>

                  {/* Inspector Remarks Entry */}
                  <div>
                    <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                      Inspector Findings & Remarks
                    </label>
                    <textarea
                      rows={3}
                      value={inspectorRemarks}
                      onChange={(e) => setInspectorRemarks(e.target.value)}
                      placeholder="Enter physical observations, batch details, or enforcement notes..."
                      className="w-full bg-white border border-[#CBD5E1] rounded-lg p-3 text-xs text-[#1E293B] placeholder-[#94A3B8] focus:ring-1 focus:ring-[#174A7E]"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-[#E2E8F0]">
                    <button
                      type="button"
                      onClick={() => setWizardStep(4)}
                      className="px-3.5 py-2 bg-white hover:bg-[#F8F9FA] text-[#475569] rounded-lg text-xs font-bold border border-[#CBD5E1] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                      <a
                        href={api.getReportPdfUrl(activeCase.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 bg-white hover:bg-[#F8F9FA] text-[#475569] rounded-lg text-xs font-bold border border-[#CBD5E1] flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5" /> Preview PDF
                      </a>

                      <button
                        type="button"
                        onClick={handleSubmitReview}
                        disabled={isSubmitting}
                        className="px-5 py-2.5 bg-[#174A7E] hover:bg-[#0F3B66] text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-xs disabled:opacity-40 transition cursor-pointer"
                      >
                        {isSubmitting ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5" />
                        )}
                        <span>Submit to Senior Queue</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DIAGNOSTICS MODAL (LEVEL 3 DETAILS) */}
          {activeDiagnosticsEvidence && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 max-w-sm w-full shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                  <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                    Evidence Diagnostics ({activeDiagnosticsEvidence.surface_type})
                  </h3>
                  <button onClick={() => setActiveDiagnosticsEvidence(null)} className="text-[#94A3B8] hover:text-[#1E293B] cursor-pointer">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1.5 text-xs text-[#475569]">
                  <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                    <span>Resolution:</span>
                    <strong className="font-mono text-[#1E293B]">{activeDiagnosticsEvidence.width_px} &times; {activeDiagnosticsEvidence.height_px} px</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                    <span>Blur Variance:</span>
                    <strong className="font-mono text-[#1E293B]">{activeDiagnosticsEvidence.blur_score?.toFixed(1) || 'N/A'}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                    <span>Brightness / Contrast:</span>
                    <strong className="font-mono text-[#1E293B]">{activeDiagnosticsEvidence.brightness_score?.toFixed(0)} / {activeDiagnosticsEvidence.contrast_score?.toFixed(0)}</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Quality Verdict:</span>
                    <span className="font-bold text-[#15803D]">{activeDiagnosticsEvidence.quality_verdict}</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveDiagnosticsEvidence(null)}
                  className="w-full py-2 bg-[#174A7E] text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* DECLARATION DETAILS MODAL (LEVEL 3 DETAILS) */}
          {activeDeclDetails && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 max-w-sm w-full shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                  <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                    {activeDeclDetails.title} Details
                  </h3>
                  <button onClick={() => setActiveDeclDetails(null)} className="text-[#94A3B8] hover:text-[#1E293B] cursor-pointer">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1.5 text-xs text-[#475569]">
                  <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                    <span>Field Type:</span>
                    <code className="text-[#174A7E] font-mono">{activeDeclDetails.field_type}</code>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                    <span>OCR Confidence:</span>
                    <strong className="font-mono text-[#1E293B]">{(activeDeclDetails.confidence * 100).toFixed(0)}%</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                    <span>Font Height:</span>
                    <strong className="font-mono text-[#1E293B]">{activeDeclDetails.font_height_mm ? `${activeDeclDetails.font_height_mm.toFixed(1)} mm` : 'N/A'}</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Surface:</span>
                    <strong className="text-[#1E293B]">{activeDeclDetails.surface_name || 'FRONT'}</strong>
                  </div>
                </div>
                <button
                  onClick={() => setActiveDeclDetails(null)}
                  className="w-full py-2 bg-[#174A7E] text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INSPECTION REGISTRY / PAST CASES */}
      {activeTab === 'registry' && (
        <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <h2 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">Inspection Case Registry</h2>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search Bar */}
              <div className="bg-[#F8F9FA] border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 flex items-center gap-2 w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Search case, commodity..."
                  value={registrySearch}
                  onChange={(e) => setRegistrySearch(e.target.value)}
                  className="bg-transparent text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none w-full"
                />
              </div>

              {/* Status Filter */}
              <select
                value={registryStatusFilter}
                onChange={(e) => setRegistryStatusFilter(e.target.value)}
                className="bg-white border border-[#CBD5E1] text-xs text-[#1E293B] rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="EVIDENCE_PENDING">Evidence Pending</option>
                <option value="ANALYSIS_COMPLETE">Analysis Complete</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="SENIOR_REVIEW">Senior Review</option>
                <option value="RETURNED">Returned</option>
                <option value="FINALIZED">Finalized</option>
              </select>

              <button
                onClick={loadRegistry}
                className="px-2.5 py-1.5 bg-white hover:bg-[#F8F9FA] text-[#475569] rounded-lg text-xs font-medium border border-[#CBD5E1] flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingRegistry ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto border border-[#E2E8F0] rounded-lg">
            <table className="w-full text-left text-xs text-[#1E293B]">
              <thead className="bg-[#F8F9FA] text-[#475569] font-semibold border-b border-[#E2E8F0]">
                <tr>
                  <th className="p-3">Case ID</th>
                  <th className="p-3">Commodity</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Failed Checks</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {inspectionsList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-[#94A3B8]">
                      No inspection cases recorded yet.
                    </td>
                  </tr>
                ) : (
                  inspectionsList.map((c) => (
                    <tr key={c.id} className="hover:bg-[#F8FAFC] transition">
                      <td className="p-3 font-mono text-[#174A7E] font-bold">{c.case_number}</td>
                      <td className="p-3 font-medium text-[#1E293B]">{c.product?.brand_name} {c.product?.commodity_name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          c.status === 'FINALIZED'
                            ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                            : c.status === 'RETURNED'
                            ? 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]'
                            : c.status === 'SENIOR_REVIEW' || c.status === 'SUBMITTED'
                            ? 'bg-[#EEF2FF] text-[#4338CA] border-[#C7D2FE]'
                            : 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-[#1E293B]">
                        {c.compliance_score ? `${c.compliance_score.toFixed(0)}%` : 'N/A'}
                      </td>
                      <td className="p-3 font-bold text-[#DC2626]">{c.failed_checks}</td>
                      <td className="p-3 text-[#64748B]">{new Date(c.created_at).toLocaleDateString()}</td>
                      <td className="p-3 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleResumeCase(c.id)}
                          className="px-2 py-1 bg-white hover:bg-[#F8F9FA] text-[#174A7E] rounded text-[11px] font-bold border border-[#CBD5E1] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <PlayCircle className="w-3 h-3" /> Resume
                        </button>
                        <a
                          href={api.getReportPdfUrl(c.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 bg-white hover:bg-[#F8F9FA] text-[#475569] rounded text-[11px] font-bold border border-[#CBD5E1] inline-flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> PDF
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Stack View */}
          <div className="md:hidden space-y-3">
            {inspectionsList.length === 0 ? (
              <div className="p-6 text-center text-[#94A3B8] border border-[#E2E8F0] rounded-lg bg-[#F8F9FA] text-xs">
                No inspection cases recorded yet.
              </div>
            ) : (
              inspectionsList.map((c) => (
                <div key={c.id} className="bg-[#F8F9FA] border border-[#D8DDE3] rounded-lg p-3.5 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[#174A7E] font-bold">{c.case_number}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      c.status === 'FINALIZED'
                        ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                        : c.status === 'RETURNED'
                        ? 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]'
                        : c.status === 'SENIOR_REVIEW' || c.status === 'SUBMITTED'
                        ? 'bg-[#EEF2FF] text-[#4338CA] border-[#C7D2FE]'
                        : 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-[#1E293B]">{c.product?.brand_name} {c.product?.commodity_name}</p>
                    <p className="text-[11px] text-[#64748B] mt-0.5">{new Date(c.created_at).toLocaleDateString()}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-white p-2 rounded border border-[#E2E8F0] text-xs">
                    <div>
                      <span className="text-[10px] text-[#64748B] block">Score</span>
                      <span className="font-mono font-bold text-[#1E293B]">
                        {c.compliance_score ? `${c.compliance_score.toFixed(0)}%` : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] block">Failed Checks</span>
                      <span className="font-bold text-[#DC2626]">{c.failed_checks}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#E2E8F0]">
                    <button
                      type="button"
                      onClick={() => handleResumeCase(c.id)}
                      className="px-3 py-1.5 bg-white hover:bg-[#F8F9FA] text-[#174A7E] rounded-lg text-xs font-bold border border-[#CBD5E1] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <PlayCircle className="w-3.5 h-3.5" /> Resume
                    </button>
                    <a
                      href={api.getReportPdfUrl(c.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-white hover:bg-[#F8F9FA] text-[#475569] rounded-lg text-xs font-bold border border-[#CBD5E1] inline-flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PRODUCTS CATALOG */}
      {activeTab === 'products' && (
        <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">Packaged Commodities Catalog</h2>
            <button
              onClick={loadProducts}
              className="px-2.5 py-1.5 bg-white hover:bg-[#F8F9FA] text-[#475569] rounded-lg text-xs font-medium border border-[#CBD5E1] flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {productsList.map((p) => (
              <div key={p.id} className="bg-[#F8F9FA] border border-[#D8DDE3] rounded-lg p-4 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[#174A7E] font-bold">{p.barcode || 'NO BARCODE'}</span>
                  <span className="text-[10px] bg-white px-2 py-0.5 rounded text-[#475569] border border-[#CBD5E1] font-semibold">{p.package_type}</span>
                </div>
                <h3 className="text-xs font-bold text-[#1E293B]">{p.brand_name} - {p.commodity_name}</h3>
                <div className="text-[11px] text-[#64748B] space-y-0.5 bg-white p-2 rounded border border-[#E2E8F0]">
                  <div className="flex justify-between">
                    <span>Default MRP:</span>
                    <span className="font-mono text-[#1E293B] font-bold">₹{p.default_mrp || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Net Qty:</span>
                    <span className="font-mono text-[#1E293B]">{p.default_net_quantity || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PDP Area:</span>
                    <span className="font-mono text-[#174A7E] font-bold">{p.pdp_area_cm2 || 0} cm²</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setBarcodeInput(p.barcode || '');
                    setProductForm({
                      brand_name: p.brand_name,
                      commodity_name: p.commodity_name,
                      package_type: p.package_type || 'BOX',
                      default_net_quantity: p.default_net_quantity || '',
                      default_mrp: p.default_mrp || 0,
                      is_imported: p.is_imported || false,
                      country_of_origin: p.country_of_origin || 'India',
                      pdp_width_cm: p.pdp_width_cm || 10,
                      pdp_height_cm: p.pdp_height_cm || 10,
                      pdp_area_cm2: p.pdp_area_cm2 || 100,
                    });
                    setActiveTab('wizard');
                    setWizardStep(1);
                  }}
                  className="w-full mt-2 py-1.5 bg-[#EBF3FA] hover:bg-[#DDEBF7] text-[#174A7E] border border-[#CBD5E1] rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Start Inspection For Product</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

