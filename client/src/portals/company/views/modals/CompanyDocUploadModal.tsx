import React, { useState } from 'react';
import { api } from '../../../../services/api';
import { X, Upload, FileText, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

interface CompanyDocUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories?: any[];
  plants?: any[];
  replaceDoc?: any | null; // If replacing an existing document
}

export const CompanyDocUploadModal: React.FC<CompanyDocUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  categories = [],
  plants = [],
  replaceDoc
}) => {
  const [title, setTitle] = useState(replaceDoc?.title || '');
  const [docType, setDocType] = useState(replaceDoc?.document_type || 'MODEL_APPROVAL_CERTIFICATE');
  const [docNumber, setDocNumber] = useState(replaceDoc?.document_number || '');
  const [categoryId, setCategoryId] = useState<string>(replaceDoc?.category_id ? String(replaceDoc.category_id) : '');
  const [plantId, setPlantId] = useState<string>(replaceDoc?.plant_id ? String(replaceDoc.plant_id) : '');
  const [notes, setNotes] = useState(replaceDoc?.notes || '');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a document title.');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('document_type', docType);
      formData.append('document_number', docNumber.trim());
      if (categoryId) formData.append('category_id', categoryId);
      if (plantId) formData.append('plant_id', plantId);
      if (notes) formData.append('notes', notes.trim());
      if (file) formData.append('file', file);

      if (replaceDoc) {
        await api.replaceCompanyDocument(replaceDoc.id, formData);
      } else {
        await api.uploadCompanyDocument(formData);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to upload document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-[#D8DDE3] shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#EBF3FA] text-[#174A7E] rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E293B]">
                {replaceDoc ? 'Replace / Resubmit Statutory Document' : 'Upload Statutory Document'}
              </h3>
              <p className="text-[11px] text-[#64748B]">
                Submitted documents are reviewed by Legal Metrology inspection officers.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#1E293B] hover:bg-[#E2E8F0] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs flex-1">
          {error && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-[#991B1B] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {replaceDoc?.rejection_reason && (
            <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-[#92400E] space-y-1">
              <div className="font-bold text-[11px] uppercase tracking-wider">Inspector Rejection Directive:</div>
              <p className="italic text-[11px]">&ldquo;{replaceDoc.rejection_reason}&rdquo;</p>
            </div>
          )}

          <div>
            <label className="block font-bold text-[#1E293B] uppercase tracking-wider text-[10px] mb-1">
              Document Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Model Approval Certificate (Sec 22) - Biscuit Packaging"
              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#1E293B] uppercase tracking-wider text-[10px] mb-1">
                Document Type *
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-[#1E293B]"
              >
                <option value="MODEL_APPROVAL_CERTIFICATE">Model Approval Certificate (Sec 22)</option>
                <option value="MANUFACTURING_LICENSE">FSSAI / State Manufacturing License</option>
                <option value="WEIGHTS_MEASURES_REGISTRATION">Packer Registration (Rule 27)</option>
                <option value="IMPORT_PERMIT">Directorate General Import Permit</option>
                <option value="STATUTORY_CERTIFICATE">General Statutory Certificate</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#1E293B] uppercase tracking-wider text-[10px] mb-1">
                Certificate / Registration Number
              </label>
              <input
                type="text"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="e.g. LM/MA/2024/8812"
                className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-[#1E293B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#1E293B] uppercase tracking-wider text-[10px] mb-1">
                Commodity Category (Optional)
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-[#1E293B]"
              >
                <option value="">-- All Categories / General --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#1E293B] uppercase tracking-wider text-[10px] mb-1">
                Plant / Facility (Optional)
              </label>
              <select
                value={plantId}
                onChange={(e) => setPlantId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-[#1E293B]"
              >
                <option value="">-- All Plants / Corporate --</option>
                {plants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#1E293B] uppercase tracking-wider text-[10px] mb-1">
              Select Document File (PDF / Image)
            </label>
            <div className="border-2 border-dashed border-[#CBD5E1] rounded-xl p-4 text-center bg-[#F8FAFC]">
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="modal-doc-file"
              />
              <label htmlFor="modal-doc-file" className="cursor-pointer flex flex-col items-center gap-1.5">
                <Upload className="w-5 h-5 text-[#174A7E]" />
                <span className="font-bold text-[#174A7E]">
                  {file ? file.name : 'Click to select certificate file'}
                </span>
                <span className="text-[10px] text-[#64748B]">PDF, PNG, JPG up to 10MB</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#1E293B] uppercase tracking-wider text-[10px] mb-1">
              Compliance Notes / Context
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details regarding issuing authority, renewal dates, etc."
              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
            />
          </div>

          <div className="p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl text-[11px] text-[#15803D] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Upload status will automatically be queued as <strong>PENDING_VERIFICATION</strong>.</span>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#475569] font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#174A7E] hover:bg-[#133E68] text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>{replaceDoc ? 'Resubmit Document' : 'Upload Document'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
