import React from "react";
import {
  Clock, Users, Star, Bookmark, ExternalLink, Globe, Code, AlignLeft,
  Sparkles, Layers, Cpu, Target
} from "lucide-react";
import { GlassCard, Badge, Btn, ProgressBar } from "../components/common/UIElements";
import { useSession } from "../context/SessionContext";

export const CompanyPage: React.FC = () => {
  const { profile } = useSession();

  const timeline = [
    { stage: "Online Assessment", date: "Feb 1", desc: "100 MCQs · Aptitude + Technical · 90 min", status: "upcoming" },
    { stage: "Technical Round 1", date: "Feb 8", desc: "DSA + Coding Problems · 2 questions · 60 min", status: "upcoming" },
    { stage: "Technical Round 2", date: "Feb 10", desc: "System Design + Core CS concepts · 60 min", status: "upcoming" },
    { stage: "HR Round", date: "Feb 12", desc: "Behavioural + Culture Fit + Salary · 30 min", status: "upcoming" },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-8 space-y-5">
      {/* Header Card */}
      <GlassCard className="p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-blue-100 shrink-0">
              {profile.targetCompany.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-bold text-[#111827]">{profile.targetCompany}</h1>
                <Badge color="blue">Target Tech</Badge>
                <Badge color="red">Hard</Badge>
              </div>
              <div className="text-sm text-[#6B7280]">{profile.targetRole} · India</div>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-[#6B7280]">
                <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> Deadline: {profile.daysRemaining} days remaining</div>
                <div className="flex items-center gap-1"><Users className="w-3 h-3" /> 200+ positions</div>
                <div className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" /> 4.8 employer rating</div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Btn variant="secondary" size="sm"><Bookmark className="w-3.5 h-3.5" /> Save</Btn>
            <Btn variant="gradient" size="sm"><ExternalLink className="w-3.5 h-3.5" /> Apply Now</Btn>
          </div>
        </div>
      </GlassCard>

      {/* Interview Timeline */}
      <GlassCard className="p-6">
        <h3 className="font-semibold text-[#111827] mb-5">Interview Timeline</h3>
        <div className="relative">
          <div className="absolute left-[15px] top-8 bottom-4 w-0.5 bg-gray-100" />
          <div className="space-y-4">
            {timeline.map((t, i) => (
              <div key={t.stage} className="flex gap-4 items-start">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 z-10 ${i === 0 ? "border-[#2563EB] bg-[#2563EB] text-white" : "border-gray-200 bg-white text-gray-400"}`}>
                  {i + 1}
                </div>
                <div className={`flex-1 p-3.5 rounded-xl border transition-colors ${i === 0 ? "border-blue-200 bg-blue-50/40" : "border-gray-100 bg-gray-50/60"}`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="font-medium text-sm text-[#111827]">{t.stage}</div>
                    <div className="text-xs text-[#6B7280]">{t.date}</div>
                  </div>
                  <div className="text-xs text-[#6B7280] mt-0.5">{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Info Grid */}
      <div className="grid md:grid-cols-2 gap-5">
        <GlassCard className="p-5">
          <h3 className="font-semibold text-[#111827] mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#2563EB]" /> Company Overview
          </h3>
          <p className="text-sm text-[#6B7280] leading-relaxed mb-4">
            {profile.targetCompany} is a global tech leader focusing on internet products, cloud computing, and artificial intelligence. Known for rigorous coding tests and deep algorithmic questions.
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {[["Category", "Big Tech"], ["HQ", "USA / India"], ["Global Workforce", "100,000+"], ["Prep Priority", "High"]].map(([k, v]) => (
              <div key={k} className="bg-gray-50 rounded-xl p-2.5">
                <div className="text-[10px] text-[#9CA3AF]">{k}</div>
                <div className="text-sm font-semibold text-[#111827]">{v}</div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="font-semibold text-[#111827] mb-4 flex items-center gap-2">
            <Code className="w-4 h-4 text-purple-600" /> Tech Stack & Focus Areas
          </h3>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {["Python", "Go", "Java", "C++", "TypeScript", "TensorFlow", "Kubernetes", "Distributed Systems"].map((t) => (
              <span key={t} className="px-2.5 py-1 bg-gray-100 text-[#374151] rounded-lg text-xs font-medium">{t}</span>
            ))}
          </div>
          <div className="space-y-2.5">
            {[
              { label: "DSA Focus", v: 90, c: "#2563EB" },
              { label: "System Design", v: 80, c: "#7C3AED" },
              { label: "Core CS (OS/DBMS/CN)", v: 70, c: "#22C55E" },
            ].map(({ label, v, c }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-xs text-[#6B7280] w-40 shrink-0">{label}</span>
                <ProgressBar value={v} color={c} className="flex-1" />
                <span className="text-xs font-semibold text-[#374151] w-6 shrink-0">{v}%</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="font-semibold text-[#111827] mb-4 flex items-center gap-2">
            <AlignLeft className="w-4 h-4 text-amber-600" /> Interview Pattern
          </h3>
          <div className="space-y-3.5">
            {[
              { step: "Online Assessment", detail: "Aptitude (30Q) + Technical MCQ (70Q) + Coding (2P)", diff: "Medium" },
              { step: "Technical Interview 1", detail: "LeetCode Hard-level DSA, 2 problems, whiteboard-style", diff: "Hard" },
              { step: "Technical Interview 2", detail: "System Design, scalability, Core CS deep-dive", diff: "Hard" },
              { step: "HR Interview", detail: "Culture fit, STAR-method stories, leadership potential", diff: "Easy" },
            ].map(({ step, detail, diff }) => (
              <div key={step} className="flex gap-3 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mt-2 shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#374151]">{step}</div>
                  <div className="text-xs text-[#6B7280] mt-0.5">{detail}</div>
                </div>
                <Badge color={diff === "Hard" ? "red" : diff === "Medium" ? "amber" : "green"}>{diff}</Badge>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="font-semibold text-[#111827] mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-green-600" /> AI Preparation Tips
          </h3>
          <div className="space-y-3">
            {[
              { tip: `Focus on Graphs and DP — 60% of ${profile.targetCompany} OA questions involve these. Practice BFS/DFS and Dijkstra.`, icon: Target },
              { tip: "Practice System Design using the STAR framework. Emphasize scalability and trade-offs in every answer.", icon: Layers },
              { tip: "Review OS concepts deeply: Process Scheduling, Memory Management, Deadlocks, Virtual Memory.", icon: Cpu },
              { tip: "Solve at least 3 LeetCode Medium/Hard problems per day. Track your weak patterns in the Knowledge Vault.", icon: Code },
            ].map(({ tip, icon: Icon }) => (
              <div key={tip} className="flex gap-2.5 items-start">
                <Icon className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                <p className="text-xs text-[#374151] leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
