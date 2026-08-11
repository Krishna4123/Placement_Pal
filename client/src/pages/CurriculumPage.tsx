import React, { useState } from "react";
import {
  BarChart2, BookOpen, Check, Sparkles, Clock, ExternalLink,
  ChevronDown, ChevronUp, Loader2, AlertCircle
} from "lucide-react";
import { GlassCard, Badge, Btn, ProgressBar } from "../components/common/UIElements";
import { useSession } from "../context/SessionContext";
import { pipelineApi } from "../api/pipeline";
import { planApi, ResourceLink } from "../api/plan";

// ── Source icon colours ───────────────────────────────────────────────────
const SOURCE_COLORS: Record<string, string> = {
  LeetCode:      "bg-orange-100 text-orange-700 border-orange-200",
  GeeksforGeeks: "bg-green-100 text-green-700 border-green-200",
  HackerRank:    "bg-emerald-100 text-emerald-700 border-emerald-200",
  Codeforces:    "bg-blue-100 text-blue-700 border-blue-200",
  IndiaBix:      "bg-violet-100 text-violet-700 border-violet-200",
  PrepInsta:     "bg-pink-100 text-pink-700 border-pink-200",
  TutorialsPoint:"bg-red-100 text-red-700 border-red-200",
  JavatPoint:    "bg-yellow-100 text-yellow-700 border-yellow-200",
};

// ── Resource Panel for a single task ─────────────────────────────────────
interface ResourcePanelProps {
  taskId: string;
  taskTitle: string;
  taskType: "coding" | "aptitude" | "core";
}

