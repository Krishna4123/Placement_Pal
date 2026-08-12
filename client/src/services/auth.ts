/**
 * Frontend authentication service — real API integration.
 *
 * Communicates with the FastAPI /auth/* endpoints.
 * Tokens are stored in localStorage; the axios interceptor
 * in api/client.ts attaches them automatically.
 */

import { apiClient } from '../api/client';

// ── Types ────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  auth_provider?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

const TOKEN_KEY = 'placementpal_access_token';

// ── Token helpers ────────────────────────────────────────

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ── Login (email + password) ─────────────────────────────

export async function login(email: string, password: string): Promise<AuthResult> {
  try {
    const res = await apiClient.post('/auth/login', { email, password });
    const { access_token, user } = res.data;
    storeToken(access_token);
    return { success: true, user };
  } catch (err: any) {
    const detail = err?.response?.data?.detail;
    return {
      success: false,
      error: detail || 'Unable to connect to the server. Please try again.',
    };
  }
}

// ── Sign-up (email + password) ───────────────────────────

export async function signup(
  name: string,
  email: string,
  password: string,
  confirmPassword: string,
): Promise<AuthResult> {
  try {
    const res = await apiClient.post('/auth/signup', {
      name,
      email,
      password,
      confirm_password: confirmPassword,
    });
    const { access_token, user } = res.data;
    storeToken(access_token);
    return { success: true, user };
  } catch (err: any) {
    const detail = err?.response?.data?.detail;
    return {
      success: false,
      error: detail || 'Unable to connect to the server. Please try again.',
    };
  }
}


// ── Get current user (session restore) ───────────────────

export async function getCurrentUser(): Promise<AuthResult> {
  const token = getStoredToken();
  if (!token) {
    return { success: false };
  }

  try {
    const res = await apiClient.get('/auth/me');
    return { success: true, user: res.data };
  } catch {
    // Token expired or invalid — clear it
    clearToken();
    return { success: false };
  }
}

// ── Logout ───────────────────────────────────────────────

export function logout(): void {
  clearToken();
  // Also clear session-related localStorage entries
  localStorage.removeItem('placementpal_active_session');
  localStorage.removeItem('placementpal_parsed_notification');
  localStorage.removeItem('placementpal_profile');
  localStorage.removeItem('placementpal_session_id');
}
