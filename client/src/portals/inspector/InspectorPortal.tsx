import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { InspectionCase, Product } from '../../types';

// Part 1 & Part 2 Components & Views
import { InspectorSidebar, type InspectorNavTab } from './components/InspectorSidebar';
import { InspectorTopbar } from './components/InspectorTopbar';
import { InspectorDashboard } from './views/InspectorDashboard';
import { InspectionsView } from './views/InspectionsView';
import { InspectionDetailView } from './views/InspectionDetailView';
import { ProductsView } from './views/ProductsView';
import { ProductDetailView } from './views/ProductDetailView';
import { NotificationsView } from './views/NotificationsView';
import { ProfileView } from './views/ProfileView';
import { InspectionWizard } from './views/wizard/InspectionWizard';

export const InspectorPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InspectorNavTab | 'inspection_detail' | 'product_detail' | 'wizard'>('home');
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [isReturnedWizardView, setIsReturnedWizardView] = useState(false);
  
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

  // Active Inspection / Wizard State
  const [activeCase, setActiveCase] = useState<InspectionCase | null>(null);
  const [selectedCaseForDetail, setSelectedCaseForDetail] = useState<InspectionCase | null>(null);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);

  // Registry & Products state
  const [inspectionsList, setInspectionsList] = useState<InspectionCase[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);

  // Load Overview Data
  const loadOverview = async () => {
    try {
      const res = await api.getInspectorOverview();
      setOverviewData(res);
    } catch (err) {
      console.error('Error loading inspector overview:', err);
    }
  };

  // Load registry data
  const loadRegistry = async () => {
    try {
      const res = await api.getInspections('ALL', '');
      setInspectionsList(res.inspections || []);
    } catch (err) {
      console.error(err);
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

  const refreshAllData = () => {
    loadOverview();
    loadRegistry();
    loadProducts();
  };

  // Compute unread notifications count
  const unreadNotificationsCount = inspectionsList.filter(
    c => c.status === 'RETURNED' || c.status === 'INSPECTOR_REVIEW' || c.status === 'ANALYSIS_COMPLETE'
  ).length;

  // Open Inspection Details (Screen 3)
  const handleOpenCase = async (caseId: number) => {
    try {
      const fullCase = await api.getInspection(caseId);
      setSelectedCaseForDetail(fullCase);
      setActiveTab('inspection_detail');
    } catch (err: any) {
      alert(`Failed to load inspection #${caseId}: ${err.message}`);
    }
  };

  // Resume Existing Case into Wizard (Part 2 Workflow)
  const handleResumeCase = async (caseId: number) => {
    try {
      const c = await api.getInspection(caseId);
      setActiveCase(c);

      if (c.status === 'RETURNED') {
        setIsReturnedWizardView(true);
        setWizardStep(2);
      } else if (c.status === 'DRAFT' || c.status === 'EVIDENCE_PENDING') {
        setIsReturnedWizardView(false);
        setWizardStep(2);
      } else if (c.status === 'ANALYZING' || c.status === 'ANALYSIS_COMPLETE' || c.status === 'INSPECTOR_REVIEW') {
        setIsReturnedWizardView(false);
        if (!c.evidences || c.evidences.length === 0) {
          setWizardStep(2);
        } else if (!c.declarations || c.declarations.length === 0) {
          setWizardStep(2);
        } else {
          setWizardStep(3);
        }
      } else if (c.status === 'SUBMITTED' || c.status === 'SENIOR_REVIEW' || c.status === 'FINALIZED') {
        setIsReturnedWizardView(false);
        setWizardStep(5);
      } else {
        setIsReturnedWizardView(false);
        setWizardStep(2);
      }

      setActiveTab('wizard');
    } catch (err: any) {
      alert(`Failed to load case #${caseId}: ${err.message}`);
    }
  };

  // View Product Details (Screen 5)
  const handleSelectProduct = (product: Product) => {
    setSelectedProductForDetail(product);
    setActiveTab('product_detail');
  };

  // Start Inspection with Product
  const handleStartInspectionWithProduct = async (product: Product) => {
    try {
      const caseRes = await api.createInspection({
        product_id: product.id,
        location_name: 'Field Sample Point',
        source_type: 'FIELD_SAMPLE'
      });
      const fullCase = await api.getInspection(caseRes.inspection.id);
      setActiveCase(fullCase);
      setIsReturnedWizardView(false);
      setWizardStep(2);
      setActiveTab('wizard');
      refreshAllData();
    } catch (err: any) {
      alert(`Failed to start inspection: ${err.message}`);
    }
  };

  // Start Brand New Inspection
  const handleStartNewInspection = () => {
    setActiveCase(null);
    setIsReturnedWizardView(false);
    setWizardStep(1);
    setActiveTab('wizard');
  };

  const currentNavTab: InspectorNavTab = 
    (activeTab === 'home' || activeTab === 'inspections' || activeTab === 'products' || activeTab === 'notifications' || activeTab === 'profile')
      ? activeTab
      : 'home';

  return (
    <div className="bg-[#F4F6F8] rounded-2xl border border-[#D8DDE3] shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[calc(100vh-8rem)]">
      {/* Left Navigation Sidebar */}
      <InspectorSidebar
        activeTab={currentNavTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'home') loadOverview();
          if (tab === 'inspections') loadRegistry();
          if (tab === 'products') loadProducts();
        }}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      {/* Main Workstation View Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        {/* Topbar Header */}
        <InspectorTopbar
          activeTab={activeTab}
          onNewInspection={handleStartNewInspection}
          onOpenNotifications={() => setActiveTab('notifications')}
          onOpenProfile={() => setActiveTab('profile')}
          unreadNotificationsCount={unreadNotificationsCount}
        />

        {/* View Routing */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
          {/* SCREEN 1: DASHBOARD (HOME) */}
          {activeTab === 'home' && (
            <InspectorDashboard
              overviewData={overviewData}
              inspectionsList={inspectionsList}
              onOpenCase={handleOpenCase}
              onResumeCase={handleResumeCase}
              onViewAllInspections={() => setActiveTab('inspections')}
            />
          )}

          {/* SCREEN 2: INSPECTIONS (ACTIVE & HISTORY) */}
          {activeTab === 'inspections' && (
            <InspectionsView
              inspections={inspectionsList}
              onOpenCase={handleOpenCase}
              onResumeCase={handleResumeCase}
            />
          )}

          {/* SCREEN 3: INSPECTION DETAILS / CASE VIEW */}
          {activeTab === 'inspection_detail' && selectedCaseForDetail && (
            <InspectionDetailView
              inspectionCase={selectedCaseForDetail}
              onBack={() => setActiveTab('inspections')}
              onResumeCase={handleResumeCase}
            />
          )}

          {/* SCREEN 4: PRODUCTS CATALOG */}
          {activeTab === 'products' && (
            <ProductsView
              products={productsList}
              onSelectProduct={handleSelectProduct}
              onStartInspectionWithProduct={handleStartInspectionWithProduct}
            />
          )}

          {/* SCREEN 5: PRODUCT DETAILS & HISTORY */}
          {activeTab === 'product_detail' && selectedProductForDetail && (
            <ProductDetailView
              product={selectedProductForDetail}
              onBack={() => setActiveTab('products')}
              onOpenCase={handleOpenCase}
              onStartInspection={handleStartInspectionWithProduct}
            />
          )}

          {/* SCREEN 6: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <NotificationsView
              inspections={inspectionsList}
              onOpenCase={handleOpenCase}
              onResumeCase={handleResumeCase}
            />
          )}

          {/* SCREEN 7: PROFILE */}
          {activeTab === 'profile' && (
            <ProfileView />
          )}

          {/* PART 2: 5-STEP CONTINUOUS GUIDED INSPECTION WIZARD */}
          {activeTab === 'wizard' && (
            <InspectionWizard
              products={productsList}
              activeCase={activeCase}
              setActiveCase={setActiveCase}
              wizardStep={wizardStep}
              setWizardStep={setWizardStep}
              isReturnedView={isReturnedWizardView}
              setIsReturnedView={setIsReturnedWizardView}
              onExit={() => {
                setActiveTab('inspections');
                refreshAllData();
              }}
              onRefreshData={refreshAllData}
            />
          )}
        </div>
      </div>
    </div>
  );
};
