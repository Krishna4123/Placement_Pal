/**
 * Frontend-only authentication service stub.
 *
 * All methods simulate network latency with a short delay.
 * Replace the internals with a real auth provider (e.g. Supabase Auth)
 * when backend authentication is ready — the call-sites stay the same.
 */

export interface AuthUser {
  name: string;
  email: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

const SIMULATED_DELAY_MS = 1200;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Simulate a login request.
 * Currently always succeeds after a short delay.
 */
export async function login(email: string, _password: string): Promise<AuthResult> {
  await delay(SIMULATED_DELAY_MS);

  // Placeholder — swap with real API / Supabase call
  return {
    success: true,
    user: { name: email.split("@")[0], email },
  };
}

/**
 * Simulate a sign-up request.
 * Currently always succeeds after a short delay.
 */
export async function signup(
  name: string,
  email: string,
  _password: string,
): Promise<AuthResult> {
  await delay(SIMULATED_DELAY_MS);

  // Placeholder — swap with real API / Supabase call
  return {
    success: true,
    user: { name, email },
  };
}

/**
 * Initiate Google Sign-In.
 * Placeholder — wire up with Google OAuth / Supabase Google provider when ready.
 */
export async function googleSignIn(): Promise<AuthResult> {
  await delay(SIMULATED_DELAY_MS);

  // Placeholder — replace with real Google OAuth flow
  console.info("[auth] Google Sign-In triggered — provider not yet configured.");
  return {
    success: false,
    error: "Google Sign-In is not yet configured. Please use email login.",
  };
}

/**
 * Clear any stored authentication tokens / state.
 */
export function logout(): void {
  // Placeholder — clear tokens, cookies, etc. when real auth is wired up
}

