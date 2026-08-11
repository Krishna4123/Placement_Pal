import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, AlertCircle, Flame, Target, CheckCircle, Clock,
  Upload, Sparkles, Bot, GraduationCap, Brain, ChevronRight, Circle
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
  const activeRole = placementState?.target_roles?.[0] || profile.targetRole;

  // Real curriculum & day data
  const rawDays = placementState?.curriculum?.days || [];
  const currentDayNum = placementState?.current_day || 1;
  const currentDayObj = rawDays.find((d: any) => d.day === currentDayNum) || rawDays[0] || { tasks: [] };

  // Tasks for today
  const initialTasks = (currentDayObj.tasks || []).map((t: any, idx: number) => ({
    id: t.task_id || t.id || `dash_${idx}`,
    label: t.title || t.name,
    done: t.status === "done" || !!t.done,
    priority: t.priority || "medium",
    type: t.type || "coding",
    estimated_minutes: t.estimated_minutes || 30,
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

  // Aggregate stats from entire curriculum
  const allTasks = rawDays.flatMap((d: any) => d.tasks || []);
  const totalTasksCount = allTasks.length;
  const completedTasksCount = allTasks.filter((t: any) => t.status === "done" || t.done).length;

  const readinessScore = totalTasksCount > 0 
    ? Math.round((completedTasksCount / totalTasksCount) * 100) 
    : 0;

  const todayCompletedCount = initialTasks.filter((t: any) => t.done).length;
  const todayTotalCount = initialTasks.length;

  // Today's estimated study time calculation
  const todayTotalMins = initialTasks.reduce((acc: number, t: any) => acc + (t.estimated_minutes || 30), 0);
  const todayCompletedMins = initialTasks.filter((t: any) => t.done).reduce((acc: number, t: any) => acc + (t.estimated_minutes || 30), 0);
  const todayRemainingMins = Math.max(0, todayTotalMins - todayCompletedMins);

  const formatMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  // Category breakdown for readiness metrics
  const codingTasks = allTasks.filter((t: any) => (t.type || "").toLowerCase() === "coding");
  const codingDone = codingTasks.filter((t: any) => t.status === "done" || t.done).length;
  const codingScore = codingTasks.length > 0 ? Math.round((codingDone / codingTasks.length) * 100) : 0;

  const coreTasks = allTasks.filter((t: any) => ["core", "cs"].includes((t.type || "").toLowerCase()));
  const coreDone = coreTasks.filter((t: any) => t.status === "done" || t.done).length;
  const coreScore = coreTasks.length > 0 ? Math.round((coreDone / coreTasks.length) * 100) : 0;

  const aptTasks = allTasks.filter((t: any) => (t.type || "").toLowerCase() === "aptitude");
  const aptDone = aptTasks.filter((t: any) => t.status === "done" || t.done).length;
  const aptScore = aptTasks.length > 0 ? Math.round((aptDone / aptTasks.length) * 100) : 0;

  const otherTasks = allTasks.filter((t: any) => !["coding", "core", "cs", "aptitude"].includes((t.type || "").toLowerCase()));
  const otherDone = otherTasks.filter((t: any) => t.status === "done" || t.done).length;
  const otherScore = otherTasks.length > 0 ? Math.round((otherDone / otherTasks.length) * 100) : 0;

  // Study hours calculation
  const totalCompletedMins = allTasks
    .filter((t: any) => t.status === "done" || t.done)
    .reduce((acc: number, t: any) => acc + (t.estimated_minutes || 30), 0);
  const totalPlannedMins = allTasks
    .reduce((acc: number, t: any) => acc + (t.estimated_minutes || 30), 0);
  
  const completedHours = (totalCompletedMins / 60).toFixed(1);
  const totalPlannedHours = (totalPlannedMins / 60).toFixed(1);

  // Dynamic daily study chart data
  const studyChartData = rawDays.length > 0
    ? rawDays.slice(0, 7).map((d: any) => {
        const dayDoneMins = (d.tasks || [])
          .filter((t: any) => t.status === "done" || t.done)
          .reduce((acc: number, t: any) => acc + (t.estimated_minutes || 30), 0);
        return {
          day: `Day ${d.day}`,
          h: parseFloat((dayDoneMins / 60).toFixed(1)) || 0,
        };
      })
    : [
        { day: "Day 1", h: 0 }, { day: "Day 2", h: 0 }, { day: "Day 3", h: 0 },
        { day: "Day 4", h: 0 }, { day: "Day 5", h: 0 }, { day: "Day 6", h: 0 }, { day: "Day 7", h: 0 },
      ];

  // Interview rounds count
  const roundsCount = placementState?.interpreted_intent?.rounds?.length ||
    placementState?.company_intel?.interview_rounds?.length || 3;

  // Dynamic Greeting based on hour
  const currentHour = new Date().getHours();
  const timeGreeting = currentHour < 12 ? "Good morning" : currentHour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-8">
      {/* Top Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">{timeGreeting}, {firstName}! 👋</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })} · {profile.daysRemaining} days until {activeCompany} interview
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
          <span className="font-semibold text-amber-900">
            {totalTasksCount > 0 ? "Active Preparation Plan: " : "No Active Plan: "}
          </span>
          <span className="text-amber-800">
            {totalTasksCount > 0
              ? `${activeCompany} preparation plan is active for ${activeRole}. ${completedTasksCount} of ${totalTasksCount} tasks completed.`
              : `Create a new session for ${activeCompany} to generate your customized day-by-day study roadmap.`}
          </span>
        </div>
        <Btn size="sm" variant="secondary" onClick={() => navigate(totalTasksCount > 0 ? "/curriculum" : "/new-session")} className="border-amber-200 text-amber-700 hover:bg-amber-100 shrink-0">
          {totalTasksCount > 0 ? "View Plan" : "Generate Plan"}
        </Btn>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Current Progress Day", value: `Day ${currentDayNum}`, icon: Flame, bg: "bg-amber-50", ic: "text-amber-500", sub: `🔥 ${rawDays.length || profile.daysRemaining} total days planned`, sc: "text-amber-600" },
          { label: "Readiness Score", value: `${readinessScore}%`, icon: Target, bg: "bg-blue-50", ic: "text-blue-600", sub: `${completedTasksCount} of ${totalTasksCount} tasks complete`, sc: "text-blue-600" },
          { label: "Today's Tasks", value: `${todayCompletedCount} / ${todayTotalCount}`, icon: CheckCircle, bg: "bg-green-50", ic: "text-green-600", sub: `${todayTotalCount - todayCompletedCount} pending today`, sc: "text-green-600" },
          { label: "Hours Completed", value: `${completedHours}h`, icon: Clock, bg: "bg-purple-50", ic: "text-purple-600", sub: todayRemainingMins > 0 ? `Today: ~${formatMins(todayRemainingMins)} left` : `Today's tasks done! 🎉`, sc: "text-purple-600" },
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
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="font-semibold text-[#111827]">Today's Tasks (Day {currentDayNum})</h3>
                <div className="flex items-center gap-2 text-xs text-[#6B7280] mt-0.5">
                  <span>{todayCompletedCount} of {todayTotalCount} completed</span>
                  <span>·</span>
                  <span className="text-[#2563EB] font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#2563EB]" />
                    {todayRemainingMins > 0 ? `~${formatMins(todayRemainingMins)} remaining today` : "All tasks completed! 🎉"}
                  </span>
                </div>
              </div>
              <Btn size="sm" variant="ghost" onClick={() => navigate("/planner")}>
                <Clock className="w-3.5 h-3.5" /> Full Planner
              </Btn>
            </div>
            <div className="space-y-2">
              {initialTasks.map((task: any) => (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id, task.done)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer border ${
                    task.done ? "bg-gray-50/70 border-transparent opacity-75" : "bg-white hover:bg-slate-50 border-gray-100 hover:border-blue-100 shadow-2xs"
                  }`}
                >
                  {task.done
                    ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    : <Circle className="w-4 h-4 text-gray-300 shrink-0" />
                  }
                  <span className={`text-sm flex-1 ${task.done ? "line-through text-[#9CA3AF]" : "text-[#374151] font-medium"}`}>{task.label}</span>
                  
                  {/* Estimated Time Pill */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-medium border border-blue-100/60 shrink-0">
                    <Clock className="w-3 h-3 text-blue-500" />
                    {formatMins(task.estimated_minutes)}
                  </span>

                  <Badge color={task.priority === "high" ? "red" : task.priority === "medium" ? "amber" : "gray"}>
                    {task.priority}
                  </Badge>
                </button>
              ))}
              {initialTasks.length === 0 && (
                <div className="text-center py-6 text-xs text-[#9CA3AF]">
                  No tasks scheduled for today. Create a new session or generate a plan to get started!
                </div>
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
                <Pie 
                  data={[{ v: readinessScore || 0 }, { v: 100 - (readinessScore || 0) }]} 
                  cx={80} cy={80} innerRadius={52} outerRadius={70}
                  startAngle={90} endAngle={-270} dataKey="v" strokeWidth={0}
                >
                  <Cell fill="#2563EB" />
                  <Cell fill="#EEF2FF" />
                </Pie>
              </PieChart>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#111827]">{readinessScore}%</div>
                  <div className="text-[10px] text-[#6B7280]">Interview Ready</div>
                </div>
              </div>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "DSA / Coding", v: codingScore, c: "#2563EB" },
                { label: "Core CS", v: coreScore, c: "#22C55E" },
                { label: "Aptitude", v: aptScore, c: "#F59E0B" },
                { label: "Other / System Design", v: otherScore, c: "#7C3AED" },
              ].map(({ label, v, c }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-xs text-[#6B7280] w-24 shrink-0 truncate">{label}</span>
                  <ProgressBar value={v} color={c} className="flex-1" />
                  <span className="text-xs font-semibold text-[#374151] w-7 text-right shrink-0">{v}%</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Daily Study Hours Chart */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#111827]">Daily Completed Hours</h3>
              <div className="flex items-center gap-1 text-xs font-medium text-amber-600">
                <Flame className="w-3.5 h-3.5" /> Day {currentDayNum}
              </div>
            </div>
            <div className="h-32 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studyChartData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 10, fill: "#6B7280", fontWeight: 500 }} 
                    axisLine={false} 
                    tickLine={false}
                    interval={0}
                  />
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 11, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}
                    formatter={(v: number) => [`${v}h`, "Study Hours"]}
                    cursor={{ fill: "#F3F4F6", radius: 4 }}
                  />
                  <Bar dataKey="h" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Active Prep Card */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#111827]">Active Prep</h3>
              <Badge color={totalTasksCount > 0 ? "green" : "amber"}>
                {totalTasksCount > 0 ? "In Progress" : "Pending"}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold shrink-0">
                {activeCompany.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-semibold text-[#111827]">{activeCompany}</div>
                <div className="text-xs text-[#6B7280]">{activeRole}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                [profile.daysRemaining.toString(), "days left"],
                [roundsCount.toString(), "rounds"],
                [`${readinessScore}%`, "prep"]
              ].map(([val, lbl]) => (
                <div key={lbl} className="text-center bg-gray-50 rounded-xl p-2">
                  <div className={`text-sm font-bold ${lbl === "prep" ? "text-[#2563EB]" : "text-[#111827]"}`}>{val}</div>
                  <div className="text-[10px] text-[#6B7280]">{lbl}</div>
                </div>
              ))}
            </div>
            <ProgressBar value={readinessScore} color="#2563EB" className="mb-2" />
            <Btn size="sm" variant="secondary" onClick={() => navigate("/company")} className="w-full justify-center text-xs mt-1">
              View Company Dashboard <ChevronRight className="w-3 h-3" />
            </Btn>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

