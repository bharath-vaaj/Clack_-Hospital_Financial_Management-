import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  FileSpreadsheet,
  FileCode,
  Download,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  UserCheck,
  Building,
  KeyRound,
  Eye,
  History,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TabAuditor: React.FC = () => {
  const { currentUser, hospitals, selectedHospitalId, showToast, refreshKey, triggerRefresh } = useApp();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterAction, setFilterAction] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLogDiff, setSelectedLogDiff] = useState<any | null>(null);

  const isCFO = currentUser?.role === 'CFO';
  const isAuditor = currentUser?.role === 'AUDITOR';

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      let url = `/api/auditor/logs?hospitalId=${selectedHospitalId}&userId=${currentUser?.id}`;
      if (filterAction) url += `&action=${filterAction}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url, {
        headers: { 'X-User-Id': currentUser?.id || '' }
      });
      const data = await res.json();
      if (res.ok) {
        setLogs(data);
      }
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedHospitalId, filterAction, searchQuery, currentUser]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs, refreshKey]);

  // Handle Export Downloads
  const handleExport = (format: 'tally' | 'xlsx' | 'csv' | 'json') => {
    const url = `/api/auditor/export?hospital_id=${selectedHospitalId}&format=${format}&userId=${currentUser?.id}`;
    window.open(url, '_blank');
    showToast(`Downloading ledger export (${format.toUpperCase()})...`, 'info');
  };

  // CFO Toggles Auditor Access for a Hospital
  const handleToggleAuditorAccess = async (hospitalId: string, currentStatus: boolean) => {
    const auditorUser = { id: 'usr-aud-1' }; // Robert Langdon
    try {
      const res = await fetch('/api/auditor/access/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id || ''
        },
        body: JSON.stringify({
          auditorId: auditorUser.id,
          hospitalId,
          grant: !currentStatus
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Auditor access ${!currentStatus ? 'GRANTED' : 'REVOKED'} for hospital`, 'success');
      triggerRefresh();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-paper-100 dark:bg-ink-900 border border-paper-200 dark:border-ink-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sage-100 dark:bg-sage-900/40 text-sage-600 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-ink-950 dark:text-paper-50">
                Auditor Portal & Verified Audit Trail
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Cryptographically tracked immutable mutations. Every tree move, merge, rename, and voucher edit is recorded.
              </p>
            </div>
          </div>

          {/* Export Formats Suite */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 mr-1">Export Ledger:</span>
            <button
              onClick={() => handleExport('tally')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-paper-50 dark:bg-ink-950 hover:bg-sage-50 dark:hover:bg-sage-950/40 border border-paper-200 dark:border-ink-800 rounded-xl text-xs font-semibold text-ink-950 dark:text-paper-50 transition-colors"
            >
              <FileCode className="w-3.5 h-3.5 text-sage-600" />
              <span>Tally XML</span>
            </button>
            <button
              onClick={() => handleExport('xlsx')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-paper-50 dark:bg-ink-950 hover:bg-sage-50 dark:hover:bg-sage-950/40 border border-paper-200 dark:border-ink-800 rounded-xl text-xs font-semibold text-ink-950 dark:text-paper-50 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel (.xlsx)</span>
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-paper-50 dark:bg-ink-950 hover:bg-paper-200 dark:hover:bg-ink-850 border border-paper-200 dark:border-ink-800 rounded-xl text-xs font-semibold text-ink-950 dark:text-paper-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => handleExport('json')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-paper-50 dark:bg-ink-950 hover:bg-paper-200 dark:hover:bg-ink-850 border border-paper-200 dark:border-ink-800 rounded-xl text-xs font-semibold text-ink-950 dark:text-paper-50 transition-colors"
            >
              <FileCode className="w-3.5 h-3.5 text-amber-500" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* CFO Grant/Revoke Auditor Scoping Control Panel */}
        {isCFO && (
          <div className="pt-4 border-t border-paper-200 dark:border-ink-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-ink-950 dark:text-paper-50 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-sage-600" />
                CFO Auditor Hospital Grants (Robert Langdon — KPMG Partner)
              </span>
              <span className="text-slate-400">Auditors only see hospitals explicitly switched on by CFO</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {hospitals.map(h => {
                const hasAccess = Boolean(Number(h.has_auditor_access) > 0);
                return (
                  <div
                    key={h.id}
                    className="p-3 bg-paper-50 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-ink-950 dark:text-paper-50 block">{h.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{h.code}</span>
                    </div>

                    <button
                      onClick={() => handleToggleAuditorAccess(h.id, hasAccess)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                        hasAccess
                          ? 'bg-sage-100 dark:bg-sage-900/50 text-sage-700 dark:text-sage-300'
                          : 'bg-paper-200 dark:bg-ink-800 text-slate-400 hover:text-ink-950'
                      }`}
                    >
                      {hasAccess ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-sage-600" />
                          <span>Granted</span>
                        </>
                      ) : (
                        <span>Revoked</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-paper-100 dark:bg-ink-900 p-3 rounded-xl border border-paper-200 dark:border-ink-800">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by user, entity ID, or description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-paper-50 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-sage-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500">Action:</span>
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="bg-paper-50 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 rounded-lg px-2.5 py-1 text-xs text-ink-950 dark:text-paper-50 cursor-pointer"
          >
            <option value="">All Actions</option>
            <option value="MOVE">Tree Restructure (MOVE)</option>
            <option value="MERGE">Ledger MERGE</option>
            <option value="CREATE">Node CREATE</option>
            <option value="RENAME">Node RENAME</option>
            <option value="COMMIT">Batch COMMIT</option>
            <option value="EDIT">Voucher EDIT</option>
            <option value="SPLIT">Voucher SPLIT</option>
            <option value="DELETE">Node DELETE</option>
          </select>
        </div>
      </div>

      {/* Immutable Audit Log Table */}
      <div className="bg-paper-100 dark:bg-ink-900 border border-paper-200 dark:border-ink-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-paper-200 dark:border-ink-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-sage-600" />
            <h2 className="text-sm font-bold text-ink-950 dark:text-paper-50">
              Audit Entries ({logs.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Immutable append-only ledger</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading audit log entries...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No audit logs matching query.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-paper-200 dark:border-ink-800 text-slate-400 font-semibold bg-paper-200/40 dark:bg-ink-850">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-3">Actor / Role</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Entity Type</th>
                  <th className="py-2.5 px-3">Entity ID</th>
                  <th className="py-2.5 px-3">Facility</th>
                  <th className="py-2.5 px-3 text-right">State Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-200 dark:divide-ink-800/60">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-paper-50 dark:hover:bg-ink-850 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-semibold text-ink-950 dark:text-paper-50">{log.user_name}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{log.user_role}</span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                          log.action === 'COMMIT'
                            ? 'bg-sage-100 text-sage-700 dark:bg-sage-950/60 dark:text-sage-300'
                            : log.action === 'MOVE' || log.action === 'MERGE'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : log.action === 'DELETE'
                            ? 'bg-coral-100 text-coral-700 dark:bg-coral-950/60 dark:text-coral-300'
                            : 'bg-paper-200 text-slate-700 dark:bg-ink-800 dark:text-slate-300'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-600 dark:text-slate-300">
                      {log.entity_type}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-400 truncate max-w-[120px]">
                      {log.entity_id}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-medium">
                      {log.hospital_name}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedLogDiff(log)}
                        className="px-2 py-1 bg-paper-200 dark:bg-ink-800 hover:bg-sage-100 dark:hover:bg-sage-900/40 text-slate-600 dark:text-slate-300 hover:text-sage-600 text-[11px] font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect Diff</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* State Diff Modal */}
      {selectedLogDiff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-paper-50 dark:bg-ink-900 border border-paper-200 dark:border-ink-700 rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-paper-200 dark:border-ink-800">
              <div>
                <h3 className="text-base font-bold text-ink-950 dark:text-paper-50">
                  Audit Mutation Diff: {selectedLogDiff.action} on {selectedLogDiff.entity_type}
                </h3>
                <span className="text-xs text-slate-400">
                  Executed by {selectedLogDiff.user_name} ({selectedLogDiff.user_role}) at {new Date(selectedLogDiff.timestamp).toLocaleString()}
                </span>
              </div>
              <button onClick={() => setSelectedLogDiff(null)}>✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-paper-100 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 space-y-2">
                <span className="font-bold text-coral-600">Before State</span>
                <pre className="font-mono text-[10px] text-slate-600 dark:text-slate-300 overflow-x-auto">
                  {JSON.stringify(selectedLogDiff.before_state, null, 2) || 'None (Created)'}
                </pre>
              </div>

              <div className="p-3 rounded-xl bg-paper-100 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 space-y-2">
                <span className="font-bold text-sage-600">After State</span>
                <pre className="font-mono text-[10px] text-slate-600 dark:text-slate-300 overflow-x-auto">
                  {JSON.stringify(selectedLogDiff.after_state, null, 2) || 'None (Deleted)'}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLogDiff(null)}
                className="px-4 py-2 text-xs font-semibold bg-paper-200 dark:bg-ink-800 rounded-lg"
              >
                Close Inspector
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
