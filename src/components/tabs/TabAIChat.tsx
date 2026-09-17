import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Send,
  Code2,
  Database,
  BarChart3,
  Table as TableIcon,
  ShieldCheck,
  RotateCcw,
  Bot,
  User,
  HelpCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useApp } from '../../context/AppContext';

interface ChatMessage {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
  sql?: string;
  data?: any[];
  chartType?: 'bar' | 'pie' | 'line' | 'table';
  timestamp: string;
}

export const TabAIChat: React.FC = () => {
  const { currentUser, selectedHospitalId, initialChatQuery, setInitialChatQuery } = useApp();
  const [inputQuery, setInputQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showSqlFor, setShowSqlFor] = useState<string | null>(null);

  const getInitialWelcome = (userName?: string): ChatMessage => ({
    id: 'welcome-1',
    sender: 'AI',
    text: `Hello ${userName || 'there'}! I am your Financial Assistant. I translate natural questions into secure, role-scoped queries across Groups, Sub-groups, Ledgers, and Vouchers. All queries are strictly scoped to your authorized hospital boundaries.`,
    timestamp: 'Just now'
  });

  // Session-bound chat cache: temporary cache preserved until user logs out
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const cacheKey = currentUser ? `hcfm_chat_${currentUser.id}` : 'hcfm_chat_guest';
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse cached chat history', e);
    }
    return [getInitialWelcome(currentUser?.name)];
  });

  // Load cache when switching or mounting user
  useEffect(() => {
    if (!currentUser?.id) return;
    const cacheKey = `hcfm_chat_${currentUser.id}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
      setMessages([getInitialWelcome(currentUser.name)]);
    } catch (e) {
      console.warn('Failed to load cached chat', e);
    }
  }, [currentUser?.id]);

  // Sync messages into sessionStorage temporary cache
  useEffect(() => {
    if (!currentUser?.id) return;
    const cacheKey = `hcfm_chat_${currentUser.id}`;
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chat cache', e);
    }
  }, [messages, currentUser?.id]);

  const handleClearChat = () => {
    const fresh = [getInitialWelcome(currentUser?.name)];
    setMessages(fresh);
    if (currentUser?.id) {
      sessionStorage.setItem(`hcfm_chat_${currentUser.id}`, JSON.stringify(fresh));
    }
  };

  const quickPrompts = [
    'Show me pharmacy expenses across our hospitals',
    'What are the top 5 highest expenses and what ledgers do they belong to?',
    'What are our pending staged approvals?',
    'Show inpatient and outpatient revenue breakdown',
    'Compare hospital spending across authorized facilities'
  ];

  const handleSend = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'USER',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id || ''
        },
        body: JSON.stringify({
          query: q,
          hospitalId: selectedHospitalId
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'AI',
        text: data.summary,
        sql: data.sql,
        data: data.data,
        chartType: data.chartType,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (e: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'AI',
        text: `Error executing query: ${e.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Consume preloaded initial query from Analytics
  useEffect(() => {
    if (initialChatQuery) {
      const q = initialChatQuery;
      setInitialChatQuery(null);
      handleSend(q);
    }
  }, [initialChatQuery]);

  const COLORS = ['#3E8E6D', '#255843', '#5FA987', '#8AC3A6', '#D96C5F', '#E8A33D', '#3D4D6B'];

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-12">
      {/* Header Banner */}
      <div className="bg-paper-100 dark:bg-ink-900 border border-paper-200 dark:border-ink-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sage-100 dark:bg-sage-900/50 text-sage-600 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-ink-950 dark:text-paper-50">
                AI Financial Assistant
              </h1>
              <p className="text-xs text-slate-500">
                Natural language querying scoped dynamically to your authorized hospital permission boundaries.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border bg-paper-200/60 dark:bg-ink-800 border-paper-300 dark:border-ink-700 text-slate-600 dark:text-slate-300 hover:bg-paper-300/60 transition-colors"
              title="Reset conversation cache for this session"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Chat</span>
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-paper-200/60 dark:bg-ink-800 text-xs text-slate-500 font-mono">
              <ShieldCheck className="w-4 h-4 text-sage-600" />
              <span>Scope: {currentUser?.role}</span>
            </div>
          </div>
        </div>

        {/* Quick prompt suggestions */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-paper-200 dark:border-ink-800">
          <span className="text-[11px] text-slate-400 font-semibold py-1">Try asking:</span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="text-xs px-2.5 py-1 bg-paper-50 dark:bg-ink-950 hover:bg-sage-50 dark:hover:bg-sage-950/40 border border-paper-200 dark:border-ink-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="space-y-4 min-h-[400px]">
        {messages.map(msg => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'AI' && (
              <div className="w-8 h-8 rounded-xl bg-sage-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-2xl p-4 space-y-3 shadow-xs ${msg.sender === 'USER'
                  ? 'bg-ink-800 text-white dark:bg-sage-600 dark:text-white rounded-br-none'
                  : 'bg-paper-100 dark:bg-ink-900 border border-paper-200 dark:border-ink-800 text-ink-950 dark:text-paper-50 rounded-bl-none'
                }`}
            >
              <div className="flex items-center justify-between text-[11px] opacity-70">
                <span className="font-semibold">{msg.sender === 'USER' ? currentUser?.name : 'Financial AI'}</span>
                <span>{msg.timestamp}</span>
              </div>

              <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.text}</p>

              {/* Inspection of Generated Scoped SQL */}
              {msg.sql && (
                <div className="pt-2 border-t border-paper-200 dark:border-ink-800">
                  <button
                    onClick={() => setShowSqlFor(showSqlFor === msg.id ? null : msg.id)}
                    className="flex items-center gap-1 text-[11px] text-sage-600 dark:text-sage-400 font-mono font-semibold hover:underline"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>{showSqlFor === msg.id ? 'Hide Executed SQL' : 'Inspect Scoped SQL Query'}</span>
                  </button>

                  {showSqlFor === msg.id && (
                    <motion.pre
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 p-3 rounded-lg bg-ink-950 text-emerald-400 font-mono text-[10px] overflow-x-auto border border-ink-800"
                    >
                      {msg.sql}
                    </motion.pre>
                  )}
                </div>
              )}

              {/* Dynamic Chart / Table Renderer from identical JSON */}
              {msg.data && msg.data.length > 0 && (
                <div className="p-3 bg-paper-50 dark:bg-ink-950 rounded-xl border border-paper-200 dark:border-ink-800 space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-sage-600" />
                      Live Query Output ({msg.data.length} records)
                    </span>
                    <span className="font-mono text-[10px]">Zero Discrepancy Guarantee</span>
                  </div>

                  {/* Render as Bar Chart if appropriate */}
                  {msg.chartType === 'bar' && (
                    <div className="h-48 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={msg.data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                          <XAxis
                            dataKey={Object.keys(msg.data[0])[0]}
                            tick={{ fontSize: 10, fill: '#8A93A6' }}
                          />
                          <YAxis tick={{ fontSize: 10, fill: '#8A93A6' }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#162138',
                              borderRadius: '8px',
                              fontSize: '11px',
                              color: '#fff'
                            }}
                          />
                          <Bar
                            dataKey={Object.keys(msg.data[0])[1]}
                            fill="#3E8E6D"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Render as Data Table */}
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-[11px] text-left">
                      <thead>
                        <tr className="border-b border-paper-200 dark:border-ink-800 text-slate-400 font-semibold">
                          {Object.keys(msg.data[0]).map(key => (
                            <th key={key} className="py-1 px-2 capitalize">
                              {key.replace(/_/g, ' ')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-paper-200 dark:divide-ink-850">
                        {msg.data.map((row: any, i: number) => (
                          <tr key={i} className="hover:bg-paper-100 dark:hover:bg-ink-900">
                            {Object.values(row).map((val: any, j: number) => (
                              <td key={j} className="py-1 px-2 font-mono">
                                {typeof val === 'number'
                                  ? val > 100
                                    ? `$${val.toLocaleString()}`
                                    : val
                                  : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {msg.sender === 'USER' && (
              <div className="w-8 h-8 rounded-xl bg-ink-800 text-white dark:bg-ink-700 flex items-center justify-center shrink-0 shadow-sm mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </motion.div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 text-xs text-slate-400 p-4 bg-paper-100 dark:bg-ink-900 rounded-xl max-w-sm">
            <Bot className="w-4 h-4 animate-spin text-sage-600" />
            <span>Generating parameterized SQL & executing query...</span>
          </div>
        )}
      </div>

      {/* Query Input Box */}
      <div className="sticky bottom-4 bg-paper-100 dark:bg-ink-900 border border-paper-200 dark:border-ink-800 rounded-2xl p-2 shadow-lg flex items-center gap-2">
        <input
          type="text"
          placeholder="Ask any financial question (e.g. 'Compare spending between Hospital A and B')..."
          value={inputQuery}
          onChange={e => setInputQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSend();
          }}
          className="flex-1 bg-transparent px-3 py-2 text-xs text-ink-950 dark:text-paper-50 focus:outline-none"
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputQuery.trim() || loading}
          className="p-2.5 bg-sage-500 hover:bg-sage-600 disabled:opacity-40 text-white rounded-xl shadow-sm transition-transform active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
