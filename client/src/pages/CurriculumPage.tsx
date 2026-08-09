import React, { useState } from "react";
import { Code, Hash, BarChart2, BookOpen, Check, Sparkles, Clock, Link } from "lucide-react";
import { GlassCard, Badge, Btn, ProgressBar } from "../components/common/UIElements";
import { useSession } from "../context/SessionContext";
import { pipelineApi } from "../api/pipeline";
import { planApi } from "../api/plan";

export const CurriculumPage: React.FC = () => {
  const { sessionId, profile, placementState, refreshState } = useSession();
  const [activePlatforms, setActivePlatforms] = useState<string[]>(["leetcode", "gfg"]);
  const [tab, setTab] = useState("all");
  const [generating, setGenerating] = useState(false);

  const platformList = [
    { id: "leetcode", label: "LeetCode", icon: Code, activeC: "bg-orange-50 border-orange-300 text-orange-700", inactiveC: "bg-white border-gray-200 text-gray-500 hover:bg-gray-50" },
    { id: "hackerrank", label: "HackerRank", icon: Hash, activeC: "bg-green-50 border-green-300 text-green-700", inactiveC: "bg-white border-gray-200 text-gray-500 hover:bg-gray-50" },
    { id: "codeforces", label: "Codeforces", icon: BarChart2, activeC: "bg-blue-50 border-blue-300 text-blue-700", inactiveC: "bg-white border-gray-200 text-gray-500 hover:bg-gray-50" },
    { id: "gfg", label: "GeeksforGeeks", icon: BookOpen, activeC: "bg-teal-50 border-teal-300 text-teal-700", inactiveC: "bg-white border-gray-200 text-gray-500 hover:bg-gray-50" },
  ];

  const rawDays = placementState?.curriculum?.days || [];
  const plan = rawDays.length > 0 ? rawDays.map((d: any, idx: number) => ({
    day: d.day || idx + 1,
    date: d.date || `Day ${d.day || idx + 1}`,
    tasks: (d.tasks || []).map((t: any, tidx: number) => ({
      id: t.task_id || t.id || `task_${idx}_${tidx}`,
      title: t.title || t.name,
      type: t.type || "coding",
      diff: t.difficulty || "Medium",
      time: t.estimated_minutes ? `${t.estimated_minutes}m` : "1h",
      done: t.status === "done" || !!t.done,
    })),
  })) : [];

  const handleGeneratePlan = async () => {
    setGenerating(true);
    try {
      await pipelineApi.runPhase2({
        session_id: sessionId,
        additional_context: { platforms: activePlatforms },
      });
      await refreshState();
    } catch (err) {
      console.error("Failed to generate plan via Phase 2 API:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleTask = async (dayIndex: number, taskIndex: number, taskId: string, currentDone: boolean) => {
    try {
      await planApi.markTask({
        session_id: sessionId,
        task_id: taskId,
        status: !currentDone ? 'done' : 'pending',
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

  return (
    <div className="max-w-6xl mx-auto pb-8">
      <div className="flex gap-6">
        {/* Main Column */}
        <div className="flex-1 space-y-5 min-w-0">
          {/* Platform Picker */}
          <GlassCard className="p-5">
            <h3 className="font-semibold text-[#111827] mb-1">Select Coding Platforms</h3>
            <p className="text-xs text-[#6B7280] mb-4">Choose the platforms to include in your daily plan</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
              {platformList.map((p) => {
                const Icon = p.icon;
                const isActive = activePlatforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => setActivePlatforms((prev) => isActive ? prev.filter((x) => x !== p.id) : [...prev, p.id])}
                    className={`flex items-center gap-2 p-3 rounded-xl border transition-all hover:scale-[1.02] cursor-pointer ${isActive ? p.activeC : p.inactiveC}`}
                  >
                    {isActive && <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />}
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-medium">{p.label}</span>
                  </button>
                );
              })}
            </div>
            <Btn variant="gradient" onClick={handleGeneratePlan} disabled={generating}>
              <Sparkles className="w-4 h-4" /> {generating ? "Generating..." : "Generate 14-Day Plan"}
            </Btn>
          </GlassCard>

          {/* Task Type Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            {[["all", "All"], ["coding", "Coding"], ["aptitude", "Aptitude"], ["core", "Core Subjects"]].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${tab === id ? "bg-white text-[#111827] shadow-sm" : "text-[#6B7280] hover:text-[#374151]"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Timeline List */}
          <div className="space-y-5">
            {plan.map((dayObj: any, dayIdx: number) => {
              const tasks = filtered(dayObj.tasks);
              if (!tasks.length) return null;
              return (
                <div key={dayObj.day}>
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="text-xs font-bold text-white bg-[#2563EB] px-3 py-1 rounded-lg">Day {dayObj.day}</div>
                    <div className="text-xs text-[#9CA3AF]">{dayObj.date}</div>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <div className="space-y-2.5 pl-2">
                    {tasks.map((task: any, taskIdx: number) => (
                      <GlassCard key={task.id} className="p-4 flex items-start gap-3 hover:shadow-md transition-shadow">
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => handleToggleTask(dayIdx, taskIdx, task.id, task.done)}
                          className="mt-0.5 accent-[#2563EB] rounded cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className={`text-sm font-medium ${task.done ? "line-through text-[#9CA3AF]" : "text-[#374151]"}`}>{task.title}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge color={task.type === "coding" ? "blue" : task.type === "aptitude" ? "amber" : "purple"}>
                              {task.type === "coding" ? "Coding" : task.type === "aptitude" ? "Aptitude" : "Core CS"}
                            </Badge>
                            <Badge color={task.diff === "Easy" ? "green" : task.diff === "Medium" ? "amber" : "red"}>{task.diff}</Badge>
                            <div className="flex items-center gap-1 text-xs text-[#9CA3AF]">
                              <Clock className="w-3 h-3" /> {task.time}
                            </div>
                            <a href="#" className="flex items-center gap-1 text-xs text-[#2563EB] hover:underline">
                              <Link className="w-3 h-3" /> Resource
                            </a>
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
              <div className="text-4xl font-bold text-[#2563EB] mb-0.5">{profile.daysRemaining}</div>
              <div className="text-xs text-[#6B7280] font-medium mb-3">Days Until Interview</div>
              <div className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] rounded-xl p-3 text-white">
                <div className="text-sm font-semibold">{profile.targetCompany}</div>
                <div className="text-xs opacity-80 mt-0.5">{profile.targetRole}</div>
              </div>
            </GlassCard>

            <GlassCard className="p-4">
              <h4 className="text-sm font-semibold text-[#111827] mb-3">Plan Progress</h4>
              <div className="space-y-3">
                {[
                  { label: "Coding Tasks", done: 2, total: 14, color: "#2563EB" },
                  { label: "Aptitude Sets", done: 1, total: 14, color: "#F59E0B" },
                  { label: "Core Topics", done: 2, total: 10, color: "#7C3AED" },
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
