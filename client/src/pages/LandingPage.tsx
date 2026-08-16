import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, ArrowRight, Play, Check, Bot, Building2, BookOpen,
  Brain, GraduationCap, TrendingUp, Calendar, CheckCircle, Circle, Zap, Info, Mail
} from "lucide-react";
import { motion } from "motion/react";
import { GlassCard, Badge, Btn } from "../components/common/UIElements";
import { Ballpit } from "../components/animations/Ballpit";
import { AnimatedCounter } from "../components/animations/AnimatedCounter";
import { useReveal } from "../hooks/useReveal";

/* ── Reusable fade-up variant ─────────────────────────────── */
const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' as const } },
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const { ref: statsRef, inView: statsInView } = useReveal<HTMLDivElement>();
  const { ref: featuresRef, inView: featuresInView } = useReveal<HTMLDivElement>();
  const { ref: workflowRef, inView: workflowInView } = useReveal<HTMLDivElement>();

  const handleGetStarted = () => navigate("/login");

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
    blue:   "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400",
    purple: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400",
    green:  "bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400",
    amber:  "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400",
  };

  return (
    <div className="pb-16">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Interactive 3D Ballpit Background */}
        <div className="absolute inset-0 w-full h-full pointer-events-auto opacity-75 dark:opacity-65 z-0">
          <Ballpit
            count={100}
            gravity={0.5}
            friction={0.9975}
            wallBounce={0.95}
            followCursor={true}
            colors={[0x2563eb, 0x7c3aed, 0x3b82f6, 0x8b5cf6, 0xec4899]}
            minSize={0.5}
            maxSize={1.1}
          />
        </div>

        {/* Floating gradient blobs (CSS-only, light weight) */}
        <div className="absolute top-24 left-1/4 w-72 h-72 blob blob-blue" style={{ animationDelay: '0s' }} />
        <div className="absolute bottom-10 right-1/4 w-56 h-56 blob blob-purple" style={{ animationDelay: '3s' }} />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="inline-flex items-center gap-2 bg-accent border border-border rounded-full px-4 py-1.5 text-sm font-medium text-primary mb-6"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Powered by Multi-Agent AI
              </motion.div>

              {/* Headline */}
              <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
                <motion.span
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, ease: 'easeOut', delay: 0 }}
                  className="block"
                >Your Personal</motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, ease: 'easeOut', delay: 0.12 }}
                  className="block gradient-text-animated"
                >
                  AI Placement
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, ease: 'easeOut', delay: 0.24 }}
                  className="block text-foreground"
                >Mentor</motion.span>
              </h1>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut', delay: 0.36 }}
                className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl"
              >
                Transform placement notifications into personalized interview preparation plans. PlacementPal AI analyzes company requirements, builds custom curricula, and guides you from notification to offer letter.
              </motion.p>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut', delay: 0.48 }}
                className="flex flex-wrap gap-4 mb-8"
              >
                <Btn variant="gradient" size="lg" onClick={handleGetStarted} className="group">
                  Get Started Free
                  <motion.span
                    className="inline-block"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.span>
                </Btn>
                <Btn variant="secondary" size="lg" onClick={handleGetStarted}>
                  <Play className="w-4 h-4 text-primary" /> Demo Dashboard
                </Btn>
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut', delay: 0.6 }}
                className="flex flex-wrap gap-5 text-sm text-muted-foreground"
              >
                {["Free for students", "No credit card required", "500+ companies"].map((t) => (
                  <div key={t} className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-green-500" />{t}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Hero Dashboard Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:flex justify-end"
            >
              <div className="relative w-[460px]">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/60 via-purple-50/40 to-indigo-50/30 dark:from-blue-900/20 dark:via-purple-900/10 dark:to-indigo-900/10 rounded-3xl" />
                <div className="relative p-5 space-y-3">
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                    className="bg-card/85 backdrop-blur-sm rounded-2xl p-4 border border-border shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-foreground">AI Plan Generated</div>
                        <div className="text-[11px] text-muted-foreground">Google SDE-1 · 14 days remaining</div>
                      </div>
                      <Badge color="green">Ready</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[["DSA", "72%", "blue"], ["System Design", "45%", "purple"], ["Core CS", "88%", "green"]].map(([label, pct, c]) => (
                        <div key={label} className={`rounded-xl p-2.5 text-center ${c === "blue" ? "bg-blue-50 dark:bg-blue-950/40" : c === "purple" ? "bg-purple-50 dark:bg-purple-950/40" : "bg-green-50 dark:bg-green-950/40"}`}>
                          <div className={`text-sm font-bold ${c === "blue" ? "text-blue-700 dark:text-blue-300" : c === "purple" ? "text-purple-700 dark:text-purple-300" : "text-green-700 dark:text-green-300"}`}>{pct}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="bg-card/85 backdrop-blur-sm rounded-2xl p-4 border border-border shadow-sm"
                  >
                    <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-primary" /> Today's Tasks
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
                          : <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        }
                        <span className={`text-[11px] ${t.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{t.label}</span>
                      </div>
                    ))}
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] rounded-2xl p-4 text-white"
                  >
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
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ─────────────────────────────────────────── */}
      <section className="py-8 border-y border-border bg-card/60" ref={statsRef}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { num: 10000, suffix: "+", label: "Students Prepared" },
              { num: 500, suffix: "+", label: "Companies Covered" },
              { num: 94, suffix: "%", label: "Placement Rate" },
              { num: 4.9, suffix: "/5", label: "Student Rating", decimals: 1 },
            ].map(({ num, suffix, label, decimals = 0 }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="text-2xl font-bold text-foreground">
                  <AnimatedCounter target={num} suffix={suffix} decimals={decimals} trigger={statsInView} />
                </div>
                <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section id="features" className="py-20 px-6" ref={featuresRef}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 bg-accent border border-border text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <Zap className="w-3.5 h-3.5" /> Core Features
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-4">Everything you need to crack placements</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Six powerful AI-driven modules that work together to give you the unfair advantage in campus placements.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 24 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                <GlassCard hover className="p-6 h-full">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${featureIconColors[color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workflow ───────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-6 bg-card/60" ref={workflowRef}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={workflowInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="text-4xl font-bold text-foreground mb-3">From notification to offer</h2>
            <p className="text-muted-foreground">Five simple steps, all powered by AI</p>
          </motion.div>
          <div className="flex flex-col md:flex-row items-stretch">
            {workflow.map((item, i) => (
              <div key={item.step} className="flex items-center flex-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={workflowInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="flex md:flex-col items-center flex-1 gap-4 md:gap-3 p-4 md:p-6 md:text-center"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 3 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-white text-sm font-bold shadow-md shrink-0"
                  >
                    {item.step}
                  </motion.div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{item.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
                  </div>
                </motion.div>
                {i < workflow.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={workflowInView ? { opacity: 1 } : {}}
                    transition={{ delay: i * 0.1 + 0.3 }}
                  >
                    <ArrowRight className="w-4 h-4 text-border shrink-0 hidden md:block" />
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* ── About ─────────────────────────────────────────────── */}
      <section id="about" className="py-16 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-accent text-primary rounded-full px-4 py-1 text-sm font-medium">
            <Info className="w-3.5 h-3.5" /> About PlacementPal AI
          </div>
          <h2 className="text-3xl font-bold text-foreground">Built for engineering students worldwide</h2>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            PlacementPal AI combines multi-agent LLM systems with real-time vector search to streamline campus placement preparation. From processing raw university notices to tracking daily practice problems, PlacementPal acts as your dedicated 24/7 AI mentor.
          </p>
        </div>
      </section>

      {/* ── Contact ───────────────────────────────────────────── */}
      <section id="contact" className="py-16 px-6 bg-secondary border-t border-border">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-accent text-primary rounded-full px-4 py-1 text-sm font-medium">
            <Mail className="w-3.5 h-3.5" /> Get in Touch
          </div>
          <h2 className="text-3xl font-bold text-foreground">Have questions or feedback?</h2>
          <p className="text-muted-foreground leading-relaxed">
            Reach out to our student support team at{" "}
            <a href="mailto:support@placementpal.ai" className="text-primary font-semibold hover:underline">
              support@placementpal.ai
            </a>.
          </p>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="bg-gradient-to-br from-[#2563EB] via-[#4F46E5] to-[#7C3AED] rounded-3xl p-12 text-white text-center relative overflow-hidden"
          >
            {/* Subtle shimmer overlay */}
            <div className="absolute inset-0 btn-shimmer opacity-50" />
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-4">Ready to crack your dream placement?</h2>
              <p className="text-blue-100 mb-8 max-w-md mx-auto">Join thousands of engineering students who used PlacementPal AI to land their dream jobs at top tech companies.</p>
              <motion.button
                onClick={handleGetStarted}
                whileHover={{ scale: 1.04, boxShadow: "0 8px 30px rgba(0,0,0,0.25)" }}
                whileTap={{ scale: 0.97 }}
                className="bg-white text-[#2563EB] font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-colors inline-flex items-center gap-2 text-base cursor-pointer"
              >
                Start Preparing Now <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
