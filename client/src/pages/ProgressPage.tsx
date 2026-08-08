import React from "react";
import { Target, Clock, Code, Flame, Star, Award } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { GlassCard, ProgressBar } from "../components/common/UIElements";
import { useSession } from "../context/SessionContext";

export const ProgressPage: React.FC = () => {
  const { profile } = useSession();
  const firstName = profile.name.split(" ")[0] || "Student";

  const weeklyData = [
    { day: "Mon", hours: 3.5, problems: 4 },
    { day: "Tue", hours: 5, problems: 6 },
    { day: "Wed", hours: 4, problems: 5 },
    { day: "Thu", hours: 2, problems: 2 },
    { day: "Fri", hours: 6, problems: 8 },
    { day: "Sat", hours: 4.5, problems: 5 },
    { day: "Sun", hours: 3, problems: 3 },
  ];

  const subjects = [
    { label: "Data Structures & Algorithms", value: 68, color: "#2563EB", problems: 42 },
    { label: "Operating Systems", value: 55, color: "#7C3AED", problems: 18 },
    { label: "Database Management", value: 82, color: "#22C55E", problems: 24 },
    { label: "Computer Networks", value: 45, color: "#F59E0B", problems: 12 },
    { label: "Object Oriented Programming", value: 90, color: "#10B981", problems: 15 },
    { label: "Aptitude & Reasoning", value: 74, color: "#F59E0B", problems: 38 },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-8 space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Overall Readiness", value: "74%", icon: Target, bg: "bg-blue-50", ic: "text-blue-600", sub: "↑ 12% this week" },
          { label: "Total Study Hours", value: "127h", icon: Clock, bg: "bg-purple-50", ic: "text-purple-600", sub: "28h this week" },
          { label: "Problems Solved", value: "149", icon: Code, bg: "bg-green-50", ic: "text-green-600", sub: "33 this week" },
          { label: "Current Streak", value: "7 days", icon: Flame, bg: "bg-amber-50", ic: "text-amber-500", sub: "🔥 Personal best" },
        ].map(({ label, value, icon: Icon, bg, ic, sub }) => (
          <GlassCard key={label} className="p-4">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${ic}`} />
            </div>
            <div className="text-xl font-bold text-[#111827]">{value}</div>
            <div className="text-xs text-[#6B7280] mt-0.5">{label}</div>
            <div className="text-xs mt-1.5 text-[#9CA3AF]">{sub}</div>
          </GlassCard>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Weekly Chart */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#111827]">This Week — Study Hours & Problems</h3>
              <div className="flex gap-3 text-xs text-[#9CA3AF]">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#2563EB]" />Hours</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#22C55E]" />Problems</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={weeklyData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 11 }}
                  cursor={{ fill: "#F9FAFB" }}
                />
                <Bar dataKey="hours" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={28} name="Hours" />
                <Bar dataKey="problems" fill="#22C55E" radius={[4, 4, 0, 0]} maxBarSize={28} name="Problems" />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* Subject Breakdown */}
          <GlassCard className="p-5">
            <h3 className="font-semibold text-[#111827] mb-4">Subject Breakdown</h3>
            <div className="space-y-4">
              {subjects.map(({ label, value, color, problems }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-[#374151] font-medium">{label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#9CA3AF]">{problems} problems</span>
                      <span className="text-sm font-bold text-[#111827]">{value}%</span>
                    </div>
                  </div>
                  <ProgressBar value={value} color={color} />
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Donut Chart */}
          <GlassCard className="p-5">
            <h3 className="font-semibold text-[#111827] mb-3">Interview Readiness</h3>
            <div className="relative w-44 h-44 mx-auto">
              <PieChart width={176} height={176}>
                <Pie data={[{ v: 74 }, { v: 26 }]} cx={88} cy={88}
                  innerRadius={58} outerRadius={76} startAngle={90} endAngle={-270} dataKey="v" strokeWidth={0}>
                  <Cell fill="#2563EB" />
                  <Cell fill="#EEF2FF" />
                </Pie>
              </PieChart>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#111827]">74%</div>
                  <div className="text-xs text-[#6B7280]">Readiness</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-blue-50 rounded-xl p-2.5 text-center">
                <div className="text-sm font-bold text-[#2563EB]">Strong</div>
                <div className="text-xs text-[#6B7280]">OOP, DBMS</div>
              </div>
              <div className="bg-red-50 rounded-xl p-2.5 text-center">
                <div className="text-sm font-bold text-red-500">Focus Areas</div>
                <div className="text-xs text-[#6B7280]">CN, OS</div>
              </div>
            </div>
          </GlassCard>

          {/* Aptitude */}
          <GlassCard className="p-5">
            <h4 className="text-sm font-semibold text-[#111827] mb-3">Aptitude Progress</h4>
            <div className="space-y-3">
              {[
                { label: "Quantitative", v: 78 },
                { label: "Logical Reasoning", v: 65 },
                { label: "Verbal Ability", v: 82 },
              ].map(({ label, v }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#6B7280]">{label}</span>
                    <span className="font-semibold text-[#374151]">{v}%</span>
                  </div>
                  <ProgressBar value={v} color="#F59E0B" />
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Motivation */}
          <GlassCard className="p-5 bg-gradient-to-br from-blue-50/60 to-purple-50/40 border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-[#111827]">Keep Going, {firstName}!</span>
            </div>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              You are in the top 25% of students preparing for {profile.targetCompany}. Your DSA progress improved 15% this week. Maintain this momentum!
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs font-medium text-[#2563EB]">
              <Award className="w-3.5 h-3.5" /> 7-day streak achievement unlocked!
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
