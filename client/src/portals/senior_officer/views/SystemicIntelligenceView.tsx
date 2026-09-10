import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertTriangle,
  RotateCw,
  CheckCircle,
  Tag,
  Calendar,
  Search,
  AlertCircle
} from 'lucide-react';
import { api } from '../../../services/api';
import { ScheduleAuditModal } from '../components/ScheduleAuditModal';

interface SystemicIntelligenceViewProps {
  onAuditScheduled?: (newCase: any) => void;
}

export const SystemicIntelligenceView: React.FC<SystemicIntelligenceViewProps> = ({
  onAuditScheduled
}) => {
  const [patterns, setPatterns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NEW' | 'UNDER_REVIEW' | 'CONFIRMED_PATTERN' | 'DISMISSED'>('ALL');
  const [selectedPattern, setSelectedPattern] = useState<any | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const loadPatterns = async () => {
    setIsLoading(true);
    try {
      const res = await api.getSystemicPatterns(statusFilter);
      setPatterns(res.patterns || []);
    } catch (err) {
      console.error('Error loading systemic patterns:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatterns();
  }, [statusFilter]);

  const handleUpdateStatus = async (patternId: number, newStatus: string) => {
    setIsUpdating(true);
    try {
      await api.updateSystemicPatternAction(patternId, {
        status: newStatus,
        notes: actionNotes
      });
      setSelectedPattern(null);
      setActionNotes('');
      loadPatterns();
    } catch (err: any) {
      alert(`Error updating pattern: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const newCount = patterns.filter((p) => p.status === 'NEW').length;
  const confirmedCount = patterns.filter((p) => p.status === 'CONFIRMED_PATTERN').length;
  const underReviewCount = patterns.filter((p) => p.status === 'UNDER_REVIEW').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-slate-800 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Innovation #5 — Automated Pattern Discovery</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Brand-Wide & Product-Line Systemic Violation Intelligence
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Correlates multi-product inspection findings to identify recurring packaging non-compliance trends across manufacturer portfolios, brand product lines, and specific Legal Metrology rules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            Schedule Plant Audit
          </button>
          <button
            onClick={loadPatterns}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
            title="Refresh analysis"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Newly Flagged Patterns
            </div>
            <div className="text-2xl font-black text-rose-600 mt-1">{newCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Awaiting Senior Officer review</div>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Under Supervisory Review
            </div>
            <div className="text-2xl font-black text-indigo-600 mt-1">{underReviewCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Cross-brand inquiry active</div>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Search className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Confirmed Systemic Defects
            </div>
            <div className="text-2xl font-black text-amber-600 mt-1">{confirmedCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Targeted audits scheduled</div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 overflow-x-auto">
        {(['ALL', 'NEW', 'UNDER_REVIEW', 'CONFIRMED_PATTERN', 'DISMISSED'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === st
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {st === 'ALL'
              ? 'All Patterns'
              : st === 'CONFIRMED_PATTERN'
              ? 'Confirmed Patterns'
              : st === 'UNDER_REVIEW'
              ? 'Under Review'
              : st}
          </button>
        ))}
      </div>

      {/* Patterns Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
          <RotateCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
          Scanning across product lines for systemic non-compliance patterns...
        </div>
      ) : patterns.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800">No systemic non-compliance patterns detected</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Inspection findings across registered companies currently do not exhibit brand-wide repeating defects.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {patterns.map((pat) => (
            <div
              key={pat.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between"
            >
              <div>
                {/* Top badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {pat.pattern_code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        pat.status === 'NEW'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : pat.status === 'CONFIRMED_PATTERN'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : pat.status === 'UNDER_REVIEW'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {pat.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-800 px-2.5 py-0.5 rounded-full text-xs font-bold border border-indigo-200">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{Math.round(pat.confidence_score * 100)}% Confidence</span>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="text-base font-bold text-slate-900 tracking-tight mb-1">
                  {pat.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {pat.description}
                </p>

                {/* Statutory Rule Citation */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 mb-4 text-xs flex items-center gap-2 text-slate-700">
                  <Tag className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-indigo-950">Statutory Violation:</span>{' '}
                    <span className="font-semibold">{pat.rule_citation}</span>
                  </div>
                </div>

                {/* Impacted SKUs / Product Lines */}
                <div className="mb-4">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Impacted SKUs / Product Lines ({pat.affected_products_count})</span>
                    <span className="text-slate-400 font-normal">{pat.occurrence_count} Total Violations</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(pat.affected_products || []).map((pName: string, i: number) => (
                      <span
                        key={i}
                        className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 font-medium"
                      >
                        {pName}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Senior Officer Notes if any */}
                {pat.senior_officer_notes && (
                  <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 mb-4">
                    <span className="font-bold">Supervisory Note:</span> {pat.senior_officer_notes}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedPattern(pat)}
                  className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  Review & Triage
                </button>

                <div className="flex items-center gap-2">
                  {pat.status !== 'CONFIRMED_PATTERN' && (
                    <button
                      onClick={() => handleUpdateStatus(pat.id, 'CONFIRMED_PATTERN')}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                    >
                      Confirm Pattern
                    </button>
                  )}
                  {pat.status !== 'DISMISSED' && (
                    <button
                      onClick={() => handleUpdateStatus(pat.id, 'DISMISSED')}
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Triage & Supervisory Action Modal */}
      {selectedPattern && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Supervisory Triage — {selectedPattern.pattern_code}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Evaluate systemic non-compliance pattern across {selectedPattern.manufacturer_name || 'Manufacturer'}.
            </p>

            <div className="space-y-4 mb-5">
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                <div className="font-bold text-slate-800">{selectedPattern.title}</div>
                <div className="text-slate-600">{selectedPattern.description}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Senior Supervisory Assessment & Action Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Verified recurring absence of Unit Sale Price declarations across confectionery SKUs. Recommend scheduled audit at Sanand plant."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedPattern(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus(selectedPattern.id, 'UNDER_REVIEW')}
                  className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg cursor-pointer"
                >
                  Mark Under Review
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus(selectedPattern.id, 'CONFIRMED_PATTERN')}
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm cursor-pointer"
                >
                  Confirm Systemic Defect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Plant Audit Modal */}
      <ScheduleAuditModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSuccess={(newCase) => {
          loadPatterns();
          if (onAuditScheduled) {
            onAuditScheduled(newCase);
          }
        }}
      />
    </div>
  );
};
