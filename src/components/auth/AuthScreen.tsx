import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Building,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AuthScreenProps {
  initialMode?: 'LOGIN' | 'SIGNUP';
  onBackToLanding?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ initialMode = 'LOGIN', onBackToLanding }) => {
  const { login, signup, hospitals } = useApp();
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>(initialMode);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'CFO' | 'MANAGER' | 'BASE_USER' | 'AUDITOR'>('MANAGER');
  const [hospitalId, setHospitalId] = useState('hosp-1');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoFilter, setDemoFilter] = useState<'ALL' | 'CFO' | 'MANAGER' | 'STAFF' | 'AUDITOR'>('ALL');

  // Complete List of Official System Profiles (Single CFO: K9 Admin)
  const ALL_DEMO_USERS = [
    { name: 'K9 Admin', email: 'k9@gmail.com', role: 'CFO', hospital: 'Network Multi-Tenant', icon: '👑', category: 'CFO' },
    { name: 'Marcus Chen', email: 'm.chen@stjude.org', role: 'MANAGER', hospital: 'Metro St. Jude', icon: '🏥', category: 'MANAGER' },
    { name: 'Dr. Priya Sharma', email: 'p.sharma@riverdale.org', role: 'MANAGER', hospital: 'Riverdale Specialty', icon: '🏥', category: 'MANAGER' },
    { name: 'David Kim', email: 'd.kim@highland.org', role: 'MANAGER', hospital: 'Highland Children\'s', icon: '🏥', category: 'MANAGER' },
    { name: 'Sarah Jenkins', email: 's.jenkins@stjude.org', role: 'BASE_USER', hospital: 'St. Jude Ingestion', icon: '📋', category: 'STAFF' },
    { name: 'Alex Rivera', email: 'a.rivera@riverdale.org', role: 'BASE_USER', hospital: 'Riverdale Ingestion', icon: '📋', category: 'STAFF' },
    { name: 'Robert Langdon', email: 'r.langdon@auditors.com', role: 'AUDITOR', hospital: 'KPMG External Audit', icon: '🔍', category: 'AUDITOR' }
  ];

  const filteredDemoUsers = demoFilter === 'ALL'
    ? ALL_DEMO_USERS
    : ALL_DEMO_USERS.filter(u => u.category === demoFilter);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'LOGIN') {
        await login(email, password);
      } else {
        await signup(name, email, password, role, hospitalId);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-Click Demo Login
  const handleQuickDemo = async (demoEmail: string) => {
    setError(null);
    setLoading(true);
    try {
      await login(demoEmail, 'password123');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-paper-50 dark:bg-ink-950 text-ink-950 dark:text-paper-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg bg-paper-100 dark:bg-ink-900 border border-paper-200 dark:border-ink-800 rounded-3xl p-8 shadow-2xl space-y-6 relative"
      >
        {/* Back to Home Button */}
        {onBackToLanding && (
          <button
            type="button"
            onClick={onBackToLanding}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-ink-950 dark:hover:text-paper-50 transition-colors py-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
        )}

        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-sage-500 text-white flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-ink-950 dark:text-paper-50">
            Clack Financial Platform
          </h1>
          <p className="text-xs text-slate-500">
            Multi-Tenant Hospital Ledger & Autonomous Ingestion Pipeline
          </p>
        </div>

        {/* Tab Selector: Sign In vs Sign Up */}
        <div className="flex rounded-xl bg-paper-200 dark:bg-ink-950 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setMode('LOGIN'); setError(null); }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'LOGIN'
                ? 'bg-paper-50 dark:bg-ink-850 text-ink-950 dark:text-paper-50 shadow-sm'
                : 'text-slate-500 hover:text-ink-950 dark:hover:text-paper-50'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('SIGNUP'); setError(null); }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'SIGNUP'
                ? 'bg-paper-50 dark:bg-ink-850 text-ink-950 dark:text-paper-50 shadow-sm'
                : 'text-slate-500 hover:text-ink-950 dark:hover:text-paper-50'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="p-3 bg-coral-50 dark:bg-coral-950/40 border border-coral-200 dark:border-coral-900/50 rounded-xl text-xs text-debit-coral flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {mode === 'SIGNUP' && (
            <div>
              <label className="block font-semibold text-slate-500 mb-1">Full Name:</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Catherine Brooks"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-paper-50 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 rounded-xl focus:ring-1 focus:ring-sage-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-500 mb-1">Email Address:</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="name@hospital.org"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-paper-50 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 rounded-xl focus:ring-1 focus:ring-sage-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-500 mb-1">Password:</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-paper-50 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 rounded-xl focus:ring-1 focus:ring-sage-500"
              />
            </div>
          </div>

          {mode === 'SIGNUP' && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block font-semibold text-slate-500 mb-1">Role Permission:</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as any)}
                  className="w-full p-2 bg-paper-50 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 rounded-xl font-medium"
                >
                  <option value="MANAGER">Manager (Hospital)</option>
                  <option value="BASE_USER">Base User (Ingestion)</option>
                  <option value="CFO">CFO (Executive Multi-tenant)</option>
                  <option value="AUDITOR">Auditor (Read-Only)</option>
                </select>
              </div>

              {role !== 'CFO' && role !== 'AUDITOR' && (
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Hospital Facility:</label>
                  <select
                    value={hospitalId}
                    onChange={e => setHospitalId(e.target.value)}
                    className="w-full p-2 bg-paper-50 dark:bg-ink-950 border border-paper-200 dark:border-ink-800 rounded-xl font-medium"
                  >
                    <option value="hosp-1">Metro St. Jude</option>
                    <option value="hosp-2">Riverdale Specialty</option>
                    <option value="hosp-3">Highland Children's</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-sage-500 hover:bg-sage-600 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 mt-2"
          >
            <span>{loading ? 'Authenticating...' : mode === 'LOGIN' ? 'Sign In to Dashboard' : 'Register Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Quick Demo Profiles for All 8 Roles */}
        {mode === 'LOGIN' && (
          <div className="pt-4 border-t border-paper-200 dark:border-ink-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>1-Click Demo Profiles (All 8 Users)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">PW: password123</span>
            </div>

            {/* Role Filter Chips */}
            <div className="flex rounded-xl bg-paper-200/80 dark:bg-ink-950 p-1 text-[11px] font-semibold">
              {(['ALL', 'CFO', 'MANAGER', 'STAFF', 'AUDITOR'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setDemoFilter(filter)}
                  className={`flex-1 py-1 px-1 rounded-lg text-center transition-all ${
                    demoFilter === filter
                      ? 'bg-paper-50 dark:bg-ink-850 text-ink-950 dark:text-paper-50 shadow-sm font-bold'
                      : 'text-slate-400 hover:text-ink-950 dark:hover:text-paper-50'
                  }`}
                >
                  {filter === 'ALL' ? 'All (8)' : filter}
                </button>
              ))}
            </div>

            {/* Demo User Grid */}
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {filteredDemoUsers.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => handleQuickDemo(u.email)}
                  className="p-2.5 rounded-xl bg-paper-50 dark:bg-ink-950 hover:bg-sage-50 dark:hover:bg-sage-950/40 border border-paper-200 dark:border-ink-800 hover:border-sage-400 dark:hover:border-sage-600 text-left transition-all flex items-start gap-2 group"
                >
                  <span className="text-sm mt-0.5">{u.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <strong className="block text-[11px] text-ink-950 dark:text-paper-50 truncate group-hover:text-sage-600 dark:group-hover:text-sage-400">
                        {u.name}
                      </strong>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate font-medium">
                      {u.hospital}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase bg-paper-200 dark:bg-ink-900 text-slate-500 dark:text-slate-300 mt-1 inline-block">
                      {u.role}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="text-center text-[10px] text-slate-400">
          Protected by PostgreSQL pgvector & Role-Based Row-Level Access Controls
        </div>
      </motion.div>
    </div>
  );
};
