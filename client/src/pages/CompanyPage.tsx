import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock, Globe, Code, Sparkles, BookOpen, MessageSquare, Layers, Calendar, CheckCircle2, Plus, Building2, ArrowRight, Trash2
} from "lucide-react";
import { GlassCard, Badge } from "../components/common/UIElements";
import { useSession } from "../context/SessionContext";

export const CompanyPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, placementState, parsedNotification, sessionId, sessions, switchSession, deleteCompanySession } = useSession();

  // ── Data sources: parsedNotification (fast, always available) comes first ──
  // parsedNotification is populated instantly by the regex parser on session start
  // placementState is populated later by the LLM pipeline (may be null on first load)

  // Fallback: if parsedNotification was cleared from memory, restore from placementState
  const effectiveParsed = parsedNotification ||
    (placementState?.parsed_notification as typeof parsedNotification) || null;

  const activeCompany =
    effectiveParsed?.company ||
    placementState?.target_companies?.[0] ||
    profile.targetCompany ||
    "Target Company";

  const targetRole =
    effectiveParsed?.target_role ||
    placementState?.target_roles?.[0] ||
    profile.targetRole ||
    "Software Engineer";

  // Interview date: prefer parsedNotification (guaranteed extracted), then LLM state
  const interviewDate =
    effectiveParsed?.interview_date ||
    placementState?.interpreted_intent?.interview_date ||
    null;

  // Remaining days: synchronized in real time with profile.daysRemaining
  const prepDays = useMemo(() => {
    if (interviewDate) {
      const parsed = new Date(interviewDate);
      if (!isNaN(parsed.getTime())) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const targetStart = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
        const diff = Math.ceil((targetStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 1;
      }
    }
    return profile.daysRemaining || 18;
  }, [interviewDate, profile.daysRemaining]);

  // Interview rounds: parsedNotification first (regex-extracted), then LLM
  const userRounds: string[] =
    (effectiveParsed?.process_rounds?.length
      ? effectiveParsed.process_rounds
      : null) ||
    placementState?.interpreted_intent?.process_rounds ||
    [];

  // Company intel from LLM — may be empty until LLM finishes
  const intelMap = placementState?.company_intel || {};
  // Match by exact name, then by first key, then empty
  const intelObj =
    intelMap[activeCompany] ||
    (Object.keys(intelMap).length > 0 ? intelMap[Object.keys(intelMap)[0]] : {});

  // Tech stack: LLM data first (more accurate), fallback to parsed notification
  const techStack: string[] = intelObj.tech_stack?.length
    ? intelObj.tech_stack
    : effectiveParsed?.tech_stack || [];
  const overview = intelObj.overview || intelObj.summary || null;
  const commonTopics: string[] = intelObj.common_topics || [];
  const tips: string[] = intelObj.tips || [];

  const llmReady = Boolean(placementState?.company_intel);
  const deadlineDate = effectiveParsed?.deadline_date || null;

  return (
    <div className="max-w-6xl mx-auto pb-8 space-y-6">
      {/* Multi-Company Sessions Navigator */}
      <GlassCard className="p-6 bg-gradient-to-r from-blue-50/50 via-white to-purple-50/40 border border-blue-100">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#111827] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Active Target Companies & Sessions
            </h2>
            <p className="text-xs text-[#6B7280]">
              Preparing for multiple companies? Switch active targets below to update all page guides, curriculum, and active recall.
            </p>
          </div>
          <button
            onClick={() => navigate("/new-session")}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-semibold hover:shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Prepare for New Company
          </button>
        </div>

        {sessions.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {sessions.map((s) => {
              const isActive = s.sessionId === sessionId;
              return (
                <div
                  key={s.sessionId}
                  onClick={() => switchSession(s.sessionId)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                    isActive
                      ? "bg-white border-blue-500 shadow-md ring-2 ring-blue-500/20"
                      : "bg-white/80 border-gray-100 hover:border-gray-300 hover:shadow-sm"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          isActive ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
                        }`}>
                          {s.companyName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-[#111827] leading-tight truncate">{s.companyName}</div>
                          <div className="text-[11px] text-[#6B7280] leading-tight truncate">{s.targetRole}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isActive && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md border border-blue-100">
                            Active
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete placement session for ${s.companyName}?`)) {
                              deleteCompanySession(s.sessionId);
                            }
                          }}
                          className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete Company Session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100 text-xs">
                    <span className="text-[#6B7280] font-medium">{s.daysRemaining} days prep</span>
                    <button
                      className={`text-xs font-semibold flex items-center gap-1 ${
                        isActive ? "text-blue-600" : "text-gray-500 hover:text-blue-600"
                      }`}
                    >
                      {isActive ? "Viewing" : "Switch Target"} <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 bg-white/70 rounded-xl text-xs text-gray-500 flex items-center justify-between">
            <span>Currently active target: <strong className="text-gray-800">{activeCompany}</strong> ({targetRole})</span>
            <button
              onClick={() => navigate("/new-session")}
              className="text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              + Add another company
            </button>
          </div>
        )}
      </GlassCard>
      {/* Header Card */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-blue-100 shrink-0">
              {activeCompany.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-bold text-[#111827]">{activeCompany}</h1>
                <Badge color="blue">Target Company</Badge>
                {intelObj.difficulty_level && (
                  <Badge color={intelObj.difficulty_level === "hard" ? "red" : "amber"}>
                    {intelObj.difficulty_level.toUpperCase()}
                  </Badge>
                )}
              </div>
              <div className="text-sm font-medium text-[#374151]">{targetRole}</div>

              {/* Gemini-extracted quick-info row */}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-[#6B7280]">
                {effectiveParsed?.stipend && (
                  <span className="bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-md font-medium">
                    ₹{parseInt(effectiveParsed.stipend).toLocaleString('en-IN')}/mo
                  </span>
                )}
                {effectiveParsed?.ctc && (
                  <span className="bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-md font-medium">
                    CTC: {effectiveParsed.ctc}
                  </span>
                )}
                {effectiveParsed?.location && (
                  <span className="bg-slate-50 text-slate-600 border border-slate-100 px-2 py-0.5 rounded-md">
                    📍 {effectiveParsed.location}
                  </span>
                )}
                {effectiveParsed?.eligibility && (
                  <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-md">
                    {effectiveParsed.eligibility}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 mt-2 text-xs text-[#6B7280] flex-wrap">
                <div className="flex items-center gap-1 font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{prepDays} days remaining</span>
                </div>
                {interviewDate ? (
                  <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Interview: {new Date(interviewDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                ) : deadlineDate ? (
                  <div className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Deadline: {new Date(deadlineDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>


      {/* User-Provided Interview Process Timeline */}
      <GlassCard className="p-6">
        <h3 className="font-semibold text-[#111827] mb-4 flex items-center gap-2">
          <Layers className="w-4.5 h-4.5 text-[#2563EB]" /> Interview Process & Timeline
        </h3>
        {userRounds.length > 0 ? (
          <div className="relative pl-2">
            <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-blue-100" />
            <div className="space-y-4">
              {userRounds.map((r: any, i: number) => {
                const title = typeof r === "string" ? r : r.title || r.name || r.stage || `Round ${i + 1}`;
                const detail = typeof r === "object" && r.description ? r.description : null;
                return (
                  <div key={i} className="flex gap-4 items-start relative">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 z-10 ${i === 0 ? "border-[#2563EB] bg-[#2563EB] text-white" : "border-blue-300 bg-white text-[#2563EB]"}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 p-3.5 rounded-xl border border-gray-100 bg-gray-50/60">
                      <div className="font-medium text-sm text-[#111827]">{title}</div>
                      {detail && <div className="text-xs text-[#6B7280] mt-1">{detail}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-xl text-xs text-[#6B7280]">
            No specific interview process rounds were provided in the placement notification.
          </div>
        )}
      </GlassCard>

      {/* Info Grid: Company Overview & Web Intel */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Company Overview (Tavily Search) */}
        <GlassCard className="p-5">
          <h3 className="font-semibold text-[#111827] mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#2563EB]" /> Company Overview
          </h3>
          <div className="text-sm text-[#374151] leading-relaxed mb-4">
            {overview ? (
              Array.isArray(overview) ? (
                <div className="space-y-2">
                  {overview.map((point: string, idx: number) => (
                    <div key={idx} className="flex gap-2 items-start text-xs font-medium text-[#374151]">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>{overview}</p>
              )
            ) : (
              <span className="text-[#9CA3AF] italic">
                {llmReady
                  ? `No overview found for ${activeCompany}.`
                  : "Web search in progress…"}
              </span>
            )}
          </div>

          {commonTopics.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-[#4B5563] mb-2 uppercase tracking-wide">Key Technical Focus Areas:</div>
              <div className="flex flex-wrap gap-1.5">
                {commonTopics.map((topic) => (
                  <span key={topic} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-100">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </GlassCard>

        {/* Tech Stack (Dynamic only) */}
        <GlassCard className="p-5">
          <h3 className="font-semibold text-[#111827] mb-3 flex items-center gap-2">
            <Code className="w-4 h-4 text-purple-600" /> Tech Stack
          </h3>
          {techStack.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {techStack.map((tech) => (
                <span key={tech} className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium border border-purple-100">
                  {tech}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#9CA3AF]">
              No specific tech stack listed in web search results for {activeCompany}.
            </p>
          )}
        </GlassCard>

        {/* Candidate Preparation & Strategy Tips (Tavily Search) */}
        <GlassCard className="p-5 md:col-span-2 space-y-3">
          <h3 className="font-semibold text-[#111827] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" /> Strategic Preparation Tips & Insights
          </h3>
          {tips.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-3">
              {tips.map((tip, idx) => (
                <div key={idx} className="flex gap-2.5 items-start p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-[#374151] leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#9CA3AF]">
              {llmReady ? (
                `No specific preparation tips compiled for ${activeCompany}.`
              ) : (
                <span className="italic">Web search in progress…</span>
              )}
            </p>
          )}
        </GlassCard>
      </div>
    </div>
  );
};
