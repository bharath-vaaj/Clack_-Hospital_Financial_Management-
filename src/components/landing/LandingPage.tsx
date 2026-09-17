import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  BookOpen,
  PieChart,
  FileText,
  ShieldAlert,
  Database,
  Lock,
  Layers,
  Activity,
  CheckCircle2,
  TrendingUp,
  Cpu,
  ChevronRight,
  Building2,
  Sun,
  Moon,
  Users,
  Compass,
  ArrowUpRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface LandingPageProps {
  onNavigateToAuth: (mode: 'LOGIN' | 'SIGNUP') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToAuth }) => {
  const { darkMode, setDarkMode, login } = useApp();

  const handleQuickDemo = async (email: string) => {
    try {
      await login(email, 'password123');
    } catch (err: any) {
      // If quick login has issue, redirect to auth form
      onNavigateToAuth('LOGIN');
    }
  };

  return (
    <div className="min-h-screen w-full bg-paper-50 dark:bg-ink-950 text-ink-950 dark:text-paper-50 transition-colors duration-300 overflow-x-hidden selection:bg-sage-500 selection:text-white">
      {/* -------------------------------------------------- */}
      {/* 1. TOP NAVIGATION BAR */}
      {/* -------------------------------------------------- */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-paper-50/80 dark:bg-ink-950/80 border-b border-paper-200/60 dark:border-ink-800/60 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sage-500 to-sage-700 text-white flex items-center justify-center shadow-lg shadow-sage-600/20 ring-2 ring-sage-400/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-ink-950 dark:text-paper-50">
                  Clack
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-sage-100 dark:bg-sage-900/50 text-sage-700 dark:text-sage-300 border border-sage-200 dark:border-sage-800/60">
                  Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Hospital Financial Management</p>
            </div>
          </div>

          {/* Quick Nav Anchor Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <a href="#problem" className="hover:text-sage-600 dark:hover:text-sage-400 transition-colors">
              The Problem
            </a>
            <a href="#capabilities" className="hover:text-sage-600 dark:hover:text-sage-400 transition-colors">
              Capabilities
            </a>
            <a href="#architecture" className="hover:text-sage-600 dark:hover:text-sage-400 transition-colors">
              Ledger Architecture
            </a>
            <a href="#personas" className="hover:text-sage-600 dark:hover:text-sage-400 transition-colors">
              Role Personas
            </a>
          </nav>

          {/* Right Controls: Theme + Auth CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl border border-paper-200 dark:border-ink-800 text-slate-500 hover:text-ink-950 dark:hover:text-paper-50 bg-paper-100/60 dark:bg-ink-900/60 transition-colors"
              title="Toggle Dark/Light Mode"
              aria-label="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <button
              onClick={() => onNavigateToAuth('LOGIN')}
              className="px-4 py-2 text-xs font-bold text-ink-950 dark:text-paper-50 hover:text-sage-600 dark:hover:text-sage-400 transition-colors"
            >
              Sign In
            </button>

            <button
              onClick={() => onNavigateToAuth('SIGNUP')}
              className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-sage-600 to-sage-500 hover:from-sage-500 hover:to-sage-600 rounded-xl shadow-md shadow-sage-600/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------- */}
      {/* 2. HERO SECTION */}
      {/* -------------------------------------------------- */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        {/* Soft Background Radial Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-sage-500/10 dark:bg-sage-500/15 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-1/3 right-10 w-[350px] h-[350px] bg-blue-500/5 dark:bg-blue-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Pill Badge with subtle animation */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sage-100/80 dark:bg-sage-950/60 border border-sage-300 dark:border-sage-800 text-sage-800 dark:text-sage-300 text-xs font-semibold shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-sage-600 dark:text-sage-400 animate-pulse" />
            <span>Unified Multi-Tenant Healthcare Ledger & Autonomous AI Intelligence</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.12] text-ink-950 dark:text-paper-50 max-w-4xl mx-auto"
          >
            Precision Financial Governance for Modern <span className="bg-gradient-to-r from-sage-600 via-sage-500 to-teal-500 bg-clip-text text-transparent">Hospital Systems</span>.
          </motion.h1>

          {/* Problem Statement (Short 2 Lines) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-3xl mx-auto bg-paper-100/70 dark:bg-ink-900/60 border border-paper-200/80 dark:border-ink-800/80 rounded-2xl p-5 shadow-sm backdrop-blur-sm"
          >
            <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-widest mb-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              The Industry Problem
            </div>
            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
              Hospitals lose millions to fragmented ledgers, unmapped departmental receipts, and audit blindspots.
              <br className="hidden sm:inline" />
              <strong className="text-ink-950 dark:text-paper-50 font-semibold"> Clack unifies daily expense ingestion, strict 4-level chart-of-accounts governance, and natural-language AI intelligence into a single auditable ledger.</strong>
            </p>
          </motion.div>

          {/* Primary Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-2"
          >
            <button
              onClick={() => onNavigateToAuth('LOGIN')}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sage-600 to-sage-500 hover:from-sage-500 hover:to-sage-600 text-white font-bold text-sm shadow-xl shadow-sage-600/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Launch Platform</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigateToAuth('SIGNUP')}
              className="px-6 py-3.5 rounded-2xl bg-paper-100 dark:bg-ink-900 hover:bg-paper-200 dark:hover:bg-ink-850 border border-paper-300 dark:border-ink-800 text-ink-950 dark:text-paper-50 font-bold text-sm transition-all"
            >
              Create Account
            </button>
          </motion.div>

          {/* Fast Persona Demo Pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="pt-4 flex flex-col items-center gap-2"
          >
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Instant 1-Click Role Sandbox
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => handleQuickDemo('k9@gmail.com')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-paper-200/80 dark:bg-ink-900 border border-paper-300 dark:border-ink-800 hover:border-sage-500 dark:hover:border-sage-500 transition-all flex items-center gap-1.5 group"
              >
                <span className="w-2 h-2 rounded-full bg-sage-500" />
                <span>CFO Demo</span>
                <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-sage-500 transition-colors" />
              </button>
              <button
                onClick={() => handleQuickDemo('m.chen@stjude.org')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-paper-200/80 dark:bg-ink-900 border border-paper-300 dark:border-ink-800 hover:border-sage-500 dark:hover:border-sage-500 transition-all flex items-center gap-1.5 group"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Hospital Manager</span>
                <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-blue-500 transition-colors" />
              </button>
              <button
                onClick={() => handleQuickDemo('r.langdon@auditors.com')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-paper-200/80 dark:bg-ink-900 border border-paper-300 dark:border-ink-800 hover:border-sage-500 dark:hover:border-sage-500 transition-all flex items-center gap-1.5 group"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Auditor View</span>
                <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-amber-500 transition-colors" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* -------------------------------------------------- */}
        {/* 3. FLOATING PLATFORM SHOWCASE & METRICS */}
        {/* -------------------------------------------------- */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
          <div className="relative rounded-3xl p-6 md:p-8 bg-paper-100/90 dark:bg-ink-900/90 border border-paper-200 dark:border-ink-800 shadow-2xl backdrop-blur-xl">
            {/* Top Mock Window Bar */}
            <div className="flex items-center justify-between pb-6 border-b border-paper-200/80 dark:border-ink-800/80">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 text-xs font-semibold text-slate-400">
                  Clack v2.4 • Live PostgreSQL & pgvector Pipeline
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-sage-600 dark:text-sage-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live Sync Connected
              </div>
            </div>

            {/* 3 Metric Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
              {/* Card 1 */}
              <motion.div
                whileHover={{ y: -4 }}
                className="p-5 rounded-2xl bg-paper-50 dark:bg-ink-950 border border-paper-200/80 dark:border-ink-800/80 space-y-3"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold">Chart of Accounts</span>
                  <BookOpen className="w-4 h-4 text-sage-500" />
                </div>
                <div>
                  <div className="text-2xl font-black text-ink-950 dark:text-paper-50 tabular-nums">
                    4-Level Hierarchy
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Roots $\rightarrow$ Groups $\rightarrow$ Subgroups $\rightarrow$ Ledgers with atomic debit/credit balances
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>100% Mathematically Balanced</span>
                </div>
              </motion.div>

              {/* Card 2 */}
              <motion.div
                whileHover={{ y: -4 }}
                className="p-5 rounded-2xl bg-paper-50 dark:bg-ink-950 border border-paper-200/80 dark:border-ink-800/80 space-y-3"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold">Daily AI Ingestion</span>
                  <FileText className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-black text-ink-950 dark:text-paper-50 tabular-nums">
                    Automated Match
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Excel/CSV expense files parsed and classified directly into existing vendor accounts
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Zero Redundant Accounts</span>
                </div>
              </motion.div>

              {/* Card 3 */}
              <motion.div
                whileHover={{ y: -4 }}
                className="p-5 rounded-2xl bg-paper-50 dark:bg-ink-950 border border-paper-200/80 dark:border-ink-800/80 space-y-3"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold">Workbench & AI Chat</span>
                  <Cpu className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <div className="text-2xl font-black text-ink-950 dark:text-paper-50 tabular-nums">
                    Text-to-SQL
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Natural language queries routed to Workbench n8n workflows with schema-safe SQL
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-purple-600 dark:text-purple-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Role-Scoped Intelligence</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- */}
      {/* 4. THE PROBLEM & THE CLACK SOLUTION */}
      {/* -------------------------------------------------- */}
      <section id="problem" className="py-20 bg-paper-100/50 dark:bg-ink-900/40 border-y border-paper-200/60 dark:border-ink-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-sage-600 dark:text-sage-400 uppercase tracking-widest">
              Why Traditional Hospital Software Fails
            </span>
            <h2 className="text-3xl font-black tracking-tight text-ink-950 dark:text-paper-50">
              The Healthcare Financial Dilemma
            </h2>
            <p className="text-sm text-slate-500">
              Healthcare operations run 24/7 with thousands of fragmented vendor vouchers, complex departmental budgets, and rigorous compliance mandates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* The Old Way */}
            <div className="p-7 rounded-3xl bg-paper-50 dark:bg-ink-950 border border-coral-200 dark:border-coral-900/40 space-y-4 shadow-sm">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-coral-50 dark:bg-coral-950/40 text-debit-coral text-xs font-bold">
                <ShieldAlert className="w-4 h-4" />
                <span>The Legacy Trap</span>
              </div>
              <h3 className="text-lg font-bold text-ink-950 dark:text-paper-50">
                Disconnected Spreadsheets & Manual Coding
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-debit-coral font-bold mt-0.5">✕</span>
                  <span>Daily bills duplicate existing ledgers under slightly varied naming conventions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-debit-coral font-bold mt-0.5">✕</span>
                  <span>Hospital managers lack multi-hospital consolidation, forcing slow end-of-month rollups.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-debit-coral font-bold mt-0.5">✕</span>
                  <span>Auditors can accidentally edit live accounts or get locked out of verification histories.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-debit-coral font-bold mt-0.5">✕</span>
                  <span>Financial analysts wait days for custom SQL reports from internal IT engineers.</span>
                </li>
              </ul>
            </div>

            {/* The Clack Way */}
            <div className="p-7 rounded-3xl bg-paper-50 dark:bg-ink-950 border border-sage-300 dark:border-sage-800/60 space-y-4 shadow-sm ring-1 ring-sage-500/20">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sage-100 dark:bg-sage-950/50 text-sage-700 dark:text-sage-300 text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>The Clack Solution</span>
              </div>
              <h3 className="text-lg font-bold text-ink-950 dark:text-paper-50">
                Autonomous Ingestion & Scoped Intelligence
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-sage-500 font-bold mt-0.5">✓</span>
                  <span>Line items automatically match existing ledgers using fuzzy AI classification.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sage-500 font-bold mt-0.5">✓</span>
                  <span>Strict 4-level Chart of Accounts maintains atomic Debit/Credit balance rollups.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sage-500 font-bold mt-0.5">✓</span>
                  <span>CFO grants time-bound, immutable read-only access to external auditors per hospital.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sage-500 font-bold mt-0.5">✓</span>
                  <span>Natural language AI chat with Workbench triggers real SQL analytics instantly.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- */}
      {/* 5. CAPABILITIES & ARCHITECTURE */}
      {/* -------------------------------------------------- */}
      <section id="capabilities" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-sage-600 dark:text-sage-400 uppercase tracking-widest">
              Engineered for Scale
            </span>
            <h2 className="text-3xl font-black tracking-tight text-ink-950 dark:text-paper-50">
              5 Integrated Financial Modules
            </h2>
            <p className="text-sm text-slate-500">
              Every workflow feeds directly into the unified PostgreSQL ledger with zero data fragmentation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Module 1 */}
            <div className="p-6 rounded-3xl bg-paper-100/60 dark:bg-ink-900/60 border border-paper-200 dark:border-ink-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sage-500/10 dark:bg-sage-500/20 text-sage-600 dark:text-sage-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-ink-950 dark:text-paper-50">Tab 1: Ingestion Pipeline</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Daily reports are parsed, staged, auto-matched to existing ledgers, and committed atomically to live accounting.
              </p>
            </div>

            {/* Module 2 */}
            <div className="p-6 rounded-3xl bg-paper-100/60 dark:bg-ink-900/60 border border-paper-200 dark:border-ink-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-ink-950 dark:text-paper-50">Tab 2: 4-Level Chart of Accounts</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Add, edit, move, and classify groups, subgroups, and ledgers with instant credit/debit totals and search filters.
              </p>
            </div>

            {/* Module 3 */}
            <div className="p-6 rounded-3xl bg-paper-100/60 dark:bg-ink-900/60 border border-paper-200 dark:border-ink-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <PieChart className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-ink-950 dark:text-paper-50">Tab 3: Executive Analytics</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Filter cashflow, burn rate, and departmental spending by date range, department, and hospital branch.
              </p>
            </div>

            {/* Module 4 */}
            <div className="p-6 rounded-3xl bg-paper-100/60 dark:bg-ink-900/60 border border-paper-200 dark:border-ink-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-ink-950 dark:text-paper-50">Tab 4: Workbench AI Chat</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Natural-language hospital questions forwarded directly to your Workbench webhook with Gemini & Supabase analysis.
              </p>
            </div>

            {/* Module 5 */}
            <div className="p-6 rounded-3xl bg-paper-100/60 dark:bg-ink-900/60 border border-paper-200 dark:border-ink-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-ink-950 dark:text-paper-50">Tab 5: Auditor Portal</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Cryptographically tracked mutation logs with CSV audit export and CFO-controlled access switches.
              </p>
            </div>

            {/* Module 6 (PostgreSQL) */}
            <div className="p-6 rounded-3xl bg-paper-100/60 dark:bg-ink-900/60 border border-paper-200 dark:border-ink-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-ink-950 dark:text-paper-50">Supabase & PGlite Sync</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                High-performance PostgreSQL engine supporting cloud Supabase clusters and instant local embedded execution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- */}
      {/* 6. ROLE PERSONAS SECTION */}
      {/* -------------------------------------------------- */}
      <section id="personas" className="py-20 bg-paper-100/50 dark:bg-ink-900/40 border-t border-paper-200/60 dark:border-ink-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-sage-600 dark:text-sage-400 uppercase tracking-widest">
              Role-Based Access Control (RBAC)
            </span>
            <h2 className="text-3xl font-black tracking-tight text-ink-950 dark:text-paper-50">
              Tailored for Every Stakeholder
            </h2>
            <p className="text-sm text-slate-500">
              Each user sees exactly what their governance level permits, enforced cryptographically in the database.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* CFO */}
            <div className="p-5 rounded-2xl bg-paper-50 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-sage-100 dark:bg-sage-950/60 text-sage-700 dark:text-sage-400 flex items-center justify-center font-bold text-xs mb-3">
                  CFO
                </div>
                <h4 className="font-bold text-sm text-ink-950 dark:text-paper-50">Executive CFO</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Multi-hospital consolidated oversight, auditor permission toggles, and cross-facility analytics.
                </p>
              </div>
              <button
                onClick={() => handleQuickDemo('k9@gmail.com')}
                className="w-full py-2 text-xs font-bold rounded-xl bg-paper-200 dark:bg-ink-900 hover:bg-sage-500 hover:text-white transition-all text-center"
              >
                Launch as CFO
              </button>
            </div>

            {/* Manager */}
            <div className="p-5 rounded-2xl bg-paper-50 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-xs mb-3">
                  MGR
                </div>
                <h4 className="font-bold text-sm text-ink-950 dark:text-paper-50">Hospital Manager</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Single-hospital isolation, ledger tree structure editing, voucher approval, and batch commits.
                </p>
              </div>
              <button
                onClick={() => handleQuickDemo('m.chen@stjude.org')}
                className="w-full py-2 text-xs font-bold rounded-xl bg-paper-200 dark:bg-ink-900 hover:bg-blue-500 hover:text-white transition-all text-center"
              >
                Launch as Manager
              </button>
            </div>

            {/* Base User */}
            <div className="p-5 rounded-2xl bg-paper-50 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center font-bold text-xs mb-3">
                  USR
                </div>
                <h4 className="font-bold text-sm text-ink-950 dark:text-paper-50">Base Accounting User</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Daily Excel/CSV receipt uploading, staging review, and unmapped voucher tagging.
                </p>
              </div>
              <button
                onClick={() => handleQuickDemo('s.jenkins@stjude.org')}
                className="w-full py-2 text-xs font-bold rounded-xl bg-paper-200 dark:bg-ink-900 hover:bg-teal-500 hover:text-white transition-all text-center"
              >
                Launch as Base User
              </button>
            </div>

            {/* Auditor */}
            <div className="p-5 rounded-2xl bg-paper-50 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-xs mb-3">
                  AUD
                </div>
                <h4 className="font-bold text-sm text-ink-950 dark:text-paper-50">Compliance Auditor</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Zero ledger tampering risk. Read-only verification of vouchers, audit trail, and export.
                </p>
              </div>
              <button
                onClick={() => handleQuickDemo('r.langdon@auditors.com')}
                className="w-full py-2 text-xs font-bold rounded-xl bg-paper-200 dark:bg-ink-900 hover:bg-amber-500 hover:text-white transition-all text-center"
              >
                Launch as Auditor
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- */}
      {/* 7. BOTTOM CALL TO ACTION */}
      {/* -------------------------------------------------- */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-ink-950 dark:text-paper-50">
            Ready to Take Control of Your Hospital Financials?
          </h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Experience real-time ledger balance integrity, automated daily report classification, and conversational AI analytics today.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => onNavigateToAuth('SIGNUP')}
              className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-sage-600 to-sage-500 hover:from-sage-500 hover:to-sage-600 text-white font-bold text-sm shadow-xl shadow-sage-600/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Get Started Now
            </button>
            <button
              onClick={() => onNavigateToAuth('LOGIN')}
              className="px-7 py-3.5 rounded-2xl bg-paper-100 dark:bg-ink-900 border border-paper-300 dark:border-ink-800 text-ink-950 dark:text-paper-50 font-bold text-sm hover:bg-paper-200 dark:hover:bg-ink-850 transition-all"
            >
              Sign In to Existing Hospital
            </button>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- */}
      {/* 8. REFINED FOOTER */}
      {/* -------------------------------------------------- */}
      <footer className="border-t border-paper-200 dark:border-ink-800/80 py-10 text-xs text-slate-500 bg-paper-100/40 dark:bg-ink-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sage-500" />
            <span className="font-bold text-ink-950 dark:text-paper-50">Clack</span>
            <span>— Hospital Financial Management Platform</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Supabase PostgreSQL Active</span>
            <span>•</span>
            <span>Workbench n8n Enabled</span>
            <span>•</span>
            <span>HIPAA-Ready Scoped Isolation</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
