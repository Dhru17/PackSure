import React from 'react';
import type { InspectionCase } from '../../../types';
import { StatusBadge } from '../../../components/ui';
import { CaseProgressIndicator } from '../components/CaseProgressIndicator';
import { 
  ArrowLeft, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Package, 
  PlayCircle,
  FileCheck2
} from 'lucide-react';

interface InspectionDetailViewProps {
  inspectionCase: InspectionCase;
  onBack: () => void;
  onResumeCase: (caseId: number) => void;
}

export const InspectionDetailView: React.FC<InspectionDetailViewProps> = ({
  inspectionCase: c,
  onBack,
  onResumeCase
}) => {
  const isReturned = c.status === 'RETURNED';
  const isFinalized = c.status === 'FINALIZED';

  const caseNumber = c.case_number || `PS-${c.id}`;
  const productName = c.product?.commodity_name || 'Packaged Commodity';
  const brandName = c.product?.brand_name || '—';
  const categoryName = c.product?.category_name || 'General Packaged Commodity';
  const manufacturerName = c.product?.manufacturer_name || 'Registered Manufacturer';
  const barcode = c.product?.barcode || '—';
  const packageQuantity = c.product?.default_net_quantity || '—';

  // Compliance metrics counts
  const compliantCount = c.passed_checks || 
    (c.compliance_checks ? c.compliance_checks.filter(chk => chk.status === 'PASS').length : 0);

  const nonCompliantCount = c.failed_checks || 
    (c.compliance_checks ? c.compliance_checks.filter(chk => chk.status === 'FAIL').length : (c.violations ? c.violations.length : 0));

  const needsVerificationCount = c.review_required_checks || 
    (c.compliance_checks ? c.compliance_checks.filter(chk => chk.status === 'REVIEW_REQUIRED').length : 0);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#D8DDE3] shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9] rounded-lg transition-colors border border-[#CBD5E1]"
            title="Back to Inspections"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg sm:text-xl font-bold text-[#1E293B] tracking-tight">
                Inspection #{caseNumber}
              </h1>
              <StatusBadge status={c.status} />
            </div>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              {productName} &bull; Recorded on {formatDate(c.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {!isFinalized && (
            <button
              onClick={() => onResumeCase(c.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold shadow-xs transition-all ${
                isReturned
                  ? 'bg-[#DC2626] text-white hover:bg-[#B91C1C]'
                  : 'bg-[#174A7E] text-white hover:bg-[#133E68]'
              }`}
            >
              {isReturned ? <RotateCcw className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
              <span>{isReturned ? 'Resume Reinspection' : 'Resume Inspection'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Returned Callout Banner (If returned by Senior Officer) */}
      {isReturned && (
        <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-[#DC2626] font-bold text-sm">
            <RotateCcw className="w-5 h-5 flex-shrink-0" />
            <span>Returned for Reinspection</span>
          </div>
          <p className="text-xs text-[#991B1B] font-medium">
            This inspection was reviewed and returned by the Senior Officer with the following instructions:
          </p>
          <div className="bg-white/80 p-3.5 rounded-lg border border-[#FECACA] text-xs text-[#7F1D1D] font-medium italic">
            &ldquo;{c.senior_remarks || 'Please verify evidence capture and confirm statutory declarations.'}&rdquo;
          </div>
          <div className="pt-1 flex items-center justify-between">
            <span className="text-[11px] text-[#991B1B] font-semibold">
              Action Required: Verify findings or capture updated packaging evidence
            </span>
            <button
              onClick={() => onResumeCase(c.id)}
              className="px-3.5 py-1.5 bg-[#DC2626] text-white font-bold rounded-lg text-xs hover:bg-[#B91C1C] transition-colors shadow-2xs"
            >
              Resume Inspection
            </button>
          </div>
        </div>
      )}

      {/* 5-Step Workflow Stepper */}
      <CaseProgressIndicator inspectionCase={c} variant="stepper" />

      {/* Main 2-Column Info & Result Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Case Information */}
        <div className="bg-white rounded-xl border border-[#D8DDE3] shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-2">
              <Package className="w-4 h-4 text-[#174A7E]" />
              <span>Case Information</span>
            </h2>
          </div>
          <div className="p-5 space-y-3.5 text-xs">
            <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
              <span className="text-[#64748B] font-medium">Product Name</span>
              <span className="font-bold text-[#1E293B] text-right">{productName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
              <span className="text-[#64748B] font-medium">Brand</span>
              <span className="font-semibold text-[#1E293B] text-right">{brandName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
              <span className="text-[#64748B] font-medium">Category</span>
              <span className="font-semibold text-[#1E293B] text-right">{categoryName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
              <span className="text-[#64748B] font-medium">Manufacturer</span>
              <span className="font-semibold text-[#1E293B] text-right">{manufacturerName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
              <span className="text-[#64748B] font-medium">Barcode</span>
              <span className="font-mono text-[#1E293B] text-right font-bold">{barcode}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
              <span className="text-[#64748B] font-medium">Package Quantity</span>
              <span className="font-semibold text-[#1E293B] text-right">{packageQuantity}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
              <span className="text-[#64748B] font-medium">Inspection Date</span>
              <span className="font-semibold text-[#1E293B] text-right">{formatDate(c.created_at)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#64748B] font-medium">Assigned Officer</span>
              <span className="font-semibold text-[#1E293B] text-right">{c.inspector_name || 'Inspector Officer'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Inspection Result Summary */}
        <div className="bg-white rounded-xl border border-[#D8DDE3] shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#174A7E]" />
                <span>Inspection Result</span>
              </h2>
            </div>
            <div className="p-5 space-y-4">
              {/* Status Summary Pills */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#F0FDF4] border border-[#DCFCE7]">
                <div className="flex items-center gap-2.5 text-xs font-bold text-[#15803D]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Compliant</span>
                </div>
                <span className="text-base font-extrabold text-[#15803D]">
                  {compliantCount}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#FEF2F2] border border-[#FEE2E2]">
                <div className="flex items-center gap-2.5 text-xs font-bold text-[#DC2626]">
                  <XCircle className="w-4 h-4" />
                  <span>Non-Compliant</span>
                </div>
                <span className="text-base font-extrabold text-[#DC2626]">
                  {nonCompliantCount}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#FFFBEB] border border-[#FEF3C7]">
                <div className="flex items-center gap-2.5 text-xs font-bold text-[#D97706]">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Needs Verification</span>
                </div>
                <span className="text-base font-extrabold text-[#D97706]">
                  {needsVerificationCount}
                </span>
              </div>
            </div>
          </div>

          {/* Remarks Footer */}
          <div className="p-5 border-t border-[#E2E8F0] bg-[#F8FAFC] space-y-2">
            <div className="text-xs font-bold text-[#1E293B]">Inspector Remarks:</div>
            <p className="text-xs text-[#64748B] italic">
              {c.inspector_remarks || 'No remarks added.'}
            </p>
          </div>
        </div>
      </div>

      {/* Compliance Findings Breakdown Table */}
      {c.compliance_checks && c.compliance_checks.length > 0 && (
        <div className="bg-white rounded-xl border border-[#D8DDE3] shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E2E8F0]">
            <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wide">
              Compliance Findings Breakdown
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1E293B]">
              <thead className="bg-[#F8FAFC] text-[#64748B] font-bold uppercase tracking-wider border-b border-[#E2E8F0] text-[11px]">
                <tr>
                  <th className="px-6 py-3">Statutory Requirement</th>
                  <th className="px-6 py-3">Finding on Package</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Rule Citation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {c.compliance_checks.map((chk) => {
                  const isPass = chk.status === 'PASS';
                  const isFail = chk.status === 'FAIL';
                  const isReview = chk.status === 'REVIEW_REQUIRED';

                  return (
                    <tr key={chk.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-3.5 font-bold text-[#1E293B]">
                        {chk.rule_title || chk.rule_code || 'Statutory Requirement'}
                      </td>
                      <td className="px-6 py-3.5 text-[#475569] font-medium">
                        {chk.reason_explanation || chk.evaluated_value || 'Declaration verified on package.'}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                            isPass
                              ? 'bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7]'
                              : isFail
                              ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                              : 'bg-[#FFFBEB] text-[#D97706] border border-[#FEF3C7]'
                          }`}
                        >
                          {isPass && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {isFail && <XCircle className="w-3.5 h-3.5" />}
                          {isReview && <AlertTriangle className="w-3.5 h-3.5" />}
                          <span>{isPass ? 'Compliant' : isFail ? 'Non-Compliant' : 'Needs Verification'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-[#64748B] font-mono text-[11px]">
                        {chk.statutory_citation || chk.rule_code || 'LMPC 2011'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
