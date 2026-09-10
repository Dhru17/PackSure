import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  Download, 
  RefreshCw, 
  RotateCw,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { api } from '../../../services/api';

interface DocumentItem {
  id: number;
  document_type: string;
  document_name?: string;
  file_name?: string;
  file_url?: string;
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | string;
  uploaded_at?: string;
  verified_at?: string;
  rejection_reason?: string;
  notes?: string;
  valid_until?: string;
}

interface CompanyDocumentsViewProps {
  onOpenUploadModal: (replaceDoc?: DocumentItem) => void;
}

export const CompanyDocumentsView: React.FC<CompanyDocumentsViewProps> = ({ onOpenUploadModal }) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getCompanyDocuments();
      if (res && res.documents) {
        setDocuments(res.documents || []);
      }
    } catch (err: any) {
      console.error('Failed to load documents:', err);
      setError(err?.response?.data?.message || 'Failed to load statutory documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const filteredDocuments = documents.filter((doc) => {
    if (filterStatus === 'ALL') return true;
    return doc.status === filterStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified by Authority
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
            <XCircle className="w-3.5 h-3.5" />
            Rejected / Action Required
          </span>
        );
      case 'PENDING_VERIFICATION':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
            <Clock className="w-3.5 h-3.5" />
            Pending Officer Verification
          </span>
        );
    }
  };

  const handleDownload = (docId: number) => {
    const url = api.getCompanyDocumentDownloadUrl(docId);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#D8DDE3] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1E293B] flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#174A7E]" />
            Statutory Compliance Documents & Licences
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            Official mandatory certificates, manufacturer registrations, and compliance declarations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDocuments}
            disabled={loading}
            className="p-2 text-[#64748B] hover:text-[#174A7E] hover:bg-[#F1F5F9] rounded-xl border border-[#E2E8F0] transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            title="Refresh documents"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => onOpenUploadModal()}
            className="px-4 py-2.5 bg-[#174A7E] hover:bg-[#133E68] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Statutory Document</span>
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="p-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#1E40AF] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[#1E3A8A] space-y-1">
          <p className="font-bold">Government Verification Notice</p>
          <p className="text-[11px] leading-relaxed text-[#2563EB]">
            Under the Legal Metrology Act, newly uploaded or replaced documents enter a <strong>Pending Verification</strong> status. Senior Inspection Officers verify the authenticity of all submitted certificates before clearing them.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 overflow-x-auto">
        {[
          { id: 'ALL', label: 'All Documents', count: documents.length },
          { id: 'VERIFIED', label: 'Verified', count: documents.filter(d => d.status === 'VERIFIED').length },
          { id: 'PENDING_VERIFICATION', label: 'Pending Verification', count: documents.filter(d => d.status === 'PENDING_VERIFICATION').length },
          { id: 'REJECTED', label: 'Rejected', count: documents.filter(d => d.status === 'REJECTED').length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              filterStatus === tab.id
                ? 'bg-[#174A7E] text-white'
                : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              filterStatus === tab.id ? 'bg-white/20 text-white' : 'bg-[#E2E8F0] text-[#475569]'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content Section */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-[#64748B] bg-white border border-[#D8DDE3] rounded-2xl">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#174A7E] mb-3" />
          Loading statutory records...
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#D8DDE3] rounded-2xl space-y-3">
          <FileText className="w-12 h-12 text-[#94A3B8] mx-auto opacity-50" />
          <h3 className="text-sm font-bold text-[#1E293B]">No Documents in this Category</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            {filterStatus !== 'ALL'
              ? `There are no documents currently marked as ${filterStatus.toLowerCase().replace('_', ' ')}.`
              : 'No compliance documents uploaded yet. Upload required licences and declarations above.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className={`bg-white border rounded-2xl p-5 shadow-xs transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                doc.status === 'REJECTED'
                  ? 'border-red-300 bg-red-50/20'
                  : 'border-[#D8DDE3] hover:border-[#CBD5E1]'
              }`}
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-sm text-[#1E293B]">
                    {doc.document_type}
                  </span>
                  {getStatusBadge(doc.status)}
                </div>

                {doc.document_name && (
                  <p className="text-xs text-[#475569] font-medium">
                    {doc.document_name}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#64748B]">
                  {doc.uploaded_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Uploaded: {new Date(doc.uploaded_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                  {doc.valid_until && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Valid Until: {new Date(doc.valid_until).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                  {doc.file_name && (
                    <span className="font-mono text-[#64748B]">
                      File: {doc.file_name}
                    </span>
                  )}
                </div>

                {/* Rejection Notice Banner */}
                {doc.status === 'REJECTED' && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-red-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      Rejection Reason (Officer Feedback):
                    </div>
                    <p className="text-red-700 text-[11px] leading-relaxed">
                      {doc.rejection_reason || 'Document does not satisfy mandatory statutory requirements or is illegible. Please review guidelines and resubmit.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2.5 flex-shrink-0 self-end md:self-center">
                {doc.status === 'REJECTED' ? (
                  <button
                    onClick={() => onOpenUploadModal(doc)}
                    className="px-3.5 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Replace & Resubmit</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onOpenUploadModal(doc)}
                    className="px-3 py-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                    title="Replace document with updated version"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Replace</span>
                  </button>
                )}

                <button
                  onClick={() => handleDownload(doc.id)}
                  className="px-3 py-2 bg-[#174A7E] hover:bg-[#133E68] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Download document"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
