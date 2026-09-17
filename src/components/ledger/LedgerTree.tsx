import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  Plus,
  Move,
  GitMerge,
  Trash2,
  Edit2,
  DollarSign,
  AlertCircle,
  Sparkles,
  Scissors,
  CheckCircle2,
  Layers,
  Search,
  ArrowUpDown,
  Lock,
  Receipt,
  Tag
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface Voucher {
  id: string;
  voucher_number: string;
  date: string;
  description: string;
  amount: number | string;
  type: 'CREDIT' | 'DEBIT';
  status: 'STAGED' | 'APPROVED';
  source_file?: string;
  confidence_score?: number;
  metadata?: any;
}

export interface LedgerNode {
  id: string;
  name: string;
  code: string;
  type: 'LEDGER';
  level: 3;
  subgroup_id: string;
  debit_total: number;
  credit_total: number;
  balance: number;
  predominance?: 'CREDIT' | 'DEBIT';
  voucher_count: number;
  staged_count: number;
  vouchers: Voucher[];
}

export interface SubgroupNode {
  id: string;
  name: string;
  code: string;
  type: 'SUBGROUP';
  level: 2;
  group_id: string;
  debit_total: number;
  credit_total: number;
  balance: number;
  voucher_count: number;
  staged_count: number;
  children: LedgerNode[];
}

export interface GroupNode {
  id: string;
  name: string;
  code: string;
  type: 'GROUP';
  level: 0 | 1;
  is_root: boolean;
  parent_id?: string | null;
  debit_total: number;
  credit_total: number;
  balance: number;
  voucher_count: number;
  staged_count: number;
  children: SubgroupNode[];
  subGroups?: GroupNode[];
}

interface LedgerTreeProps {
  roots: GroupNode[];
  isStagingView?: boolean;
  hospitalId: string;
  onRefresh?: () => void;
  selectedGroupFilter?: string | null;
}

