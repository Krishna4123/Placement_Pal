import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, AlertCircle, Flame, Target, CheckCircle, Clock,
  Upload, Sparkles, Bot, GraduationCap, Brain, TrendingUp, ChevronRight, Circle
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { GlassCard, Badge, Btn, ProgressBar } from "../components/common/UIElements";
import { useSession } from "../context/SessionContext";
import { planApi } from "../api/plan";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, sessionId, placementState, refreshState } = useSession();
  const firstName = profile.name.split(" ")[0] || "Student";
  const activeCompany = placementState?.target_companies?.[0] || profile.targetCompany;

  const rawDays = placementState?.curriculum?.days || [];
  const currentDayNum = placementState?.current_day || 1;
  const currentDayObj = rawDays.find((d: any) => d.day === currentDayNum) || rawDays[0] || { tasks: [] };

  const initialTasks = (currentDayObj.tasks || []).map((t: any, idx: number) => ({
    id: t.task_id || t.id || `dash_${idx}`,
    label: t.title || t.name,
    done: t.status === "done" || !!t.done,
    priority: t.priority || "medium",
  }));

  const toggleTask = async (taskId: string, currentDone: boolean) => {
    try {
      await planApi.markTask({
        session_id: sessionId,
        task_id: taskId,
        status: !currentDone ? 'done' : 'pending',
      });
      await refreshState();
    } catch (err) {
      console.error('Failed to sync task status with backend:', err);
    }
  };

  const streakData = [
    { day: "Mon", h: 3.5 }, { day: "Tue", h: 5 }, { day: "Wed", h: 4 },
    { day: "Thu", h: 2 }, { day: "Fri", h: 6 }, { day: "Sat", h: 4.5 }, { day: "Sun", h: 3 },
  ];

  const completedCount = initialTasks.filter((t: any) => t.done).length;

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-8">
      {/* Top Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Good morning, {firstName}! 👋</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })} · {profile.daysRemaining} days until {profile.targetCompany} interview
          </p>
        </div>
        <Btn variant="gradient" onClick={() => navigate("/new-session")}>
          <Plus className="w-4 h-4" /> New Session
        </Btn>
      </div>

      {/* Alert */}
      <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
        <div className="flex-1 text-sm">
          <span className="font-semibold text-amber-900">Deadline Alert: </span>
          <span className="text-amber-800">{profile.targetCompany} application process is active. Increase daily study hours to meet your readiness goal.</span>
        </div>
        <Btn size="sm" variant="secondary" onClick={() => navigate("/company")} className="border-amber-200 text-amber-700 hover:bg-amber-100 shrink-0">
          View Plan
        </Btn>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Study Streak", value: "7 days", icon: Flame, bg: "bg-amber-50", ic: "text-amber-500", sub: "🔥 Personal best!", sc: "text-amber-600" },
          { label: "Readiness Score", value: "74%", icon: Target, bg: "bg-blue-50", ic: "text-blue-600", sub: "↑ 12% this week", sc: "text-blue-600" },
          { label: "Tasks Completed", value: `${completedCount} / 5`, icon: CheckCircle, bg: "bg-green-50", ic: "text-green-600", sub: `${5 - completedCount} pending today`, sc: "text-green-600" },
          { label: "Hours This Week", value: "24h", icon: Clock, bg: "bg-purple-50", ic: "text-purple-600", sub: "Goal: 30h / week", sc: "text-purple-600" },
        ].map(({ label, value, icon: Icon, bg, ic, sub, sc }) => (
          <GlassCard key={label} className="p-4">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${ic}`} />
            </div>
            <div className="text-xl font-bold text-[#111827]">{value}</div>
            <div className="text-xs text-[#6B7280] mt-0.5">{label}</div>
            <div className={`text-xs mt-1.5 font-medium ${sc}`}>{sub}</div>
          </GlassCard>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Tasks */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-[#111827]">Today's Tasks</h3>
                <p className="text-xs text-[#6B7280] mt-0.5">{initialTasks.filter((t: any) => t.done).length} of {initialTasks.length} completed</p>
              </div>
              <Btn size="sm" variant="ghost" onClick={() => navigate("/planner")}>
                <Clock className="w-3.5 h-3.5" /> Full Planner
              </Btn>
            </div>
            <div className="space-y-1">
              {initialTasks.map((task: any) => (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id, task.done)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors cursor-pointer ${task.done ? "bg-gray-50" : "hover:bg-gray-50"}`}
                >
                  {task.done
                    ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    : <Circle className="w-4 h-4 text-gray-300 shrink-0" />
                  }
                  <span className={`text-sm flex-1 ${task.done ? "line-through text-[#9CA3AF]" : "text-[#374151]"}`}>{task.label}</span>
                  <Badge color={task.priority === "high" ? "red" : task.priority === "medium" ? "amber" : "gray"}>
                    {task.priority}
                  </Badge>
                </button>
              ))}
              {initialTasks.length === 0 && (
                <div className="text-center py-6 text-xs text-[#9CA3AF]">No tasks scheduled for today. Create a new session or generate a plan to get started!</div>
              )}
            </div>
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard className="p-6">
            <h3 className="font-semibold text-[#111827] mb-4">Quick Actions</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Upload Notes", icon: Upload, bg: "bg-blue-50 border-blue-100 hover:bg-blue-100", ic: "text-blue-600", to: "/vault" },
                { label: "Generate Plan", icon: Sparkles, bg: "bg-purple-50 border-purple-100 hover:bg-purple-100", ic: "text-purple-600", to: "/new-session" },
                { label: "Curriculum", icon: GraduationCap, bg: "bg-amber-50 border-amber-100 hover:bg-amber-100", ic: "text-amber-600", to: "/curriculum" },
                { label: "Recall Guide", icon: Brain, bg: "bg-purple-50 border-purple-100 hover:bg-purple-100", ic: "text-purple-600", to: "/recall" },
                { label: "Progress", icon: TrendingUp, bg: "bg-blue-50 border-blue-100 hover:bg-blue-100", ic: "text-blue-600", to: "/progress" },
                { label: "Ask AI", icon: Bot, bg: "bg-green-50 border-green-100 hover:bg-green-100", ic: "text-green-600", to: "/vault" },
              ].map(({ label, icon: Icon, bg, ic, to }) => (
                <button
                  key={label}
                  onClick={() => navigate(to)}
                  className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all hover:scale-[1.03] hover:shadow-sm cursor-pointer ${bg}`}
                >
                  <Icon className={`w-5 h-5 ${ic}`} />
                  <span className="text-xs font-medium text-[#374151] text-center leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Readiness Donut */}
          <GlassCard className="p-5">
            <h3 className="font-semibold text-[#111827] mb-4">Readiness Score</h3>
            <div className="relative w-40 h-40 mx-auto mb-3">
              <PieChart width={160} height={160}>
                <Pie data={[{ v: 74 }, { v: 26 }]} cx={80} cy={80} innerRadius={52} outerRadius={70}
                  startAngle={90} endAngle={-270} dataKey="v" strokeWidth={0}>
                  <Cell fill="#2563EB" />
                  <Cell fill="#EEF2FF" />
                </Pie>
              </PieChart>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#111827]">74%</div>
                  <div className="text-[10px] text-[#6B7280]">Interview Ready</div>
                </div>
              </div>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "DSA", v: 68, c: "#2563EB" },
                { label: "Core CS", v: 82, c: "#22C55E" },
                { label: "Aptitude", v: 74, c: "#F59E0B" },
                { label: "System Design", v: 45, c: "#7C3AED" },
              ].map(({ label, v, c }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-xs text-[#6B7280] w-24 shrink-0">{label}</span>
                  <ProgressBar value={v} color={c} className="flex-1" />
                  <span className="text-xs font-semibold text-[#374151] w-7 text-right shrink-0">{v}%</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Weekly Study */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#111827]">Weekly Study</h3>
              <div className="flex items-center gap-1 text-xs font-medium text-amber-600">
                <Flame className="w-3.5 h-3.5" /> 7-day streak
              </div>
            </div>
            <ResponsiveContainer width="100%" height={72}>
              <BarChart data={streakData} margin={{ top: 0, right: 0, bottom: 0, left: -28 }}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 11 }}
                  formatter={(v: number) => [`${v}h`, "Study"]}
                  cursor={{ fill: "#F9FAFB" }}
                />
                <Bar dataKey="h" fill="#2563EB" radius={[3, 3, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* Active Prep Card */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#111827]">Active Prep</h3>
              <Badge color="green">In Progress</Badge>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold shrink-0">
                {profile.targetCompany.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-semibold text-[#111827]">{profile.targetCompany}</div>
                <div className="text-xs text-[#6B7280]">{profile.targetRole}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                [profile.daysRemaining.toString(), "days left"],
                ["3", "rounds"],
                ["55%", "prep"]
              ].map(([val, lbl]) => (
                <div key={lbl} className="text-center bg-gray-50 rounded-xl p-2">
                  <div className={`text-sm font-bold ${lbl === "prep" ? "text-[#2563EB]" : "text-[#111827]"}`}>{val}</div>
                  <div className="text-[10px] text-[#6B7280]">{lbl}</div>
                </div>
              ))}
            </div>
            <ProgressBar value={55} color="#2563EB" className="mb-2" />
            <Btn size="sm" variant="secondary" onClick={() => navigate("/company")} className="w-full justify-center text-xs mt-1">
              View Company Dashboard <ChevronRight className="w-3 h-3" />
            </Btn>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
