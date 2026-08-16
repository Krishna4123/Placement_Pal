import React, { createContext, useContext, useState, useEffect } from 'react';
import { stateApi, PlacementState } from '../api/state';
import { ParsedNotification } from '../api/parse';
import { vaultApi } from '../api/vault';
import { useAuth } from './AuthContext';

export interface UserProfile {
  name: string;
  email: string;
  college: string;
  department: string;
  gradYear: string;
  cgpa: string;
  targetCompany: string;
  targetRole: string;
  daysRemaining: number;
}

export interface CompanySessionItem {
  sessionId: string;
  companyName: string;
  targetRole: string;
  daysRemaining: number;
  updatedAt?: string;
  parsedNotification?: ParsedNotification | null;
}

interface SessionContextType {
  sessionId: string;
  hasActiveSession: boolean;
  sessions: CompanySessionItem[];
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  placementState: PlacementState | null;
  parsedNotification: ParsedNotification | null;
  resumeData: any | null;
  loadingState: boolean;
  switchSession: (targetSessionId: string) => Promise<void>;
  deleteCompanySession: (targetSessionId: string) => Promise<void>;
  refreshState: (overrideSessionId?: string) => Promise<void>;
  refreshResume: (overrideSessionId?: string) => Promise<void>;
  refreshSessionsList: () => Promise<void>;
  applyParsedNotification: (data: ParsedNotification, company?: string) => void;
  startNewSession: (newCompany?: string) => string;
  clearSession: () => void;
}

