import React, { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Building2, BookOpen, Brain, GraduationCap,
  Settings, MessageSquare, Plus,
  Calendar, Sparkles, X, Menu, FileText, LogOut, Sun, Moon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProgressBar } from "../components/common/UIElements";
import { ChatPanel } from "../components/chat/ChatPanel";
import { useSession } from "../context/SessionContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { PageTransition } from "../components/animations/PageTransition";

const navItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/new-session", icon: Plus, label: "New Session", badge: "+" },
  { path: "/company", icon: Building2, label: "Company" },
  { path: "/vault", icon: BookOpen, label: "Knowledge Vault" },
  { path: "/resume", icon: FileText, label: "Resume" },
  { path: "/recall", icon: Brain, label: "Recall Guide" },
  { path: "/curriculum", icon: GraduationCap, label: "Curriculum" },
  { path: "/planner", icon: Calendar, label: "Daily Planner" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/new-session": "New Session",
  "/company": "Company Intelligence & Sessions",
  "/vault": "Knowledge Vault",
  "/resume": "Resume & Portfolio Hub",
  "/recall": "Recall Guide",
  "/curriculum": "Curriculum",
  "/planner": "Daily Planner",
  "/settings": "Settings",
};

// Framer Motion sidebar stagger variants
const sidebarContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.055, delayChildren: 0.1 },
  },
};
const sidebarItemVariants = {
  hidden:  { opacity: 0, x: -14 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, clearSession } = useSession();
  const { logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const getInitials = (name: string) => {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return "AK";
  };

  const currentTitle = routeTitles[location.pathname] || "PlacementPal";

  return (
    <div className="flex h-screen bg-background overflow-hidden antialiased">
      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 bg-black/30 z-20 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-30 w-64 flex-shrink-0 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } shadow-xl md:shadow-none border-r border-border bg-card flex flex-col h-full`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <motion.div
              whileHover={{ scale: 1.08, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center shrink-0 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-white" />
            </motion.div>
            <div>
              <div className="text-sm font-semibold text-foreground leading-tight">PlacementPal</div>
              <div className="text-[10px] text-muted-foreground leading-tight">AI Mentor</div>
            </div>
          </div>
          <button className="md:hidden p-1 rounded-lg hover:bg-secondary transition-colors" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Menu</div>
          <motion.div
            variants={sidebarContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {navItems.map(({ path, icon: Icon, label, badge }) => (
              <motion.div key={path} variants={sidebarItemVariants}>
                <NavLink
                  to={path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group relative ${
                      isActive
                        ? "bg-accent text-primary nav-active-glow"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute inset-0 rounded-xl bg-accent"
                          style={{ zIndex: -1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 35 }}
                        />
                      )}
                      <motion.div
                        whileHover={{ scale: 1.12, x: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                      </motion.div>
                      <span>{label}</span>
                      {badge && !isActive && (
                        <span className="ml-auto w-5 h-5 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-bold">{badge}</span>
                      )}
                    </>
                  )}
                </NavLink>
              </motion.div>
            ))}
          </motion.div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border shrink-0">
          <div className="bg-gradient-to-r from-accent to-accent/50 border border-border rounded-xl p-3 mb-3">
            <div className="text-xs font-semibold text-foreground mb-0.5">Interview in {profile.daysRemaining} days</div>
            <div className="text-[11px] text-muted-foreground mb-2">{profile.targetCompany} · Stay on track!</div>
            <ProgressBar value={55} color="var(--primary)" />
          </div>
          <button
            onClick={() => { navigate("/settings"); setSidebarOpen(false); }}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-secondary transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {getInitials(profile.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-foreground truncate">{profile.name}</div>
              <div className="text-[11px] text-muted-foreground truncate">{profile.department} · {profile.college}</div>
            </div>
          </button>
          <button
            onClick={() => { logout(); clearSession(); navigate("/login"); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 mt-1 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TopBar */}
        <header className="h-16 border-b border-border px-4 md:px-6 flex items-center gap-3 bg-card/80 backdrop-blur-sm shrink-0">
          <button className="md:hidden p-2 rounded-xl hover:bg-secondary transition-colors" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-muted-foreground" />
          </button>
          <h2 className="text-base font-semibold text-foreground">{currentTitle}</h2>
          <div className="flex-1" />

          {/* Target Company Indicator Pill */}
          <motion.div
            onClick={() => navigate("/company")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="hidden sm:flex items-center gap-2 bg-accent border border-border rounded-xl px-3 py-1.5 cursor-pointer transition-colors"
            title="Click to view or switch target companies"
          >
            <Building2 className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs font-bold text-foreground">{profile.targetCompany}</span>
            <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-semibold">{profile.daysRemaining}d prep</span>
          </motion.div>

          {/* Theme Toggle */}
          <motion.button
            onClick={toggleTheme}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            className="p-2 rounded-xl hover:bg-secondary transition-colors"
            title={resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <AnimatePresence mode="wait" initial={false}>
              {resolvedTheme === 'dark' ? (
                <motion.div
                  key="sun"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="w-4 h-4 text-amber-400" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ opacity: 0, rotate: 90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: -90 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          <button onClick={() => setChatOpen(true)} className="p-2 rounded-xl hover:bg-accent transition-colors" title="Open AI Assistant">
            <MessageSquare className="w-5 h-5 text-primary" />
          </button>

          <motion.div
            onClick={() => navigate("/settings")}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-white text-xs font-semibold cursor-pointer shadow-sm"
            title="Profile & Settings"
          >
            {getInitials(profile.name)}
          </motion.div>
        </header>

        {/* Page Content with Transition */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>

      {/* AI Chat Drawer */}
      {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}

      {/* Floating Chat Trigger */}
      <AnimatePresence>
        {!chatOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1, boxShadow: "0 8px 24px rgba(37,99,235,0.45)" }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            onClick={() => setChatOpen(true)}
            className="fixed bottom-6 right-6 w-12 h-12 bg-gradient-to-br from-[#2563EB] to-[#7C3AED] rounded-2xl shadow-lg flex items-center justify-center text-white z-40 cursor-pointer"
            title="PlacementPal AI Assistant"
          >
            <MessageSquare className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
