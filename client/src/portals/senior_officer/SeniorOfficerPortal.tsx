import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { InspectionCase } from '../../types';

// Senior Officer Components & Views
import { SeniorSidebar, type SeniorNavTab } from './components/SeniorSidebar';
import { SeniorTopbar } from './components/SeniorTopbar';
import { SeniorDashboard } from './views/SeniorDashboard';
import { SeniorUpcomingAuditsView } from './views/SeniorUpcomingAuditsView';
import { SeniorReviewsView } from './views/SeniorReviewsView';
import { SystemicIntelligenceView } from './views/SystemicIntelligenceView';
import { SeniorHistoryView } from './views/SeniorHistoryView';
import { SeniorNotificationsView } from './views/SeniorNotificationsView';
import { SeniorProfileView } from './views/SeniorProfileView';
import { SeniorReviewWorkspace } from './views/review/SeniorReviewWorkspace';

export const SeniorOfficerPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SeniorNavTab | 'review_workspace'>('home');
  
  // Data states
  const [overviewData, setOverviewData] = useState<any>(null);
  const [queue, setQueue] = useState<InspectionCase[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  const [allInspections, setAllInspections] = useState<InspectionCase[]>([]);
  
  // Active case for Review Workspace
  const [selectedCaseForReview, setSelectedCaseForReview] = useState<InspectionCase | null>(null);

  // Load Overview Data
  const loadOverview = async () => {
    try {
      const res = await api.getSeniorOverview();
      setOverviewData(res);
    } catch (err) {
      console.error('Error loading senior overview:', err);
    }
  };

  // Load Review Queue
  const loadQueue = async () => {
    setIsLoadingQueue(true);
    try {
      const res = await api.getReviewQueue({
        status: 'ALL',
        severity: 'ALL',
        sortBy: 'newest'
      });
      setQueue(res.queue || []);
    } catch (err) {
      console.error('Error loading review queue:', err);
    } finally {
      setIsLoadingQueue(false);
    }
  };

  // Load All Inspections (History & Notifications)
  const loadAllInspections = async () => {
    try {
      const res = await api.getInspections('ALL', '');
      setAllInspections(res.inspections || []);
    } catch (err) {
      console.error('Error loading all inspections:', err);
    }
  };

  useEffect(() => {
    loadOverview();
    loadQueue();
    loadAllInspections();
  }, []);

  const refreshAllData = () => {
    loadOverview();
    loadQueue();
    loadAllInspections();
  };

  // Open Case in Review Workspace
  const handleOpenCaseForReview = async (caseId: number) => {
    try {
      const fullCase = await api.getInspection(caseId);
      setSelectedCaseForReview(fullCase);
      setActiveTab('review_workspace');
    } catch (err: any) {
      alert(`Error loading inspection case #${caseId}: ${err.message}`);
    }
  };

  // Compute pending reviews count & unread notifications
  const pendingReviewsCount = queue.filter(
    c => c.status === 'SUBMITTED' || c.status === 'SENIOR_REVIEW'
  ).length;

  const unreadNotificationsCount = queue.filter(
    c => c.status === 'SUBMITTED' || c.status === 'SENIOR_REVIEW' || c.status === 'RETURNED'
  ).length;

  const currentNavTab: SeniorNavTab = 
    (activeTab === 'home' || activeTab === 'upcoming' || activeTab === 'reviews' || activeTab === 'intelligence' || activeTab === 'history' || activeTab === 'notifications' || activeTab === 'profile')
      ? activeTab
      : 'home';

  return (
    <div className="bg-[#F4F6F8] rounded-2xl border border-[#D8DDE3] shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[calc(100vh-8rem)]">
      {/* Left Navigation Sidebar */}
      <SeniorSidebar
        activeTab={currentNavTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'home') loadOverview();
          if (tab === 'reviews') loadQueue();
          if (tab === 'history') loadAllInspections();
        }}
        pendingReviewsCount={pendingReviewsCount}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      {/* Main Workstation View Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        {/* Topbar Header */}
        <SeniorTopbar
          activeTab={activeTab}
          onReviewPending={() => {
            setActiveTab('reviews');
            loadQueue();
          }}
          onOpenNotifications={() => setActiveTab('notifications')}
          onOpenProfile={() => setActiveTab('profile')}
          pendingReviewsCount={pendingReviewsCount}
          unreadNotificationsCount={unreadNotificationsCount}
        />

        {/* View Routing */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
          {/* SCREEN 1: DASHBOARD (HOME) */}
          {activeTab === 'home' && (
            <SeniorDashboard
              overviewData={overviewData}
              onOpenCase={handleOpenCaseForReview}
              onViewAllReviews={() => {
                setActiveTab('reviews');
                loadQueue();
              }}
              onViewUpcoming={() => setActiveTab('upcoming')}
              onViewIntelligence={() => setActiveTab('intelligence')}
              onViewHistory={() => {
                setActiveTab('history');
                loadAllInspections();
              }}
              onRefreshData={refreshAllData}
            />
          )}

          {/* SCREEN 2: UPCOMING & ACTIVE FIELD AUDITS */}
          {activeTab === 'upcoming' && (
            <SeniorUpcomingAuditsView
              onOpenCase={handleOpenCaseForReview}
            />
          )}

          {/* SCREEN 3: REVIEWS QUEUE */}
          {activeTab === 'reviews' && (
            <SeniorReviewsView
              queue={queue}
              isLoading={isLoadingQueue}
              onRefresh={loadQueue}
              onOpenCase={handleOpenCaseForReview}
            />
          )}

          {/* SCREEN 4: SYSTEMIC VIOLATION INTELLIGENCE (INNOVATION #5) */}
          {activeTab === 'intelligence' && (
            <SystemicIntelligenceView />
          )}

          {/* SCREEN 5: REVIEW WORKSPACE */}
          {activeTab === 'review_workspace' && selectedCaseForReview && (
            <SeniorReviewWorkspace
              inspectionCase={selectedCaseForReview}
              onBack={() => {
                setActiveTab('reviews');
                refreshAllData();
              }}
              onFinalizeComplete={() => {
                setActiveTab('home');
                refreshAllData();
              }}
            />
          )}

          {/* SCREEN 6: HISTORY */}
          {activeTab === 'history' && (
            <SeniorHistoryView
              inspections={allInspections}
              onOpenCase={handleOpenCaseForReview}
            />
          )}

          {/* SCREEN 7: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <SeniorNotificationsView
              inspections={allInspections}
              onOpenCase={handleOpenCaseForReview}
            />
          )}

          {/* SCREEN 8: PROFILE */}
          {activeTab === 'profile' && (
            <SeniorProfileView />
          )}
        </div>
      </div>
    </div>
  );
};
