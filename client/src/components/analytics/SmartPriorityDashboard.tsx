import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Flame, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Search, 
  Clock, 
  ChevronRight,
  Database,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api';

interface BrandPriorityItem {
  rank: number;
  brand_name: string;
  violations_count: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  priority_badge: string;
  priority_rank: number;
  inspections_count: number;
  compliance_rate: number;
  top_violated_rule: string;
}

interface RuleTrendItem {
  rank: number;
  rule_code: string;
  rule_title: string;
  statutory_citation: string;
  times_violated: number;
  market_share_percent: number;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface MarketSummary {
  total_violations: number;
  total_inspections: number;
  high_priority_brands_count: number;
  top_violator_brand: string;
  top_violated_rule: string;
  market_compliance_rate: number;
  tracked_brands_count: number;
  tracked_rules_count: number;
}

interface SmartPriorityDashboardProps {
  onSelectBrand?: (brandName: string) => void;
  onSelectRule?: (ruleCode: string) => void;
}

export const SmartPriorityDashboard: React.FC<SmartPriorityDashboardProps> = ({
  onSelectBrand,
  onSelectRule
}) => {
  const [data, setData] = useState<{
    market_summary: MarketSummary;
    brand_priority: BrandPriorityItem[];
    rule_trend: RuleTrendItem[];
    timeframe: string;
    generated_at: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [timeframe, setTimeframe] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(30); // in seconds, 0 = off
  const [lastUpdatedText, setLastUpdatedText] = useState<string>('Just now');

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await api.getSmartPriorityAnalytics({ timeframe, refresh: isManual });
      setData(res);
      setLastUpdatedText(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to load Smart Priority analytics:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh interval (polling)
  useEffect(() => {
    if (!autoRefreshInterval || autoRefreshInterval <= 0) return;
    const timer = setInterval(() => {
      fetchData(false);
    }, autoRefreshInterval * 1000);
    return () => clearInterval(timer);
  }, [autoRefreshInterval, fetchData]);

  const handleSeedDemo = async () => {
    setIsRefreshing(true);
    try {
      await api.seedSmartPriorityDemo();
      await fetchData(true);
    } catch (err: any) {
      alert(`Error seeding demo data: ${err.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filtered brands
  const filteredBrands = useMemo(() => {
    if (!data?.brand_priority) return [];
    return data.brand_priority.filter(item => {
      const matchesPriority = priorityFilter === 'ALL' || item.priority === priorityFilter;
      const matchesSearch = item.brand_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.top_violated_rule.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesPriority && matchesSearch;
    });
  }, [data?.brand_priority, priorityFilter, searchQuery]);

  if (isLoading && !data) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center space-y-4 shadow-sm min-h-[350px]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-600 animate-pulse">
          Pandas Aggregating Live Inspection Records...
        </p>
      </div>
    );
  }

  const summary = data?.market_summary || {
    total_violations: 0,
    total_inspections: 0,
    high_priority_brands_count: 0,
    top_violator_brand: 'None',
    top_violated_rule: 'None',
    market_compliance_rate: 0,
    tracked_brands_count: 0,
    tracked_rules_count: 0
  };

  const ruleTrend = data?.rule_trend || [];
  const maxRuleViolations = ruleTrend.length > 0 ? Math.max(...ruleTrend.map(r => r.times_violated)) : 1;

  return (
    <div className="space-y-6">
      {/* Top Banner & Surveillance Controls */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-full border border-indigo-400/30">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Pandas GroupBy Intelligence Engine</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] text-emerald-300 font-mono">LIVE SYNC</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              Smart Priority Dashboard
            </h1>
            <p className="text-xs lg:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Real-time market surveillance classifying brand violation risks and identifying the most frequently breached Legal Metrology statutory rules across all inspections.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Timeframe Selector */}
            <div className="bg-slate-800/90 p-1 rounded-xl border border-slate-700 flex items-center text-xs">
              {(['all', '30d', '7d', 'today'] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    timeframe === tf
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {tf === 'all' ? 'All Time' : tf === '30d' ? '30 Days' : tf === '7d' ? '7 Days' : 'Today'}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-white rounded-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              title="Force recalculate latest SQLite / PostgreSQL records via Pandas"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Recalculating...' : 'Refresh'}</span>
            </button>

            {/* Seed Demo Data Button */}
            <button
              onClick={handleSeedDemo}
              disabled={isRefreshing}
              className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Ensure Balaji (18), Parle (5), Consumer Care (42), and Font Size (31) data are loaded"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Demo Data</span>
            </button>
          </div>
        </div>

        {/* Live sync pipeline indicator */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>Database: <strong className="text-slate-200 font-mono">PostgreSQL / SQLite</strong></span>
            <span className="text-slate-600">•</span>
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Aggregator: <strong className="text-slate-200 font-mono">Pandas DataFrame groupby()</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Last Computed: <span className="font-mono text-white">{lastUpdatedText}</span>
            </span>
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="bg-slate-800 text-slate-200 text-[11px] px-2 py-1 rounded-md border border-slate-700 outline-none"
            >
              <option value={0}>Auto-refresh: Off</option>
              <option value={15}>Auto-refresh: 15s</option>
              <option value={30}>Auto-refresh: 30s</option>
              <option value={60}>Auto-refresh: 60s</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4 Market Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Market Violations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Violations</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{summary.total_violations}</span>
            <span className="text-xs text-rose-600 font-bold">Market-wide</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Across <strong className="text-slate-700">{summary.total_inspections}</strong> inspection cases
          </p>
        </div>

        {/* Card 2: High Priority Brands */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">High-Priority Brands</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600 font-mono">{summary.high_priority_brands_count}</span>
            <span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-700 font-bold rounded-full">Critical Focus</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Top Offender: <strong className="text-slate-800">{summary.top_violator_brand}</strong>
          </p>
        </div>

        {/* Card 3: Top Violated Rule */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Most Breached Rule</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="truncate">
            <span className="text-lg font-bold text-slate-900 block truncate" title={summary.top_violated_rule}>
              {summary.top_violated_rule}
            </span>
          </div>
          <p className="text-xs text-indigo-600 font-semibold mt-1">
            Market share: {ruleTrend[0] ? `${ruleTrend[0].market_share_percent}% of all infractions` : 'N/A'}
          </p>
        </div>

        {/* Card 4: Overall Market Compliance Index */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Compliance Rate</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">{summary.market_compliance_rate}%</span>
            <span className={`text-xs font-bold ${summary.market_compliance_rate >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {summary.market_compliance_rate >= 70 ? 'Healthy' : 'Enforcement Required'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracking <strong className="text-slate-700">{summary.tracked_brands_count}</strong> active commercial brands
          </p>
        </div>
      </div>

      {/* Main 2-Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* =========================================================================
            SECTION 1: BRAND PRIORITY (Columns: 7 on lg)
           ========================================================================= */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h2 className="text-base font-bold text-slate-900">Brand Priority</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Brand Violations Priority calculated by Pandas aggregation of inspection findings.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    priorityFilter === p
                      ? p === 'HIGH'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : p === 'MEDIUM'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : p === 'LOW'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p === 'ALL' ? 'All' : p === 'HIGH' ? '🔴 High' : p === 'MEDIUM' ? '🟡 Medium' : '🟢 Low'}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="px-5 py-3 border-b border-slate-100 bg-white flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by brand name or violated rule..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 hover:text-slate-600 px-1 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Brand Priority List */}
          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[520px]">
            {filteredBrands.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">
                No brands match the selected filter.
              </div>
            ) : (
              filteredBrands.map((brand) => {
                const isHigh = brand.priority === 'HIGH';
                const isMed = brand.priority === 'MEDIUM';

                return (
                  <div
                    key={brand.brand_name}
                    onClick={() => onSelectBrand?.(brand.brand_name)}
                    className="p-4.5 hover:bg-slate-50/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group cursor-pointer"
                  >
                    {/* Brand Name & Top Rule */}
                    <div className="flex items-start gap-3.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isHigh ? 'bg-rose-100 text-rose-700' : isMed ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        #{brand.rank}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                            {brand.brand_name}
                          </span>
                          {/* Priority Badge */}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            isHigh
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : isMed
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {brand.priority_badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                          <span>Primary Breach:</span>
                          <strong className="text-slate-700 font-medium truncate max-w-[240px] sm:max-w-[320px]">
                            {brand.top_violated_rule}
                          </strong>
                        </p>
                      </div>
                    </div>

                    {/* Stats & Progress */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pl-11 sm:pl-0">
                      {/* Compliance Rate */}
                      <div className="text-right">
                        <div className="text-xs font-semibold text-slate-500">Compliance</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                brand.compliance_rate >= 70 ? 'bg-emerald-500' : brand.compliance_rate >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${brand.compliance_rate}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-slate-700 font-mono">
                            {brand.compliance_rate}%
                          </span>
                        </div>
                      </div>

                      {/* Violations Count */}
                      <div className="text-right min-w-[65px]">
                        <div className="text-xs font-semibold text-slate-500">Violations</div>
                        <div className="text-base font-black font-mono mt-0.5 text-slate-900">
                          {brand.violations_count}
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors shrink-0 hidden sm:block" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>
              Showing <strong>{filteredBrands.length}</strong> of {data?.brand_priority.length || 0} commercial brands
            </span>
            <span className="text-slate-400">
              🔴 High: ≥ 10 breaches | 🟡 Medium: 4–9 breaches | 🟢 Low: ≤ 3 breaches
            </span>
          </div>
        </div>

        {/* =========================================================================
            SECTION 2: RULE TREND (Columns: 5 on lg)
           ========================================================================= */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h2 className="text-base font-bold text-slate-900">Rule Trend</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Rule Times Violated — identifies which statutory provisions are most commonly violated across the market.
            </p>
          </div>

          {/* Rule Trend List with horizontal bars */}
          <div className="p-5 space-y-4.5 flex-1 overflow-y-auto max-h-[560px]">
            {ruleTrend.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No statutory rule infractions recorded.
              </div>
            ) : (
              ruleTrend.map((rule) => {
                const barWidth = Math.max(8, Math.round((rule.times_violated / maxRuleViolations) * 100));
                const isHighSeverity = rule.severity === 'HIGH';

                return (
                  <div
                    key={rule.rule_code}
                    onClick={() => onSelectRule?.(rule.rule_code)}
                    className="p-3.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all group cursor-pointer"
                  >
                    {/* Top Row: Title & Counter */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {rule.rule_title}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {rule.statutory_citation}
                        </div>
                      </div>

                      {/* Times Violated Pill */}
                      <div className="text-right shrink-0">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-mono font-bold shadow-xs">
                          <span>{rule.times_violated}</span>
                          <span className="text-[10px] font-normal text-slate-300">violations</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="space-y-1.5 mt-2.5">
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isHighSeverity
                              ? 'bg-gradient-to-r from-rose-500 to-rose-600'
                              : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                          }`}
                          style={{ width: `${barWidth}%` }}
                        ></div>
                      </div>

                      {/* Metrics below bar */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                        <span className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${isHighSeverity ? 'bg-rose-500' : 'bg-indigo-500'}`}></span>
                          Market Share: <strong className="text-slate-800">{rule.market_share_percent}%</strong>
                        </span>
                        <span className="font-mono text-slate-400 text-[10px]">
                          {rule.rule_code}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>
              Most Violated: <strong>{ruleTrend[0]?.rule_title || 'N/A'}</strong>
            </span>
            <span className="text-slate-400">
              Ranked by market breach frequency
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Architecture Notice */}
      <div className="p-4 bg-slate-100/80 rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
          <span>
            <strong>How does it stay updated?</strong> Whenever an inspection is submitted or updated, it is persisted to PostgreSQL/SQLite. Pandas recalculates counts with <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[11px]">groupby()</code> and streams the new priority radar to your screen.
          </span>
        </div>
        <div className="shrink-0 text-slate-400 text-[11px]">
          PackSure Legal Metrology Engine v2.0
        </div>
      </div>
    </div>
  );
};

export default SmartPriorityDashboard;
