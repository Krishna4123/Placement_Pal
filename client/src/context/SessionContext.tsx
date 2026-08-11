import React, { createContext, useContext, useState, useEffect } from 'react';
import { stateApi, PlacementState } from '../api/state';
import { ParsedNotification } from '../api/parse';
import { vaultApi } from '../api/vault';

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

interface SessionContextType {
  sessionId: string;
  hasActiveSession: boolean;
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  placementState: PlacementState | null;
  parsedNotification: ParsedNotification | null;
  resumeData: any | null;
  loadingState: boolean;
  refreshState: (overrideSessionId?: string) => Promise<void>;
  refreshResume: (overrideSessionId?: string) => Promise<void>;
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
  const [sessionId, setSessionId] = useState<string>("active_session");

  const [hasActiveSession, setHasActiveSession] = useState<boolean>(() => {
    return localStorage.getItem('placementpal_active_session') === 'true';
  });

  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('placementpal_profile');
    return saved ? JSON.parse(saved) : defaultProfile;
  });

  const [placementState, setPlacementState] = useState<PlacementState | null>(null);
  const [parsedNotification, setParsedNotification] = useState<ParsedNotification | null>(() => {
    const saved = localStorage.getItem('placementpal_parsed_notification');
    return saved ? JSON.parse(saved) : null;
  });
  const [resumeData, setResumeData] = useState<any | null>(() => {
    const saved = localStorage.getItem('placementpal_user_resume');
    return saved ? JSON.parse(saved) : null;
  });
  const [loadingState, setLoadingState] = useState<boolean>(false);

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

    localStorage.setItem('placementpal_total_days', String(days));

    setProfile((prev) => ({
      ...prev,
      targetCompany: company || data.company || prev.targetCompany,
      targetRole: data.target_role || prev.targetRole,
      daysRemaining: days,
    }));
  };

  const startNewSession = (newCompany?: string) => {
    const newId = 'active_session';
    const createdAtStr = new Date().toISOString();
    localStorage.setItem('placementpal_session_id', newId);
    localStorage.setItem('placementpal_active_session', 'true');
    localStorage.setItem('placementpal_created_at', createdAtStr);
    setSessionId(newId);
    setHasActiveSession(true);
    if (newCompany) {
      setProfile((prev) => ({ ...prev, targetCompany: newCompany }));
    }
    return newId;
  };

  const clearSession = () => {
    localStorage.removeItem('placementpal_active_session');
    localStorage.removeItem('placementpal_parsed_notification');
    localStorage.removeItem('placementpal_user_resume');
    localStorage.removeItem('placementpal_created_at');
    localStorage.removeItem('placementpal_total_days');
    setHasActiveSession(false);
    setPlacementState(null);
    setParsedNotification(null);
    setResumeData(null);
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

        if (!parsedNotification && stateData.parsed_notification) {
          const pn = stateData.parsed_notification as any;
          setParsedNotification(pn);
          localStorage.setItem('placementpal_parsed_notification', JSON.stringify(pn));
        }

        setProfile((prev) => ({
          ...prev,
          targetCompany: comp || prev.targetCompany,
          targetRole: role || prev.targetRole,
          daysRemaining: daysRemaining,
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
    if (hasActiveSession && sessionId) {
      refreshState(sessionId);
    }
  }, [sessionId, hasActiveSession]);

  return (
    <SessionContext.Provider
      value={{
        sessionId,
        hasActiveSession,
        profile,
        setProfile,
        placementState,
        parsedNotification,
        resumeData,
        loadingState,
        refreshState,
        refreshResume,
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
