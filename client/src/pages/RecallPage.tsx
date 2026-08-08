import React, { useState } from "react";
import { Bot, Download, Cpu, Database, Layers, Network } from "lucide-react";
import { GlassCard, Badge, Btn } from "../components/common/UIElements";
import { useSession } from "../context/SessionContext";

type SubjectColor = "blue" | "green" | "purple" | "amber";

export const RecallPage: React.FC = () => {
  const { profile } = useSession();

  const subjects: Array<{
    id: string; label: string; icon: React.ElementType; color: SubjectColor;
    topics: string[]; weak: number; known: number;
  }> = [
    { id: "os", label: "Operating Systems", icon: Cpu, color: "blue", weak: 2, known: 3,
      topics: ["Process Scheduling", "Memory Management", "Deadlocks", "File Systems", "I/O Management"] },
    { id: "dbms", label: "Database Management", icon: Database, color: "green", weak: 1, known: 4,
      topics: ["Normalization", "SQL Joins & Views", "Transactions & ACID", "Indexing", "ER Diagrams"] },
    { id: "oop", label: "Object Oriented Programming", icon: Layers, color: "purple", weak: 0, known: 5,
      topics: ["Inheritance", "Polymorphism", "Abstraction", "Encapsulation", "Design Patterns"] },
    { id: "cn", label: "Computer Networks", icon: Network, color: "amber", weak: 3, known: 2,
      topics: ["OSI Model", "TCP/IP Suite", "HTTP & HTTPS", "DNS & DHCP", "Routing Algorithms"] },
  ];

  const subjectBg: Record<SubjectColor, string> = {
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    purple: "bg-purple-50 border-purple-200",
    amber: "bg-amber-50 border-amber-200",
  };
  const subjectIconBg: Record<SubjectColor, string> = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    amber: "bg-amber-100 text-amber-600",
  };

  const [activeId, setActiveId] = useState("os");
  const active = subjects.find((s) => s.id === activeId)!;

  return (
    <div className="max-w-6xl mx-auto pb-8 space-y-5">
      {/* AI Summary */}
      <GlassCard className="p-6 bg-gradient-to-br from-blue-50/60 via-white to-purple-50/40 border-blue-100">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-4 h-4 text-[#2563EB]" />
              <span className="text-xs font-semibold text-[#2563EB]">AI Revision Summary — Generated Today</span>
            </div>
            <h2 className="text-base font-bold text-[#111827] mb-2">Your {profile.targetCompany} Interview in {profile.daysRemaining} Days — Priority Revision Plan</h2>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              Based on your Knowledge Vault and weak topic analysis, <strong className="text-[#374151]">OS Process Management</strong> and <strong className="text-[#374151]">Computer Networks</strong> need the most attention. Recommended allocation: 40% DSA (Graphs + DP), 30% OS, 20% CN, 10% DBMS review.
            </p>
          </div>
          <Btn variant="secondary" size="sm" className="shrink-0">
            <Download className="w-3.5 h-3.5" /> Download PDF
          </Btn>
        </div>
      </GlassCard>

      {/* Subject Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {subjects.map((s) => {
          const Icon = s.icon;
          const isActive = activeId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className={`p-4 rounded-2xl border text-left transition-all hover:shadow-sm cursor-pointer ${isActive ? subjectBg[s.color] : "bg-white border-gray-100 hover:bg-gray-50"}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${subjectIconBg[s.color]}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="font-semibold text-sm text-[#111827] mb-1">{s.label}</div>
              <div className="flex gap-2">
                <span className="text-xs text-green-600 font-medium">{s.known} strong</span>
                <span className="text-xs text-red-500 font-medium">{s.weak} weak</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Key Concepts */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#111827]">{active.label} — Key Concepts to Revise</h3>
          <Badge color="blue">AI Generated</Badge>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {active.topics.map((topic, i) => (
            <div key={topic} className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="text-sm font-medium text-[#374151]">{topic}</div>
                <Badge color={i < active.weak ? "red" : i < active.weak + 2 ? "amber" : "green"}>
                  {i < active.weak ? "Weak" : i < active.weak + 2 ? "Review" : "Strong"}
                </Badge>
              </div>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">
                {i < active.weak
                  ? "Priority: spend extra time here. Review theory and solve past year questions."
                  : i < active.weak + 2
                  ? "Near-mastery: do a quick 20-min revision and practice 3–5 problems."
                  : "Well covered: a brief recap before the interview will suffice."}
              </p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};
