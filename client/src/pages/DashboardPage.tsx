import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, AlertCircle, Flame, Target, CheckCircle, Clock,
  Upload, Sparkles, Bot, GraduationCap, Brain, ChevronRight, Circle
} from "lucide-react";
import { motion } from "motion/react";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { GlassCard, Badge, Btn, ProgressBar } from "../components/common/UIElements";
import { AnimatedCounter } from "../components/animations/AnimatedCounter";
import { useReveal } from "../hooks/useReveal";
import { useSession } from "../context/SessionContext";
import { planApi } from "../api/plan";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, sessionId, placementState, refreshState } = useSession();
  const { ref: statsRef, inView: statsInView } = useReveal<HTMLDivElement>({ threshold: 0.1 });

  const firstName = profile.name.split(" ")[0] || "Student";
  const activeCompany = placementState?.target_companies?.[0] || profile.targetCompany;
  const activeRole = placementState?.target_roles?.[0] || profile.targetRole;

  const rawDays = placementState?.curriculum?.days || [];
  const totalDaysCount = rawDays.length || placementState?.preparation_duration_days || profile.daysRemaining || 19;
  const currentDayNum = Math.min(totalDaysCount, Math.max(1, totalDaysCount - profile.daysRemaining + 1));
  const currentDayObj = rawDays.find((d: any) => d.day === currentDayNum) || rawDays[currentDayNum - 1] || rawDays[0] || { tasks: [] };

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
      await planApi.markTask({ session_id: sessionId, task_id: taskId, status: !currentDone ? 'done' : 'pending' });
      await refreshState();
    } catch (err) {
      console.error('Failed to sync task status with backend:', err);
    }
  };

  const allTasks = rawDays.flatMap((d: any) => d.tasks || []);
  const totalTasksCount = allTasks.length;
  const completedTasksCount = allTasks.filter((t: any) => t.status === "done" || t.done).length;
  const readinessScore = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
  const todayCompletedCount = initialTasks.filter((t: any) => t.done).length;
  const todayTotalCount = initialTasks.length;

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

  const totalCompletedMins = allTasks.filter((t: any) => t.status === "done" || t.done).reduce((acc: number, t: any) => acc + (t.estimated_minutes || 30), 0);
  const totalPlannedMins = allTasks.reduce((acc: number, t: any) => acc + (t.estimated_minutes || 30), 0);
  const completedHours = (totalCompletedMins / 60).toFixed(1);
  const totalPlannedHours = (totalPlannedMins / 60).toFixed(1);

  // Dynamic daily study chart data (only calculate completed hours up to currentDayNum, future days remain 0)
  const studyChartData = rawDays.length > 0
    ? rawDays.slice(0, 7).map((d: any) => {
        const isFutureDay = d.day > currentDayNum;
        const dayDoneMins = isFutureDay
          ? 0
          : (d.tasks || [])
              .filter((t: any) => t.status === "done" || t.done)
              .reduce((acc: number, t: any) => acc + (t.estimated_minutes || 30), 0);
        return {
          day: `Day ${d.day}`,
          h: parseFloat((dayDoneMins / 60).toFixed(1)) || 0,
        };
      })
    : [{ day: "D1", h: 0 }, { day: "D2", h: 0 }, { day: "D3", h: 0 }, { day: "D4", h: 0 }, { day: "D5", h: 0 }, { day: "D6", h: 0 }, { day: "D7", h: 0 }];

  const roundsCount = placementState?.interpreted_intent?.rounds?.length || placementState?.company_intel?.interview_rounds?.length || 3;
  const currentHour = new Date().getHours();
  const timeGreeting = currentHour < 12 ? "Good morning" : currentHour < 17 ? "Good afternoon" : "Good evening";

  // Real-time time remaining for today (hours & minutes left for this day)
  const [timeLeftToday, setTimeLeftToday] = React.useState<{ hours: number; minutes: number }>({ hours: 0, minutes: 0 });

  React.useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      const diffMs = Math.max(0, endOfDay.getTime() - now.getTime());
      const totalMins = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(totalMins / 60);
      const minutes = totalMins % 60;
      setTimeLeftToday({ hours, minutes });
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-8">
      {/* Top Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-start justify-between flex-wrap gap-3"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">{timeGreeting}, {firstName}! 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })} · {profile.daysRemaining} days until {activeCompany} interview
          </p>
        </div>
        <Btn variant="gradient" onClick={() => navigate("/new-session")}>
          <Plus className="w-4 h-4" /> New Session
        </Btn>
      </motion.div>

      {/* Alert */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4"
      >
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
        <div className="flex-1 text-sm">
          <span className="font-semibold text-amber-900 dark:text-amber-300">
            {totalTasksCount > 0 ? "Active Preparation Plan: " : "No Active Plan: "}
          </span>
          <span className="text-amber-800 dark:text-amber-400">
            {totalTasksCount > 0
              ? `${activeCompany} preparation plan is active for ${activeRole}. ${completedTasksCount} of ${totalTasksCount} tasks completed.`
              : `Create a new session for ${activeCompany} to generate your customized day-by-day study roadmap.`}
          </span>
        </div>
        <Btn size="sm" variant="secondary" onClick={() => navigate(totalTasksCount > 0 ? "/curriculum" : "/new-session")} className="border-amber-200 text-amber-700 hover:bg-amber-100 dark:border-amber-900/50 dark:text-amber-400 dark:hover:bg-amber-950/30 shrink-0">
          {totalTasksCount > 0 ? "View Plan" : "Generate Plan"}
        </Btn>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" ref={statsRef}>
        {[
          {
            label: "Current Progress Day",
            num: currentDayNum,
            prefix: "Day ",
            suffix: "",
            icon: Flame,
            bg: "bg-amber-50 dark:bg-amber-950/30",
            ic: "text-amber-500",
            sub: `⏳ ${timeLeftToday.hours}h ${timeLeftToday.minutes}m left for this day`,
            sc: "text-amber-600 dark:text-amber-400 font-semibold",
            extraSub: `🔥 ${rawDays.length || profile.daysRemaining} total days planned`
          },
          { label: "Readiness Score", num: readinessScore, suffix: "%", icon: Target, bg: "bg-blue-50 dark:bg-blue-950/30", ic: "text-blue-600", sub: `${completedTasksCount} of ${totalTasksCount} tasks complete`, sc: "text-blue-600 dark:text-blue-400" },
          { label: "Today's Tasks", num: todayCompletedCount, suffix: ` / ${todayTotalCount}`, icon: CheckCircle, bg: "bg-green-50 dark:bg-green-950/30", ic: "text-green-600", sub: `${todayTotalCount - todayCompletedCount} pending today`, sc: "text-green-600 dark:text-green-400" },
          { label: "Hours Completed", num: parseFloat(completedHours), suffix: "h", icon: Clock, bg: "bg-purple-50 dark:bg-purple-950/30", ic: "text-purple-600", sub: `Total plan: ${totalPlannedHours}h`, sc: "text-purple-600 dark:text-purple-400", decimals: 1 },
        ].map(({ label, num, suffix = "", prefix = "", icon: Icon, bg, ic, sub, sc, extraSub, decimals = 0 }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <GlassCard hover className="p-4">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${ic}`} />
              </div>
              <div className="text-xl font-bold text-foreground">
                {prefix}
                <AnimatedCounter target={num} suffix={suffix} decimals={decimals} trigger={statsInView} />
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
              <div className={`text-xs mt-1.5 font-medium ${sc}`}>{sub}</div>
              {extraSub && <div className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5 font-medium">{extraSub}</div>}
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.45 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">Today's Tasks (Day {currentDayNum})</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{todayCompletedCount} of {todayTotalCount} completed</p>
                </div>
                <Btn size="sm" variant="ghost" onClick={() => navigate("/planner")}>
                  <Clock className="w-3.5 h-3.5" /> Full Planner
                </Btn>
              </div>
              <div className="space-y-1">
                {initialTasks.map((task: any, idx: number) => (
                  <motion.button
                    key={task.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + idx * 0.06, duration: 0.35 }}
                    onClick={() => toggleTask(task.id, task.done)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors cursor-pointer ${task.done ? "bg-secondary" : "hover:bg-secondary"}`}
                  >
                    {task.done
                      ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      : <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                    }
                    <span className={`text-sm flex-1 ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.label}</span>
                    <Badge color={task.priority === "high" ? "red" : task.priority === "medium" ? "amber" : "gray"}>
                      {task.priority}
                    </Badge>
                  </motion.button>
                ))}
                {initialTasks.length === 0 && (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    No tasks scheduled for today. Create a new session or generate a plan to get started!
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.45 }}
          >
            <GlassCard className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Upload Notes", icon: Upload, bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-950/50", ic: "text-blue-600 dark:text-blue-400", to: "/vault" },
                  { label: "Generate Plan", icon: Sparkles, bg: "bg-purple-50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900/40 hover:bg-purple-100 dark:hover:bg-purple-950/50", ic: "text-purple-600 dark:text-purple-400", to: "/new-session" },
                  { label: "Curriculum", icon: GraduationCap, bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40 hover:bg-amber-100 dark:hover:bg-amber-950/50", ic: "text-amber-600 dark:text-amber-400", to: "/curriculum" },
                  { label: "Recall Guide", icon: Brain, bg: "bg-purple-50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900/40 hover:bg-purple-100 dark:hover:bg-purple-950/50", ic: "text-purple-600 dark:text-purple-400", to: "/recall" },
                  { label: "Ask AI", icon: Bot, bg: "bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900/40 hover:bg-green-100 dark:hover:bg-green-950/50", ic: "text-green-600 dark:text-green-400", to: "/vault" },
                ].map(({ label, icon: Icon, bg, ic, to }, i) => (
                  <motion.button
                    key={label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.07 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(to)}
                    className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all cursor-pointer ${bg}`}
                  >
                    <Icon className={`w-5 h-5 ${ic}`} />
                    <span className="text-xs font-medium text-foreground text-center leading-tight">{label}</span>
                  </motion.button>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Readiness Donut */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.45 }}
          >
            <GlassCard className="p-5">
              <h3 className="font-semibold text-foreground mb-4">Readiness Score</h3>
              <div className="relative w-40 h-40 mx-auto mb-3">
                <PieChart width={160} height={160}>
                  <Pie
                    data={[{ v: readinessScore || 0 }, { v: 100 - (readinessScore || 0) }]}
                    cx={80} cy={80} innerRadius={52} outerRadius={70}
                    startAngle={90} endAngle={-270} dataKey="v" strokeWidth={0}
                  >
                    <Cell fill="#2563EB" />
                    <Cell fill="var(--secondary)" />
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                      <AnimatedCounter target={readinessScore} suffix="%" trigger={statsInView} />
                    </div>
                    <div className="text-[10px] text-muted-foreground">Interview Ready</div>
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
                    <span className="text-xs text-muted-foreground w-24 shrink-0 truncate">{label}</span>
                    <ProgressBar value={v} color={c} className="flex-1" />
                    <span className="text-xs font-semibold text-foreground w-7 text-right shrink-0">{v}%</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.45 }}
          >
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Daily Completed Hours</h3>
                <div className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                  <Flame className="w-3.5 h-3.5" /> Day {currentDayNum}
                </div>
              </div>
              <div className="h-32 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studyChartData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontWeight: 500 }} axisLine={false} tickLine={false} interval={0} />
                    <Tooltip
                      contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }}
                      formatter={(v: number) => [`${v}h`, "Study Hours"]}
                      cursor={{ fill: "var(--secondary)" }}
                    />
                    <Bar dataKey="h" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={26} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </motion.div>

          {/* Active Prep Card */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.45 }}
          >
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Active Prep</h3>
                <Badge color={totalTasksCount > 0 ? "green" : "amber"}>
                  {totalTasksCount > 0 ? "In Progress" : "Pending"}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold shrink-0">
                  {activeCompany.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{activeCompany}</div>
                  <div className="text-xs text-muted-foreground">{activeRole}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[[profile.daysRemaining.toString(), "days left"], [roundsCount.toString(), "rounds"], [`${readinessScore}%`, "prep"]].map(([val, lbl]) => (
                  <div key={lbl} className="text-center bg-secondary rounded-xl p-2">
                    <div className={`text-sm font-bold ${lbl === "prep" ? "text-primary" : "text-foreground"}`}>{val}</div>
                    <div className="text-[10px] text-muted-foreground">{lbl}</div>
                  </div>
                ))}
              </div>
              <ProgressBar value={readinessScore} className="mb-2" />
              <Btn size="sm" variant="secondary" onClick={() => navigate("/company")} className="w-full justify-center text-xs mt-1">
                View Company Dashboard <ChevronRight className="w-3 h-3" />
              </Btn>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
