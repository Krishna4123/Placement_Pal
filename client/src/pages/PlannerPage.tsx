import React, { useState } from "react";
import { Sparkles, ChevronLeft, ChevronRight, Clock, CheckCircle, CalendarX, AlertCircle, ArrowRight } from "lucide-react";
import { GlassCard, Badge, Btn } from "../components/common/UIElements";
import { useSession } from "../context/SessionContext";
import { planApi } from "../api/plan";
import { useNavigate } from "react-router-dom";

const parseToLocalMidnight = (dateVal?: string | Date | null): Date => {
  if (!dateVal) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (dateVal instanceof Date) {
    const d = new Date(dateVal);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const str = String(dateVal).split("T")[0];
  const parts = str.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month, day, 0, 0, 0, 0);
    }
  }
  const d = new Date(dateVal);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const PlannerPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, sessionId, placementState, refreshState } = useSession();
  
  // Base week view date
  const [baseDate, setBaseDate] = useState<Date>(new Date());
  // Selected calendar date (defaults to today)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const activeCompany = placementState?.target_companies?.[0] || profile.targetCompany;

  // Real curriculum task days & total plan duration
  const rawDays = placementState?.curriculum?.days || [];
  const totalPlanDays = rawDays.length > 0 
    ? rawDays.length 
    : (placementState?.preparation_duration_days || profile.daysRemaining || 19);

  // Dynamic start date derived from real-time daysRemaining (e.g. 18 remaining of 19 total => started yesterday)
  const elapsedDaysFromRemaining = Math.max(0, totalPlanDays - profile.daysRemaining);
  const computedStartDate = new Date();
  computedStartDate.setHours(0, 0, 0, 0);
  computedStartDate.setDate(computedStartDate.getDate() - elapsedDaysFromRemaining);

  const startDate = computedStartDate;
  const startDateIsoStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`;

  // Plan end date
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + totalPlanDays - 1);

  // Calculate day number relative to startDate for currently selected date
  const normalizedSelected = parseToLocalMidnight(selectedDate);
  const daysDiffFromStart = Math.round((normalizedSelected.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const currentDayNumber = daysDiffFromStart + 1;

  // Boundary checks
  const isBeforePlan = currentDayNumber < 1;
  const isAfterPlan = currentDayNumber > totalPlanDays;
  const isPlanActive = !isBeforePlan && !isAfterPlan;

  // Helper to compute Monday-to-Sunday 7-day strip for baseDate
  const getWeekDays = (currDate: Date) => {
    const d = new Date(currDate);
    const day = d.getDay(); // 0 (Sun) to 6 (Sat)
    const diffToMonday = (day + 6) % 7; // Distance from Monday
    const monday = new Date(d);
    monday.setDate(d.getDate() - diffToMonday);

    return Array.from({ length: 7 }, (_, i) => {
      const dayObj = new Date(monday);
      dayObj.setDate(monday.getDate() + i);
      return dayObj;
    });
  };

  const weekDays = getWeekDays(baseDate);

  // Month & Year header from baseDate
  const currentMonthYear = baseDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const handlePrevWeek = () => {
    const prev = new Date(baseDate);
    prev.setDate(baseDate.getDate() - 7);
    setBaseDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(baseDate);
    next.setDate(baseDate.getDate() + 7);
    setBaseDate(next);
  };

  const handleStartDateChange = async (newDateStr: string) => {
    try {
      await planApi.updateStartDate({
        session_id: sessionId,
        start_date: newDateStr,
      });
      await refreshState();
    } catch (err) {
      console.error("Failed to update start date:", err);
    }
  };

  const setYesterdayAsStart = () => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yStr = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, "0")}-${String(y.getDate()).padStart(2, "0")}`;
    handleStartDateChange(yStr);
  };

  const setTodayAsStart = () => {
    const t = new Date();
    const tStr = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
    handleStartDateChange(tStr);
  };

  // Retrieve current day's object if within plan boundaries
  const activeDayObj = isPlanActive
    ? (rawDays.find((d: any) => d.day === currentDayNumber) || rawDays[currentDayNumber - 1] || { tasks: [] })
    : { tasks: [] };

  const initialTasks = (activeDayObj.tasks || []).map((t: any, idx: number) => ({
    id: t.task_id || t.id || `p_${currentDayNumber}_${idx}`,
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
        status: !currentDone ? "done" : "pending",
      });
      await refreshState();
    } catch (err) {
      console.error("Failed to mark task complete on backend:", err);
    }
  };

  const handleDateSelect = async (dateObj: Date, calculatedDayNum: number) => {
    setSelectedDate(dateObj);
    if (calculatedDayNum >= 1 && calculatedDayNum <= totalPlanDays) {
      try {
        await planApi.advanceDay({
          session_id: sessionId,
          target_day: calculatedDayNum,
        });
        await refreshState();
      } catch (err) {
        console.error("Failed to advance day on backend:", err);
      }
    }
  };

  const pending = initialTasks.filter((t: any) => !t.done);
  const completed = initialTasks.filter((t: any) => t.done);

  const todayStr = new Date().toDateString();

  return (
    <div className="max-w-5xl mx-auto pb-8 space-y-5">
      {/* AI schedule banner */}
      <div className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-2xl p-4">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 text-sm">
          <span className="font-semibold text-[#111827]">AI Schedule Status: </span>
          <span className="text-[#6B7280]">
            {isPlanActive ? (
              `Selected Date corresponds to Day ${currentDayNumber} of ${totalPlanDays} in your ${activeCompany} preparation plan.`
            ) : isAfterPlan ? (
              `Selected Date (Day ${currentDayNumber}) is past your ${totalPlanDays}-day preparation roadmap. Plan ended on ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.`
            ) : (
              `Selected Date is prior to your session start date (${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}).`
            )}
          </span>
        </div>
        <Btn size="sm" variant="ghost" className="shrink-0 text-xs">Dismiss</Btn>
      </div>

      {/* Real-time Calendar Strip */}
      <GlassCard className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-semibold text-[#111827]">{currentMonthYear}</h3>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B7280] mt-0.5">
              <span>
                Plan Duration: {totalPlanDays} Days ({startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
              </span>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-gray-700">Start Date:</span>
                <input
                  type="date"
                  value={startDateIsoStr}
                  onChange={(e) => e.target.value && handleStartDateChange(e.target.value)}
                  className="bg-white border border-gray-200 rounded-md px-1.5 py-0.5 text-xs text-gray-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                />
                <button
                  onClick={setYesterdayAsStart}
                  title="Set plan start date to yesterday"
                  className="px-1.5 py-0.5 text-[11px] font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 rounded border border-purple-200 transition-colors cursor-pointer"
                >
                  Start Yesterday
                </button>
                <button
                  onClick={setTodayAsStart}
                  title="Set plan start date to today"
                  className="px-1.5 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded border border-blue-200 transition-colors cursor-pointer"
                >
                  Start Today
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={handlePrevWeek}
              title="Previous Week"
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button 
              onClick={() => {
                const now = new Date();
                setBaseDate(now);
                setSelectedDate(now);
              }}
              className="px-2.5 py-1 text-xs font-medium text-[#2563EB] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            >
              Today
            </button>
            <button 
              onClick={handleNextWeek}
              title="Next Week"
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map((dateObj) => {
            const dayLabel = dateObj.toLocaleDateString("en-US", { weekday: "short" });
            const dateNum = dateObj.getDate();
            const isToday = dateObj.toDateString() === todayStr;
            const isSelected = dateObj.toDateString() === selectedDate.toDateString();

            const dNorm = parseToLocalMidnight(dateObj);
            const dDiff = Math.round((dNorm.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            const calculatedDayNum = dDiff + 1;

            const isDayInPlan = calculatedDayNum >= 1 && calculatedDayNum <= totalPlanDays;

            return (
              <button
                key={dateObj.toISOString()}
                onClick={() => handleDateSelect(dateObj, calculatedDayNum)}
                className={`flex flex-col items-center py-2.5 rounded-xl transition-all cursor-pointer relative ${
                  isSelected 
                    ? "bg-[#2563EB] text-white shadow-sm" 
                    : isToday 
                    ? "bg-blue-50 border border-blue-200 text-[#2563EB]" 
                    : isDayInPlan
                    ? "hover:bg-gray-50 text-[#374151]"
                    : "opacity-50 hover:bg-gray-50 text-[#9CA3AF]"
                }`}
              >
                <span className={`text-[10px] font-medium ${isSelected ? "text-blue-100" : isToday ? "text-[#2563EB]" : "text-[#9CA3AF]"}`}>
                  {dayLabel}
                </span>
                <span className={`text-base font-semibold mt-0.5 ${isSelected ? "text-white" : isToday ? "text-[#2563EB]" : "text-[#111827]"}`}>
                  {dateNum}
                </span>
                {isDayInPlan && (
                  <span className={`text-[9px] font-bold mt-0.5 ${isSelected ? "text-blue-200" : "text-[#2563EB]"}`}>
                    Day {calculatedDayNum}
                  </span>
                )}
                {!isDayInPlan && (
                  <span className={`text-[9px] mt-0.5 ${isSelected ? "text-blue-200" : "text-[#9CA3AF]"}`}>
                    No Plan
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* Task Columns OR Out-of-Bounds Plan State */}
      {isPlanActive ? (
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <h3 className="font-semibold text-[#111827] mb-3">
              Day {currentDayNumber} Tasks{" "}
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
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
              {pending.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-[#9CA3AF]">All tasks for Day {currentDayNumber} completed! Outstanding work! 🎉</p>
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
                <div className="text-center py-8 text-sm text-[#9CA3AF]">No completed tasks yet for Day {currentDayNumber}. Keep going! 💪</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* No Study Plan State when selected date is past plan duration (e.g. Day 21) */
        <GlassCard className="p-8 text-center space-y-4 max-w-2xl mx-auto my-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
            <CalendarX className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#111827]">
              No Study Plan Scheduled (Day {currentDayNumber})
            </h3>
            <p className="text-sm text-[#6B7280] mt-1.5 max-w-md mx-auto">
              {isAfterPlan ? (
                `Your ${activeCompany} preparation plan covers ${totalPlanDays} days (ending on ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}). There are no study tasks scheduled for Day ${currentDayNumber}.`
              ) : (
                `The selected date is before your session start date (${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}).`
              )}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <Btn variant="secondary" onClick={() => navigate("/curriculum")}>
              View Full Curriculum
            </Btn>
            <Btn variant="gradient" onClick={() => navigate("/new-session")}>
              Start New Session <ArrowRight className="w-4 h-4" />
            </Btn>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
