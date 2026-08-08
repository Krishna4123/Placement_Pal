import React, { createContext, useContext, useState, useEffect } from 'react';
import { stateApi, PlacementState } from '../api/state';

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
  loadingState: boolean;
  refreshState: () => Promise<void>;
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
  const [sessionId, setSessionId] = useState<string>(() => {
    const saved = localStorage.getItem('placementpal_session_id');
    if (saved) return saved;
    const newId = 'session_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    localStorage.setItem('placementpal_session_id', newId);
    return newId;
  });

  const [hasActiveSession, setHasActiveSession] = useState<boolean>(() => {
    return localStorage.getItem('placementpal_active_session') === 'true';
  });

  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('placementpal_profile');
    return saved ? JSON.parse(saved) : defaultProfile;
  });

  const [placementState, setPlacementState] = useState<PlacementState | null>(null);
  const [loadingState, setLoadingState] = useState<boolean>(false);

  const startNewSession = (newCompany?: string) => {
    const newId = 'session_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    localStorage.setItem('placementpal_session_id', newId);
    localStorage.setItem('placementpal_active_session', 'true');
    setSessionId(newId);
    setHasActiveSession(true);
    if (newCompany) {
      setProfile((prev) => ({ ...prev, targetCompany: newCompany }));
    }
    return newId;
  };

  const clearSession = () => {
    localStorage.removeItem('placementpal_active_session');
    setHasActiveSession(false);
    setPlacementState(null);
  };

  const refreshState = async () => {
    try {
      setLoadingState(true);
      const res = await stateApi.getState(sessionId);
      if (res && res.data) {
        setPlacementState(res.data);
      }
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
    if (hasActiveSession) {
      refreshState();
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
        loadingState,
        refreshState,
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
