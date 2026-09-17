import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'CFO' | 'MANAGER' | 'BASE_USER' | 'AUDITOR';
  hospital_id: string | null;
  hospital_name?: string;
}

export interface Hospital {
  id: string;
  name: string;
  code: string;
  city: string;
  cfo_id: string;
  cfo_name?: string;
  has_auditor_access?: number;
}

interface AppContextType {
  currentUser: User | null;
  token: string | null;
  login: (email: string, pass: string) => Promise<void>;
  signup: (name: string, email: string, pass: string, role: string, hospitalId?: string) => Promise<void>;
  logout: () => void;
  hospitals: Hospital[];
  selectedHospitalId: string;
  setSelectedHospitalId: (id: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  refreshKey: number;
  triggerRefresh: () => void;
  wsConnected: boolean;
  lastLiveEvent: any;
  preselectedGroup: string | null;
  setPreselectedGroup: (group: string | null) => void;
  initialChatQuery: string | null;
  setInitialChatQuery: (query: string | null) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  toast: { msg: string; type: 'success' | 'error' | 'info' | 'warning' } | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('hcfm_token') || null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('ledger');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('hcfm_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
  });
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [lastLiveEvent, setLastLiveEvent] = useState<any>(null);
  const [preselectedGroup, setPreselectedGroup] = useState<string | null>(null);
  const [initialChatQuery, setInitialChatQuery] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const triggerRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  // Fetch verified profile from session token
  useEffect(() => {
    if (!token) {
      setCurrentUser(null);
      return;
    }

    fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-User-Id': token
      }
    })
      .then(async res => {
        if (!res.ok) {
          throw new Error('Session expired');
        }
        return res.json();
      })
      .then((user: User) => {
        setCurrentUser(user);
        // Default tab adjustments based on role
        if (user.role === 'AUDITOR') {
          setActiveTab('auditor');
        } else if (user.role === 'CFO' && activeTab === 'ingestion') {
          setActiveTab('ledger'); // CFO does not need Ingestion tab
        }
      })
      .catch(err => {
        console.warn('Auth verification failed:', err);
        localStorage.removeItem('hcfm_token');
        setToken(null);
        setCurrentUser(null);
      });
  }, [token]);

  // Fetch hospitals when currentUser changes
  useEffect(() => {
    if (!currentUser || !token) return;

    fetch(`/api/hospitals?userId=${currentUser.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-User-Id': currentUser.id
      }
    })
      .then(res => res.json())
      .then((data: Hospital[]) => {
        setHospitals(data);
        if (data.length > 0) {
          if (currentUser.hospital_id) {
            setSelectedHospitalId(currentUser.hospital_id);
          } else if (!selectedHospitalId || !data.find(h => h.id === selectedHospitalId)) {
            setSelectedHospitalId(data[0].id);
          }
        }
      })
      .catch(err => console.error('Error fetching hospitals:', err));
  }, [currentUser, token, refreshKey]);

  // Login handler
  const login = async (email: string, pass: string) => {
    let res: Response;
    try {
      res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: pass })
      });
    } catch (networkErr: any) {
      throw new Error(`Cannot connect to Backend API Server. Please ensure 'npm run server' is running on port 3001.`);
    }

    let data: any = {};
    try {
      data = await res.json();
    } catch {
      throw new Error(`Server returned invalid response (Status ${res.status}). Please check that the backend is active on port 3001.`);
    }

    if (!res.ok) {
      throw new Error(data.error || 'Invalid credentials or user not found');
    }

    localStorage.setItem('hcfm_token', data.token);
    setToken(data.token);
    setCurrentUser(data.user);
    showToast(`Welcome back, ${data.user.name}!`, 'success');
  };

  // Signup handler
  const signup = async (name: string, email: string, pass: string, role: string, hospitalId?: string) => {
    let res: Response;
    try {
      res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: email.trim(), password: pass, role, hospitalId })
      });
    } catch (networkErr: any) {
      throw new Error(`Cannot connect to Backend API Server. Please ensure 'npm run server' is running on port 3001.`);
    }

    let data: any = {};
    try {
      data = await res.json();
    } catch {
      throw new Error(`Server returned invalid response (Status ${res.status}).`);
    }

    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    localStorage.setItem('hcfm_token', data.token);
    setToken(data.token);
    setCurrentUser(data.user);
    showToast(`Account registered successfully as ${data.user.role}!`, 'success');
  };

  // Logout handler
  const logout = () => {
    // Clear temporary chat cache for the user session
    if (currentUser?.id) {
      sessionStorage.removeItem(`hcfm_chat_${currentUser.id}`);
    }
    try {
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('hcfm_chat_')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Could not clear chat session cache', e);
    }

    localStorage.removeItem('hcfm_token');
    setToken(null);
    setCurrentUser(null);
    showToast('Signed out successfully', 'info');
  };

  // WebSocket connection for real-time live sync
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let ws: WebSocket | null = null;
    let timer: any = null;

    function connect() {
      try {
        ws = new WebSocket(wsUrl);
        ws.onopen = () => setWsConnected(true);
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setLastLiveEvent(data);
            if (['BATCH_COMMITTED', 'LEDGER_RESTUCTURED', 'INGESTION_STAGED', 'VOUCHER_CREATED', 'VOUCHER_UPDATED'].includes(data.type)) {
              triggerRefresh();
              showToast(`Live Sync: ${data.message || data.action || data.type}`, 'success');
            }
          } catch (e) {
            console.error('WS parse error:', e);
          }
        };
        ws.onclose = () => {
          setWsConnected(false);
          timer = setTimeout(connect, 3000);
        };
      } catch (err) {
        setWsConnected(false);
        timer = setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      if (ws) ws.close();
      if (timer) clearTimeout(timer);
    };
  }, [triggerRefresh, showToast]);

  // Dark mode class on html document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('hcfm_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('hcfm_theme', 'light');
    }
  }, [darkMode]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        token,
        login,
        signup,
        logout,
        hospitals,
        selectedHospitalId,
        setSelectedHospitalId,
        activeTab,
        setActiveTab,
        darkMode,
        setDarkMode,
        refreshKey,
        triggerRefresh,
        wsConnected,
        lastLiveEvent,
        preselectedGroup,
        setPreselectedGroup,
        initialChatQuery,
        setInitialChatQuery,
        showToast,
        toast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
