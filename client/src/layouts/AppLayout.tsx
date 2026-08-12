import React, { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Building2, BookOpen, Brain, GraduationCap,
  Settings, Search, Bell, MessageSquare, Plus,
  Calendar, Sparkles, X, Menu, Terminal, LogOut
} from "lucide-react";
import { ProgressBar } from "../components/common/UIElements";
import { ChatPanel } from "../components/chat/ChatPanel";
import { useSession } from "../context/SessionContext";
import { useAuth } from "../context/AuthContext";

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
  "/company": "Company Intelligence",
  "/vault": "Knowledge Vault",
  "/resume": "Resume & Portfolio Hub",
  "/recall": "Recall Guide",
  "/curriculum": "Curriculum",
  "/planner": "Daily Planner",
  "/settings": "Settings",
};

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, placementState, clearSession } = useSession();
  const { logout } = useAuth();
  const activeCompany = placementState?.target_companies?.[0] || profile.targetCompany;
  
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
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden antialiased">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 w-64 bg-white border-r border-gray-100 z-50 transition-transform duration-200 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 px-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-200/50">
              PP
            </div>
            <div>
              <div className="font-bold text-sm text-[#111827] leading-none">PlacementPal</div>
              <div className="text-[10px] text-[#6B7280] mt-0.5 font-medium">AI Career Agent</div>
            </div>
          </div>
          <button
            className="md:hidden p-1 rounded-lg text-gray-400 hover:text-gray-600"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ path, icon: Icon, label, badge }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? "bg-blue-50 text-[#2563EB]"
                    : "text-[#6B7280] hover:bg-gray-50 hover:text-[#374151]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#2563EB]" : "text-[#9CA3AF] group-hover:text-[#374151]"}`} />
                  <span>{label}</span>
                  {badge && !isActive && (
                    <span className="ml-auto w-5 h-5 bg-[#2563EB] text-white text-[10px] rounded-full flex items-center justify-center font-bold">{badge}</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer Info */}
        <div className="p-3 border-t border-gray-100 shrink-0">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-xl p-3 mb-3">
            <div className="text-xs font-semibold text-[#111827] mb-0.5">Interview in {profile.daysRemaining} days</div>
            <div className="text-[11px] text-[#6B7280] mb-2">{activeCompany} · Stay on track!</div>
            <ProgressBar value={55} color="#2563EB" />
          </div>
          <button
            onClick={() => {
              navigate("/settings");
              setSidebarOpen(false);
            }}
            className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 text-left transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {getInitials(profile.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-[#111827] truncate">{profile.name}</div>
              <div className="text-[11px] text-[#6B7280] truncate">{profile.department} · {profile.college}</div>
            </div>
          </button>
          <button
            onClick={() => {
              logout();
              clearSession();
              navigate("/login");
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 mt-1 rounded-xl text-sm font-medium text-[#EF4444] hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TopBar */}
        <header className="h-16 border-b border-gray-100 px-4 md:px-6 flex items-center gap-3 bg-white/80 backdrop-blur-sm shrink-0">
          <button className="md:hidden p-2 rounded-xl hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-[#6B7280]" />
          </button>
          <h2 className="text-base font-semibold text-[#111827]">{currentTitle}</h2>
          <div className="flex-1" />

          {/* Pill Badge matching user image: Target Company : Days Left */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-50/90 border border-slate-100 text-xs sm:text-sm font-medium text-slate-800 shadow-2xs">
            <span className="font-semibold text-slate-900">{activeCompany}</span>
            <span className="text-slate-400 font-normal">:</span>
            <span className="font-semibold text-[#2563EB] ml-0.5">{profile.daysRemaining} Days Left</span>
          </div>

          <div
            onClick={() => navigate("/settings")}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-white text-xs font-semibold cursor-pointer"
            title="Profile & Settings"
          >
            {getInitials(profile.name)}
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {/* AI Chat Drawer */}
      {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}

      {/* Floating Chat Trigger */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 w-12 h-12 bg-gradient-to-br from-[#2563EB] to-[#7C3AED] rounded-2xl shadow-lg shadow-blue-200/60 flex items-center justify-center text-white hover:scale-110 hover:shadow-xl hover:shadow-blue-200/80 transition-all duration-200 z-40 cursor-pointer"
          title="PlacementPal AI Assistant"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
