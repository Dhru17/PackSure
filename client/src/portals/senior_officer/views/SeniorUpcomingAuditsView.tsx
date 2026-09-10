import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Search,
  RotateCw,
  Plus,
  Building2,
  Clock,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { api } from '../../../services/api';
import { ScheduleAuditModal } from '../components/ScheduleAuditModal';

interface SeniorUpcomingAuditsViewProps {
  onOpenCase: (caseId: number) => void;
}

export const SeniorUpcomingAuditsView: React.FC<SeniorUpcomingAuditsViewProps> = ({
  onOpenCase
}) => {
  const [audits, setAudits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UPCOMING' | 'ACTIVE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Reschedule / Reassign state
  const [selectedAuditForEdit, setSelectedAuditForEdit] = useState<any | null>(null);
  const [eligibleInspectors, setEligibleInspectors] = useState<any[]>([]);
  const [editInspectorId, setEditInspectorId] = useState<number | ''>('');
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const loadAudits = async () => {
    setIsLoading(true);
    try {
      const res = await api.getScheduledAudits({
        status: statusFilter,
        search: searchQuery
      });
      setAudits(res.audits || []);
    } catch (err) {
      console.error('Error loading scheduled audits:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAudits();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadAudits();
  };

  const handleOpenReassignModal = async (audit: any) => {
    setSelectedAuditForEdit(audit);
    setEditInspectorId(audit.inspector_id);
    setEditDate(audit.scheduled_date ? audit.scheduled_date.split('T')[0] : '');
    setEditNotes(audit.senior_remarks || '');

    try {
      const res = await api.getEligibleInspectorsForAudit({
        plant_id: audit.plant_id,
        category_id: audit.product?.category_id
      });
      setEligibleInspectors(res.inspectors || []);
    } catch (err) {
      console.error('Error fetching eligible inspectors for reassign:', err);
    }
  };

  const handleSaveAuditUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAuditForEdit) return;

    setIsUpdating(true);
    try {
      await api.updateScheduledAudit(selectedAuditForEdit.id, {
        inspector_id: editInspectorId ? Number(editInspectorId) : undefined,
        scheduled_date: editDate || undefined,
        instructions: editNotes
      });
      setSelectedAuditForEdit(null);
      loadAudits();
    } catch (err: any) {
      alert(`Failed to update scheduled audit: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const upcomingCount = audits.filter(
    (a) => a.status === 'DRAFT' || a.status === 'EVIDENCE_PENDING'
  ).length;
  const activeCount = audits.filter(
    (a) =>
      a.status === 'ANALYZING' ||
      a.status === 'ANALYSIS_COMPLETE' ||
      a.status === 'INSPECTOR_REVIEW'
  ).length;

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            <span>Supervisory Scheduling & Operations</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Upcoming & Active Field Audits
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor scheduled factory inspections, live in-field evaluations, and reassign officers as needed.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm shadow-indigo-200 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Schedule New Audit
          </button>
          <button
            onClick={loadAudits}
            className="p-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Audits ({audits.length})
          </button>
          <button
            onClick={() => setStatusFilter('UPCOMING')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'UPCOMING'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            Upcoming Scheduled ({upcomingCount})
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'ACTIVE'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            In-Field Active ({activeCount})
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search brand, plant, case #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </form>
      </div>

      {/* Audits Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <RotateCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
            Loading scheduled audits...
          </div>
        ) : audits.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-800">No scheduled audits found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Schedule an inspection audit for a factory plant to deploy an authorized field inspector.
            </p>
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Schedule First Audit
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Case & Product</th>
                  <th className="px-4 py-3.5">Plant / Location</th>
                  <th className="px-4 py-3.5">Assigned Inspector</th>
                  <th className="px-4 py-3.5">Target Date</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Rule Version</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {audits.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          {a.product?.brand_name || 'Inspection Sample'}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          {a.case_number}
                        </div>
                        <div className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {a.product?.commodity_name || 'Packaged Commodity'}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-start gap-2">
                        <Building2 className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-800 text-xs">
                            {a.plant_name || a.location_name || 'Standard Plant'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {a.plant_city || 'Assigned Zone'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          {a.inspector_name ? a.inspector_name[0] : 'I'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-xs">
                            {a.inspector_name || 'Assigned Inspector'}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {a.inspector_badge || 'INSP-FIELD'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {a.scheduled_date
                          ? new Date(a.scheduled_date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })
                          : 'Pending Date'}
                      </div>
                      {a.review_cycle && a.review_cycle > 1 && (
                        <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                          Cycle {a.review_cycle} Re-audit
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          a.status === 'DRAFT' || a.status === 'EVIDENCE_PENDING'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : a.status === 'ANALYZING' || a.status === 'ANALYSIS_COMPLETE'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                            : a.status === 'INSPECTOR_REVIEW'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : a.status === 'RETURNED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        <ShieldCheck className="w-3 h-3 text-indigo-600" />
                        {a.rule_version || 'v2026.1_GSR128E'}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenReassignModal(a)}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                        >
                          Reassign
                        </button>
                        <button
                          onClick={() => onOpenCase(a.id)}
                          className="px-3 py-1 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          View Case
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Audit Modal */}
      <ScheduleAuditModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSuccess={() => {
          loadAudits();
        }}
      />

      {/* Reassign / Reschedule Modal */}
      {selectedAuditForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Reassign or Reschedule Audit #{selectedAuditForEdit.case_number}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Select an authorized replacement inspector or update the field audit date.
            </p>

            <form onSubmit={handleSaveAuditUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Assigned Inspector
                </label>
                <select
                  value={editInspectorId}
                  onChange={(e) => setEditInspectorId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                  required
                >
                  {eligibleInspectors.map((insp) => (
                    <option key={insp.inspector_id} value={insp.inspector_id}>
                      {insp.full_name} ({insp.workload_status} - {insp.active_cases_count} active)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Scheduled Audit Date
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Supervisory Directives / Notes
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedAuditForEdit(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
