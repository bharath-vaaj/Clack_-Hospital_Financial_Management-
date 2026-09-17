import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  FileCheck,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  PlusCircle,
  HelpCircle,
  Lock,
  Layers,
  RefreshCw,
  FolderPlus,
  FileSpreadsheet,
  Link2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { LedgerTree, GroupNode } from '../ledger/LedgerTree';

export const TabIngestion: React.FC = () => {
  const { currentUser, selectedHospitalId, showToast, refreshKey, triggerRefresh } = useApp();
  const [stagedRoots, setStagedRoots] = useState<GroupNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle real file upload from local disk
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be re-selected
    e.target.value = '';
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    // Guess sample type from extension / name for demo routing
    let sampleType = 'daily_report';
    if (['pdf', 'png', 'jpg', 'jpeg'].includes(ext)) sampleType = 'daily_report';
    else if (file.name.toLowerCase().includes('pharm')) sampleType = 'pharmaceuticals';
    else if (file.name.toLowerCase().includes('surg')) sampleType = 'surgical';
    await handleUploadSample(sampleType, file.name);
  };

  // Case 2: Unmatched items queue ("Needs classification")
  const [unmatchedQueue, setUnmatchedQueue] = useState<any[]>([
    {
      id: 'unmatched-drone-1',
      entityName: 'Drone Delivery Fees',
      description: 'Urgent FAA Organ Transport Flight - AeroMed Logistics',
      amount: 4750.00,
      type: 'DEBIT',
      confidence: 0.41,
      sourceFile: 'AeroMed_Urgent_Dispatch.pdf',
      date: '2025-04-08'
    }
  ]);

  // Classification Modal State
  const [activeClassification, setActiveClassification] = useState<any | null>(null);
  const [classificationChoice, setClassificationChoice] = useState<'NEW_LEDGER' | 'NEW_SUBGROUP' | 'NEW_GROUP'>('NEW_LEDGER');
  const [targetSubgroupId, setTargetSubgroupId] = useState<string>('');
  const [targetGroupId, setTargetGroupId] = useState<string>('');
  const [targetRootGroupId, setTargetRootGroupId] = useState<string>('');
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [newSubgroupName, setNewSubgroupName] = useState<string>('');
  const [newLedgerName, setNewLedgerName] = useState<string>('');

  // Collect all existing ledgers so user can directly map items into existing accounts
  const allExistingLedgers: { id: string; name: string; subgroupName: string }[] = [];
  function collectLedgers(groups: GroupNode[]) {
    for (const g of groups) {
      if (g.children) {
        for (const sg of g.children) {
          if (sg.children) {
            for (const l of sg.children) {
              allExistingLedgers.push({ id: l.id, name: l.name, subgroupName: sg.name });
            }
          }
        }
      }
      if (g.subGroups) collectLedgers(g.subGroups);
    }
  }
  collectLedgers(stagedRoots);

  // Fetch staged tree
  const fetchStagedTree = useCallback(async () => {
    if (!selectedHospitalId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/ledger/tree?hospital_id=${selectedHospitalId}&status=STAGED&userId=${currentUser?.id}`, {
        headers: { 'X-User-Id': currentUser?.id || '' }
      });
      const data = await res.json();
      if (res.ok) {
        setStagedRoots(data.roots || []);
      }
    } catch (e: any) {
      console.error('Failed to load staged tree:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedHospitalId, currentUser]);

  useEffect(() => {
    fetchStagedTree();
  }, [fetchStagedTree, refreshKey]);

  // Upload daily financial report or invoice
  const handleUploadSample = async (sampleType: string, customFilename?: string) => {
    if (uploading) return;
    setUploading(true);
    setUploadProgress(15);

    const progressInterval = setInterval(() => {
      setUploadProgress(p => (p >= 90 ? 90 : p + 25));
    }, 200);

    try {
      const filename = customFilename || (sampleType === 'daily_report'
        ? `Daily_Financial_Summary_${new Date().toISOString().split('T')[0]}.xlsx`
        : `${sampleType}_invoice_${Date.now().toString().slice(-4)}.pdf`);

      const res = await fetch('/api/ingestion/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id || ''
        },
        body: JSON.stringify({
          hospitalId: selectedHospitalId,
          sampleType,
          filename
        })
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.unmatchedItems && data.unmatchedItems.length > 0) {
        setUnmatchedQueue(prev => [...prev, ...data.unmatchedItems]);
      }

      showToast(`Processed: ${data.stagedVouchers.length} mapped to existing accounts!`, 'success');
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        fetchStagedTree();
      }, 500);
    } catch (e: any) {
      clearInterval(progressInterval);
      setUploading(false);
      setUploadProgress(0);
      showToast(e.message, 'error');
    }
  };

  // Direct map unmatched item to existing ledger
  const handleMapToExistingLedger = async (item: any, existingLedgerId: string) => {
    if (!existingLedgerId) return;
    try {
      const res = await fetch('/api/vouchers/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id || ''
        },
        body: JSON.stringify({
          hospitalId: selectedHospitalId,
          ledgerId: existingLedgerId,
          voucherNumber: `VCH-${Date.now().toString().slice(-6)}`,
          date: item.date || new Date().toISOString().split('T')[0],
          description: item.description,
          amount: item.amount,
          type: item.type,
          status: 'STAGED'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUnmatchedQueue(prev => prev.filter(q => q.id !== item.id));
      showToast(`Mapped "${item.description}" to existing ledger account`, 'success');
      fetchStagedTree();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  // Submit Case 2 Classification
  const handleResolveClassification = async () => {
    if (!activeClassification) return;
    try {
      const res = await fetch('/api/ingestion/classify-entity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id || ''
        },
        body: JSON.stringify({
          hospitalId: selectedHospitalId,
          entityName: activeClassification.entityName,
          voucherData: activeClassification,
          choice: classificationChoice,
          targetSubgroupId,
          targetGroupId,
          targetRootGroupId,
          newGroupName,
          newSubgroupName,
          newLedgerName: newLedgerName || activeClassification.entityName
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUnmatchedQueue(prev => prev.filter(item => item.id !== activeClassification.id));
      setActiveClassification(null);
      showToast(data.message, 'success');
      fetchStagedTree();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  // Atomic Commit to Live Ledger
  const handleCommit = async () => {
    try {
      const res = await fetch('/api/ingestion/commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id || ''
        },
        body: JSON.stringify({ hospitalId: selectedHospitalId })
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          showToast(data.error, 'error');
          return;
        }
        throw new Error(data.error);
      }

      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      showToast(data.message, 'success');
      triggerRefresh();
      fetchStagedTree();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const totalStagedCount = stagedRoots.reduce((acc, r) => acc + r.staged_count, 0);
  const totalStagedDebit = stagedRoots.reduce((acc, r) => acc + r.debit_total, 0);

  const isBaseUser = currentUser?.role === 'BASE_USER';
  const isAuditor = currentUser?.role === 'AUDITOR';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-paper-100 dark:bg-ink-900 border border-paper-200 dark:border-ink-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-sage-100 dark:bg-sage-900/50 text-sage-600 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-ink-950 dark:text-paper-50">
                Daily Financial Reports & AI Ingestion Staging
              </h1>
            </div>
            <p className="mt-1 text-xs text-slate-500 max-w-2xl">
              Upload daily billing reports and vendor invoices. Items automatically merge into your existing accounts.
              Review and edit staged vouchers before atomic commit into the live ledger.
            </p>
          </div>

          {/* Commit Action Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={fetchStagedTree}
              className="p-2 text-slate-400 hover:text-ink-950 dark:hover:text-paper-50 hover:bg-paper-200 dark:hover:bg-ink-800 rounded-xl transition-colors"
              title="Refresh staging tree"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {isBaseUser ? (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-200 font-medium">
                <Lock className="w-4 h-4 text-amber-500" />
                <span>Base User: Manager Review Required</span>
              </div>
            ) : isAuditor ? (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-ink-800 text-xs text-slate-400">
                <Lock className="w-4 h-4" />
                <span>Auditor: Read-only Access</span>
              </div>
            ) : (
              <button
                onClick={handleCommit}
                disabled={totalStagedCount === 0 || uploading}
                className="flex items-center gap-2 px-5 py-2.5 bg-sage-500 hover:bg-sage-600 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-98"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Commit to Live Ledger ({totalStagedCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Upload Zone & Daily Report Selection */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="lg:col-span-2 border-2 border-dashed border-paper-300 dark:border-ink-700 hover:border-sage-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-paper-50/50 dark:bg-ink-950/40 cursor-pointer transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.txt"
              onChange={handleFileChange}
            />
            <UploadCloud className="w-9 h-9 text-sage-500 mb-2" />
            <span className="text-sm font-bold text-ink-950 dark:text-paper-50">
              Upload Daily Financial / Billing Report
            </span>
            <span className="text-xs text-slate-400 mt-1">
              Drop daily batch invoice, PDF, Excel (.xlsx), CSV, or clinical report here
            </span>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-3 py-1.5 bg-sage-500 hover:bg-sage-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Choose Local File
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUploadSample('daily_report');
                }}
                className="px-3 py-1.5 bg-paper-200 dark:bg-ink-800 hover:bg-paper-300 dark:hover:bg-ink-700 text-ink-950 dark:text-paper-50 font-semibold text-xs rounded-xl transition-colors"
              >
                Upload Daily Batch Preset
              </button>
            </div>

            {uploading && (
              <div className="w-full max-w-xs mt-3">
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span>Analyzing & matching into existing entities...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-paper-200 dark:bg-ink-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sage-500 transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-paper-200/50 dark:bg-ink-850 rounded-2xl border border-paper-200 dark:border-ink-800 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-ink-950 dark:text-paper-50 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-sage-600" /> Fast Document Presets
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                Upload realistic daily healthcare batches:
              </p>
            </div>
            <div className="grid grid-cols-1 gap-1.5 mt-3">
              <button
                onClick={() => handleUploadSample('pharmaceuticals')}
                disabled={uploading}
                className="px-2.5 py-1.5 text-left text-xs bg-paper-50 dark:bg-ink-900 hover:bg-sage-50 dark:hover:bg-sage-950/40 border border-paper-200 dark:border-ink-800 rounded-xl text-ink-950 dark:text-paper-50 transition-colors flex items-center justify-between"
              >
                <span>📦 B. Braun Pharmaceuticals</span>
                <span className="text-[10px] text-sage-600 font-semibold">Existing Match</span>
              </button>
              <button
                onClick={() => handleUploadSample('surgical')}
                disabled={uploading}
                className="px-2.5 py-1.5 text-left text-xs bg-paper-50 dark:bg-ink-900 hover:bg-sage-50 dark:hover:bg-sage-950/40 border border-paper-200 dark:border-ink-800 rounded-xl text-ink-950 dark:text-paper-50 transition-colors flex items-center justify-between"
              >
                <span>🔬 Stryker Surgical Implants</span>
                <span className="text-[10px] text-sage-600 font-semibold">Existing Match</span>
              </button>
              <button
                onClick={() => handleUploadSample('drone_delivery')}
                disabled={uploading}
                className="px-2.5 py-1.5 text-left text-xs bg-paper-50 dark:bg-ink-900 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-paper-200 dark:border-ink-800 rounded-xl text-ink-950 dark:text-paper-50 transition-colors flex items-center justify-between"
              >
                <span>🚁 AeroMed Drone Delivery</span>
                <span className="text-[10px] text-amber-500 font-semibold">Novel Entity</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CASE 2: "NEEDS CLASSIFICATION" PANEL (With Option to Map Directly into Existing Accounts) */}
      {unmatchedQueue.length > 0 && (
        <div className="bg-amber-50/60 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-900/60 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 rounded-lg animate-subtle-pulse">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  Needs Account Mapping ({unmatchedQueue.length})
                </h3>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  These items can either be attached to an existing ledger or classified as a new account.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {unmatchedQueue.map(item => (
              <div
                key={item.id}
                className="p-4 bg-paper-50 dark:bg-ink-900 border border-amber-200 dark:border-amber-900/50 rounded-2xl space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Unmatched Bill</span>
                    <h4 className="text-xs font-bold text-ink-950 dark:text-paper-50">{item.entityName}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-debit-coral tabular-nums">
                    -${Number(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Option to Quick-Map to an Existing Ledger */}
                <div className="pt-2 border-t border-paper-200 dark:border-ink-800 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1 font-medium">
                      <Link2 className="w-3 h-3 text-sage-600" /> Map to Existing Ledger:
                    </span>
                  </div>
                  <select
                    onChange={e => handleMapToExistingLedger(item, e.target.value)}
                    className="w-full p-2 bg-paper-100 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 rounded-xl text-xs font-medium"
                    defaultValue=""
                  >
                    <option value="" disabled>-- Select Existing Account --</option>
                    {allExistingLedgers.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.subgroupName})
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-400 font-mono text-[10px]">Or create new:</span>
                    <button
                      onClick={() => {
                        setActiveClassification(item);
                        setClassificationChoice('NEW_LEDGER');
                        setNewLedgerName(item.entityName);
                      }}
                      className="text-xs text-amber-600 font-bold hover:underline"
                    >
                      Classify New Account →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CASE 1: FULL INTERACTIVE STAGING TREE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sage-600" />
            <h2 className="text-sm font-bold text-ink-950 dark:text-paper-50">
              Staged Ledger Preview (Live Structure Mirror)
            </h2>
            <span className="text-xs text-slate-400">
              — {totalStagedCount} vouchers staged ({new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalStagedDebit)})
            </span>
          </div>

          <button
            onClick={fetchStagedTree}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-ink-950 dark:hover:text-paper-50"
          >
            <RefreshCw className="w-3 h-3" /> Refresh Preview
          </button>
        </div>

        {loading ? (
          <div className="p-16 text-center text-xs text-slate-400 bg-paper-100 dark:bg-ink-900 rounded-2xl">
            Loading staged ledger preview...
          </div>
        ) : totalStagedCount === 0 ? (
          <div className="p-8 text-center bg-paper-100 dark:bg-ink-900 border border-paper-200 dark:border-ink-800 rounded-2xl space-y-2">
            <CheckCircle className="w-8 h-8 text-sage-500 mx-auto" />
            <p className="text-sm font-semibold text-ink-950 dark:text-paper-50">Staging Queue is Clear</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              All daily report bills have been committed into the live ledger. Upload a report above to stage new entries.
            </p>
          </div>
        ) : (
          <LedgerTree
            roots={stagedRoots}
            isStagingView={true}
            hospitalId={selectedHospitalId}
            onRefresh={fetchStagedTree}
          />
        )}
      </div>

      {/* CASE 2 CLASSIFICATION MODAL */}
      <AnimatePresence>
        {activeClassification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-paper-50 dark:bg-ink-900 border border-paper-200 dark:border-ink-700 rounded-3xl shadow-2xl max-w-xl w-full p-6 space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-paper-200 dark:border-ink-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/40 text-amber-600 rounded-xl">
                    <FolderPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-ink-950 dark:text-paper-50">
                      Where does "{activeClassification.entityName}" belong?
                    </h3>
                    <p className="text-xs text-slate-400">
                      Select hierarchy location. Updates AI pgvector memory so future daily reports match automatically.
                    </p>
                  </div>
                </div>
                <button onClick={() => setActiveClassification(null)}>✕</button>
              </div>

              <div className="space-y-2">
                <label
                  onClick={() => setClassificationChoice('NEW_LEDGER')}
                  className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-colors ${
                    classificationChoice === 'NEW_LEDGER'
                      ? 'border-sage-500 bg-sage-50/50 dark:bg-sage-950/20'
                      : 'border-paper-200 dark:border-ink-800 hover:bg-paper-100 dark:hover:bg-ink-850'
                  }`}
                >
                  <input
                    type="radio"
                    name="choice"
                    checked={classificationChoice === 'NEW_LEDGER'}
                    onChange={() => setClassificationChoice('NEW_LEDGER')}
                    className="mt-1 text-sage-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-ink-950 dark:text-paper-50">
                      (a) Attach as new Ledger under an existing Sub-group
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Attaches under an operational subcategory (e.g. "Medical Gas & Plant Utilities").
                    </p>
                  </div>
                </label>

                <label
                  onClick={() => setClassificationChoice('NEW_SUBGROUP')}
                  className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-colors ${
                    classificationChoice === 'NEW_SUBGROUP'
                      ? 'border-sage-500 bg-sage-50/50 dark:bg-sage-950/20'
                      : 'border-paper-200 dark:border-ink-800 hover:bg-paper-100 dark:hover:bg-ink-850'
                  }`}
                >
                  <input
                    type="radio"
                    name="choice"
                    checked={classificationChoice === 'NEW_SUBGROUP'}
                    onChange={() => setClassificationChoice('NEW_SUBGROUP')}
                    className="mt-1 text-sage-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-ink-950 dark:text-paper-50">
                      (b) Create a new Sub-group under an existing Group
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Creates a new subcategory (e.g. "Specialized Aerial Logistics") under "Facility & Biomedical".
                    </p>
                  </div>
                </label>

                <label
                  onClick={() => setClassificationChoice('NEW_GROUP')}
                  className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-colors ${
                    classificationChoice === 'NEW_GROUP'
                      ? 'border-sage-500 bg-sage-50/50 dark:bg-sage-950/20'
                      : 'border-paper-200 dark:border-ink-800 hover:bg-paper-100 dark:hover:bg-ink-850'
                  }`}
                >
                  <input
                    type="radio"
                    name="choice"
                    checked={classificationChoice === 'NEW_GROUP'}
                    onChange={() => setClassificationChoice('NEW_GROUP')}
                    className="mt-1 text-sage-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-ink-950 dark:text-paper-50">
                      (c) Go all the way up and create a brand-new Group
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Select which of the 4 Roots (Expense, Income, Profit, Loss) it belongs to.
                    </p>
                  </div>
                </label>
              </div>

              <div className="p-4 bg-paper-100 dark:bg-ink-950 rounded-2xl border border-paper-200 dark:border-ink-800 space-y-3 text-xs">
                {classificationChoice === 'NEW_LEDGER' && (
                  <div>
                    <label className="block font-semibold text-slate-500 mb-1">Select Existing Sub-group:</label>
                    <select
                      value={targetSubgroupId}
                      onChange={e => setTargetSubgroupId(e.target.value)}
                      className="w-full p-2.5 bg-paper-50 dark:bg-ink-900 border border-paper-200 dark:border-ink-800 rounded-xl"
                    >
                      <option value="">-- Choose Sub-group --</option>
                      {stagedRoots.flatMap(r => r.subGroups || []).flatMap(g => g.children || []).map(sg => (
                        <option key={sg.id} value={sg.id}>{sg.name} ({sg.code})</option>
                      ))}
                    </select>
                  </div>
                )}

                {classificationChoice === 'NEW_SUBGROUP' && (
                  <div className="space-y-2">
                    <div>
                      <label className="block font-semibold text-slate-500 mb-1">Select Parent Group:</label>
                      <select
                        value={targetGroupId}
                        onChange={e => setTargetGroupId(e.target.value)}
                        className="w-full p-2.5 bg-paper-50 dark:bg-ink-900 border border-paper-200 dark:border-ink-800 rounded-xl"
                      >
                        <option value="">-- Choose Parent Group --</option>
                        {stagedRoots.flatMap(r => r.subGroups || []).map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-500 mb-1">New Sub-group Name:</label>
                      <input
                        type="text"
                        placeholder="e.g. Drone Logistics"
                        value={newSubgroupName}
                        onChange={e => setNewSubgroupName(e.target.value)}
                        className="w-full p-2 bg-paper-50 dark:bg-ink-900 border rounded-xl"
                      />
                    </div>
                  </div>
                )}

                {classificationChoice === 'NEW_GROUP' && (
                  <div className="space-y-2">
                    <div>
                      <label className="block font-semibold text-slate-500 mb-1">Root Category:</label>
                      <select
                        value={targetRootGroupId}
                        onChange={e => setTargetRootGroupId(e.target.value)}
                        className="w-full p-2.5 bg-paper-50 dark:bg-ink-900 border border-paper-200 dark:border-ink-800 rounded-xl font-bold"
                      >
                        <option value="">-- Select Root (Expense / Income / Profit / Loss) --</option>
                        {stagedRoots.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-500 mb-1">New Group Name:</label>
                      <input
                        type="text"
                        placeholder="e.g. Autonomous Transportation"
                        value={newGroupName}
                        onChange={e => setNewGroupName(e.target.value)}
                        className="w-full p-2 bg-paper-50 dark:bg-ink-900 border rounded-xl"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Ledger Title:</label>
                  <input
                    type="text"
                    value={newLedgerName}
                    onChange={e => setNewLedgerName(e.target.value)}
                    className="w-full p-2 bg-paper-50 dark:bg-ink-900 border rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setActiveClassification(null)}
                  className="px-4 py-2 text-xs text-slate-500 hover:bg-paper-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolveClassification}
                  className="px-5 py-2 text-xs font-bold text-white bg-sage-500 hover:bg-sage-600 rounded-xl shadow-md"
                >
                  Confirm & Update AI Memory
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
