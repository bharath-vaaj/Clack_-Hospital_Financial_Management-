import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  PieChart as PieIcon,
  BarChart3,
  Building,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Filter,
  Calendar,
  Layers,
  Building2,
  AlertCircle,
  RotateCcw,
  Hash,
  SlidersHorizontal,
  FileText,
  Activity,
  ShieldCheck,
  Percent,
  Flame,
  CheckCircle2,
  AlertTriangle,
  X,
  Search,
  ChevronRight,
  Bot
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { useApp } from '../../context/AppContext';

export const TabAnalytics: React.FC = () => {
  const {
    currentUser,
    hospitals,
    selectedHospitalId,
    setSelectedHospitalId,
    setActiveTab,
    setPreselectedGroup,
    setInitialChatQuery,
    showToast,
    refreshKey
  } = useApp();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Multi-dimensional filters state
  const [dateRange, setDateRange] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  const [selectedSubgroupId, setSelectedSubgroupId] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  const [amountTier, setAmountTier] = useState<'ALL' | 'HIGH' | 'MID' | 'ROUTINE'>('ALL');
  const [includeStaged, setIncludeStaged] = useState<boolean>(false);

  // Ledger Inspector Modal State
  const [selectedLedgerIdForModal, setSelectedLedgerIdForModal] = useState<string | null>(null);
  const [ledgerModalData, setLedgerModalData] = useState<any>(null);
  const [ledgerModalLoading, setLedgerModalLoading] = useState<boolean>(false);
  const [ledgerSearchTerm, setLedgerSearchTerm] = useState<string>('');

  // AI Diagnostic State
  const [aiDiagnostic, setAiDiagnostic] = useState<any>(null);
  const [aiDiagnosticLoading, setAiDiagnosticLoading] = useState<boolean>(false);

  const fetchAnalytics = useCallback(async () => {
    if (!selectedHospitalId && hospitals.length > 0) {
      setSelectedHospitalId(hospitals[0].id);
      return;
    }
    if (!selectedHospitalId) return;

    try {
      setLoading(true);
      setErrorMsg(null);

      // Build unified query string with all active filters
      let url = `/api/analytics?hospital_id=${selectedHospitalId}&userId=${currentUser?.id}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      if (selectedDeptId && selectedDeptId !== 'ALL') url += `&departmentId=${selectedDeptId}`;
      if (selectedSubgroupId && selectedSubgroupId !== 'ALL') url += `&subgroupId=${selectedSubgroupId}`;
      if (typeFilter !== 'ALL') url += `&typeFilter=${typeFilter}`;
      if (amountTier !== 'ALL') url += `&amountTier=${amountTier}`;
      if (includeStaged) url += `&includeStaged=true`;

      const res = await fetch(url, {
        headers: { 'X-User-Id': currentUser?.id || '' }
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        setErrorMsg(json.error);
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  }, [
    selectedHospitalId,
    startDate,
    endDate,
    selectedDeptId,
    selectedSubgroupId,
    typeFilter,
    amountTier,
    includeStaged,
    currentUser,
    hospitals,
    setSelectedHospitalId
  ]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics, refreshKey]);

  // Handle Preset Date Ranges with Fiscal Precision
  const handleDatePresetChange = (preset: string) => {
    setDateRange(preset);

    if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'AUG_2026') {
      setStartDate('2026-08-01');
      setEndDate('2026-08-31');
    } else if (preset === 'Q3_2026') {
      setStartDate('2026-07-01');
      setEndDate('2026-09-30');
    } else if (preset === 'FY_2026') {
      setStartDate('2026-01-01');
      setEndDate('2026-12-31');
    } else if (preset === 'CUSTOM') {
      if (!startDate) setStartDate('2026-08-01');
      if (!endDate) setEndDate('2026-08-31');
    }
  };

  const handleDeptChange = (deptId: string) => {
    setSelectedDeptId(deptId);
    setSelectedSubgroupId('ALL');
  };

  const handleResetFilters = () => {
    setDateRange('ALL');
    setStartDate('');
    setEndDate('');
    setSelectedDeptId('ALL');
    setSelectedSubgroupId('ALL');
    setTypeFilter('ALL');
    setAmountTier('ALL');
    setIncludeStaged(false);
  };

  // Open Ledger Transaction Inspector Modal
  const handleOpenLedgerModal = async (ledgerId: string) => {
    setSelectedLedgerIdForModal(ledgerId);
    setLedgerModalLoading(true);
    setLedgerSearchTerm('');
    try {
      const res = await fetch(`/api/analytics/ledger/${ledgerId}/vouchers`, {
        headers: { 'X-User-Id': currentUser?.id || '' }
      });
      const json = await res.json();
      if (res.ok) {
        setLedgerModalData(json);
      } else {
        showToast(json.error || 'Failed to load ledger transactions', 'error');
        setSelectedLedgerIdForModal(null);
      }
    } catch (e: any) {
      showToast('Network error while retrieving ledger transactions', 'error');
      setSelectedLedgerIdForModal(null);
    } finally {
      setLedgerModalLoading(false);
    }
  };

  // Run AI Financial Diagnostic
  const handleRunAIDiagnostic = async () => {
    if (!data || !currentHospital) return;
    try {
      setAiDiagnosticLoading(true);
      const res = await fetch('/api/analytics/ai-diagnostic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id || ''
        },
        body: JSON.stringify({
          hospitalName: currentHospital.name,
          totalRevenue: data.kpi.totalRevenue,
          totalOutflow: data.kpi.totalOutflow,
          netIncome: data.kpi.netIncome,
          operatingMargin: data.kpi.operatingMargin,
          topCategories: data.departmentalBreakdown?.slice(0, 5),
          concentrationRatio: data.financialRatios?.concentrationRatio
        })
      });
      const json = await res.json();
      if (res.ok) {
        setAiDiagnostic(json);
        showToast('AI financial diagnostic updated successfully', 'success');
      }
    } catch (e: any) {
      showToast('AI diagnostic failed: ' + e.message, 'error');
    } finally {
      setAiDiagnosticLoading(false);
    }
  };

  // Auto-generate AI Diagnostic when data changes
  useEffect(() => {
    if (data && currentHospital) {
      handleRunAIDiagnostic();
    }
  }, [data?.kpi?.totalRevenue, data?.kpi?.totalOutflow, selectedHospitalId]);

  const fmt = (n: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(n);
  };

  const COLORS = ['#3E8E6D', '#255843', '#5FA987', '#8AC3A6', '#D96C5F', '#E8A33D', '#3D4D6B', '#8C52FF', '#0097A7', '#FF7043', '#EC4899', '#6366F1'];

  const isCFO = currentUser?.role === 'CFO';
  const isAuditor = currentUser?.role === 'AUDITOR';
  const currentHospital = hospitals.find(h => h.id === selectedHospitalId);

  // Subgroups available for the selected department
  const availableSubgroups = (data?.availableSubgroups || []).filter((sg: any) => {
    if (!selectedDeptId || selectedDeptId === 'ALL') return true;
    return sg.group_id === selectedDeptId;
  });

  const hasActiveFilters =
    dateRange !== 'ALL' ||
    Boolean(startDate) ||
    Boolean(endDate) ||
    selectedDeptId !== 'ALL' ||
    selectedSubgroupId !== 'ALL' ||
    typeFilter !== 'ALL' ||
    amountTier !== 'ALL' ||
    includeStaged;

  // Filter vouchers inside modal by search
  const filteredVouchers = (ledgerModalData?.vouchers || []).filter((v: any) => {
    if (!ledgerSearchTerm) return true;
    const term = ledgerSearchTerm.toLowerCase();
    return (
      (v.voucher_number || '').toLowerCase().includes(term) ||
      (v.description || '').toLowerCase().includes(term) ||
      (v.amount || '').toString().includes(term) ||
      (v.status || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & FACILITY SELECTION */}
      {/* ========================================================================= */}
      <div className="bg-paper-100 dark:bg-ink-900 border border-paper-200 dark:border-ink-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 bg-sage-100 dark:bg-sage-900/50 text-sage-600 rounded-2xl shadow-xs">
                <BarChart3 className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-ink-950 dark:text-paper-50">
                  Hospital Financial Intelligence & Analytics
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Synchronized multi-dimensional financial reporting, deterministic ledger rollups & AI analytical copilot.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors shadow-xs"
                title="Clear all active filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}

            {currentHospital && (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-paper-50 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 text-xs font-mono text-slate-500">
                <Building2 className="w-4 h-4 text-sage-600" />
                <span>Facility: <strong className="text-ink-950 dark:text-paper-50">{currentHospital.name}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* DEDICATED HOSPITAL SWITCHER TABS */}
        {(isCFO || (isAuditor && hospitals.length > 0) || hospitals.length > 1) && (
          <div className="space-y-2 pt-3 border-t border-paper-200 dark:border-ink-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isAuditor ? 'Authorized Facilities (Auditor Read-Only):' : 'Select Health Facility:'}
            </span>
            <div className="flex flex-wrap gap-2.5">
              {hospitals.map(h => {
                const isActive = h.id === selectedHospitalId;
                return (
                  <button
                    key={h.id}
                    onClick={() => {
                      setSelectedHospitalId(h.id);
                      setSelectedDeptId('ALL');
                      setSelectedSubgroupId('ALL');
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                      isActive
                        ? 'bg-sage-600 text-white shadow-md'
                        : 'bg-paper-50 dark:bg-ink-950 hover:bg-paper-200 dark:hover:bg-ink-800 text-ink-950 dark:text-paper-50 border border-paper-200 dark:border-ink-800'
                    }`}
                  >
                    <Building2 className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-sage-600'}`} />
                    <span>{h.name}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isActive ? 'bg-sage-700 text-white' : 'bg-paper-200 dark:bg-ink-850 text-slate-500'}`}>
                      {h.code}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. MULTI-DIMENSIONAL FILTERS TOOLBAR */}
        {/* ========================================================================= */}
        <div className="pt-3 border-t border-paper-200 dark:border-ink-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-sage-600" />
              Multi-Dimensional Financial Filters
            </span>
            {hasActiveFilters && (
              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/60">
                Filters Active
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
            {/* Filter 1: Date Period Preset */}
            <div>
              <label className="block font-semibold text-slate-500 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-sage-600" />
                <span>Period:</span>
              </label>
              <select
                value={dateRange}
                onChange={e => handleDatePresetChange(e.target.value)}
                className="w-full p-2.5 bg-paper-50 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 rounded-xl font-bold cursor-pointer focus:ring-1 focus:ring-sage-500"
              >
                <option value="ALL">All Time (Historical)</option>
                <option value="AUG_2026">Fiscal Aug 2026 (Active)</option>
                <option value="Q3_2026">Q3 2026 (Jul - Sep)</option>
                <option value="FY_2026">Fiscal Year 2026</option>
                <option value="CUSTOM">Custom Date Range...</option>
              </select>
            </div>

            {/* Filter 2: Cash Flow (Credit / Debit) */}
            <div>
              <label className="block font-semibold text-slate-500 mb-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-sage-600" />
                <span>Cash Flow:</span>
              </label>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as any)}
                className="w-full p-2.5 bg-paper-50 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 rounded-xl font-semibold cursor-pointer focus:ring-1 focus:ring-sage-500"
              >
                <option value="ALL">All Flows (Net Margin)</option>
                <option value="DEBIT">Outflows Only (- DR Expenses)</option>
                <option value="CREDIT">Inflows Only (+ CR Revenues)</option>
              </select>
            </div>

            {/* Filter 3: Department / Group Filter */}
            <div>
              <label className="block font-semibold text-slate-500 mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-sage-600" />
                <span>Department / Group:</span>
              </label>
              <select
                value={selectedDeptId}
                onChange={e => handleDeptChange(e.target.value)}
                className="w-full p-2.5 bg-paper-50 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 rounded-xl font-semibold cursor-pointer focus:ring-1 focus:ring-sage-500"
              >
                <option value="ALL">All Departments</option>
                {(data?.availableGroups || []).map((g: any) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            {/* Filter 4: Sub-Department Drilldown */}
            <div>
              <label className="block font-semibold text-slate-500 mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-sage-600" />
                <span>Sub-Department:</span>
              </label>
              <select
                value={selectedSubgroupId}
                onChange={e => setSelectedSubgroupId(e.target.value)}
                className="w-full p-2.5 bg-paper-50 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 rounded-xl font-semibold cursor-pointer focus:ring-1 focus:ring-sage-500"
              >
                <option value="ALL">All Sub-groups</option>
                {availableSubgroups.map((sg: any) => (
                  <option key={sg.id} value={sg.id}>{sg.name}</option>
                ))}
              </select>
            </div>

            {/* Filter 5: Transaction Size Tier */}
            <div>
              <label className="block font-semibold text-slate-500 mb-1 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-sage-600" />
                <span>Transaction Size:</span>
              </label>
              <select
                value={amountTier}
                onChange={e => setAmountTier(e.target.value as any)}
                className="w-full p-2.5 bg-paper-50 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 rounded-xl font-semibold cursor-pointer focus:ring-1 focus:ring-sage-500"
              >
                <option value="ALL">All Ticket Sizes</option>
                <option value="HIGH">High Value (&gt; $10,000)</option>
                <option value="MID">Standard ($2,500 - $10k)</option>
                <option value="ROUTINE">Routine (&lt; $2,500)</option>
              </select>
            </div>

            {/* Filter 6: Staged Status Toggle */}
            <div className="flex flex-col justify-end">
              <button
                onClick={() => setIncludeStaged(!includeStaged)}
                className={`w-full p-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                  includeStaged
                    ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                    : 'bg-paper-50 dark:bg-ink-950 border-paper-200 dark:border-ink-800 text-slate-500 hover:text-ink-950 dark:hover:text-paper-50'
                }`}
                title="Include staged vouchers pending committee commit"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">{includeStaged ? 'With Staged' : 'Approved Only'}</span>
              </button>
            </div>
          </div>

          {/* Custom Date Pickers when CUSTOM is active */}
          {dateRange === 'CUSTOM' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs bg-paper-50 dark:bg-ink-950 p-3.5 rounded-2xl border border-paper-200 dark:border-ink-800"
            >
              <div>
                <label className="block font-semibold text-slate-500 mb-1">Start Date:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-ink-900 border border-paper-200 dark:border-ink-800 rounded-xl font-mono text-xs focus:ring-1 focus:ring-sage-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-500 mb-1">End Date:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-ink-900 border border-paper-200 dark:border-ink-800 rounded-xl font-mono text-xs focus:ring-1 focus:ring-sage-500"
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Error State */}
      {errorMsg && (
        <div className="p-6 bg-coral-50 dark:bg-coral-950/30 border border-coral-200 dark:border-coral-900/50 rounded-3xl text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-debit-coral mx-auto" />
          <h3 className="text-sm font-bold text-debit-coral">{errorMsg}</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            If you are an Auditor, the CFO can grant access to specific hospitals under Tab 5 (Auditor Portal).
          </p>
        </div>
      )}

      {loading ? (
        <div className="p-20 text-center text-xs text-slate-400 bg-paper-100 dark:bg-ink-900 rounded-3xl border border-paper-200 dark:border-ink-800 flex flex-col items-center justify-center space-y-3">
          <div className="w-6 h-6 border-2 border-sage-500 border-t-transparent rounded-full animate-spin" />
          <span>Computing financial aggregates and ledger trees across active parameters...</span>
        </div>
      ) : data && !errorMsg && (
        <>
          {/* ========================================================================= */}
          {/* 3. PRIMARY FINANCIAL KPI CARDS (5 Core Dimensions) */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* KPI 1: Revenue */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="p-5 bg-paper-100 dark:bg-ink-900 border border-paper-200 dark:border-ink-800 rounded-3xl shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total Revenue (+ CR)</span>
                <div className="p-2 bg-sage-50 dark:bg-sage-950/40 text-sage-600 rounded-xl">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold tracking-tight text-sage-600 tabular-nums">
                {fmt(data.kpi.totalRevenue)}
              </div>
              <div className="text-[11px] text-slate-400">Verified inflows & collections</div>
            </motion.div>

            {/* KPI 2: Net Surplus */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="p-5 bg-paper-100 dark:bg-ink-900 border border-paper-200 dark:border-ink-800 rounded-3xl shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Net Operating Surplus</span>
                <div className="p-2 bg-sage-50 dark:bg-sage-950/40 text-sage-600 rounded-xl">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold tracking-tight text-ink-950 dark:text-paper-50 tabular-nums">
                {fmt(data.kpi.netIncome)}
              </div>
              <div className="text-[11px] text-slate-400">
                Operating margin: <strong className={data.kpi.operatingMargin >= 0 ? "text-sage-600" : "text-debit-coral"}>{data.kpi.operatingMargin}%</strong>
              </div>
            </motion.div>

            {/* KPI 3: Outflow */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="p-5 bg-paper-100 dark:bg-ink-900 border border-paper-200 dark:border-ink-800 rounded-3xl shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total Outflow (- DR)</span>
                <div className="p-2 bg-coral-50 dark:bg-coral-950/40 text-debit-coral rounded-xl">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold tracking-tight text-debit-coral tabular-nums">
                {fmt(data.kpi.totalOutflow)}
              </div>
              <div className="text-[11px] text-slate-400">Clinical, plant & supply spend</div>
            </motion.div>

            {/* KPI 4: Transaction Volume & Avg Size */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="p-5 bg-paper-100 dark:bg-ink-900 border border-paper-200 dark:border-ink-800 rounded-3xl shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Vouchers & Ticket Size</span>
                <div className="p-2 bg-paper-200/60 dark:bg-ink-800 text-slate-600 dark:text-slate-300 rounded-xl">
                  <Hash className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold tracking-tight text-ink-950 dark:text-paper-50 tabular-nums">
                {data.kpi.voucherCount} <span className="text-xs font-normal text-slate-400">items</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Avg Size: <strong className="font-mono text-ink-900 dark:text-paper-100">{fmt(data.kpi.avgTransaction)}</strong>
              </div>
            </motion.div>

            {/* KPI 5: Pending Approvals */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              onClick={() => {
                if (currentUser?.role !== 'CFO' && currentUser?.role !== 'AUDITOR') {
                  setActiveTab('ingestion');
                }
              }}
              className="p-5 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-3xl shadow-xs space-y-3 cursor-pointer"
            >
              <div className="flex items-center justify-between text-amber-800 dark:text-amber-200 text-xs font-semibold">
                <span>Pending Approvals</span>
                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 text-amber-600 rounded-xl">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold tracking-tight text-amber-800 dark:text-amber-200 tabular-nums flex items-center justify-between">
                <span>{data.kpi.pendingApprovals}</span>
                {currentUser?.role !== 'CFO' && currentUser?.role !== 'AUDITOR' && (
                  <span className="text-xs font-normal text-amber-700 dark:text-amber-300 flex items-center gap-1">
                    Review <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <div className="text-[11px] text-amber-700/80 dark:text-amber-300/80">Staged AI transactions awaiting commit</div>
            </motion.div>
          </div>

          {/* ========================================================================= */}
          {/* 4. HEALTHCARE FINANCIAL RATIOS & CONCENTRATION RISK BAR */}
          {/* ========================================================================= */}
          {data.financialRatios && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Ratio 1: Operating Ratio (Cost-to-Income) */}
              <div className="p-4 bg-paper-100 dark:bg-ink-900 border border-paper-200 dark:border-ink-800 rounded-2xl space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-sage-600" />
                    Operating Ratio (Cost/Income)
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      data.financialRatios.operatingRatio < 85
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : data.financialRatios.operatingRatio <= 100
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {data.financialRatios.operatingRatio < 85 ? 'Healthy' : data.financialRatios.operatingRatio <= 100 ? 'Caution' : 'Deficit'}
                  </span>
                </div>
                <div className="text-xl font-bold font-mono text-ink-950 dark:text-paper-50">
                  {data.financialRatios.operatingRatio}%
                </div>
                <p className="text-[11px] text-slate-400">
                  Target &lt;85% operating cost to income ratio for sustainable clinical operations.
                </p>
              </div>

              {/* Ratio 2: Daily Operating Burn Rate */}
              <div className="p-4 bg-paper-100 dark:bg-ink-900 border border-paper-200 dark:border-ink-800 rounded-2xl space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-rose-500" />
                    Daily Expense Burn Rate
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">30d cadence</span>
                </div>
                <div className="text-xl font-bold font-mono text-ink-950 dark:text-paper-50">
                  {fmt(data.financialRatios.dailyBurnRate)} <span className="text-xs font-normal text-slate-400">/ day</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Estimated average daily capital deployment for medical consumables & plant.
                </p>
              </div>

              {/* Ratio 3: Spending Concentration (Pareto 80/20) */}
              <div className="p-4 bg-paper-100 dark:bg-ink-900 border border-paper-200 dark:border-ink-800 rounded-2xl space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-blue-500" />
                    Top 3 Category Concentration
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      data.financialRatios.concentrationRatio > 70
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                        : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    {data.financialRatios.concentrationRatio > 70 ? 'High Risk' : 'Diversified'}
                  </span>
                </div>
                <div className="text-xl font-bold font-mono text-ink-950 dark:text-paper-50">
                  {data.financialRatios.concentrationRatio}%
                </div>
                <p className="text-[11px] text-slate-400">
                  Share of expenditure absorbed by top 3 clinical and facility cost centers.
                </p>
              </div>

              {/* Ratio 4: Staged Pipeline Liabilities */}
              <div className="p-4 bg-paper-100 dark:bg-ink-900 border border-paper-200 dark:border-ink-800 rounded-2xl space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                    Staged Uncommitted Pipeline
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                    {data.financialRatios.stagedLiabilities.count} queued
                  </span>
                </div>
                <div className="text-xl font-bold font-mono text-ink-950 dark:text-paper-50">
                  {fmt(data.financialRatios.stagedLiabilities.amount)}
                </div>
                <p className="text-[11px] text-slate-400">
                  Uncommitted liabilities waiting in staging queue before general ledger write.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. AI FINANCIAL DIAGNOSTIC & STRATEGIC ADVISOR */}
          {/* ========================================================================= */}
          <div className="p-5 bg-gradient-to-r from-sage-50/70 via-paper-100 to-sage-50/40 dark:from-sage-950/30 dark:via-ink-900 dark:to-ink-950 border border-sage-200/80 dark:border-sage-900/50 rounded-3xl shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sage-500 text-white rounded-xl shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink-950 dark:text-paper-50 flex items-center gap-2">
                    AI Healthcare Financial Diagnostic
                    {aiDiagnostic && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          aiDiagnostic.rating === 'STRONG'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200'
                            : aiDiagnostic.rating === 'CRITICAL'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200'
                        }`}
                      >
                        Status: {aiDiagnostic.rating}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Deterministic figures synthesized by Groq 120B / Gemini hospital reasoning engine.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunAIDiagnostic}
                  disabled={aiDiagnosticLoading}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-ink-800 text-slate-700 dark:text-slate-200 border border-paper-200 dark:border-ink-700 hover:bg-paper-50 transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${aiDiagnosticLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Diagnostic</span>
                </button>

                <button
                  onClick={() => {
                    setInitialChatQuery(
                      `Perform an executive healthcare financial audit for ${currentHospital?.name}. Evaluate current operating margin of ${data.kpi.operatingMargin}%, spending concentration, and recommend 3 cost optimization strategies.`
                    );
                    setActiveTab('ai_chat');
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-sage-600 text-white hover:bg-sage-700 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Open in AI Copilot</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {aiDiagnostic && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs">
                {/* Observations */}
                <div className="p-3.5 bg-paper-50 dark:bg-ink-950/80 rounded-2xl border border-paper-200/80 dark:border-ink-800 space-y-2">
                  <span className="font-bold text-ink-950 dark:text-paper-50 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-sage-600" />
                    Key Clinical Cost Observations
                  </span>
                  <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                    {(aiDiagnostic.observations || []).map((obs: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-sage-600 font-bold">•</span>
                        <span>{obs}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                <div className="p-3.5 bg-paper-50 dark:bg-ink-950/80 rounded-2xl border border-paper-200/80 dark:border-ink-800 space-y-2">
                  <span className="font-bold text-ink-950 dark:text-paper-50 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Strategic CFO Recommendations
                  </span>
                  <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                    {(aiDiagnostic.recommendations || []).map((rec: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 6. CHARTS ROW: CLEAN SPLIT ALLOCATION & MONTHLY TREND */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Departmental / Subgroup Distribution (REDESIGNED FOR PERFECT ALIGNMENT) */}
            <div className="bg-paper-100 dark:bg-ink-900 border border-paper-200 dark:border-ink-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4 min-h-[460px]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-ink-950 dark:text-paper-50 flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-sage-600" />
                    {data.breakdownLevel === 'SUBGROUP'
                      ? 'Sub-Department Distribution Drilldown'
                      : (typeFilter === 'CREDIT' ? 'Departmental Revenue Breakdown' : 'Departmental Expense Distribution')}
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {data.breakdownLevel === 'SUBGROUP'
                      ? 'Individual sub-groups within selected operational department.'
                      : 'Clinical categories. Click any row or donut segment to drill down into subgroups.'}
                  </p>
                </div>
                {selectedDeptId !== 'ALL' && (
                  <button
                    onClick={() => setSelectedDeptId('ALL')}
                    className="text-xs font-bold text-sage-600 hover:text-sage-700 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sage-50 dark:bg-sage-950/40 border border-sage-200 dark:border-sage-800 transition-colors"
                  >
                    <span>← View All Groups</span>
                  </button>
                )}
              </div>

              {/* Redesigned Clean Split Layout */}
              {(() => {
                const pieData = (data.departmentalBreakdown || [])
                  .map((dept: any) => ({
                    ...dept,
                    total_amount: Number(dept.total_amount) || 0
                  }))
                  .filter((dept: any) => dept.total_amount > 0);

                const totalSpend = pieData.reduce((acc: number, curr: any) => acc + curr.total_amount, 0);

                if (pieData.length === 0) {
                  return (
                    <div className="h-64 w-full flex items-center justify-center text-xs text-slate-400 bg-paper-50/50 dark:bg-ink-950/50 rounded-2xl border border-dashed border-paper-300 dark:border-ink-800">
                      No distribution records matching this filter combination.
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center flex-1">
                    {/* Left: Donut Chart with Centered Total Callout */}
                    <div className="md:col-span-5 relative flex items-center justify-center h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            dataKey="total_amount"
                            nameKey="group_name"
                            cx="50%"
                            cy="50%"
                            outerRadius={95}
                            innerRadius={62}
                            paddingAngle={2.5}
                            onClick={(entry: any) => {
                              const targetId = entry?.group_id || entry?.payload?.group_id;
                              if (data.breakdownLevel === 'GROUP' && targetId) {
                                setSelectedDeptId(targetId);
                              }
                            }}
                            cursor="pointer"
                          >
                            {pieData.map((_entry: any, index: number) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                                className="transition-all hover:opacity-80 outline-none"
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(val: any) => [fmt(Number(val)), typeFilter === 'CREDIT' ? 'Revenue' : 'Volume']}
                            contentStyle={{
                              backgroundColor: '#162138',
                              borderColor: '#28364F',
                              borderRadius: '12px',
                              color: '#FAF8F4',
                              fontSize: '12px',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>

                      {/* Center Callout Overlay inside Donut Hole */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-2">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          {typeFilter === 'CREDIT' ? 'Total Inflow' : 'Total Outflow'}
                        </span>
                        <span className="text-sm font-extrabold font-mono text-ink-950 dark:text-paper-50">
                          {fmt(totalSpend)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {pieData.length} categories
                        </span>
                      </div>
                    </div>

                    {/* Right: Clean, Beautifully Aligned Allocation Breakdown List */}
                    <div className="md:col-span-7 space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {pieData.map((dept: any, index: number) => {
                        const pct = totalSpend > 0 ? ((dept.total_amount / totalSpend) * 100).toFixed(1) : '0';
                        return (
                          <div
                            key={dept.group_id}
                            onClick={() => {
                              if (data.breakdownLevel === 'GROUP') {
                                setSelectedDeptId(dept.group_id);
                              }
                            }}
                            className="p-2.5 rounded-xl bg-paper-50 dark:bg-ink-950 hover:bg-sage-50 dark:hover:bg-sage-950/40 border border-paper-200/80 dark:border-ink-800 transition-all cursor-pointer group space-y-1.5 shadow-2xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span className="text-xs font-semibold text-ink-950 dark:text-paper-50 truncate group-hover:text-sage-600 transition-colors">
                                  {dept.group_name}
                                </span>
                                {dept.count && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-paper-200 dark:bg-ink-800 text-slate-500 shrink-0">
                                    {dept.count} txns
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[11px] font-bold text-slate-400 font-mono">
                                  {pct}%
                                </span>
                                <span className="text-xs font-extrabold font-mono text-ink-950 dark:text-paper-50">
                                  {fmt(dept.total_amount)}
                                </span>
                              </div>
                            </div>

                            {/* Proportional Progress Bar */}
                            <div className="w-full h-1.5 rounded-full bg-paper-200 dark:bg-ink-800 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: COLORS[index % COLORS.length]
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-paper-200 dark:border-ink-800">
                <span>Deterministic Chart Rollups</span>
                <span className="font-semibold text-sage-600">Click any category row to drill down</span>
              </div>
            </div>

            {/* Card 2: Monthly Inflow vs Outflow & Timeline */}
            <div className="bg-paper-100 dark:bg-ink-900 border border-paper-200 dark:border-ink-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4 min-h-[460px]">
              <div>
                <h2 className="text-sm font-bold text-ink-950 dark:text-paper-50 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-sage-600" />
                  Monthly Inflow vs Outflow Cash Velocity
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Synchronously filtered ledger trends matching your active criteria
                </p>
              </div>

              <div className="h-64 w-full flex-1 min-h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8A93A6' }} />
                    <YAxis tickFormatter={v => `$${v / 1000}k`} tick={{ fontSize: 11, fill: '#8A93A6' }} />
                    <Tooltip
                      formatter={(val: any) => [fmt(Number(val)), '']}
                      contentStyle={{
                        backgroundColor: '#162138',
                        borderColor: '#28364F',
                        borderRadius: '12px',
                        color: '#FAF8F4',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="revenue" fill="#3E8E6D" name="Revenue (+ CR Inflow)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="#D96C5F" name="Expenses (- DR Outflow)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3 rounded-2xl bg-sage-50/50 dark:bg-sage-950/20 border border-sage-200 dark:border-sage-900/40 text-xs text-sage-800 dark:text-sage-200 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sage-600" />
                  <span>Filtered Net Operating Margin: <strong className="font-mono">{fmt(data.kpi.netIncome)}</strong></span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">PostgreSQL Live Aggregation</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 7. TOP VALUE LEDGERS (FILTER-SCOPED COST CENTERS - WITH CLICK TO INSPECT) */}
          {/* ========================================================================= */}
          {data.topLedgers && data.topLedgers.length > 0 && (
            <div className="bg-paper-100 dark:bg-ink-900 border border-paper-200 dark:border-ink-800 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-ink-950 dark:text-paper-50 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-sage-600" />
                    Top Value Ledgers (Filter-Scoped Cost Centers)
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Highest volume financial accounts matching active parameters. Click any ledger to inspect its individual vouchers, audit history, and transaction records.
                  </p>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-paper-50 dark:bg-ink-950 text-slate-400 border border-paper-200 dark:border-ink-800 self-start sm:self-auto">
                  Interactive Drilldown Enabled
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {data.topLedgers.map((item: any, idx: number) => {
                  const maxAmt = Math.max(...data.topLedgers.map((l: any) => l.total_amount));
                  const pct = maxAmt > 0 ? Math.round((item.total_amount / maxAmt) * 100) : 0;
                  return (
                    <motion.div
                      key={item.ledger_id}
                      whileHover={{ scale: 1.02, y: -2 }}
                      onClick={() => handleOpenLedgerModal(item.ledger_id)}
                      className="p-4 rounded-2xl bg-paper-50 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 text-left flex flex-col justify-between space-y-3 hover:border-sage-500 dark:hover:border-sage-500 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-slate-400 font-bold">
                            #{idx + 1} • {item.ledger_code}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-paper-200 dark:bg-ink-800 text-slate-600 dark:text-slate-300">
                            {item.transaction_count} txns
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-ink-950 dark:text-paper-50 truncate group-hover:text-sage-600 transition-colors" title={item.ledger_name}>
                          {item.ledger_name}
                        </h4>
                        <div className="text-[10px] text-slate-400 truncate">
                          {item.subgroup_name}
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-paper-200 dark:border-ink-800">
                        <div className="flex items-center justify-between text-xs font-extrabold text-ink-950 dark:text-paper-50 font-mono">
                          <span>{fmt(item.total_amount)}</span>
                          <span className="text-[10px] font-normal text-sage-600 group-hover:translate-x-0.5 transition-transform flex items-center">
                            Inspect <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-paper-200 dark:bg-ink-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-sage-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 8. CFO CROSS-HOSPITAL COMPARISON VIEW */}
          {/* ========================================================================= */}
          {currentUser?.role === 'CFO' && data.crossHospital && (
            <div className="bg-paper-100 dark:bg-ink-900 border border-paper-200 dark:border-ink-800 rounded-3xl p-6 shadow-xs space-y-4">
              <div>
                <h2 className="text-sm font-bold text-ink-950 dark:text-paper-50 flex items-center gap-2">
                  <Building className="w-4 h-4 text-sage-600" />
                  CFO Executive Cross-Hospital Comparison
                </h2>
                <p className="text-xs text-slate-400">
                  Side-by-side performance across all owned health facilities
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-paper-200 dark:border-ink-800 text-slate-400 font-semibold">
                      <th className="py-2.5 px-3">Hospital Facility</th>
                      <th className="py-2.5 px-3">Code</th>
                      <th className="py-2.5 px-3 text-right">Total Revenue</th>
                      <th className="py-2.5 px-3 text-right">Total Expense</th>
                      <th className="py-2.5 px-3 text-right">Net Operating Surplus</th>
                      <th className="py-2.5 px-3 text-center">Pending Approvals</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-paper-200 dark:divide-ink-800/60">
                    {data.crossHospital.map((h: any) => {
                      const rev = Number(h.revenue);
                      const exp = Number(h.expense);
                      const net = rev - exp;
                      return (
                        <tr key={h.id} className="hover:bg-paper-50 dark:hover:bg-ink-850 transition-colors">
                          <td className="py-3 px-3 font-bold text-ink-950 dark:text-paper-50">{h.name}</td>
                          <td className="py-3 px-3 font-mono text-slate-400">{h.code}</td>
                          <td className="py-3 px-3 text-right tabular-nums font-semibold text-sage-600">
                            {fmt(rev)}
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums font-semibold text-debit-coral">
                            {fmt(exp)}
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums font-bold text-ink-950 dark:text-paper-50">
                            {fmt(net)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-mono text-[10px] font-bold">
                              {h.pending_count} pending
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* 9. INTERACTIVE LEDGER TRANSACTION INSPECTOR MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedLedgerIdForModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-paper-100 dark:bg-ink-900 border border-paper-200 dark:border-ink-800 rounded-3xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-paper-200 dark:border-ink-800 flex items-center justify-between bg-paper-50/50 dark:bg-ink-950/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-sage-100 dark:bg-sage-900/60 text-sage-700 dark:text-sage-300 font-mono text-xs font-bold">
                      {ledgerModalData?.ledger?.code || 'LEDGER'}
                    </span>
                    <h3 className="text-base font-bold text-ink-950 dark:text-paper-50">
                      {ledgerModalData?.ledger?.name || 'Ledger Account Details'}
                    </h3>
                  </div>
                  {ledgerModalData?.ledger && (
                    <p className="text-xs text-slate-400">
                      {ledgerModalData.ledger.hospital_name} • {ledgerModalData.ledger.group_name} &gt; {ledgerModalData.ledger.subgroup_name}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSelectedLedgerIdForModal(null);
                    setLedgerModalData(null);
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-ink-950 dark:hover:text-paper-50 hover:bg-paper-200 dark:hover:bg-ink-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              {ledgerModalLoading ? (
                <div className="p-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-3">
                  <div className="w-6 h-6 border-2 border-sage-500 border-t-transparent rounded-full animate-spin" />
                  <span>Loading ledger transaction history & voucher entries...</span>
                </div>
              ) : ledgerModalData ? (
                <div className="p-5 space-y-4 overflow-y-auto flex-1">
                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-paper-50 dark:bg-ink-950 border border-paper-200 dark:border-ink-800">
                      <span className="text-[10px] text-slate-400 block font-semibold">Total Debits (- DR Outflows)</span>
                      <span className="text-sm font-extrabold font-mono text-debit-coral">
                        {fmt(ledgerModalData.summary.totalDebit)}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-paper-50 dark:bg-ink-950 border border-paper-200 dark:border-ink-800">
                      <span className="text-[10px] text-slate-400 block font-semibold">Total Credits (+ CR Inflows)</span>
                      <span className="text-sm font-extrabold font-mono text-sage-600">
                        {fmt(ledgerModalData.summary.totalCredit)}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-paper-50 dark:bg-ink-950 border border-paper-200 dark:border-ink-800">
                      <span className="text-[10px] text-slate-400 block font-semibold">Net Balance</span>
                      <span className={`text-sm font-extrabold font-mono ${ledgerModalData.summary.netBalance >= 0 ? 'text-sage-600' : 'text-debit-coral'}`}>
                        {fmt(ledgerModalData.summary.netBalance)}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-paper-50 dark:bg-ink-950 border border-paper-200 dark:border-ink-800">
                      <span className="text-[10px] text-slate-400 block font-semibold">Total Verified Vouchers</span>
                      <span className="text-sm font-extrabold font-mono text-ink-950 dark:text-paper-50">
                        {ledgerModalData.summary.voucherCount} records
                      </span>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="relative flex-1 max-w-xs">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search vouchers, dates, vendors..."
                        value={ledgerSearchTerm}
                        onChange={e => setLedgerSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-paper-50 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 rounded-xl text-xs focus:ring-1 focus:ring-sage-500"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const ledger = ledgerModalData.ledger;
                          setInitialChatQuery(
                            `Provide an in-depth financial audit and spending analysis for ledger "${ledger.code}: ${ledger.name}" in ${ledger.hospital_name}. What are the primary expenditures and vendor patterns?`
                          );
                          setSelectedLedgerIdForModal(null);
                          setActiveTab('ai_chat');
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sage-600 text-white hover:bg-sage-700 transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <Bot className="w-3.5 h-3.5" />
                        <span>Audit with AI</span>
                      </button>

                      {currentUser?.role !== 'AUDITOR' && (
                        <button
                          onClick={() => {
                            if (ledgerModalData?.ledger?.hospital_id) {
                              setSelectedHospitalId(ledgerModalData.ledger.hospital_id);
                            }
                            const targetGroup = ledgerModalData?.ledger?.group_name || ledgerModalData?.ledger?.name;
                            setPreselectedGroup(targetGroup);
                            setSelectedLedgerIdForModal(null);
                            setActiveTab('ledger');
                            showToast(`Opening "${ledgerModalData.ledger.name}" in Chart of Accounts`, 'info');
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-paper-50 dark:bg-ink-950 text-ink-950 dark:text-paper-50 border border-paper-200 dark:border-ink-800 hover:bg-paper-200 dark:hover:bg-ink-800 transition-colors flex items-center gap-1 shadow-xs"
                        >
                          <span>Open in Ledger Tab</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Vouchers Table */}
                  <div className="border border-paper-200 dark:border-ink-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto max-h-[360px]">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="sticky top-0 bg-paper-100 dark:bg-ink-900 border-b border-paper-200 dark:border-ink-800 text-slate-400 font-semibold z-10">
                          <tr>
                            <th className="py-2.5 px-3">Voucher #</th>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Description / Narration</th>
                            <th className="py-2.5 px-3 text-center">Type</th>
                            <th className="py-2.5 px-3 text-center">Status</th>
                            <th className="py-2.5 px-3 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-paper-200 dark:divide-ink-800/60">
                          {filteredVouchers.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                                No voucher entries matching search criteria.
                              </td>
                            </tr>
                          ) : (
                            filteredVouchers.map((v: any) => (
                              <tr key={v.id} className="hover:bg-paper-50 dark:hover:bg-ink-850 transition-colors">
                                <td className="py-2.5 px-3 font-mono font-bold text-ink-950 dark:text-paper-50">
                                  {v.voucher_number}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                                  {v.date}
                                </td>
                                <td className="py-2.5 px-3 text-ink-900 dark:text-paper-100">
                                  {v.description}
                                </td>
                                <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                  <span
                                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                      v.type === 'CREDIT'
                                        ? 'bg-sage-100 dark:bg-sage-950/60 text-sage-700 dark:text-sage-300'
                                        : 'bg-coral-50 dark:bg-coral-950/60 text-debit-coral'
                                    }`}
                                  >
                                    {v.type === 'CREDIT' ? '+ CR' : '- DR'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                  <span
                                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                      v.status === 'APPROVED'
                                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                                        : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                                    }`}
                                  >
                                    {v.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap tabular-nums">
                                  <span className={v.type === 'CREDIT' ? 'text-sage-600' : 'text-debit-coral'}>
                                    {v.type === 'DEBIT' ? '-' : '+'}{fmt(v.amount)}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Modal Footer */}
              <div className="p-4 border-t border-paper-200 dark:border-ink-800 bg-paper-50/50 dark:bg-ink-950/50 flex items-center justify-between text-xs text-slate-400">
                <span>Verified PostgreSQL Audit Trail</span>
                <button
                  onClick={() => {
                    setSelectedLedgerIdForModal(null);
                    setLedgerModalData(null);
                  }}
                  className="px-4 py-1.5 rounded-xl font-semibold bg-paper-200 dark:bg-ink-800 hover:bg-paper-300 dark:hover:bg-ink-700 text-ink-950 dark:text-paper-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