const ResourcePanel: React.FC<ResourcePanelProps> = ({ taskId, taskTitle, taskType }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState<ResourceLink[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (links !== null) return; // already fetched
    setLoading(true);
    setError(null);
    try {
      const res = await planApi.taskResources({ task_title: taskTitle, task_type: taskType });
      setLinks(res?.data?.resources ?? []);
    } catch (e) {
      setError("Could not fetch resources. Try again.");
      setLinks([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2">
      <button
        onClick={handleToggle}
        className="flex items-center gap-1.5 text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] transition-colors group"
        id={`resource-btn-${taskId}`}
      >
        <ExternalLink className="w-3 h-3" />
        Resource
        {open ? (
          <ChevronUp className="w-3 h-3 opacity-60 group-hover:opacity-100" />
        ) : (
          <ChevronDown className="w-3 h-3 opacity-60 group-hover:opacity-100" />
        )}
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 space-y-2 animate-fade-in">
          {loading && (
            <div className="flex items-center gap-2 text-xs text-[#6B7280]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Searching for resources…
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-500">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </div>
          )}
          {!loading && links && links.length === 0 && !error && (
            <p className="text-xs text-[#9CA3AF]">No resources found.</p>
          )}
          {!loading && links && links.map((link, i) => {
            const colorClass = SOURCE_COLORS[link.source] || "bg-gray-100 text-gray-600 border-gray-200";
            return (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-[#E5E7EB] hover:border-[#2563EB] hover:shadow-sm transition-all group/link"
              >
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colorClass} shrink-0`}>
                  {link.source}
                </span>
                <span className="text-xs text-[#374151] group-hover/link:text-[#2563EB] truncate flex-1">
                  {link.title}
                </span>
                <ExternalLink className="w-3 h-3 text-[#9CA3AF] group-hover/link:text-[#2563EB] shrink-0" />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};


// ── Main CurriculumPage ───────────────────────────────────────────────────
export const CurriculumPage: React.FC = () => {
  const { sessionId, profile, placementState, refreshState } = useSession();
  const [tab, setTab] = useState("all");
  const [generating, setGenerating] = useState(false);

  const rawDays = placementState?.curriculum?.days || [];
  const plan = rawDays.length > 0 ? rawDays.map((d: any, idx: number) => ({
    day: d.day || idx + 1,
    date: d.date || `Day ${d.day || idx + 1}`,
    tasks: (d.tasks || []).map((t: any, tidx: number) => ({
      id: t.task_id || t.id || `task_${idx}_${tidx}`,
      title: t.title || t.name,
      type: (t.type || "coding") as "coding" | "aptitude" | "core",
      diff: t.difficulty || "Medium",
      time: t.estimated_minutes ? `${t.estimated_minutes}m` : "1h",
      done: t.status === "done" || !!t.done,
    })),
  })) : [];

  const targetDays =
    placementState?.preparation_duration_days ||
    profile?.daysRemaining ||
    19;
  const currentDayNum = Math.min(targetDays, Math.max(1, targetDays - profile.daysRemaining + 1));
  const isPlanGenerated = plan.length > 0;
  const needsMoreDays = plan.length < targetDays;

  const handleGeneratePlan = async (generateNext = false) => {
    setGenerating(true);
    try {
      await pipelineApi.runPhase2({
        session_id: sessionId,
        additional_context: { generate_next: generateNext },
      });
      await refreshState();
    } catch (err) {
      console.error("Failed to generate plan via Phase 2 API:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleTask = async (
    _dayIndex: number,
    _taskIndex: number,
    taskId: string,
    currentDone: boolean
  ) => {
    try {
      await planApi.markTask({
        session_id: sessionId,
        task_id: taskId,
        status: !currentDone ? "done" : "pending",
      });
      await refreshState();
    } catch (err) {
      console.error("Failed to mark task complete on backend:", err);
    }
  };

  const filtered = (tasks: any[]) => {
    if (tab === "all") return tasks;
    if (tab === "coding") return tasks.filter((t: any) => t.type === "coding");
    if (tab === "aptitude") return tasks.filter((t: any) => t.type === "aptitude");
    return tasks.filter((t: any) => t.type === "core");
  };

  // Dynamic progress from actual plan data
  const allTasks = plan.flatMap((d: any) => d.tasks);
  const codingTotal = allTasks.filter((t: any) => t.type === "coding").length;
  const codingDone = allTasks.filter((t: any) => t.type === "coding" && t.done).length;
  const aptTotal = allTasks.filter((t: any) => t.type === "aptitude").length;
  const aptDone = allTasks.filter((t: any) => t.type === "aptitude" && t.done).length;
  const coreTotal = allTasks.filter((t: any) => t.type === "core").length;
  const coreDone = allTasks.filter((t: any) => t.type === "core" && t.done).length;

  return (
    <div className="max-w-6xl mx-auto pb-8">
      <div className="flex gap-6">
        {/* Main Column */}
        <div className="flex-1 space-y-5 min-w-0">

          {/* Generate Button Card */}
          <GlassCard className="p-5">
            <h3 className="font-semibold text-[#111827] mb-1">Study Plan</h3>
            <p className="text-xs text-[#6B7280] mb-4">
              {isPlanGenerated
                ? `Generated ${plan.length} of ${targetDays} days. ${needsMoreDays ? "Generate the next 5 days when ready." : "Your full plan is ready!"}`
                : "Generate your first 5-day plan to get started."}
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              {!isPlanGenerated ? (
                <Btn variant="gradient" onClick={() => handleGeneratePlan(false)} disabled={generating}>
                  <Sparkles className="w-4 h-4" />
                  {generating ? "Generating…" : `Generate ${Math.min(5, targetDays)}-Day Plan`}
                </Btn>
              ) : needsMoreDays ? (
                <Btn variant="gradient" onClick={() => handleGeneratePlan(true)} disabled={generating}>
                  <Sparkles className="w-4 h-4" />
                  {generating ? "Generating Next Days…" : `Generate Next 5 Days`}
                </Btn>
              ) : (
                <div className="flex items-center gap-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
                  <Check className="w-4 h-4" /> Full plan generated — {targetDays} days covered!
                </div>
              )}
              {isPlanGenerated && (
                <span className="text-xs text-[#9CA3AF]">
                  Day {plan.length} / {targetDays}
                </span>
              )}
            </div>
          </GlassCard>

          {/* Task Type Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            {[["all", "All"], ["coding", "Coding"], ["aptitude", "Aptitude"], ["core", "Core Subjects"]].map(
              ([id, label]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    tab === id
                      ? "bg-white text-[#111827] shadow-sm"
                      : "text-[#6B7280] hover:text-[#374151]"
                  }`}
                >
                  {label}
                </button>
              )
            )}
          </div>

          {/* Timeline */}
          <div className="space-y-5">
            {plan.length === 0 && (
              <GlassCard className="p-10 text-center text-[#9CA3AF]">
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No plan yet. Click "Generate Plan" above to get started.</p>
              </GlassCard>
            )}
            {plan.map((dayObj: any, dayIdx: number) => {
              const tasks = filtered(dayObj.tasks);
              if (!tasks.length) return null;
              return (
                <div key={dayObj.day}>
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className={`text-xs font-bold px-3 py-1 rounded-lg ${dayObj.day === currentDayNum ? "bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white shadow-sm" : "bg-[#2563EB] text-white"}`}>
                      Day {dayObj.day}
                    </div>
                    {dayObj.day === currentDayNum && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 shadow-2xs">
                        Current Progress Day
                      </span>
                    )}
                    <div className="text-xs text-[#9CA3AF]">{dayObj.date}</div>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <div className="space-y-2.5 pl-2">
                    {tasks.map((task: any, taskIdx: number) => (
                      <GlassCard
                        key={task.id}
                        className="p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={task.done}
                            onChange={() =>
                              handleToggleTask(dayIdx, taskIdx, task.id, task.done)
                            }
                            className="mt-0.5 accent-[#2563EB] rounded cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                              <span
                                className={`text-sm font-medium ${
                                  task.done
                                    ? "line-through text-[#9CA3AF]"
                                    : "text-[#374151]"
                                }`}
                              >
                                {task.title}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <Badge
                                color={
                                  task.type === "coding"
                                    ? "blue"
                                    : task.type === "aptitude"
                                    ? "amber"
                                    : "purple"
                                }
                              >
                                {task.type === "coding"
                                  ? "Coding"
                                  : task.type === "aptitude"
                                  ? "Aptitude"
                                  : "Core CS"}
                              </Badge>
                              <Badge
                                color={
                                  task.diff === "Easy"
                                    ? "green"
                                    : task.diff === "Medium"
                                    ? "amber"
                                    : "red"
                                }
                              >
                                {task.diff}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-[#9CA3AF]">
                                <Clock className="w-3 h-3" /> {task.time}
                              </div>
                            </div>
                            {/* Resource Panel — inline below the task meta */}
                            {(task.type === "coding" || task.type === "aptitude" || task.type === "core") && (
                              <ResourcePanel
                                taskId={task.id}
                                taskTitle={task.title}
                                taskType={task.type}
                              />
                            )}
                          </div>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sticky Sidebar */}
        <div className="w-60 shrink-0 hidden lg:block">
          <div className="sticky top-0 space-y-4 pt-0">
            <GlassCard className="p-4 text-center">
              <div className="text-4xl font-bold text-[#2563EB] mb-0.5">
                {profile.daysRemaining}
              </div>
              <div className="text-xs text-[#6B7280] font-medium mb-3">
                Days Until Interview
              </div>
              <div className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] rounded-xl p-3 text-white">
                <div className="text-sm font-semibold">{profile.targetCompany}</div>
                <div className="text-xs opacity-80 mt-0.5">{profile.targetRole}</div>
              </div>
            </GlassCard>

            <GlassCard className="p-4">
              <h4 className="text-sm font-semibold text-[#111827] mb-3">Plan Progress</h4>
              <div className="space-y-3">
                {[
                  { label: "Coding Tasks", done: codingDone, total: codingTotal || 1, color: "#2563EB" },
                  { label: "Aptitude Sets", done: aptDone, total: aptTotal || 1, color: "#F59E0B" },
                  { label: "Core Topics", done: coreDone, total: coreTotal || 1, color: "#7C3AED" },
                ].map(({ label, done, total, color }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[#6B7280]">{label}</span>
                      <span className="font-semibold text-[#374151]">{done}/{total}</span>
                    </div>
                    <ProgressBar value={(done / total) * 100} color={color} />
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};
