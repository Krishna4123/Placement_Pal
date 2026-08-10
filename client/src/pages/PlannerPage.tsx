import React, { useState } from "react";
import { Sparkles, ChevronDown, Clock, ExternalLink, CheckCircle } from "lucide-react";
import { GlassCard, Badge, Btn } from "../components/common/UIElements";
import { useSession } from "../context/SessionContext";
import { planApi } from "../api/plan";

export const PlannerPage: React.FC = () => {
  const { sessionId, placementState, refreshState } = useSession();
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dates = [13, 14, 15, 16, 17, 18, 19];
  const [selectedDay, setSelectedDay] = useState(0);

  const rawDays = placementState?.curriculum?.days || [];
  const activeDayObj = rawDays.find((d: any) => d.day === selectedDay + 1) || rawDays[0] || { tasks: [] };

  const initialTasks = (activeDayObj.tasks || []).map((t: any, idx: number) => ({
    id: t.task_id || t.id || `p_${selectedDay}_${idx}`,
    title: t.title || t.name,
    type: t.type || "coding",
    priority: t.priority || "medium",
    diff: t.difficulty || "Medium",
    time: t.estimated_minutes ? `${t.estimated_minutes}m` : "1h",
    done: t.status === "done" || !!t.done,
  }));

  const toggle = async (id: string, currentDone: boolean) => {
    try {
      await planApi.markTask({
        session_id: sessionId,
        task_id: id,
        status: !currentDone ? 'done' : 'pending',
      });
      await refreshState();
    } catch (err) {
      console.error("Failed to mark task complete on backend:", err);
    }
  };

  const handleDaySelect = async (index: number) => {
    setSelectedDay(index);
    try {
      await planApi.advanceDay({
        session_id: sessionId,
        target_day: index + 1,
      });
      await refreshState();
    } catch (err) {
      console.error("Failed to advance day on backend:", err);
    }
  };

  const pending = initialTasks.filter((t: any) => !t.done);
  const completed = initialTasks.filter((t: any) => t.done);

  return (
    <div className="max-w-5xl mx-auto pb-8 space-y-5">
      {/* AI banner */}
      <div className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-2xl p-4">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 text-sm">
          <span className="font-semibold text-[#111827]">AI Schedule Update: </span>
          <span className="text-[#6B7280]">Missed tasks from yesterday have been rescheduled. System Design mock interview moved to today for better momentum.</span>
        </div>
        <Btn size="sm" variant="ghost" className="shrink-0 text-xs">Dismiss</Btn>
      </div>

      {/* Calendar Strip */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#111827]">January 2025</h3>
          <div className="flex gap-1">
            <button className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronDown className="w-4 h-4 text-gray-400 rotate-90" /></button>
            <button className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronDown className="w-4 h-4 text-gray-400 -rotate-90" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d, i) => (
            <button
              key={d}
              onClick={() => handleDaySelect(i)}
              className={`flex flex-col items-center py-2.5 rounded-xl transition-all cursor-pointer ${selectedDay === i ? "bg-[#2563EB] text-white shadow-sm" : "hover:bg-gray-50 text-[#374151]"}`}
            >
              <span className={`text-[10px] font-medium ${selectedDay === i ? "text-blue-100" : "text-[#9CA3AF]"}`}>{d}</span>
              <span className={`text-base font-semibold mt-0.5 ${selectedDay === i ? "text-white" : "text-[#111827]"}`}>{dates[i]}</span>
              {[0, 2, 4, 5].includes(i) && (
                <span className={`w-1 h-1 rounded-full mt-1 ${selectedDay === i ? "bg-blue-200" : "bg-[#2563EB]"}`} />
              )}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Task Columns */}
      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <h3 className="font-semibold text-[#111827] mb-3">
            Today's Tasks{" "}
            <span className="text-sm font-normal text-[#9CA3AF]">({pending.length} remaining)</span>
          </h3>
          <div className="space-y-3">
            {pending.map((task: any) => (
              <GlassCard key={task.id} className="p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => toggle(task.id, false)}
                    className="mt-0.5 accent-[#2563EB] cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-sm font-medium text-[#374151]">{task.title}</span>
                      <Badge color={task.priority === "high" ? "red" : "amber"}>{task.priority}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge color={task.type === "coding" ? "blue" : task.type === "aptitude" ? "amber" : "purple"}>
                        {task.type === "coding" ? "Coding" : task.type === "aptitude" ? "Aptitude" : "Core CS"}
                      </Badge>
                      <Badge color={task.diff === "Easy" ? "green" : task.diff === "Medium" ? "amber" : "red"}>{task.diff}</Badge>
                      <span className="text-xs text-[#9CA3AF] flex items-center gap-1"><Clock className="w-3 h-3" />{task.time}</span>
                      <a href="#" className="text-xs text-[#2563EB] flex items-center gap-1 hover:underline">
                        <ExternalLink className="w-3 h-3" /> Resource
                      </a>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
            {pending.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-[#9CA3AF]">All tasks completed! Outstanding work today! 🎉</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-[#111827] mb-3">
            Completed{" "}
            <span className="text-sm font-normal text-[#9CA3AF]">({completed.length} done)</span>
          </h3>
          <div className="space-y-3">
            {completed.map((task: any) => (
              <GlassCard key={task.id} className="p-4 opacity-65">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked
                    onChange={() => toggle(task.id, true)}
                    className="mt-0.5 accent-[#22C55E] cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="text-sm text-[#9CA3AF] line-through">{task.title}</span>
                    <div className="flex gap-1.5 mt-1.5">
                      <Badge color="gray">{task.time}</Badge>
                      <Badge color="green">Completed</Badge>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
            {completed.length === 0 && (
              <div className="text-center py-8 text-sm text-[#9CA3AF]">No completed tasks yet. Keep going! 💪</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
