import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { GlassCard, Btn } from "../components/common/UIElements";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import { useAuth } from "../context/AuthContext";
import { useSession } from "../context/SessionContext";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const { startNewSession } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ── Redirect if already logged in ───────────────────── */
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  /* ── Validation helpers ──────────────────────────────── */
  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const canSubmit = email.trim() !== "" && password.trim() !== "" && isValidEmail(email);

  /* ── Submit ──────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password.trim()) {
      setError("Password is required.");
      return;
    }

    try {
      setLoading(true);
      const result = await login(email, password);
      if (result.success) {
        startNewSession();
        navigate("/dashboard");
      } else {
        setError(result.error || "Login failed. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-12 antialiased">
      <div className="w-full max-w-md">
        {/* Logo & tagline */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] mb-4 shadow-lg shadow-blue-200/50 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#111827]">
            Welcome back to{" "}
            <span className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] bg-clip-text text-transparent">
              PlacementPal AI
            </span>
          </h1>
          <p className="text-sm text-[#6B7280] mt-2">
            Sign in to continue your placement preparation.
          </p>
        </div>

        {/* Card */}
        <GlassCard className="p-7">
          <form onSubmit={handleSubmit} className="space-y-5" id="login-form">
            {/* Error banner */}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3 animate-fade-in">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password">Password</Label>
                <button
                  type="button"
                  className="text-xs text-[#2563EB] hover:underline font-medium cursor-pointer"
                  onClick={() => {/* placeholder for forgot-password flow */}}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl pr-11"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="login-remember"
                checked={rememberMe}
                onCheckedChange={(v) => setRememberMe(v === true)}
              />
              <Label htmlFor="login-remember" className="text-sm font-normal text-[#6B7280] cursor-pointer">
                Remember me
              </Label>
            </div>

            {/* Submit */}
            <Btn
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full justify-center"
              disabled={!canSubmit || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Btn>
          </form>

          {/* Sign-up link */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-sm text-[#6B7280]">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-[#2563EB] font-semibold hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </GlassCard>

        {/* Back to home */}
        <p className="text-center text-xs text-[#9CA3AF] mt-6">
          <Link to="/" className="hover:text-[#6B7280] transition-colors">
            ← Back to PlacementPal AI
          </Link>
        </p>
      </div>
    </div>
  );
};

