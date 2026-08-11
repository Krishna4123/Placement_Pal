import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, ArrowRight, Play, Check, Bot, Building2, BookOpen,
  Brain, GraduationCap, TrendingUp, Calendar, CheckCircle, Circle, Zap, Info, Mail
} from "lucide-react";
import { GlassCard, Badge, Btn } from "../components/common/UIElements";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/login");
  };

  const features = [
    { icon: Bot, title: "Multi-Agent AI", desc: "Specialized AI agents work in parallel to analyze your profile, company requirements, and generate custom plans in seconds.", color: "blue" as const },
    { icon: Building2, title: "Company Intelligence", desc: "Deep-dive analysis of 500+ companies including tech stack, interview patterns, culture fit signals, and recent news.", color: "purple" as const },
    { icon: BookOpen, title: "Knowledge Vault", desc: "Upload your notes, textbooks, and resources. AI indexes and retrieves them with semantic search during prep sessions.", color: "green" as const },
    { icon: Brain, title: "Recall Guide", desc: "AI-generated revision summaries, flashcards, and concept maps tailored to your weak areas and upcoming deadlines.", color: "amber" as const },
    { icon: GraduationCap, title: "Personalized Curriculum", desc: "Day-by-day study plans calibrated to your timeline, skill level, target company, and chosen coding platforms.", color: "blue" as const },
    { icon: TrendingUp, title: "Progress Tracking", desc: "Visual analytics dashboard tracking your readiness score, study hours, problem-solving velocity, and subject gaps.", color: "purple" as const },
  ];

  const workflow = [
    { step: "01", label: "Paste Notification", desc: "Drop the placement notice" },
    { step: "02", label: "Upload Notes", desc: "Add your study materials" },
    { step: "03", label: "Generate Plan", desc: "AI creates your roadmap" },
    { step: "04", label: "Track Progress", desc: "Monitor daily goals" },
    { step: "05", label: "Interview Ready", desc: "Ace the placement" },
  ];

  const featureIconColors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="pb-16">
      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                Powered by Multi-Agent AI
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-[#111827] leading-tight mb-6">
                Your Personal<br />
                <span className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] bg-clip-text text-transparent">
                  AI Placement
                </span>
                <br />Mentor
              </h1>
              <p className="text-lg text-[#6B7280] leading-relaxed mb-8 max-w-xl">
                Transform placement notifications into personalized interview preparation plans. PlacementPal AI analyzes company requirements, builds custom curricula, and guides you from notification to offer letter.
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <Btn variant="gradient" size="lg" onClick={handleGetStarted}>
                  Get Started Free <ArrowRight className="w-4 h-4" />
                </Btn>
                <Btn variant="secondary" size="lg" onClick={handleGetStarted}>
                  <Play className="w-4 h-4 text-[#2563EB]" /> Demo Dashboard
                </Btn>
              </div>
              <div className="flex flex-wrap gap-5 text-sm text-[#6B7280]">
                {["Free for students", "No credit card required", "500+ companies"].map((t) => (
                  <div key={t} className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-green-500" />{t}
                  </div>
                ))}
              </div>
            </div>

            {/* Hero illustration — mini dashboard mockup */}
            <div className="hidden lg:flex justify-end">
              <div className="relative w-[460px]">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-50 to-indigo-50 rounded-3xl" />
                <div className="relative p-5 space-y-3">
                  <div className="bg-white/85 backdrop-blur-sm rounded-2xl p-4 border border-white shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-[#111827]">AI Plan Generated</div>
                        <div className="text-[11px] text-[#6B7280]">Google SDE-1 · 14 days remaining</div>
                      </div>
                      <Badge color="green">Ready</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[["DSA", "72%", "blue"], ["System Design", "45%", "purple"], ["Core CS", "88%", "green"]].map(([label, pct, c]) => (
                        <div key={label} className={`rounded-xl p-2.5 text-center ${c === "blue" ? "bg-blue-50" : c === "purple" ? "bg-purple-50" : "bg-green-50"}`}>
                          <div className={`text-sm font-bold ${c === "blue" ? "text-blue-700" : c === "purple" ? "text-purple-700" : "text-green-700"}`}>{pct}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/85 backdrop-blur-sm rounded-2xl p-4 border border-white shadow-sm">
                    <div className="text-xs font-semibold text-[#111827] mb-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#2563EB]" /> Today's Tasks
                    </div>
                    {[
                      { label: "Binary Trees — LeetCode #102", done: true },
                      { label: "OS Scheduling Algorithms", done: true },
                      { label: "Mock Interview Practice", done: false },
                      { label: "DBMS Transactions", done: false },
                    ].map((t) => (
                      <div key={t.label} className="flex items-center gap-2 py-1.5">
                        {t.done
                          ? <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          : <Circle className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                        }
                        <span className={`text-[11px] ${t.done ? "line-through text-gray-400" : "text-[#374151]"}`}>{t.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] rounded-2xl p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-medium opacity-80">Readiness Score</div>
                        <div className="text-3xl font-bold mt-0.5">74%</div>
                        <div className="text-xs opacity-70 mt-0.5">↑ 12% this week</div>
                      </div>
                      <div className="w-14 h-14 rounded-full border-4 border-white/30 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-8 border-y border-gray-100 bg-white/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[["10,000+", "Students Prepared"], ["500+", "Companies Covered"], ["94%", "Placement Rate"], ["4.9/5", "Student Rating"]].map(([num, label]) => (
              <div key={label}>
                <div className="text-2xl font-bold text-[#111827]">{num}</div>
                <div className="text-sm text-[#6B7280] mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 border border-purple-100 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <Zap className="w-3.5 h-3.5" /> Core Features
            </div>
            <h2 className="text-4xl font-bold text-[#111827] mb-4">Everything you need to crack placements</h2>
            <p className="text-[#6B7280] max-w-xl mx-auto">Six powerful AI-driven modules that work together to give you the unfair advantage in campus placements.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <GlassCard key={title} className="p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${featureIconColors[color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-[#111827] mb-2">{title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="how-it-works" className="py-20 px-6 bg-white/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-[#111827] mb-3">From notification to offer</h2>
            <p className="text-[#6B7280]">Five simple steps, all powered by AI</p>
          </div>
          <div className="flex flex-col md:flex-row items-stretch">
            {workflow.map((item, i) => (
              <div key={item.step} className="flex items-center flex-1">
                <div className="flex md:flex-col items-center flex-1 gap-4 md:gap-3 p-4 md:p-6 md:text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-white text-sm font-bold shadow-md shadow-blue-100 shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#111827]">{item.label}</div>
                    <div className="text-xs text-[#6B7280] mt-0.5">{item.desc}</div>
                  </div>
                </div>
                {i < workflow.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-gray-300 shrink-0 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-16 px-6 border-t border-gray-100">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-1 text-sm font-medium">
            <Info className="w-3.5 h-3.5" /> About PlacementPal AI
          </div>
          <h2 className="text-3xl font-bold text-[#111827]">Built for engineering students worldwide</h2>
          <p className="text-[#6B7280] leading-relaxed max-w-2xl mx-auto">
            PlacementPal AI combines multi-agent LLM systems with real-time vector search to streamline campus placement preparation. From processing raw university notices to tracking daily practice problems, PlacementPal acts as your dedicated 24/7 AI mentor.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-16 px-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 rounded-full px-4 py-1 text-sm font-medium">
            <Mail className="w-3.5 h-3.5" /> Get in Touch
          </div>
          <h2 className="text-3xl font-bold text-[#111827]">Have questions or feedback?</h2>
          <p className="text-[#6B7280] leading-relaxed">
            Reach out to our student support team at <a href="mailto:support@placementpal.ai" className="text-[#2563EB] font-semibold hover:underline">support@placementpal.ai</a>.
          </p>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-[#2563EB] via-[#4F46E5] to-[#7C3AED] rounded-3xl p-12 text-white text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to crack your dream placement?</h2>
            <p className="text-blue-100 mb-8 max-w-md mx-auto">Join thousands of engineering students who used PlacementPal AI to land their dream jobs at top tech companies.</p>
            <button
              onClick={handleGetStarted}
              className="bg-white text-[#2563EB] font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-colors inline-flex items-center gap-2 text-base cursor-pointer"
            >
              Start Preparing Now <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