const defaultProfile: UserProfile = {
  name: 'Arjun Kumar',
  email: 'arjun.kumar@iitd.ac.in',
  college: 'IIT Delhi',
  department: 'Computer Science & Engineering',
  gradYear: '2025',
  cgpa: '8.6',
  targetCompany: 'Google',
  targetRole: 'Software Development Engineer — L3',
  daysRemaining: 14,
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser, logout: authLogout } = useAuth();
  
  const [sessionId, setSessionId] = useState<string>(() => {
    return localStorage.getItem('placementpal_active_session_id') || "active_session";
  });

  const [sessions, setSessions] = useState<CompanySessionItem[]>(() => {
    const saved = localStorage.getItem('placementpal_sessions_list');
    return saved ? JSON.parse(saved) : [];
  });

  const [hasActiveSession, setHasActiveSession] = useState<boolean>(() => {
    return localStorage.getItem('placementpal_active_session') === 'true' || Boolean(localStorage.getItem('placementpal_active_session_id'));
  });

  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('placementpal_profile');
    if (saved) return JSON.parse(saved);
    return {
      ...defaultProfile,
      name: authUser?.name || defaultProfile.name,
      email: authUser?.email || defaultProfile.email,
    };
  });

  const [placementState, setPlacementState] = useState<PlacementState | null>(null);
  const [parsedNotification, setParsedNotification] = useState<ParsedNotification | null>(() => {
    const saved = localStorage.getItem(`placementpal_parsed_${sessionId}`);
    if (saved) return JSON.parse(saved);
    const fallback = localStorage.getItem('placementpal_parsed_notification');
    return fallback ? JSON.parse(fallback) : null;
  });
  
  const [resumeData, setResumeData] = useState<any | null>(() => {
    const saved = localStorage.getItem('placementpal_user_resume');
    return saved ? JSON.parse(saved) : null;
  });
  const [loadingState, setLoadingState] = useState<boolean>(false);

  const refreshSessionsList = async () => {
    try {
      const res = await stateApi.getAllSessions();
      if (res && res.data && Array.isArray(res.data)) {
        const fetchedSessions: CompanySessionItem[] = res.data.map((s: any) => {
          const company = s.parsed_notification?.company || s.target_companies?.[0] || 'Target Company';
          const role = s.parsed_notification?.target_role || s.target_roles?.[0] || 'Software Engineer';
          const days = s.parsed_notification?.preparation_duration_days || 14;
          return {
            sessionId: s.session_id,
            companyName: company,
            targetRole: role,
            daysRemaining: days,
            updatedAt: s.updated_at,
            parsedNotification: s.parsed_notification || null,
          };
        });
        setSessions(fetchedSessions);
        localStorage.setItem('placementpal_sessions_list', JSON.stringify(fetchedSessions));
      }
    } catch (err) {
      console.warn('Failed to fetch sessions list from server:', err);
    }
  };

  const switchSession = async (targetSessionId: string) => {
    if (!targetSessionId || targetSessionId === sessionId) return;
    setSessionId(targetSessionId);
    localStorage.setItem('placementpal_active_session_id', targetSessionId);
    localStorage.setItem('placementpal_active_session', 'true');
    setHasActiveSession(true);
    
    // Load local parsed notification cache for target session if available
    const savedParsed = localStorage.getItem(`placementpal_parsed_${targetSessionId}`);
    if (savedParsed) {
      setParsedNotification(JSON.parse(savedParsed));
    }

    await refreshState(targetSessionId);
  };

  const deleteCompanySession = async (targetSessionId: string) => {
    try {
      await stateApi.deleteSession(targetSessionId);
    } catch (err) {
      console.warn('Failed to delete session on server:', err);
    }
    
    localStorage.removeItem(`placementpal_parsed_${targetSessionId}`);
    const remaining = sessions.filter((s) => s.sessionId !== targetSessionId);
    setSessions(remaining);
    localStorage.setItem('placementpal_sessions_list', JSON.stringify(remaining));

    if (sessionId === targetSessionId) {
      if (remaining.length > 0) {
        await switchSession(remaining[0].sessionId);
      } else {
        setPlacementState(null);
        setParsedNotification(null);
      }
    }
  };

  const refreshResume = async (overrideSessionId?: string) => {
    try {
      const activeId = overrideSessionId || sessionId || 'active_session';
      const res = await vaultApi.getResume(activeId);
      if (res && res.data) {
        setResumeData(res.data);
        localStorage.setItem('placementpal_user_resume', JSON.stringify(res.data));
      }
    } catch (err) {
      console.warn('Failed to fetch resume for session:', err);
    }
  };

  const applyParsedNotification = (data: ParsedNotification, company?: string) => {
    setParsedNotification(data);
    localStorage.setItem('placementpal_parsed_notification', JSON.stringify(data));
    localStorage.setItem(`placementpal_parsed_${sessionId}`, JSON.stringify(data));
    
    // Track session creation timestamp for real-time calendar day countdowns
    const createdAtStr = new Date().toISOString();
    localStorage.setItem('placementpal_created_at', createdAtStr);

    let days = data.preparation_duration_days || 14;
    if (data.interview_date) {
      const parsed = new Date(data.interview_date);
      if (!isNaN(parsed.getTime())) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const targetStart = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
        const diff = Math.ceil((targetStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
        days = diff > 0 ? diff : 1;
      }
    }

    const companyName = company || data.company || profile.targetCompany;
    localStorage.setItem('placementpal_total_days', String(days));

    setProfile((prev) => ({
      ...prev,
      targetCompany: companyName,
      targetRole: data.target_role || prev.targetRole,
      daysRemaining: days,
    }));

    // Update or append in sessions list
    setSessions((prev) => {
      const exists = prev.some((s) => s.sessionId === sessionId);
      const newItem: CompanySessionItem = {
        sessionId,
        companyName,
        targetRole: data.target_role || profile.targetRole,
        daysRemaining: days,
        updatedAt: new Date().toISOString(),
        parsedNotification: data,
      };
      if (exists) {
        return prev.map((s) => (s.sessionId === sessionId ? newItem : s));
      }
      return [newItem, ...prev];
    });

    refreshSessionsList();
  };

  const startNewSession = (newCompany?: string) => {
    const newId = 'active_session';
    const createdAtStr = new Date().toISOString();
    localStorage.setItem('placementpal_session_id', newId);
    localStorage.setItem('placementpal_active_session', 'true');
    localStorage.setItem('placementpal_created_at', createdAtStr);
    setSessionId(newId);
    setHasActiveSession(true);
    setPlacementState(null);
    if (newCompany) {
      setProfile((prev) => ({ ...prev, targetCompany: newCompany }));
    }

    return newId;
  };

  const clearSession = () => {
    localStorage.removeItem('placementpal_active_session');
    localStorage.removeItem('placementpal_active_session_id');
    localStorage.removeItem('placementpal_parsed_notification');
    localStorage.removeItem('placementpal_user_resume');
    localStorage.removeItem('placementpal_created_at');
    localStorage.removeItem('placementpal_total_days');
    setHasActiveSession(false);
    setPlacementState(null);
    setParsedNotification(null);
    setResumeData(null);
    authLogout();
  };

  const refreshState = async (overrideSessionId?: string) => {
    try {
      setLoadingState(true);
      const activeId = overrideSessionId || sessionId;
      if (!activeId) return;
      const res = await stateApi.getState(activeId);
      if (res && res.data) {
        const stateData = res.data;

        // Calculate real-time calendar days elapsed since session creation
        const createdAtSaved = localStorage.getItem('placementpal_created_at') || stateData.created_at;
        let elapsedDays = 0;
        if (createdAtSaved) {
          const createdDate = new Date(createdAtSaved);
          if (!isNaN(createdDate.getTime())) {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const createdStart = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());
            elapsedDays = Math.max(0, Math.floor((todayStart.getTime() - createdStart.getTime()) / (1000 * 60 * 60 * 24)));
          }
        }

        const comp = stateData.target_companies?.[0] || profile.targetCompany;
        const role = stateData.target_roles?.[0] || profile.targetRole;
        const rawDate = stateData.interpreted_intent?.interview_date;
        let totalDays: number = stateData.preparation_duration_days || parseInt(localStorage.getItem('placementpal_total_days') || '14', 10);
        let daysRemaining: number = totalDays;

        if (rawDate) {
          const parsed = new Date(rawDate);
          if (!isNaN(parsed.getTime())) {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const targetStart = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
            const diff = Math.ceil((targetStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
            daysRemaining = diff > 0 ? diff : 1;
          }
        } else {
          daysRemaining = Math.max(1, totalDays - elapsedDays);
        }

        // Synchronize current_day & start_date in real time with daysRemaining and totalDays
        const calculatedCurrentDay = Math.min(totalDays, Math.max(1, totalDays - daysRemaining + 1));
        stateData.current_day = calculatedCurrentDay;
        
        const realElapsedDays = Math.max(0, totalDays - daysRemaining);
        const realStartDate = new Date();
        realStartDate.setDate(realStartDate.getDate() - realElapsedDays);
        stateData.start_date = `${realStartDate.getFullYear()}-${String(realStartDate.getMonth() + 1).padStart(2, "0")}-${String(realStartDate.getDate()).padStart(2, "0")}`;

        setPlacementState(stateData);

        const pn = (stateData.parsed_notification as any) || parsedNotification;
        if (pn) {
          setParsedNotification(pn);
          localStorage.setItem(`placementpal_parsed_${activeId}`, JSON.stringify(pn));
        }

        const comp = pn?.company || stateData.target_companies?.[0] || profile.targetCompany;
        const role = pn?.target_role || stateData.target_roles?.[0] || profile.targetRole;
        const rawDate = pn?.interview_date || stateData.interpreted_intent?.interview_date;
        let days: number | undefined = pn?.preparation_duration_days || stateData.interpreted_intent?.preparation_duration_days;

        if (rawDate) {
          const parsed = new Date(rawDate);
          if (!isNaN(parsed.getTime())) {
            const diff = Math.ceil((parsed.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            days = diff > 0 ? diff : 1;
          }
        }
        setProfile((prev) => ({
          ...prev,
          targetCompany: comp || prev.targetCompany,
          targetRole: role || prev.targetRole,
          daysRemaining: days !== undefined ? days : prev.daysRemaining,
        }));
      }

      await refreshResume(activeId);
    } catch (err) {
      console.warn('Failed to load session state from server, using local fallback', err);
    } finally {
      setLoadingState(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('placementpal_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    if (authUser) {
      setProfile((prev) => ({
        ...prev,
        name: authUser.name || prev.name,
        email: authUser.email || prev.email,
      }));
    }
  }, [authUser]);

  useEffect(() => {
    refreshSessionsList();
  }, []);

  useEffect(() => {
    if (hasActiveSession && sessionId) {
      refreshState(sessionId);
    }
  }, [sessionId, hasActiveSession]);

  return (
    <SessionContext.Provider
      value={{
        sessionId,
        hasActiveSession,
        sessions,
        profile,
        setProfile,
        placementState,
        parsedNotification,
        resumeData,
        loadingState,
        switchSession,
        deleteCompanySession,
        refreshState,
        refreshResume,
        refreshSessionsList,
        applyParsedNotification,
        startNewSession,
        clearSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};


export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
