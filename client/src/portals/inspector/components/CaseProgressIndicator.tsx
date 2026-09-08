import React from 'react';
import { Check, AlertTriangle, Circle } from 'lucide-react';
import type { InspectionCase } from '../../../types';

interface CaseProgressIndicatorProps {
  inspectionCase: InspectionCase;
  variant?: 'stepper' | 'badge' | 'compact';
}

export const getCaseProgress = (c: InspectionCase) => {
  // Step 1: Product (always true if case exists)
  const isProductDone = true;
  
  // Step 2: Evidence
  const isEvidenceDone = Boolean(c.evidences && c.evidences.length > 0);
  
  // Step 3: AI Analysis
  const isAnalysisDone = Boolean(
    c.declarations && c.declarations.length > 0
  ) || c.status === 'ANALYSIS_COMPLETE' || c.status === 'INSPECTOR_REVIEW' || c.status === 'SUBMITTED' || c.status === 'SENIOR_REVIEW' || c.status === 'RETURNED' || c.status === 'FINALIZED';
  
  // Step 4: Compliance Verification
  const isComplianceDone = c.status === 'SUBMITTED' || c.status === 'SENIOR_REVIEW' || c.status === 'FINALIZED';
  const isComplianceNeedsVerification = c.status === 'INSPECTOR_REVIEW' || c.status === 'RETURNED' || c.status === 'ANALYSIS_COMPLETE';
  
  // Step 5: Review & Submit
  const isReviewDone = c.status === 'SUBMITTED' || c.status === 'SENIOR_REVIEW' || c.status === 'FINALIZED';

  let completedSteps = 1;
  if (isEvidenceDone) completedSteps++;
  if (isAnalysisDone) completedSteps++;
  if (isComplianceDone) completedSteps++;
  if (isReviewDone) completedSteps++;

  return {
    isProductDone,
    isEvidenceDone,
    isAnalysisDone,
    isComplianceDone,
    isComplianceNeedsVerification,
    isReviewDone,
    completedSteps,
    totalSteps: 5,
    progressText: `${completedSteps}/5`
  };
};

export const CaseProgressIndicator: React.FC<CaseProgressIndicatorProps> = ({
  inspectionCase,
  variant = 'stepper'
}) => {
  const {
    isProductDone,
    isEvidenceDone,
    isAnalysisDone,
    isComplianceDone,
    isComplianceNeedsVerification,
    isReviewDone,
    completedSteps
  } = getCaseProgress(inspectionCase);

  if (variant === 'compact') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F1F5F9] border border-[#CBD5E1] text-[11px] font-bold text-[#334155]">
        <span>{completedSteps}/5</span>
        <span className="text-[10px] text-[#64748B] font-normal">complete</span>
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <span className="text-xs font-bold text-[#1E293B]">
        {completedSteps}/5
      </span>
    );
  }

  const steps = [
    {
      id: 1,
      label: 'Product',
      status: isProductDone ? 'completed' : 'pending',
      statusText: 'Completed'
    },
    {
      id: 2,
      label: 'Evidence',
      status: isEvidenceDone ? 'completed' : 'pending',
      statusText: isEvidenceDone ? 'Completed' : 'Pending'
    },
    {
      id: 3,
      label: 'AI Analysis',
      status: isAnalysisDone ? 'completed' : 'pending',
      statusText: isAnalysisDone ? 'Completed' : 'Pending'
    },
    {
      id: 4,
      label: 'Compliance',
      status: isComplianceDone ? 'completed' : isComplianceNeedsVerification ? 'warning' : 'pending',
      statusText: isComplianceDone ? 'Completed' : isComplianceNeedsVerification ? 'Needs Verification' : 'Not Started'
    },
    {
      id: 5,
      label: 'Review',
      status: isReviewDone ? 'completed' : 'pending',
      statusText: isReviewDone ? 'Completed' : 'Not Started'
    }
  ];

  return (
    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          return (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-2.5 min-w-fit">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                    step.status === 'completed'
                      ? 'bg-[#15803D] text-white'
                      : step.status === 'warning'
                      ? 'bg-[#F59E0B] text-white'
                      : 'bg-[#E2E8F0] text-[#64748B]'
                  }`}
                >
                  {step.status === 'completed' ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : step.status === 'warning' ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  ) : (
                    <Circle className="w-3 h-3 text-[#94A3B8]" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1E293B] leading-tight">
                    {step.label}
                  </div>
                  <div
                    className={`text-[11px] font-medium leading-tight mt-0.5 ${
                      step.status === 'completed'
                        ? 'text-[#15803D]'
                        : step.status === 'warning'
                        ? 'text-[#B45309] font-bold'
                        : 'text-[#94A3B8]'
                    }`}
                  >
                    {step.statusText}
                  </div>
                </div>
              </div>

              {!isLast && (
                <div className="flex-1 h-0.5 min-w-[24px] bg-[#E2E8F0] mx-2" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
