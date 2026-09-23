export interface CompanyAuditStatusItem {
  label: string;
  value: number;
  color: string;
  badgeClass: string;
}

export interface CompanyComplianceOverviewItem {
  label: string;
  value: number; // percentage
  color: string;
}

export interface CompanyViolationTypeItem {
  label: string;
  value: number;
  color: string;
}

export interface CompanyAuditTimelineItem {
  inspectionNumber: string;
  date: string;
  status: 'Compliant' | 'Violations' | 'Reinspection' | 'Finalized';
  productName: string;
  auditRef: string;
  badgeColor: string;
}

export interface CompanyDemoAnalytics {
  auditStatus: CompanyAuditStatusItem[];
  complianceOverview: CompanyComplianceOverviewItem[];
  violationsByType: CompanyViolationTypeItem[];
  auditTimeline: CompanyAuditTimelineItem[];
}

export const staticCompanyAnalytics: CompanyDemoAnalytics = {
  auditStatus: [
    { label: 'Upcoming', value: 4, color: 'bg-indigo-600', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { label: 'Active', value: 2, color: 'bg-amber-600', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
    { label: 'Under Review', value: 1, color: 'bg-blue-600', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
    { label: 'Returned', value: 1, color: 'bg-rose-600', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' },
    { label: 'Finalized', value: 9, color: 'bg-emerald-600', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  ],

  complianceOverview: [
    { label: 'Compliant', value: 72, color: '#16A34A' },
    { label: 'Violations', value: 20, color: '#DC2626' },
    { label: 'Under Review', value: 8, color: '#D97706' }
  ],

  violationsByType: [
    { label: 'MRP Declaration Issue', value: 8, color: 'bg-rose-500' },
    { label: 'Consumer Care Declaration', value: 6, color: 'bg-amber-500' },
    { label: 'Font / Display Requirement', value: 4, color: 'bg-indigo-500' },
    { label: 'Net Quantity Issue', value: 3, color: 'bg-blue-500' },
    { label: 'Other', value: 2, color: 'bg-slate-400' }
  ],

  auditTimeline: [
    {
      inspectionNumber: 'Inspection 1',
      date: '12 Jan 2026',
      status: 'Compliant',
      productName: 'Example Product A (Wheat Flour 1kg)',
      auditRef: 'AUD-2026-001',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      inspectionNumber: 'Inspection 2',
      date: '28 Mar 2026',
      status: 'Violations',
      productName: 'Example Product A (Wheat Flour 1kg)',
      auditRef: 'AUD-2026-042',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
    },
    {
      inspectionNumber: 'Inspection 3',
      date: '17 Jun 2026',
      status: 'Reinspection',
      productName: 'Example Product A (Wheat Flour 1kg)',
      auditRef: 'AUD-2026-089',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    {
      inspectionNumber: 'Inspection 4',
      date: '03 Sep 2026',
      status: 'Finalized',
      productName: 'Example Product A (Wheat Flour 1kg)',
      auditRef: 'AUD-2026-114',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    }
  ]
};
