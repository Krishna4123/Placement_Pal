import React, { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Building2, BookOpen, Brain, GraduationCap,
  TrendingUp, Settings, Search, Bell, MessageSquare, Plus,
  Calendar, Sparkles, X, Menu
} from "lucide-react";
import { ProgressBar } from "../components/common/UIElements";
import { ChatPanel } from "../components/chat/ChatPanel";
import { useSession } from "../context/SessionContext";

const navItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/new-session", icon: Plus, label: "New Session", badge: "+" },
  { path: "/company", icon: Building2, label: "Company" },
  { path: "/vault", icon: BookOpen, label: "Knowledge Vault" },
  { path: "/recall", icon: Brain, label: "Recall Guide" },
  { path: "/curriculum", icon: GraduationCap, label: "Curriculum" },
  { path: "/planner", icon: Calendar, label: "Daily Planner" },
  { path: "/progress", icon: TrendingUp, label: "Progress" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/new-session": "New Session",
  "/company": "Company Intelligence",
  "/vault": "Knowledge Vault",
  "/recall": "Recall Guide",
  "/curriculum": "Curriculum",
  "/planner": "Daily Planner",
  "/progress": "Progress Analytics",
  "/settings": "Settings",
};

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useSession();
  
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
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 z-20 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-30 w-64 flex-shrink-0 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } shadow-xl md:shadow-none border-r border-gray-100 bg-white flex flex-col h-full`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#111827] leading-tight">PlacementPal</div>
              <div className="text-[10px] text-[#9CA3AF] leading-tight">AI Mentor</div>
            </div>
          </div>
          <button className="md:hidden p-1 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Menu</div>
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
            <div className="text-[11px] text-[#6B7280] mb-2">{profile.targetCompany} · Stay on track!</div>
            <ProgressBar value={55} color="#2563EB" />
          </div>
          <button
            onClick={() => {
              navigate("/settings");
              setSidebarOpen(false);
            }}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {getInitials(profile.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-[#111827] truncate">{profile.name}</div>
              <div className="text-[11px] text-[#6B7280] truncate">{profile.department} · {profile.college}</div>
            </div>
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
          
          <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 w-56">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              placeholder="Search topics..."
              className="bg-transparent text-sm text-[#374151] outline-none flex-1 placeholder:text-gray-400 min-w-0"
            />
            <kbd className="text-[10px] text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded-md">⌘K</kbd>
          </div>

          <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors" title="Notifications">
            <Bell className="w-5 h-5 text-[#6B7280]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full border-2 border-white" />
          </button>

          <button onClick={() => setChatOpen(true)} className="p-2 rounded-xl hover:bg-blue-50 transition-colors" title="Open AI Assistant">
            <MessageSquare className="w-5 h-5 text-[#2563EB]" />
          </button>

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
