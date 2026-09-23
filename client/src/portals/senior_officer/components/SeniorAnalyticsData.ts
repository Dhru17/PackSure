/**
 * Centralized Static Demo Analytics Data for Senior Officer Module
 * 
 * Note: These are structured demonstration values to provide visual understanding
 * across supervisory workflows. They are strongly typed and centralized here for easy
 * replacement with future API endpoints.
 */

export interface DonutSegment {
  label: string;
  percentage: number;
  color: string;
  count?: number;
}

export interface BarMetricItem {
  label: string;
  count: number;
  color?: string;
  badge?: string;
  badgeType?: 'danger' | 'warning' | 'success' | 'default';
}

export interface LineChartPoint {
  month: string;
  value: number;
}

export interface TimelineInspectionPoint {
  inspectionName: string;
  date: string;
  status: 'Compliant' | 'Violations' | 'Reinspection' | 'Finalized';
  caseRef: string;
  badgeColor: string;
}

export interface SeniorOfficerDemoAnalytics {
  // Part 1: Senior Dashboard
  complianceOverview: {
    segments: DonutSegment[];
    centerText: string;
    centerSubtext: string;
  };
  auditStatus: BarMetricItem[];
  violationTrends: BarMetricItem[];

  // Part 2: Systemic Intelligence
  systemicRuleTrend: BarMetricItem[];
  companyPriority: BarMetricItem[];
  recurringPatternTrend: LineChartPoint[];

  // Part 3: Senior Review Workspace
  reviewBreakdown: DonutSegment[];
  violationSeverity: BarMetricItem[];

  // Part 4: Senior History
  historyTimeline: TimelineInspectionPoint[];
}

export const staticSeniorOfficerAnalytics: SeniorOfficerDemoAnalytics = {
  // Part 1: Dashboard Analytics
  complianceOverview: {
    segments: [
      { label: 'Compliant', percentage: 62, color: '#15803D', count: 62 },
      { label: 'Violations', percentage: 28, color: '#DC2626', count: 28 },
      { label: 'Review Required', percentage: 10, color: '#D97706', count: 10 }
    ],
    centerText: '100%',
    centerSubtext: 'Inspection Mix'
  },
  auditStatus: [
    { label: 'Upcoming', count: 12, color: '#4F46E5' },
    { label: 'Active In-Field', count: 7, color: '#0F766E' },
    { label: 'Pending Review', count: 5, color: '#D97706' },
    { label: 'Returned', count: 3, color: '#DC2626' },
    { label: 'Finalized', count: 18, color: '#15803D' }
  ],
  violationTrends: [
    { label: 'MRP Declaration Issue', count: 24, color: '#DC2626' },
    { label: 'Consumer Care Declaration', count: 18, color: '#D97706' },
    { label: 'Font / Display Requirement', count: 13, color: '#4F46E5' },
    { label: 'Net Quantity', count: 9, color: '#0F766E' },
    { label: 'Other', count: 6, color: '#64748B' }
  ],

  // Part 2: Systemic Intelligence Analytics
  systemicRuleTrend: [
    { label: 'Missing Consumer Care', count: 42, color: '#DC2626' },
    { label: 'Wrong Font Size', count: 31, color: '#4F46E5' },
    { label: 'MRP Declaration Issue', count: 24, color: '#D97706' },
    { label: 'Net Quantity Issue', count: 16, color: '#0F766E' },
    { label: 'Manufacturer Information', count: 11, color: '#64748B' }
  ],
  companyPriority: [
    { label: 'ABC Foods', count: 18, badge: 'HIGH', badgeType: 'danger', color: '#DC2626' },
    { label: 'XYZ Foods', count: 9, badge: 'MEDIUM', badgeType: 'warning', color: '#D97706' },
    { label: 'PQR Industries', count: 5, badge: 'MEDIUM', badgeType: 'warning', color: '#D97706' },
    { label: 'LMN Foods', count: 3, badge: 'LOW', badgeType: 'default', color: '#15803D' }
  ],
  recurringPatternTrend: [
    { month: 'May', value: 4 },
    { month: 'Jun', value: 7 },
    { month: 'Jul', value: 9 },
    { month: 'Aug', value: 12 },
    { month: 'Sep', value: 15 }
  ],

  // Part 3: Senior Review Workspace
  reviewBreakdown: [
    { label: 'Passed', percentage: 58, color: '#15803D', count: 14 },
    { label: 'Failed', percentage: 21, color: '#DC2626', count: 5 },
    { label: 'Review Required', percentage: 8, color: '#D97706', count: 2 },
    { label: 'Not Applicable', percentage: 13, color: '#94A3B8', count: 3 }
  ],
  violationSeverity: [
    { label: 'High Severity', count: 5, color: '#DC2626', badge: 'HIGH' },
    { label: 'Medium Severity', count: 7, color: '#D97706', badge: 'MEDIUM' },
    { label: 'Low Severity', count: 3, color: '#15803D', badge: 'LOW' }
  ],

  // Part 4: Senior History Timeline
  historyTimeline: [
    { inspectionName: 'Initial Baseline Audit', date: '14 May 2026', status: 'Compliant', caseRef: 'LM-2026-1021', badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { inspectionName: 'Label Surveillance Check', date: '28 Jun 2026', status: 'Violations', caseRef: 'LM-2026-1088', badgeColor: 'text-rose-700 bg-rose-50 border-rose-200' },
    { inspectionName: 'Corrective Follow-Up Audit', date: '19 Aug 2026', status: 'Reinspection', caseRef: 'LM-2026-1142', badgeColor: 'text-amber-700 bg-amber-50 border-amber-200' },
    { inspectionName: 'Supervisory Final Review', date: '12 Sep 2026', status: 'Finalized', caseRef: 'LM-2026-1205', badgeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200' }
  ]
};
