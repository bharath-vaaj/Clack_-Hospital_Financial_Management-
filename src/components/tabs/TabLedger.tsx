import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  RefreshCw,
  Building2,
  Filter,
  Eye,
  SlidersHorizontal,
  Plus,
  ShieldCheck,
  Download,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LedgerTree, GroupNode } from '../ledger/LedgerTree';

export const TabLedger: React.FC = () => {
  const {
    currentUser,
    hospitals,
    selectedHospitalId,
    setSelectedHospitalId,
    refreshKey,
    preselectedGroup,
    setPreselectedGroup
  } = useApp();

  const [roots, setRoots] = useState<GroupNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showStagedOverlay, setShowStagedOverlay] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchLiveTree = useCallback(async () => {
    if (!selectedHospitalId && hospitals.length > 0) {
      setSelectedHospitalId(hospitals[0].id);
      return;
    }
    if (!selectedHospitalId) return;

    try {
      setLoading(true);
      setErrorMsg(null);
      const statusParam = showStagedOverlay ? 'ALL' : 'APPROVED';
      const res = await fetch(`/api/ledger/tree?hospital_id=${selectedHospitalId}&status=${statusParam}&userId=${currentUser?.id}`, {
        headers: { 'X-User-Id': currentUser?.id || '' }
      });
      const data = await res.json();
      if (res.ok) {
        setRoots(data.roots || []);
      } else {
        setErrorMsg(data.error);
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  }, [selectedHospitalId, showStagedOverlay, currentUser, hospitals, setSelectedHospitalId]);

  useEffect(() => {
    fetchLiveTree();
  }, [fetchLiveTree, refreshKey]);

  const currentHospital = hospitals.find(h => h.id === selectedHospitalId);
  const isCFO = currentUser?.role === 'CFO';
  const isAuditor = currentUser?.role === 'AUDITOR';
  const isBaseUser = currentUser?.role === 'BASE_USER';

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Top Header & Context Controls */}
      <div className="bg-paper-100 dark:bg-ink-900 border border-paper-200 dark:border-ink-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sage-100 dark:bg-sage-900/50 text-sage-600 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-ink-950 dark:text-paper-50">
                  Hospital General Ledger & Chart of Accounts
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-paper-200 dark:bg-ink-800 text-slate-500 font-mono">
                  4-Level Tally Hierarchy
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Root Categories → Groups → Sub-groups → Ledgers → Vouchers. All balances are rolled up dynamically.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Staged Overlay Toggle */}
            <button
              onClick={() => setShowStagedOverlay(!showStagedOverlay)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border ${
                showStagedOverlay
                  ? 'bg-amber-100 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                  : 'bg-paper-50 dark:bg-ink-950 border-paper-200 dark:border-ink-800 text-slate-500 hover:text-ink-950 dark:hover:text-paper-50'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showStagedOverlay ? 'Staged Overlay: ON' : 'Show Staged Overlay'}</span>
            </button>

            <button
              onClick={fetchLiveTree}
              className="p-2 text-slate-400 hover:text-ink-950 dark:hover:text-paper-50 hover:bg-paper-200 dark:hover:bg-ink-800 rounded-xl transition-colors"
              title="Refresh ledger"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* DEDICATED HOSPITAL SWITCHER TABS (CFO & Auditor with multi-hospital access) */}
        {(isCFO || (isAuditor && hospitals.length > 0) || hospitals.length > 1) && (
          <div className="space-y-1.5 pt-2 border-t border-paper-200 dark:border-ink-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isAuditor ? 'Authorized Hospital Facilities (Auditor Read-Only):' : 'Hospital Facilities Owned:'}
            </span>
            <div className="flex flex-wrap gap-2">
              {hospitals.map(h => {
                const isActive = h.id === selectedHospitalId;
                return (
                  <button
                    key={h.id}
                    onClick={() => setSelectedHospitalId(h.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                      isActive
                        ? 'bg-sage-500 text-white shadow-md'
                        : 'bg-paper-50 dark:bg-ink-950 hover:bg-paper-200 dark:hover:bg-ink-800 text-ink-950 dark:text-paper-50 border border-paper-200 dark:border-ink-800'
                    }`}
                  >
                    <Building2 className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-sage-600'}`} />
                    <span>{h.name}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isActive ? 'bg-sage-600 text-white' : 'bg-paper-200 dark:bg-ink-850 text-slate-500'}`}>
                      {h.code}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Auditor or Manager Active Facility Scope Display */}
        {(!isCFO && hospitals.length <= 1) && (
          <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-paper-50/70 dark:bg-ink-950/50 border border-paper-200 dark:border-ink-800/80">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sage-600" />
              <span>
                Active Facility: <strong className="text-ink-950 dark:text-paper-50">{currentHospital?.name || 'Authorized Hospital'}</strong> ({currentHospital?.code})
              </span>
            </div>

            <div className="text-slate-400 text-[11px]">
              {isAuditor ? 'Auditor Verified: Read-only access to live tree & vouchers' : 'Full Manager restructuring rights'}
            </div>
          </div>
        )}

        {/* Active Filter Pill if filtered from Analytics */}
        {preselectedGroup && (
          <div className="flex items-center justify-between p-2.5 bg-sage-50 dark:bg-sage-950/30 border border-sage-200 dark:border-sage-800 rounded-xl text-xs text-sage-800 dark:text-sage-200">
            <span className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-sage-600" />
              Filtered from Analytics: <strong>{preselectedGroup}</strong>
            </span>
            <button
              onClick={() => setPreselectedGroup(null)}
              className="text-[11px] font-semibold underline hover:text-sage-900 dark:hover:text-white"
            >
              Clear Filter
            </button>
          </div>
        )}
      </div>

      {/* Error / Guidance for Auditor without permission */}
      {errorMsg && (
        <div className="p-6 bg-coral-50 dark:bg-coral-950/30 border border-coral-200 dark:border-coral-900/50 rounded-2xl text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-debit-coral mx-auto" />
          <h3 className="text-sm font-bold text-debit-coral">{errorMsg}</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            If you are an Auditor, the CFO can grant access to specific hospitals under Tab 5 (Auditor Portal).
          </p>
        </div>
      )}

      {/* Ledger Tree View */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-paper-100 dark:bg-ink-900 rounded-2xl">
          Computing recursive ledger rollups...
        </div>
      ) : !errorMsg && (
        <LedgerTree
          roots={roots}
          isStagingView={false}
          hospitalId={selectedHospitalId}
          onRefresh={fetchLiveTree}
          selectedGroupFilter={preselectedGroup}
        />
      )}
    </div>
  );
};
