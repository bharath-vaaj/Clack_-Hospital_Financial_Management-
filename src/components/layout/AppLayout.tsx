import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  BookOpen,
  PieChart,
  Sparkles,
  ShieldAlert,
  Moon,
  Sun,
  Building2,
  User,
  Activity,
  Wifi,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LogOut,
  KeyRound
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LandingPage } from '../landing/LandingPage';
import { AuthScreen } from '../auth/AuthScreen';
import { TabIngestion } from '../tabs/TabIngestion';
import { TabLedger } from '../tabs/TabLedger';
import { TabAnalytics } from '../tabs/TabAnalytics';
import { TabAIChat } from '../tabs/TabAIChat';
import { TabAuditor } from '../tabs/TabAuditor';

export const AppLayout: React.FC = () => {
  const {
    currentUser,
    logout,
    hospitals,
    selectedHospitalId,
    setSelectedHospitalId,
    activeTab,
    setActiveTab,
    darkMode,
    setDarkMode,
    wsConnected,
    toast
  } = useApp();

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [unauthView, setUnauthView] = useState<'LANDING' | 'AUTH'>('LANDING');
  const [authInitialMode, setAuthInitialMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

  // If user is not authenticated, show Landing Page or Login & Signup screen
  if (!currentUser) {
    if (unauthView === 'AUTH') {
      return (
        <AuthScreen
          initialMode={authInitialMode}
          onBackToLanding={() => setUnauthView('LANDING')}
        />
      );
    }

    return (
      <LandingPage
        onNavigateToAuth={(mode) => {
          setAuthInitialMode(mode);
          setUnauthView('AUTH');
        }}
      />
    );
  }

  // CFO does NOT see Ingestion tab (Section 1 & User Request)
  const allTabs = [
    {
      id: 'ingestion',
      name: 'Tab 1: Ingestion',
      subtitle: 'Daily Reports & AI Staging',
      icon: FileText,
      visibleTo: ['MANAGER', 'BASE_USER'] // CFO does not need Ingestion tab!
    },
    {
      id: 'ledger',
      name: 'Tab 2: Ledger',
      subtitle: '4-Level Chart of Accounts',
      icon: BookOpen,
      visibleTo: ['CFO', 'MANAGER', 'BASE_USER'] // Auditor cannot view ledger
    },
    {
      id: 'analytics',
      name: 'Tab 3: Analytics',
      subtitle: 'KPIs & Cashflow Filters',
      icon: PieChart,
      visibleTo: ['CFO', 'MANAGER', 'BASE_USER', 'AUDITOR']
    },
    {
      id: 'ai_chat',
      name: 'Tab 4: AI Chat',
      subtitle: 'Text-to-SQL Assistant',
      icon: Sparkles,
      visibleTo: ['CFO', 'MANAGER', 'BASE_USER', 'AUDITOR']
    },
    {
      id: 'auditor',
      name: 'Tab 5: Auditor',
      subtitle: 'Immutable Logs & Export',
      icon: ShieldAlert,
      visibleTo: ['AUDITOR', 'CFO']
    }
  ];

  const visibleTabs = allTabs.filter(t => t.visibleTo.includes(currentUser.role));

  const currentHospital = hospitals.find(h => h.id === selectedHospitalId);

  return (
    <div className="flex h-screen overflow-hidden bg-paper-50 dark:bg-ink-950 text-ink-950 dark:text-paper-50">
      {/* ---------------------------------------------------- */}
      {/* 1. PERSISTENT COLLAPSIBLE SIDEBAR ("Ink & Sage") */}
      {/* ---------------------------------------------------- */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 76 : 260 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="h-full bg-ink-950 text-paper-50 border-r border-ink-800 flex flex-col justify-between shrink-0 select-none z-20"
      >
        {/* Brand & Logo */}
        <div className="p-4 border-b border-ink-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-sage-500 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
                C
              </div>
              {!sidebarCollapsed && (
                <div className="leading-tight">
                  <span className="font-extrabold text-sm tracking-tight text-paper-50 block">
                    Clack
                  </span>
                  <span className="text-[10px] text-sage-400 font-mono tracking-wider uppercase">
                    Fintech Ledger
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-slate-400 hover:text-paper-50 p-1 rounded-lg hover:bg-ink-850 transition-colors"
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {visibleTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-sage-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-paper-50 hover:bg-ink-850'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'group-hover:text-sage-400'}`} />
                {!sidebarCollapsed && (
                  <div className="text-left leading-tight truncate">
                    <div className="truncate">{tab.name}</div>
                    <div className={`text-[10px] font-normal truncate ${isActive ? 'text-sage-100' : 'text-slate-500'}`}>
                      {tab.subtitle}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer: Active User & Connection Status */}
        <div className="p-3 border-t border-ink-800/80 space-y-2">
          {!sidebarCollapsed ? (
            <div className="p-2.5 rounded-xl bg-ink-900 border border-ink-800 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-[10px]">
                <span className="font-semibold uppercase tracking-wider">Facility Scope</span>
                <span className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-sage-500' : 'bg-coral-500'}`}></span>
                  {wsConnected ? 'Live' : 'Syncing'}
                </span>
              </div>
              <div className="font-bold text-paper-50 truncate text-[11px]">
                {currentUser.hospital_name || (currentUser.role === 'CFO' ? 'Executive Network View' : 'Authorized Access')}
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-ink-800 text-[10px] text-slate-400">
                <span className="font-mono text-sage-400 font-bold">{currentUser.role}</span>
                <span>{currentUser.name.split(' ')[0]}</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-sage-500' : 'bg-coral-500'}`}></span>
            </div>
          )}
        </div>
      </motion.aside>

      {/* ---------------------------------------------------- */}
      {/* 2. MAIN WORKSPACE & TOP HEADER */}
      {/* ---------------------------------------------------- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-paper-200 dark:border-ink-800 px-6 bg-paper-50/80 dark:bg-ink-950/80 backdrop-blur-md flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400">Current View:</span>
            <span className="text-sm font-bold text-ink-950 dark:text-paper-50">
              {allTabs.find(t => t.id === activeTab)?.name}
            </span>
          </div>

          {/* User Profile Badge & Sign Out Button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-paper-100 dark:bg-ink-900 border border-paper-200 dark:border-ink-800 text-xs">
              <div className="w-6 h-6 rounded-lg bg-sage-100 dark:bg-sage-900/60 text-sage-600 flex items-center justify-center font-bold text-xs">
                {currentUser.name[0]}
              </div>
              <div>
                <div className="font-bold text-ink-950 dark:text-paper-50 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-400 font-mono leading-none">
                  {currentUser.role} • {currentUser.email}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-paper-100 dark:bg-ink-900 hover:bg-coral-50 dark:hover:bg-coral-950/30 border border-paper-200 dark:border-ink-800 hover:border-coral-300 text-xs font-semibold text-slate-500 hover:text-debit-coral transition-colors"
              title="Sign Out of Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-slate-400 hover:text-ink-950 dark:hover:text-paper-50 hover:bg-paper-200 dark:hover:bg-ink-850 transition-colors"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Tab Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + currentUser.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeTab === 'ingestion' && <TabIngestion />}
              {activeTab === 'ledger' && <TabLedger />}
              {activeTab === 'analytics' && <TabAnalytics />}
              {activeTab === 'ai_chat' && <TabAIChat />}
              {activeTab === 'auditor' && <TabAuditor />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl text-xs font-bold border ${
              toast.type === 'success'
                ? 'bg-sage-500 text-white border-sage-600'
                : toast.type === 'error'
                ? 'bg-debit-coral text-white border-coral-600'
                : toast.type === 'warning'
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-ink-800 text-white border-ink-700'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4" />}
            <span>{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
