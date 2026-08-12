/**
 * AuthContext.tsx
 * ──────────────
 * Dedicated authentication state management — separate from SessionContext
 * which handles placement session data.
 *
 * Provides:
 *  - isAuthenticated / isLoading state
 *  - user object (id, name, email)
 *  - login / signup / logout actions
 *  - Automatic session restoration on mount via GET /auth/me
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AuthUser,
  login as apiLogin,
  signup as apiSignup,
  getCurrentUser,
  logout as apiLogout,
} from '../services/auth';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string, confirmPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true); // start true until session check completes

  // ── Restore session on mount ────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await getCurrentUser();
      if (!cancelled) {
        if (result.success && result.user) {
          setUser(result.user);
        }
        setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Login ───────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    if (result.success && result.user) {
      setUser(result.user);
      return { success: true };
    }
    return { success: false, error: result.error };
  }, []);

  // ── Signup ──────────────────────────────────────────
  const signup = useCallback(async (name: string, email: string, password: string, confirmPassword: string) => {
    const result = await apiSignup(name, email, password, confirmPassword);
    if (result.success && result.user) {
      setUser(result.user);
      return { success: true };
    }
    return { success: false, error: result.error };
  }, []);

  // ── Logout ──────────────────────────────────────────
  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

