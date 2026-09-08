import React, { useState } from 'react';
import type { InspectionCase, Product } from '../../../../types';
import { api } from '../../../../services/api';
import { Step1Product } from './Step1Product';
import { Step2Evidence } from './Step2Evidence';
import { Step3AiAnalysis } from './Step3AiAnalysis';
import { Step4Compliance } from './Step4Compliance';
import { Step5Review } from './Step5Review';
import { ReturnedInspectionView } from './ReturnedInspectionView';
import { CheckCircle2, Circle, ArrowLeft } from 'lucide-react';

interface InspectionWizardProps {
  products: Product[];
  activeCase: InspectionCase | null;
  setActiveCase: (c: InspectionCase | null) => void;
  wizardStep: number;
  setWizardStep: (step: number) => void;
  isReturnedView: boolean;
  setIsReturnedView: (val: boolean) => void;
  onExit: () => void;
  onRefreshData: () => void;
}

export const InspectionWizard: React.FC<InspectionWizardProps> = ({
  products,
  activeCase,
  setActiveCase,
  wizardStep,
  setWizardStep,
  isReturnedView,
  setIsReturnedView,
  onExit,
  onRefreshData
}) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [productForm] = useState({
    brand_name: 'Britannia',
    commodity_name: 'Good Day Butter Cookies',
    category_name: 'Biscuits & Bakery',
    package_type: 'BOX',
    default_net_quantity: '200 g',
    default_mrp: 40.0,
    is_imported: false,
    country_of_origin: 'India',
    pdp_width_cm: 15.0,
    pdp_height_cm: 10.0,
    pdp_area_cm2: 150.0,
    manufacturer_name: 'Britannia Industries Ltd.'
  });

  const [corrections, setCorrections] = useState<Record<string, string>>({});
  const [inspectorRemarks, setInspectorRemarks] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Step 1: Create Case & Advance
  const handleStep1Continue = async (formData: any, barcode: string) => {
    try {
      const prodRes = await api.createProduct({
        barcode: barcode || `GEN-${Date.now()}`,
        ...formData,
        pdp_area_cm2: formData.pdp_width_cm * formData.pdp_height_cm
      });

      const caseRes = await api.createInspection({
        product_id: prodRes.product.id,
        location_name: 'Surveillance Inspection Desk',
        source_type: 'FIELD_SAMPLE'
      });

      const fullCase = await api.getInspection(caseRes.inspection.id);
      setActiveCase(fullCase);
      setWizardStep(2);
      onRefreshData();
    } catch (err: any) {
      alert(`Failed to initialize inspection: ${err.message}`);
    }
  };

  // Step 2: Run Analysis & Advance to Step 3
  const handleStep2Continue = async () => {
    if (!activeCase) return;
    setIsAnalyzing(true);
    try {
      await api.runAnalysis(activeCase.id);
      const updatedCase = await api.getInspection(activeCase.id);
      setActiveCase(updatedCase);
      setWizardStep(3);
      onRefreshData();
    } catch (err: any) {
      alert(`AI Extraction failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Step 5: Submit for Senior Review
  const handleStep5Submit = async () => {
    if (!activeCase) return;
    setIsSubmitting(true);
    try {
      await api.submitInspectorReview(activeCase.id, {
        remarks: inspectorRemarks,
        corrections: corrections
      });
      setSubmissionSuccess(true);
      onRefreshData();
    } catch (err: any) {
      alert(`Failed to submit inspection: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: '01 Product' },
    { num: 2, label: '02 Evidence' },
    { num: 3, label: '03 AI Analysis' },
    { num: 4, label: '04 Compliance' },
    { num: 5, label: '05 Review' },
  ];

  // If in dedicated Returned case view
  if (isReturnedView && activeCase && activeCase.status === 'RETURNED') {
    return (
      <ReturnedInspectionView
        inspectionCase={activeCase}
        onResume={(targetStep) => {
          setIsReturnedView(false);
          setWizardStep(targetStep);
        }}
        onExit={onExit}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Breadcrumb & Exit Control */}
      <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-xl border border-[#D8DDE3] shadow-xs">
        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-2 text-xs font-bold text-[#174A7E] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit to Inspections</span>
        </button>
        <div className="text-xs font-bold text-[#1E293B]">
          {activeCase ? `Inspection #${activeCase.case_number || activeCase.id}` : 'New Inspection'}
        </div>
      </div>

      {/* 5-Step Continuous Guided Stepper */}
      <div className="bg-white border border-[#D8DDE3] rounded-xl p-4 shadow-xs">
        <div className="grid grid-cols-5 gap-2 text-center text-xs font-medium">
          {steps.map((s) => {
            const isCompleted = wizardStep > s.num;
            const isCurrent = wizardStep === s.num;

            return (
              <div
                key={s.num}
                className={`p-2.5 rounded-lg transition flex items-center justify-center gap-2 ${
                  isCurrent
                    ? 'bg-[#EBF3FA] text-[#174A7E] border border-[#174A7E] font-bold shadow-2xs'
                    : isCompleted
                    ? 'bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]'
                    : 'bg-[#F8FAFC] text-[#94A3B8] border border-[#E2E8F0]'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                ) : isCurrent ? (
                  <span className="w-4 h-4 rounded-full bg-[#174A7E] text-white flex items-center justify-center text-[10px] font-bold">
                    {s.num}
                  </span>
                ) : (
                  <Circle className="w-3.5 h-3.5 text-[#CBD5E1]" />
                )}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1: PRODUCT IDENTIFICATION */}
      {wizardStep === 1 && (
        <Step1Product
          products={products}
          initialProductForm={productForm}
          barcodeInput={barcodeInput}
          setBarcodeInput={setBarcodeInput}
          onContinue={handleStep1Continue}
          onCancel={onExit}
        />
      )}

      {/* STEP 2: EVIDENCE CAPTURE */}
      {wizardStep === 2 && activeCase && (
        <Step2Evidence
          inspectionCase={activeCase}
          onEvidenceUpdated={(updated) => setActiveCase(updated)}
          onBack={() => setWizardStep(1)}
          onContinue={handleStep2Continue}
          isAnalyzing={isAnalyzing}
        />
      )}

      {/* STEP 3: AI ANALYSIS */}
      {wizardStep === 3 && activeCase && (
        <Step3AiAnalysis
          inspectionCase={activeCase}
          onBack={() => setWizardStep(2)}
          onContinue={() => setWizardStep(4)}
        />
      )}

      {/* STEP 4: COMPLIANCE VERIFICATION */}
      {wizardStep === 4 && activeCase && (
        <Step4Compliance
          inspectionCase={activeCase}
          corrections={corrections}
          setCorrections={setCorrections}
          onBack={() => setWizardStep(3)}
          onContinue={() => setWizardStep(5)}
        />
      )}

      {/* STEP 5: REVIEW & SUBMIT */}
      {wizardStep === 5 && activeCase && (
        <Step5Review
          inspectionCase={activeCase}
          inspectorRemarks={inspectorRemarks}
          setInspectorRemarks={setInspectorRemarks}
          onSubmit={handleStep5Submit}
          isSubmitting={isSubmitting}
          submissionSuccess={submissionSuccess}
          onBack={() => setWizardStep(4)}
          onExitToDashboard={onExit}
        />
      )}
    </div>
  );
};