export const LedgerTree: React.FC<LedgerTreeProps> = ({
  roots,
  isStagingView = false,
  hospitalId,
  onRefresh,
  selectedGroupFilter
}) => {
  const { currentUser, showToast } = useApp();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['grp-hosp-1-root-exp']));
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Auto-expand nodes and filter when selectedGroupFilter is set from Analytics
  useEffect(() => {
    if (selectedGroupFilter && roots.length > 0) {
      const target = selectedGroupFilter.toLowerCase();
      const toExpand = new Set<string>();

      roots.forEach(root => {
        toExpand.add(root.id);
        root.subGroups?.forEach(group => {
          const groupMatch = (group.name || '').toLowerCase().includes(target) || (group.code || '').toLowerCase().includes(target);
          if (groupMatch) {
            toExpand.add(group.id);
            group.children?.forEach(sg => toExpand.add(sg.id));
          }
          group.children?.forEach(sg => {
            const sgMatch = (sg.name || '').toLowerCase().includes(target) || (sg.code || '').toLowerCase().includes(target);
            if (sgMatch) {
              toExpand.add(group.id);
              toExpand.add(sg.id);
            }
            sg.children?.forEach(l => {
              if ((l.name || '').toLowerCase().includes(target) || (l.code || '').toLowerCase().includes(target)) {
                toExpand.add(group.id);
                toExpand.add(sg.id);
              }
            });
          });
        });
      });

      setExpandedNodes(prev => {
        const next = new Set(prev);
        toExpand.forEach(id => next.add(id));
        return next;
      });

      setSearchTerm(selectedGroupFilter);
    }
  }, [selectedGroupFilter, roots]);

  // Modals state
  const [activeModal, setActiveModal] = useState<{
    type: 'ADD' | 'ADD_VOUCHER' | 'MOVE' | 'MERGE' | 'DELETE' | 'EDIT_NODE' | 'SPLIT_VOUCHER' | 'EDIT_VOUCHER';
    node?: any;
    targetLedger?: any;
  } | null>(null);

  // Move Modal State
  const [moveTargetParentId, setMoveTargetParentId] = useState<string>('');

  // Merge Modal State
  const [mergeTargetLedgerId, setMergeTargetLedgerId] = useState<string>('');

  // Add Node Modal State
  const [newNodeName, setNewNodeName] = useState<string>('');
  const [newNodeCode, setNewNodeCode] = useState<string>('');
  const [newNodeType, setNewNodeType] = useState<'GROUP' | 'SUBGROUP' | 'LEDGER'>('SUBGROUP');
  const [newNodeParentId, setNewNodeParentId] = useState<string>('');

  // Edit Node Modal State (Edit name & code for Group, Subgroup, Ledger)
  const [editNodeName, setEditNodeName] = useState<string>('');
  const [editNodeCode, setEditNodeCode] = useState<string>('');

  // Add Voucher / Receipt State
  const [newVoucherData, setNewVoucherData] = useState({
    voucherNumber: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    type: 'DEBIT' as 'CREDIT' | 'DEBIT',
    ledgerId: ''
  });

  // Edit Voucher State
  const [editVoucherData, setEditVoucherData] = useState({
    id: '',
    voucherNumber: '',
    date: '',
    description: '',
    amount: 0,
    type: 'DEBIT' as 'CREDIT' | 'DEBIT',
    ledgerId: ''
  });

  // Voucher Split State
  const [splitData, setSplitData] = useState({
    amount1: 0,
    desc1: '',
    ledger1: '',
    amount2: 0,
    desc2: '',
    ledger2: ''
  });

  // Delete Confirmation State
  const [deleteWarning, setDeleteWarning] = useState<{
    blocked: boolean;
    voucherCount: number;
    totalValue: number;
    message: string;
  } | null>(null);

  const canEdit = currentUser?.role === 'CFO' || currentUser?.role === 'MANAGER';
  const isAuditor = currentUser?.role === 'AUDITOR';

  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Collect all ledgers for dropdowns
  const allLedgers: { id: string; name: string; subgroupName: string }[] = [];
  function collectLedgers(groups: GroupNode[]) {
    for (const g of groups) {
      if (g.children) {
        for (const sg of g.children) {
          if (sg.children) {
            for (const l of sg.children) {
              allLedgers.push({ id: l.id, name: l.name, subgroupName: sg.name });
            }
          }
        }
      }
      if (g.subGroups) collectLedgers(g.subGroups);
    }
  }
  collectLedgers(roots);

  const fmt = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(num);
  };

  // Handler: Add Node (Group, Sub-group, Ledger)
  const handleAddConfirm = async () => {
    if (!newNodeName.trim()) return;
    try {
      const res = await fetch('/api/ledger/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id || ''
        },
        body: JSON.stringify({
          nodeType: newNodeType,
          parentId: newNodeParentId || activeModal?.node?.id,
          name: newNodeName.trim(),
          code: newNodeCode.trim() || undefined,
          hospitalId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Created ${newNodeType}: "${data.name}"`, 'success');
      setActiveModal(null);
      setNewNodeName('');
      setNewNodeCode('');
      if (onRefresh) onRefresh();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  // Handler: Edit Node (Group, Sub-group, Ledger)
  const handleEditNodeConfirm = async () => {
    if (!activeModal?.node || !editNodeName.trim()) return;
    try {
      const res = await fetch('/api/ledger/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id || ''
        },
        body: JSON.stringify({
          nodeId: activeModal.node.id,
          nodeType: activeModal.node.type,
          name: editNodeName.trim(),
          code: editNodeCode.trim() || undefined,
          hospitalId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Updated ${activeModal.node.type}: "${editNodeName}"`, 'success');
      setActiveModal(null);
      if (onRefresh) onRefresh();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  // Handler: Add Voucher / Receipt
  const handleAddVoucherConfirm = async () => {
    if (!newVoucherData.description.trim() || !newVoucherData.amount || !newVoucherData.ledgerId) {
      showToast('Please enter description, amount, and select a ledger', 'warning');
      return;
    }
    try {
      const res = await fetch('/api/vouchers/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id || ''
        },
        body: JSON.stringify({
          hospitalId,
          ledgerId: newVoucherData.ledgerId,
          voucherNumber: newVoucherData.voucherNumber,
          date: newVoucherData.date,
          description: newVoucherData.description.trim(),
          amount: Number(newVoucherData.amount),
          type: newVoucherData.type
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Voucher created (${data.voucherNumber})`, 'success');
      setActiveModal(null);
      setNewVoucherData({
        voucherNumber: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        type: 'DEBIT',
        ledgerId: ''
      });
      if (onRefresh) onRefresh();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  // Handler: Edit Voucher
  const handleEditVoucherConfirm = async () => {
    try {
      const res = await fetch('/api/vouchers/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id || ''
        },
        body: JSON.stringify({
          id: editVoucherData.id,
          amount: Number(editVoucherData.amount),
          description: editVoucherData.description,
          date: editVoucherData.date,
          type: editVoucherData.type,
          ledgerId: editVoucherData.ledgerId,
          hospitalId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Voucher updated successfully`, 'success');
      setActiveModal(null);
      if (onRefresh) onRefresh();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  // Handler: Move Node
  const handleMoveConfirm = async () => {
    if (!activeModal?.node || !moveTargetParentId) return;
    try {
      const res = await fetch('/api/ledger/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id || ''
        },
        body: JSON.stringify({
          nodeId: activeModal.node.id,
          nodeType: activeModal.node.type,
          newParentId: moveTargetParentId,
          hospitalId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Successfully moved ${activeModal.node.name}`, 'success');
      setActiveModal(null);
      if (onRefresh) onRefresh();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  // Handler: Merge Ledgers
  const handleMergeConfirm = async () => {
    if (!activeModal?.node || !mergeTargetLedgerId) return;
    try {
      const res = await fetch('/api/ledger/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id || ''
        },
        body: JSON.stringify({
          sourceLedgerId: activeModal.node.id,
          targetLedgerId: mergeTargetLedgerId,
          hospitalId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message, 'success');
      setActiveModal(null);
      if (onRefresh) onRefresh();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  // Handler: Delete Node
  const handleDeleteConfirm = async (force = false) => {
    if (!activeModal?.node) return;
    try {
      const res = await fetch('/api/ledger/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id || ''
        },
        body: JSON.stringify({
          nodeId: activeModal.node.id,
          nodeType: activeModal.node.type,
          hospitalId,
          force
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.blocked) {
        setDeleteWarning(data);
        return;
      }

      showToast(`Node deleted successfully`, 'success');
      setActiveModal(null);
      setDeleteWarning(null);
      if (onRefresh) onRefresh();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  // Handler: Delete Voucher
  const handleDeleteVoucher = async (vId: string) => {
    if (!confirm('Are you sure you want to delete this voucher entry?')) return;
    try {
      const res = await fetch(`/api/vouchers/${vId}`, {
        method: 'DELETE',
        headers: { 'X-User-Id': currentUser?.id || '' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Voucher deleted`, 'info');
      if (onRefresh) onRefresh();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  // Preserve complete tree structure; selectedGroupFilter auto-expands & highlights via searchTerm
  const displayedRoots = roots;

  return (
    <div className="space-y-4">
      {/* Top Search, Add Root Action, & Credit/Debit Badges Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-paper-100 dark:bg-ink-900 p-3 rounded-2xl border border-paper-200 dark:border-ink-800">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search chart of accounts, ledgers, vouchers..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-paper-50 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-sage-500"
          />
        </div>

        {/* Action Controls for CFO and Manager */}
        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveModal({ type: 'ADD' });
                setNewNodeType('GROUP');
                setNewNodeParentId(roots[0]?.id || '');
                setNewNodeName('');
                setNewNodeCode('');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sage-500 hover:bg-sage-600 text-white font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Group</span>
            </button>

            <button
              onClick={() => {
                setActiveModal({ type: 'ADD_VOUCHER' });
                setNewVoucherData({
                  voucherNumber: `VCH-${Date.now().toString().slice(-6)}`,
                  date: new Date().toISOString().split('T')[0],
                  description: '',
                  amount: '',
                  type: 'DEBIT',
                  ledgerId: allLedgers[0]?.id || ''
                });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-paper-50 dark:bg-ink-950 hover:bg-sage-50 dark:hover:bg-sage-950/40 border border-paper-200 dark:border-ink-800 text-ink-950 dark:text-paper-50 font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              <Receipt className="w-3.5 h-3.5 text-sage-600" />
              <span>Add Receipt / Voucher</span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sage-100 dark:bg-sage-950/50 text-sage-700 dark:text-sage-300 font-bold text-[11px]">
            + CR Credit / Inflow
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-coral-100 dark:bg-coral-950/50 text-coral-700 dark:text-coral-300 font-bold text-[11px]">
            - DR Debit / Outflow
          </span>
        </div>
      </div>

      {/* The 4-Level Interactive Tree */}
      <div className="space-y-3">
        {displayedRoots.map(rootGroup => (
          <div
            key={rootGroup.id}
            className="bg-paper-100 dark:bg-ink-900/90 rounded-2xl border border-paper-200 dark:border-ink-800/80 shadow-sm overflow-hidden"
          >
            {/* LEVEL 0: ROOT CATEGORY (Expense, Income, Profit, Loss) */}
            <div
              onClick={() => toggleExpand(rootGroup.id)}
              className="flex items-center justify-between px-4 py-3.5 bg-paper-200/60 dark:bg-ink-850 cursor-pointer hover:bg-paper-200 dark:hover:bg-ink-800 transition-colors border-b border-paper-200/80 dark:border-ink-800"
            >
              <div className="flex items-center gap-3">
                <button className="text-slate-400 hover:text-ink-950 dark:hover:text-paper-50">
                  {expandedNodes.has(rootGroup.id) ? (
                    <ChevronDown className="w-5 h-5 text-sage-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </button>
                <div className="w-2.5 h-2.5 rounded-full bg-sage-500 shadow-sm"></div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base tracking-tight text-ink-950 dark:text-paper-50">
                      {rootGroup.name}
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wider rounded bg-sage-100 dark:bg-sage-900/40 text-sage-700 dark:text-sage-300">
                      ROOT
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{rootGroup.code}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Rollup Summary with Explicit CR and DR breakdown */}
                <div className="text-right flex items-center gap-3">
                  {rootGroup.credit_total > 0 && (
                    <div className="px-2 py-0.5 rounded bg-sage-50 dark:bg-sage-950/40 text-sage-600 font-mono text-xs font-bold tabular-nums">
                      + CR {fmt(rootGroup.credit_total)}
                    </div>
                  )}
                  {rootGroup.debit_total > 0 && (
                    <div className="px-2 py-0.5 rounded bg-coral-50 dark:bg-coral-950/40 text-debit-coral font-mono text-xs font-bold tabular-nums">
                      - DR {fmt(rootGroup.debit_total)}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-400 font-medium">
                    {rootGroup.voucher_count} vouchers
                  </div>
                </div>

                {canEdit && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveModal({ type: 'ADD', node: rootGroup });
                        setNewNodeType('GROUP');
                        setNewNodeParentId(rootGroup.id);
                        setNewNodeName('');
                        setNewNodeCode('');
                      }}
                      title="Add Group under this Root"
                      className="p-1.5 text-slate-400 hover:text-sage-600 rounded-lg hover:bg-paper-300/60 dark:hover:bg-ink-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveModal({ type: 'EDIT_NODE', node: rootGroup });
                        setEditNodeName(rootGroup.name);
                        setEditNodeCode(rootGroup.code);
                      }}
                      title="Rename / Edit Root Category"
                      className="p-1.5 text-slate-400 hover:text-ink-950 dark:hover:text-paper-50 rounded-lg hover:bg-paper-300/60 dark:hover:bg-ink-700 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* LEVEL 1: GROUPS UNDER ROOT */}
            <AnimatePresence>
              {expandedNodes.has(rootGroup.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="divide-y divide-paper-200/50 dark:divide-ink-800/50"
                >
                  {rootGroup.subGroups?.map(group => (
                    <GroupItem
                      key={group.id}
                      group={group}
                      expandedNodes={expandedNodes}
                      toggleExpand={toggleExpand}
                      canEdit={canEdit}
                      isAuditor={isAuditor}
                      fmt={fmt}
                      onAddSubgroup={() => {
                        setActiveModal({ type: 'ADD', node: group });
                        setNewNodeType('SUBGROUP');
                        setNewNodeParentId(group.id);
                        setNewNodeName('');
                        setNewNodeCode('');
                      }}
                      onEditGroup={() => {
                        setActiveModal({ type: 'EDIT_NODE', node: group });
                        setEditNodeName(group.name);
                        setEditNodeCode(group.code);
                      }}
                      onMoveGroup={() => {
                        setActiveModal({ type: 'MOVE', node: group });
                        setMoveTargetParentId(group.parent_id || rootGroup.id);
                      }}
                      onDeleteGroup={() => {
                        setActiveModal({ type: 'DELETE', node: group });
                        setDeleteWarning(null);
                      }}
                      onSubgroupAction={(action, sg) => {
                        if (action === 'ADD_LEDGER') {
                          setActiveModal({ type: 'ADD', node: sg });
                          setNewNodeType('LEDGER');
                          setNewNodeParentId(sg.id);
                          setNewNodeName('');
                          setNewNodeCode('');
                        } else if (action === 'EDIT') {
                          setActiveModal({ type: 'EDIT_NODE', node: sg });
                          setEditNodeName(sg.name);
                          setEditNodeCode(sg.code);
                        } else if (action === 'MOVE') {
                          setActiveModal({ type: 'MOVE', node: sg });
                          setMoveTargetParentId(sg.group_id);
                        } else if (action === 'DELETE') {
                          setActiveModal({ type: 'DELETE', node: sg });
                          setDeleteWarning(null);
                        }
                      }}
                      onLedgerAction={(action, ledger) => {
                        if (action === 'ADD_VOUCHER') {
                          setActiveModal({ type: 'ADD_VOUCHER', targetLedger: ledger });
                          setNewVoucherData({
                            voucherNumber: `VCH-${Date.now().toString().slice(-6)}`,
                            date: new Date().toISOString().split('T')[0],
                            description: '',
                            amount: '',
                            type: 'DEBIT',
                            ledgerId: ledger.id
                          });
                        } else if (action === 'EDIT') {
                          setActiveModal({ type: 'EDIT_NODE', node: ledger });
                          setEditNodeName(ledger.name);
                          setEditNodeCode(ledger.code);
                        } else if (action === 'MOVE') {
                          setActiveModal({ type: 'MOVE', node: ledger });
                          setMoveTargetParentId(ledger.subgroup_id);
                        } else if (action === 'MERGE') {
                          setActiveModal({ type: 'MERGE', node: ledger });
                          setMergeTargetLedgerId('');
                        } else if (action === 'DELETE') {
                          setActiveModal({ type: 'DELETE', node: ledger });
                          setDeleteWarning(null);
                        }
                      }}
                      onVoucherAction={(action, v, ledger) => {
                        if (action === 'EDIT') {
                          setActiveModal({ type: 'EDIT_VOUCHER', node: v });
                          setEditVoucherData({
                            id: v.id,
                            voucherNumber: v.voucher_number,
                            date: v.date,
                            description: v.description,
                            amount: Number(v.amount),
                            type: v.type,
                            ledgerId: ledger.id
                          });
                        } else if (action === 'SPLIT') {
                          setActiveModal({ type: 'SPLIT_VOUCHER', node: v });
                          const amt = Number(v.amount);
                          setSplitData({
                            amount1: Math.round(amt * 0.6),
                            desc1: `${v.description} (Part 1)`,
                            ledger1: ledger.id,
                            amount2: Math.round(amt * 0.4),
                            desc2: `${v.description} (Part 2)`,
                            ledger2: ledger.id
                          });
                        } else if (action === 'DELETE') {
                          handleDeleteVoucher(v.id);
                        }
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* COMPREHENSIVE MODALS: ADD NODE, ADD VOUCHER, EDIT NODE, EDIT VOUCHER, MOVE, MERGE, DELETE */}
      {/* ========================================================================= */}

      {/* 1. ADD NODE MODAL (Group, Sub-group, Ledger) */}
      <AnimatePresence>
        {activeModal?.type === 'ADD' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-paper-50 dark:bg-ink-900 border border-paper-200 dark:border-ink-700 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-paper-200 dark:border-ink-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-sage-100 dark:bg-sage-900/40 text-sage-600 rounded-xl">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-ink-950 dark:text-paper-50">
                      Add New {newNodeType}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {activeModal.node ? `Under "${activeModal.node.name}"` : 'Chart of accounts tree'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-ink-950">✕</button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Entity Level:</label>
                  <select
                    value={newNodeType}
                    onChange={e => setNewNodeType(e.target.value as any)}
                    className="w-full p-2.5 bg-paper-100 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 rounded-xl font-bold"
                  >
                    <option value="GROUP">Group (Department / Major Function)</option>
                    <option value="SUBGROUP">Sub-group (Operational Category)</option>
                    <option value="LEDGER">Ledger (Accounting Line Account)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Account Title / Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Specialty Clinical Consumables"
                    value={newNodeName}
                    onChange={e => setNewNodeName(e.target.value)}
                    className="w-full p-2.5 bg-paper-100 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 rounded-xl focus:ring-1 focus:ring-sage-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Account Code (Optional):</label>
                  <input
                    type="text"
                    placeholder="e.g. PHARM-CNS-01"
                    value={newNodeCode}
                    onChange={e => setNewNodeCode(e.target.value)}
                    className="w-full p-2.5 bg-paper-100 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 rounded-xl focus:ring-1 focus:ring-sage-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-500 hover:bg-paper-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddConfirm}
                  disabled={!newNodeName.trim()}
                  className="px-5 py-2 text-xs font-bold text-white bg-sage-500 hover:bg-sage-600 disabled:opacity-40 rounded-xl shadow-md"
                >
                  Create {newNodeType}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. ADD VOUCHER / RECEIPT DIRECTLY UNDER LEDGER */}
      <AnimatePresence>
        {activeModal?.type === 'ADD_VOUCHER' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-paper-50 dark:bg-ink-900 border border-paper-200 dark:border-ink-700 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-paper-200 dark:border-ink-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-sage-100 dark:bg-sage-900/40 text-sage-600 rounded-xl">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-ink-950 dark:text-paper-50">
                      Add New Voucher / Receipt
                    </h3>
                    <p className="text-xs text-slate-400">
                      Record an expense or revenue directly into a ledger
                    </p>
                  </div>
                </div>
                <button onClick={() => setActiveModal(null)}>✕</button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-500 mb-1">Transaction Type:</label>
                    <select
                      value={newVoucherData.type}
                      onChange={e => setNewVoucherData({ ...newVoucherData, type: e.target.value as any })}
                      className="w-full p-2.5 bg-paper-100 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 rounded-xl font-bold"
                    >
                      <option value="DEBIT">Debit (Expense / Outflow)</option>
                      <option value="CREDIT">Credit (Revenue / Inflow)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-500 mb-1">Amount ($):</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={newVoucherData.amount}
                      onChange={e => setNewVoucherData({ ...newVoucherData, amount: e.target.value })}
                      className="w-full p-2.5 bg-paper-100 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Target Ledger Account:</label>
                  <select
                    value={newVoucherData.ledgerId}
                    onChange={e => setNewVoucherData({ ...newVoucherData, ledgerId: e.target.value })}
                    className="w-full p-2.5 bg-paper-100 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 rounded-xl font-semibold"
                  >
                    <option value="">-- Select Ledger --</option>
                    {allLedgers.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.subgroupName})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Description / Narration:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sterile Syringes 10ml order - McKesson"
                    value={newVoucherData.description}
                    onChange={e => setNewVoucherData({ ...newVoucherData, description: e.target.value })}
                    className="w-full p-2.5 bg-paper-100 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-500 mb-1">Date:</label>
                    <input
                      type="date"
                      value={newVoucherData.date}
                      onChange={e => setNewVoucherData({ ...newVoucherData, date: e.target.value })}
                      className="w-full p-2 bg-paper-100 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-500 mb-1">Voucher Number:</label>
                    <input
                      type="text"
                      value={newVoucherData.voucherNumber}
                      onChange={e => setNewVoucherData({ ...newVoucherData, voucherNumber: e.target.value })}
                      className="w-full p-2 bg-paper-100 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-500 hover:bg-paper-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddVoucherConfirm}
                  disabled={!newVoucherData.description || !newVoucherData.amount}
                  className="px-5 py-2 text-xs font-bold text-white bg-sage-500 hover:bg-sage-600 disabled:opacity-40 rounded-xl shadow-md"
                >
                  Save Voucher
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. EDIT NODE MODAL (Group, Sub-group, Ledger) */}
      <AnimatePresence>
        {activeModal?.type === 'EDIT_NODE' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-paper-50 dark:bg-ink-900 border border-paper-200 dark:border-ink-700 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-paper-200 dark:border-ink-800">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-sage-600" />
                  <h3 className="text-base font-bold text-ink-950 dark:text-paper-50">
                    Edit {activeModal.node.type}: "{activeModal.node.name}"
                  </h3>
                </div>
                <button onClick={() => setActiveModal(null)}>✕</button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Title / Name:</label>
                  <input
                    type="text"
                    value={editNodeName}
                    onChange={e => setEditNodeName(e.target.value)}
                    className="w-full p-2.5 bg-paper-100 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Code:</label>
                  <input
                    type="text"
                    value={editNodeCode}
                    onChange={e => setEditNodeCode(e.target.value)}
                    className="w-full p-2.5 bg-paper-100 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-500 hover:bg-paper-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditNodeConfirm}
                  className="px-5 py-2 text-xs font-bold text-white bg-sage-500 hover:bg-sage-600 rounded-xl shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. EDIT VOUCHER MODAL (Amounts, Descriptions, Date, Type, Assigned Ledger) */}
      <AnimatePresence>
        {activeModal?.type === 'EDIT_VOUCHER' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-paper-50 dark:bg-ink-900 border border-paper-200 dark:border-ink-700 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-paper-200 dark:border-ink-800">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-sage-600" />
                  <h3 className="text-base font-bold text-ink-950 dark:text-paper-50">
                    Edit Voucher Data ({editVoucherData.voucherNumber})
                  </h3>
                </div>
                <button onClick={() => setActiveModal(null)}>✕</button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-500 mb-1">Transaction Type:</label>
                    <select
                      value={editVoucherData.type}
                      onChange={e => setEditVoucherData({ ...editVoucherData, type: e.target.value as any })}
                      className="w-full p-2.5 bg-paper-100 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 rounded-xl font-bold"
                    >
                      <option value="DEBIT">Debit (- DR Outflow)</option>
                      <option value="CREDIT">Credit (+ CR Inflow)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-500 mb-1">Amount ($):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editVoucherData.amount}
                      onChange={e => setEditVoucherData({ ...editVoucherData, amount: Number(e.target.value) })}
                      className="w-full p-2.5 bg-paper-100 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Description / Narration:</label>
                  <input
                    type="text"
                    value={editVoucherData.description}
                    onChange={e => setEditVoucherData({ ...editVoucherData, description: e.target.value })}
                    className="w-full p-2.5 bg-paper-100 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-500 mb-1">Date:</label>
                    <input
                      type="date"
                      value={editVoucherData.date}
                      onChange={e => setEditVoucherData({ ...editVoucherData, date: e.target.value })}
                      className="w-full p-2 bg-paper-100 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-500 mb-1">Assigned Ledger Account:</label>
                    <select
                      value={editVoucherData.ledgerId}
                      onChange={e => setEditVoucherData({ ...editVoucherData, ledgerId: e.target.value })}
                      className="w-full p-2 bg-paper-100 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 rounded-xl font-medium"
                    >
                      {allLedgers.map(l => (
                        <option key={l.id} value={l.id}>{l.name} ({l.subgroupName})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-500 hover:bg-paper-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditVoucherConfirm}
                  className="px-5 py-2 text-xs font-bold text-white bg-sage-500 hover:bg-sage-600 rounded-xl shadow-md"
                >
                  Save Corrections
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. MOVE NODE MODAL */}
      <AnimatePresence>
        {activeModal?.type === 'MOVE' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-paper-50 dark:bg-ink-900 border border-paper-200 dark:border-ink-700 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-paper-200 dark:border-ink-800">
                <div className="flex items-center gap-2">
                  <Move className="w-5 h-5 text-sage-600" />
                  <h3 className="text-base font-bold text-ink-950 dark:text-paper-50">
                    Move {activeModal.node.type}: "{activeModal.node.name}"
                  </h3>
                </div>
                <button onClick={() => setActiveModal(null)}>✕</button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 p-3 bg-paper-100 dark:bg-ink-950 rounded-2xl border border-paper-200 dark:border-ink-800">
                {activeModal.node.type === 'LEDGER' && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500 mb-2">Select Target Sub-group:</p>
                    {roots.flatMap(r => r.subGroups || []).flatMap(g => g.children || []).map(sg => (
                      <div
                        key={sg.id}
                        onClick={() => setMoveTargetParentId(sg.id)}
                        className={`flex items-center justify-between p-2 rounded-xl cursor-pointer text-xs transition-colors ${
                          moveTargetParentId === sg.id
                            ? 'bg-sage-500 text-white font-semibold'
                            : 'hover:bg-paper-200 dark:hover:bg-ink-850'
                        }`}
                      >
                        <span className="flex items-center gap-2"><Folder className="w-3.5 h-3.5 opacity-70" />{sg.name}</span>
                        <span className="font-mono text-[10px] opacity-75">{sg.code}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeModal.node.type === 'SUBGROUP' && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500 mb-2">Select Target Group:</p>
                    {roots.flatMap(r => r.subGroups || []).map(g => (
                      <div
                        key={g.id}
                        onClick={() => setMoveTargetParentId(g.id)}
                        className={`flex items-center justify-between p-2 rounded-xl cursor-pointer text-xs transition-colors ${
                          moveTargetParentId === g.id
                            ? 'bg-sage-500 text-white font-semibold'
                            : 'hover:bg-paper-200 dark:hover:bg-ink-850'
                        }`}
                      >
                        <span className="flex items-center gap-2"><FolderOpen className="w-3.5 h-3.5 opacity-70" />{g.name}</span>
                        <span className="font-mono text-[10px] opacity-75">{g.code}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeModal.node.type === 'GROUP' && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500 mb-2">Select Target Root Category:</p>
                    {roots.map(r => (
                      <div
                        key={r.id}
                        onClick={() => setMoveTargetParentId(r.id)}
                        className={`flex items-center justify-between p-2 rounded-xl cursor-pointer text-xs transition-colors ${
                          moveTargetParentId === r.id
                            ? 'bg-sage-500 text-white font-semibold'
                            : 'hover:bg-paper-200 dark:hover:bg-ink-850'
                        }`}
                      >
                        <span className="font-bold">{r.name}</span>
                        <span className="font-mono text-[10px] opacity-75">{r.code}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-500 hover:bg-paper-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMoveConfirm}
                  disabled={!moveTargetParentId}
                  className="px-5 py-2 text-xs font-bold text-white bg-sage-500 hover:bg-sage-600 disabled:opacity-40 rounded-xl shadow-md"
                >
                  Confirm Relocation
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. MERGE LEDGERS MODAL */}
      <AnimatePresence>
        {activeModal?.type === 'MERGE' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-paper-50 dark:bg-ink-900 border border-paper-200 dark:border-ink-700 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-paper-200 dark:border-ink-800">
                <div className="flex items-center gap-2">
                  <GitMerge className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-bold text-ink-950 dark:text-paper-50">
                    Merge Ledger: "{activeModal.node.name}"
                  </h3>
                </div>
                <button onClick={() => setActiveModal(null)}>✕</button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Pick Surviving Destination Ledger:
                </label>
                <select
                  value={mergeTargetLedgerId}
                  onChange={e => setMergeTargetLedgerId(e.target.value)}
                  className="w-full p-2.5 text-xs bg-paper-100 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 rounded-xl focus:ring-1 focus:ring-sage-500"
                >
                  <option value="">-- Select surviving target ledger --</option>
                  {allLedgers
                    .filter(l => l.id !== activeModal.node.id)
                    .map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.subgroupName})</option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-xs text-slate-500 hover:bg-paper-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMergeConfirm}
                  disabled={!mergeTargetLedgerId}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-40 rounded-xl shadow-md"
                >
                  Execute Merge & Archive
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. DELETE MODAL */}
      <AnimatePresence>
        {activeModal?.type === 'DELETE' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-paper-50 dark:bg-ink-900 border border-coral-200 dark:border-coral-900/60 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center gap-3 text-debit-coral">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-bold">Delete {activeModal.node.name}</h3>
              </div>

              {deleteWarning ? (
                <div className="p-3.5 bg-coral-50 dark:bg-coral-950/40 border border-coral-200 dark:border-coral-900/60 rounded-2xl text-xs text-coral-800 dark:text-coral-200 space-y-2">
                  <p className="font-bold">⚠️ High Value Cascade Deletion Warning</p>
                  <p>{deleteWarning.message}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Are you sure you want to delete this {activeModal.node.type.toLowerCase()}? This action will be recorded in the audit trail.
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-xs text-slate-500 hover:bg-paper-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteConfirm(!!deleteWarning)}
                  className="px-5 py-2 text-xs font-bold text-white bg-debit-coral hover:bg-coral-600 rounded-xl shadow-md"
                >
                  {deleteWarning ? 'Force Delete Everything' : 'Confirm Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ----------------------------------------------------
// SUB-COMPONENT: GROUP ITEM (Level 1)
// ----------------------------------------------------
interface GroupItemProps {
  group: GroupNode;
  expandedNodes: Set<string>;
  toggleExpand: (id: string) => void;
  canEdit: boolean;
  isAuditor: boolean;
  fmt: (n: number) => string;
  onAddSubgroup: () => void;
  onEditGroup: () => void;
  onMoveGroup: () => void;
  onDeleteGroup: () => void;
  onSubgroupAction: (action: string, sg: SubgroupNode) => void;
  onLedgerAction: (action: string, ledger: LedgerNode) => void;
  onVoucherAction: (action: string, v: Voucher, ledger: LedgerNode) => void;
}

const GroupItem: React.FC<GroupItemProps> = ({
  group,
  expandedNodes,
  toggleExpand,
  canEdit,
  fmt,
  onAddSubgroup,
  onEditGroup,
  onMoveGroup,
  onDeleteGroup,
  onSubgroupAction,
  onLedgerAction,
  onVoucherAction
}) => {
  const isExpanded = expandedNodes.has(group.id);

  return (
    <div className="group/g">
      <div
        onClick={() => toggleExpand(group.id)}
        className="flex items-center justify-between pl-8 pr-4 py-3 hover:bg-paper-200/50 dark:hover:bg-ink-800/60 cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <button className="text-slate-400">
            {isExpanded ? <ChevronDown className="w-4 h-4 text-sage-600" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <FolderOpen className="w-4 h-4 text-sage-600" />
          <div>
            <span className="font-semibold text-sm text-ink-950 dark:text-paper-50">{group.name}</span>
            <span className="ml-2 text-[10px] font-mono text-slate-400">{group.code}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Explicit Credit and Debit badges */}
          <div className="flex items-center gap-2">
            {group.credit_total > 0 && (
              <span className="px-2 py-0.5 rounded bg-sage-50 dark:bg-sage-950/40 text-sage-600 font-mono text-xs font-bold tabular-nums">
                + CR {fmt(group.credit_total)}
              </span>
            )}
            {group.debit_total > 0 && (
              <span className="px-2 py-0.5 rounded bg-coral-50 dark:bg-coral-950/40 text-debit-coral font-mono text-xs font-bold tabular-nums">
                - DR {fmt(group.debit_total)}
              </span>
            )}
          </div>

          {canEdit && (
            <div className="opacity-0 group-hover/g:opacity-100 flex items-center gap-1 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); onAddSubgroup(); }}
                title="Add Sub-group"
                className="p-1 text-slate-400 hover:text-sage-600 rounded-lg hover:bg-paper-200 dark:hover:bg-ink-700"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onEditGroup(); }}
                title="Edit Group"
                className="p-1 text-slate-400 hover:text-ink-950 dark:hover:text-paper-50 rounded-lg hover:bg-paper-200 dark:hover:bg-ink-700"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onMoveGroup(); }}
                title="Move Group"
                className="p-1 text-slate-400 hover:text-ink-950 dark:hover:text-paper-50 rounded-lg hover:bg-paper-200 dark:hover:bg-ink-700"
              >
                <Move className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteGroup(); }}
                title="Delete Group"
                className="p-1 text-slate-400 hover:text-debit-coral rounded-lg hover:bg-paper-200 dark:hover:bg-ink-700"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* LEVEL 2: SUB-GROUPS */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="pl-6 border-l-2 border-paper-200 dark:border-ink-800 ml-9 my-1 space-y-1"
          >
            {group.children?.map(subgroup => (
              <SubgroupItem
                key={subgroup.id}
                subgroup={subgroup}
                expandedNodes={expandedNodes}
                toggleExpand={toggleExpand}
                canEdit={canEdit}
                fmt={fmt}
                onAction={onSubgroupAction}
                onLedgerAction={onLedgerAction}
                onVoucherAction={onVoucherAction}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ----------------------------------------------------
// SUB-COMPONENT: SUBGROUP ITEM (Level 2)
// ----------------------------------------------------
interface SubgroupItemProps {
  subgroup: SubgroupNode;
  expandedNodes: Set<string>;
  toggleExpand: (id: string) => void;
  canEdit: boolean;
  fmt: (n: number) => string;
  onAction: (action: string, sg: SubgroupNode) => void;
  onLedgerAction: (action: string, ledger: LedgerNode) => void;
  onVoucherAction: (action: string, v: Voucher, ledger: LedgerNode) => void;
}

const SubgroupItem: React.FC<SubgroupItemProps> = ({
  subgroup,
  expandedNodes,
  toggleExpand,
  canEdit,
  fmt,
  onAction,
  onLedgerAction,
  onVoucherAction
}) => {
  const isExpanded = expandedNodes.has(subgroup.id);

  return (
    <div className="group/sg">
      <div
        onClick={() => toggleExpand(subgroup.id)}
        className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-paper-200/60 dark:hover:bg-ink-800/40 cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-2">
          <button className="text-slate-400">
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-sage-600" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          <Folder className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-medium text-ink-950 dark:text-paper-50">{subgroup.name}</span>
          <span className="text-[9px] font-mono text-slate-400">{subgroup.code}</span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Explicit Subgroup Totals */}
          {subgroup.credit_total > 0 && (
            <span className="px-2 py-0.5 rounded bg-sage-50 dark:bg-sage-950/40 text-sage-600 font-mono text-[11px] font-bold tabular-nums">
              + CR {fmt(subgroup.credit_total)}
            </span>
          )}
          {subgroup.debit_total > 0 && (
            <span className="px-2 py-0.5 rounded bg-coral-50 dark:bg-coral-950/40 text-debit-coral font-mono text-[11px] font-bold tabular-nums">
              - DR {fmt(subgroup.debit_total)}
            </span>
          )}
          {subgroup.credit_total === 0 && subgroup.debit_total === 0 && (
            <span className="px-2 py-0.5 rounded bg-paper-200/50 dark:bg-ink-800 text-slate-400 font-mono text-[11px]">
              $0.00
            </span>
          )}

          {canEdit && (
            <div className="opacity-0 group-hover/sg:opacity-100 flex items-center gap-1 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); onAction('ADD_LEDGER', subgroup); }}
                title="Add Ledger Account"
                className="p-1 text-slate-400 hover:text-sage-600 rounded"
              >
                <Plus className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onAction('EDIT', subgroup); }}
                title="Edit Sub-group"
                className="p-1 text-slate-400 hover:text-ink-950 dark:hover:text-paper-50 rounded"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onAction('MOVE', subgroup); }}
                title="Move Sub-group"
                className="p-1 text-slate-400 hover:text-ink-950 dark:hover:text-paper-50 rounded"
              >
                <Move className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onAction('DELETE', subgroup); }}
                title="Delete Sub-group"
                className="p-1 text-slate-400 hover:text-debit-coral rounded"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* LEVEL 3: LEDGERS */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="pl-5 border-l border-paper-300 dark:border-ink-800 ml-6 my-1 space-y-1"
          >
            {subgroup.children?.map(ledger => (
              <LedgerItem
                key={ledger.id}
                ledger={ledger}
                expandedNodes={expandedNodes}
                toggleExpand={toggleExpand}
                canEdit={canEdit}
                fmt={fmt}
                onAction={onLedgerAction}
                onVoucherAction={onVoucherAction}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ----------------------------------------------------
// SUB-COMPONENT: LEDGER ITEM (Level 3) & VOUCHERS
// ----------------------------------------------------
interface LedgerItemProps {
  ledger: LedgerNode;
  expandedNodes: Set<string>;
  toggleExpand: (id: string) => void;
  canEdit: boolean;
  fmt: (n: number) => string;
  onAction: (action: string, ledger: LedgerNode) => void;
  onVoucherAction: (action: string, v: Voucher, ledger: LedgerNode) => void;
}

const LedgerItem: React.FC<LedgerItemProps> = ({
  ledger,
  expandedNodes,
  toggleExpand,
  canEdit,
  fmt,
  onAction,
  onVoucherAction
}) => {
  const isExpanded = expandedNodes.has(ledger.id);

  return (
    <div className="group/l">
      <div
        onClick={() => toggleExpand(ledger.id)}
        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-paper-200/40 dark:hover:bg-ink-800/30 cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-2">
          <button className="text-slate-400">
            {isExpanded ? <ChevronDown className="w-3 h-3 text-sage-600" /> : <ChevronRight className="w-3 h-3" />}
          </button>
          <FileText className="w-3.5 h-3.5 text-sage-600/80" />
          <span className="text-xs text-ink-950 dark:text-paper-50 font-medium">{ledger.name}</span>
          <span className="text-[9px] font-mono text-slate-400">{ledger.code}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Explicit Ledger Amount & Clear Credit / Debit Badges */}
          {ledger.credit_total > 0 && (
            <span className="px-2 py-0.5 rounded-md font-mono text-xs font-bold tabular-nums bg-sage-100 dark:bg-sage-950/60 text-sage-700 dark:text-sage-300">
              + CR {fmt(ledger.credit_total)}
            </span>
          )}
          {ledger.debit_total > 0 && (
            <span className="px-2 py-0.5 rounded-md font-mono text-xs font-bold tabular-nums bg-coral-100 dark:bg-coral-950/60 text-debit-coral">
              - DR {fmt(ledger.debit_total)}
            </span>
          )}
          {ledger.credit_total === 0 && ledger.debit_total === 0 && (
            <span className="px-2 py-0.5 rounded-md font-mono text-xs text-slate-400 bg-paper-200/50 dark:bg-ink-850">
              $0.00 (0 vouchers)
            </span>
          )}

          {canEdit && (
            <div className="opacity-0 group-hover/l:opacity-100 flex items-center gap-1 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); onAction('ADD_VOUCHER', ledger); }}
                title="Add Voucher / Receipt under this Ledger"
                className="p-1 text-slate-400 hover:text-sage-600 rounded"
              >
                <Plus className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onAction('EDIT', ledger); }}
                title="Edit Ledger Title / Code"
                className="p-1 text-slate-400 hover:text-ink-950 dark:hover:text-paper-50 rounded"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onAction('MOVE', ledger); }}
                title="Move Ledger to different Sub-group"
                className="p-1 text-slate-400 hover:text-ink-950 dark:hover:text-paper-50 rounded"
              >
                <Move className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onAction('MERGE', ledger); }}
                title="Merge Ledger into another"
                className="p-1 text-slate-400 hover:text-amber-500 rounded"
              >
                <GitMerge className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onAction('DELETE', ledger); }}
                title="Delete Ledger"
                className="p-1 text-slate-400 hover:text-debit-coral rounded"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* LEVEL 4: VOUCHERS LIST */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="pl-5 ml-4 border-l border-paper-200 dark:border-ink-800 space-y-1 my-1.5"
          >
            {ledger.vouchers.length === 0 ? (
              <div className="text-[11px] text-slate-400 py-1 italic flex items-center justify-between">
                <span>Empty ledger — no vouchers recorded yet.</span>
                {canEdit && (
                  <button
                    onClick={() => onAction('ADD_VOUCHER', ledger)}
                    className="text-[10px] text-sage-600 font-bold hover:underline"
                  >
                    + Add First Receipt / Voucher
                  </button>
                )}
              </div>
            ) : (
              ledger.vouchers.map(v => (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-paper-50 dark:bg-ink-950 border border-paper-200/70 dark:border-ink-800/70 text-xs hover:border-sage-400/50 transition-colors group/v"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[10px] text-slate-400">{v.date}</span>
                    <span className="font-mono text-[10px] font-semibold text-slate-500">{v.voucher_number}</span>
                    <span className="text-ink-950 dark:text-paper-50 font-medium">{v.description}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        v.type === 'CREDIT'
                          ? 'bg-sage-100 dark:bg-sage-950/50 text-sage-600'
                          : 'bg-coral-100 dark:bg-coral-950/50 text-debit-coral'
                      }`}
                    >
                      {v.type === 'CREDIT' ? '+ CR' : '- DR'}
                    </span>
                    {v.status === 'STAGED' && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                        <Sparkles className="w-2.5 h-2.5" /> AI Staged
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`font-mono font-bold tabular-nums ${
                        v.type === 'DEBIT' ? 'text-debit-coral' : 'text-sage-600'
                      }`}
                    >
                      {v.type === 'DEBIT' ? '-' : '+'}{fmt(Number(v.amount))}
                    </span>

                    {canEdit && (
                      <div className="opacity-0 group-v:opacity-100 flex items-center gap-1 transition-opacity">
                        <button
                          onClick={() => onVoucherAction('EDIT', v, ledger)}
                          title="Edit voucher (amount, date, description, type)"
                          className="p-1 text-slate-400 hover:text-ink-950 dark:hover:text-paper-50 rounded"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onVoucherAction('SPLIT', v, ledger)}
                          title="Split voucher across two accounts"
                          className="p-1 text-slate-400 hover:text-sage-600 rounded"
                        >
                          <Scissors className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onVoucherAction('DELETE', v, ledger)}
                          title="Delete voucher"
                          className="p-1 text-slate-400 hover:text-debit-coral rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
