export interface StatusDistributionItem {
  label: string;
  value: number;
  color: string;
  badgeClass: string;
}

export interface InspectionProgressStage {
  label: string;
  value: number; // percentage 0-100
  color: string;
  description: string;
}

export interface EvidenceSummaryMetrics {
  front: number;
  back: number;
  additional: number;
  measurements: number;
}

export interface InspectorDemoAnalytics {
  assignedAuditStatus: StatusDistributionItem[];
  inspectionProgress: InspectionProgressStage[];
  evidenceSummary: EvidenceSummaryMetrics;
}

export const staticInspectorAnalytics: InspectorDemoAnalytics = {
  assignedAuditStatus: [
    { label: 'Upcoming', value: 4, color: 'bg-indigo-600', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { label: 'In Progress', value: 2, color: 'bg-amber-600', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
    { label: 'Returned', value: 1, color: 'bg-rose-600', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' },
    { label: 'Submitted', value: 3, color: 'bg-blue-600', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
    { label: 'Finalized', value: 8, color: 'bg-emerald-600', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  ],

  inspectionProgress: [
    { label: 'Product', value: 100, color: 'bg-emerald-500', description: 'Mandatory declaration specifications verified' },
    { label: 'Evidence', value: 100, color: 'bg-emerald-500', description: 'Calibrated packaging panels captured' },
    { label: 'AI Analysis', value: 90, color: 'bg-indigo-600', description: 'OCR extraction & bounding boxes verified' },
    { label: 'Compliance', value: 70, color: 'bg-amber-500', description: 'Statutory rule evaluations in review' },
    { label: 'Review', value: 40, color: 'bg-slate-400', description: 'Digital signature & submission pending' }
  ],

  evidenceSummary: {
    front: 1,
    back: 1,
    additional: 2,
    measurements: 3
  }
};
