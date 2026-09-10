import React, { useState, useEffect } from 'react';
import { CompanySidebar, type CompanyNavTab } from './components/CompanySidebar';
import { CompanyTopbar } from './components/CompanyTopbar';
import { CompanyDashboard } from './views/CompanyDashboard';
import { CompanyProfileView } from './views/CompanyProfileView';
import { CompanyPlantsView } from './views/CompanyPlantsView';
import { CompanyProductsView } from './views/CompanyProductsView';
import { CompanyDocumentsView } from './views/CompanyDocumentsView';
import { CompanyUpcomingAuditsView } from './views/CompanyUpcomingAuditsView';
import { CompanyAuditHistoryView } from './views/CompanyAuditHistoryView';
import { CompanyNotificationsView } from './views/CompanyNotificationsView';
import { CompanyRuleBookView } from './views/CompanyRuleBookView';
import { CompanyDocUploadModal } from './views/modals/CompanyDocUploadModal';
import { CompanyAuditDetailDrawer } from './views/modals/CompanyAuditDetailDrawer';
import { CompanyProductDetailDrawer } from './views/modals/CompanyProductDetailDrawer';
import { api } from '../../services/api';

export const CompanyPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CompanyNavTab>('dashboard');
  const [companyName, setCompanyName] = useState<string>('Enterprise Compliance');
  const [pendingDocsCount, setPendingDocsCount] = useState<number>(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [overviewData, setOverviewData] = useState<any>(null);

  // Modals & Drawers state
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [replaceDoc, setReplaceDoc] = useState<any | null>(null);
  const [selectedAuditId, setSelectedAuditId] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const loadCompanySummary = async () => {
    try {
      const res = await api.getCompanyDashboard();
      if (res) {
        setOverviewData(res);
        if (res.company?.legal_name) {
          setCompanyName(res.company.legal_name);
        }
        if (res.stats?.pending_docs !== undefined) {
          setPendingDocsCount(res.stats.pending_docs);
        }
        if (res.stats?.unread_notifications !== undefined) {
          setUnreadNotificationsCount(res.stats.unread_notifications);
        }
      }
    } catch (err) {
      console.error('Failed to load company portal summary:', err);
    }
  };

  useEffect(() => {
    loadCompanySummary();
  }, []);

  const handleOpenUploadModal = (docToReplace?: any) => {
    setReplaceDoc(docToReplace || null);
    setUploadModalOpen(true);
  };

  const handleCloseUploadModal = () => {
    setUploadModalOpen(false);
    setReplaceDoc(null);
  };

  const handleUploadSuccess = () => {
    loadCompanySummary();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* Top Banner / Topbar */}
      <CompanyTopbar
        companyName={companyName}
        activeTab={activeTab}
        unreadCount={unreadNotificationsCount}
        onOpenNotifications={() => setActiveTab('notifications')}
        onRefresh={loadCompanySummary}
      />

      {/* Main Body */}
      <div className="flex-1 w-full flex flex-col lg:flex-row gap-6 mt-4">
        {/* Sidebar */}
        <CompanySidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingDocsCount={pendingDocsCount}
          unreadNotificationsCount={unreadNotificationsCount}
        />

        {/* Content View */}
        <main className="flex-1 min-w-0">
          {activeTab === 'dashboard' && (
            <CompanyDashboard
              overviewData={overviewData}
              onOpenAuditDetail={(id: number) => setSelectedAuditId(id)}
              onOpenProductDetail={(id: number) => setSelectedProductId(id)}
              onNavigateTab={(tab: CompanyNavTab) => setActiveTab(tab)}
              onOpenUploadDoc={() => handleOpenUploadModal()}
            />
          )}

          {activeTab === 'profile' && (
            <CompanyProfileView 
              onNavigateTab={(tab: CompanyNavTab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'plants' && (
            <CompanyPlantsView 
              onNavigateTab={(tab: CompanyNavTab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'products' && (
            <CompanyProductsView
              onSelectProduct={(id: number) => setSelectedProductId(id)}
            />
          )}

          {activeTab === 'documents' && (
            <CompanyDocumentsView
              onOpenUploadModal={handleOpenUploadModal}
            />
          )}

          {activeTab === 'upcoming' && (
            <CompanyUpcomingAuditsView
              onSelectAudit={(id: number) => setSelectedAuditId(id)}
              onSelectProduct={(id: number) => setSelectedProductId(id)}
              onNavigateTab={(tab: CompanyNavTab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'history' && (
            <CompanyAuditHistoryView
              onSelectAudit={(id: number) => setSelectedAuditId(id)}
              onSelectProduct={(id: number) => setSelectedProductId(id)}
              onNavigateTab={(tab: CompanyNavTab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'notifications' && (
            <CompanyNotificationsView
              onRefreshBadge={loadCompanySummary}
            />
          )}

          {activeTab === 'rules' && (
            <CompanyRuleBookView />
          )}
        </main>
      </div>

      {/* Drawers & Modals */}
      <CompanyDocUploadModal
        isOpen={uploadModalOpen}
        onClose={handleCloseUploadModal}
        onSuccess={handleUploadSuccess}
        replaceDoc={replaceDoc}
      />

      <CompanyAuditDetailDrawer
        isOpen={selectedAuditId !== null}
        onClose={() => setSelectedAuditId(null)}
        auditId={selectedAuditId}
      />

      <CompanyProductDetailDrawer
        isOpen={selectedProductId !== null}
        onClose={() => setSelectedProductId(null)}
        productId={selectedProductId}
        onOpenAuditDetail={(id: number) => {
          setSelectedProductId(null);
          setSelectedAuditId(id);
        }}
      />
    </div>
  );
};
export default CompanyPortal;
