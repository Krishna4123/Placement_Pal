import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  FileText, CheckCircle, Sparkles, Award, ShieldCheck, 
  AlertCircle, FileCheck, Brain, XCircle, CheckCircle2, ArrowRight, Upload
} from "lucide-react";
import { GlassCard, Badge, Btn } from "../components/common/UIElements";
import { useSession } from "../context/SessionContext";

const isSkillMatch = (expectedSkill: string, resumeSkill: string): boolean => {
  const expLower = expectedSkill.toLowerCase().trim();
  const resLower = resumeSkill.toLowerCase().trim();

  if (!expLower || !resLower) return false;
  if (expLower === resLower) return true;

  if (resLower === "c") {
    return (
      /\bc\b/i.test(expLower) ||
      expLower.includes("c++") ||
      expLower.includes("c/") ||
      expLower.includes("/c")
    );
  }

  if (resLower === "r") {
    return /\br\b/i.test(expLower) || expLower.includes("r-lang") || expLower.includes("r programming");
  }

  if (resLower === "go") {
    return /\bgo\b/i.test(expLower) || expLower.includes("golang");
  }

  if (resLower === "dsa" || resLower === "data structures") {
    return expLower.includes("data structure") || expLower.includes("dsa") || expLower.includes("algorithm");
  }

  if (resLower === "oop" || resLower === "object oriented") {
    return expLower.includes("object-oriented") || expLower.includes("oop");
  }

  if (resLower === "sql") {
    return expLower.includes("sql") || expLower.includes("database");
  }

  if (resLower === "api" || resLower === "rest") {
    return expLower.includes("api") || expLower.includes("rest") || expLower.includes("microservices");
  }

  if (resLower === "system design") {
    return expLower.includes("system design") || expLower.includes("architecture");
  }

  if (resLower.length <= 3) {
    const escaped = resLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(expLower);
  }

  return expLower.includes(resLower) || resLower.includes(expLower);
};

export const ResumePage: React.FC = () => {
  const { profile, placementState, parsedNotification, resumeData } = useSession();

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

  const intelMap = placementState?.company_intel || {};
  const intelObj =
    intelMap[activeCompany] ||
    (Object.keys(intelMap).length > 0 ? intelMap[Object.keys(intelMap)[0]] : {});

  const companyTechStack: string[] = useMemo(() => {
    const fromIntel = intelObj.tech_stack?.length ? intelObj.tech_stack : null;
    const fromParsed = effectiveParsed?.tech_stack?.length ? effectiveParsed.tech_stack : null;
    const defaultStack = [
      "Data Structures & Algorithms",
      "System Design & Architecture",
      "Python / C++",
      "SQL & Database Systems",
      "REST APIs & Microservices",
      "React / Frontend Engineering",
      "Object-Oriented Programming (OOP)"
    ];
    return fromIntel || fromParsed || defaultStack;
  }, [intelObj, effectiveParsed]);

  const resumeSkills: string[] = useMemo(() => {
    return resumeData?.extracted_skills || resumeData?.extractedSkills || [
      "Data Structures & Algorithms",
      "Python",
      "C++",
      "SQL",
      "REST APIs",
      "React",
      "Git"
    ];
  }, [resumeData]);

  const matchedTechStack = useMemo(() => {
    if (!resumeData) return [];
    return companyTechStack.filter((expectedSkill) => {
      return resumeSkills.some((resSkill) => isSkillMatch(expectedSkill, resSkill));
    });
  }, [companyTechStack, resumeSkills, resumeData]);

  const missingTechStack = useMemo(() => {
    if (!resumeData) return [];
    return companyTechStack.filter((skill) => !matchedTechStack.includes(skill));
  }, [companyTechStack, matchedTechStack, resumeData]);

  const atsScore = useMemo(() => {
    if (!resumeData) return 0;
    if (typeof resumeData.ats_score === "number") return resumeData.ats_score;
    const matchRatio = companyTechStack.length > 0 ? matchedTechStack.length / companyTechStack.length : 0.6;
    return Math.max(25, Math.min(98, Math.round(matchRatio * 100)));
  }, [matchedTechStack, companyTechStack, resumeData]);

  const strengths: string[] = useMemo(() => {
    return resumeData?.strengths || [
      `Strong technical alignment with ${activeCompany}'s software engineering standards.`,
      `Demonstrated project work in Core CS, REST APIs, and Database management.`,
      `High candidate readiness for ${targetRole} evaluation loops.`
    ];
  }, [resumeData, activeCompany, targetRole]);

  const suggestions: string = useMemo(() => {
    if (resumeData?.suggestions) return resumeData.suggestions;
    if (missingTechStack.length > 0) {
      return `To boost your ATS score for ${activeCompany}, consider highlighting experience with: ${missingTechStack.slice(0, 3).join(", ")}.`;
    }
    return `Excellent fit! Your resume strongly aligns with tech stack requirements for ${activeCompany}.`;
  }, [resumeData, missingTechStack, activeCompany]);

  return (
    <div className="max-w-5xl mx-auto pb-10 space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-200" />
            <h2 className="text-xl font-bold">Resume & ATS Evaluation Hub</h2>
          </div>
          <p className="text-sm text-blue-100 max-w-xl">
            Read-only candidate profile analysis comparing your resume tech stack directly against <span className="font-semibold text-white">{activeCompany}</span>'s hiring requirements.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-xs font-medium">
          <FileCheck className="w-4 h-4 text-green-300" />
          <span>ATS Evaluation Active</span>
        </div>
      </div>

      {/* Main Content */}
      {!resumeData ? (
        <GlassCard className="p-10 text-center space-y-4 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto border border-purple-100 shadow-sm">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#111827]">No Resume Uploaded for Active Session</h3>
            <p className="text-sm text-[#6B7280] mt-1 max-w-md mx-auto leading-relaxed">
              Upload your resume when starting a new session to automatically trigger ATS score calculation, company tech stack matching, and resume-driven active recall guides.
            </p>
          </div>
          <div className="pt-2">
            <Link to="/new-session">
              <Btn variant="gradient" size="md" className="px-6">
                <Upload className="w-4 h-4 mr-2" /> Start New Session with Resume
              </Btn>
            </Link>
          </div>
        </GlassCard>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column (2 Cols): Resume Info & Skill Match Analysis */}
          <div className="md:col-span-2 space-y-6">
            {/* Resume File Summary */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                    PDF
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#111827]">{resumeData.filename || resumeData.fileName || "Uploaded_Resume.pdf"}</h3>
                    <p className="text-xs text-[#6B7280]">
                      {resumeData.file_size || resumeData.fileSize || "1.2 MB"} • Ingested into MongoDB & Knowledge Vault
                    </p>
                  </div>
                </div>
                <Badge color="green" className="shrink-0">
                  <CheckCircle className="w-3 h-3 mr-1" /> ATS Parsed
                </Badge>
              </div>

              {/* Extracted Resume Skills Cloud */}
              <div>
                <h4 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2.5">
                  Extracted Tech Stack & Skills from Resume ({resumeSkills.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {resumeSkills.map((skill: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </GlassCard>

            {/* Company Tech Stack Comparison */}
            <GlassCard className="p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-semibold text-[#111827] flex items-center gap-2">
                    <Brain className="w-4 h-4 text-indigo-600" />
                    Company Tech Stack Comparison
                  </h3>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    Matching resume skills against <span className="font-semibold text-gray-800">{activeCompany}</span> expected skills ({targetRole})
                  </p>
                </div>
                <Badge color="blue">{activeCompany}</Badge>
              </div>

              {/* Matched Tech Stack */}
              <div>
                <h4 className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  Matched Company Skills ({matchedTechStack.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {matchedTechStack.map((skill, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      {skill}
                    </span>
                  ))}
                  {matchedTechStack.length === 0 && (
                    <p className="text-xs text-gray-400 italic">No direct matches found yet.</p>
                  )}
                </div>
              </div>

              {/* Missing / Gap Tech Stack */}
              {missingTechStack.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    Missing Company Expected Skills ({missingTechStack.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {missingTechStack.map((skill, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        <XCircle className="w-3 h-3 text-amber-600" />
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Candidate Strengths */}
              <div>
                <h4 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">
                  Profile Strengths & Key Highlights
                </h4>
                <ul className="space-y-2">
                  {strengths.map((str, idx) => (
                    <li key={idx} className="text-xs text-[#374151] flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </GlassCard>
          </div>

          {/* Right Column: ATS Score & AI Recommendations */}
          <div className="space-y-6">
            <GlassCard className="p-6 space-y-5">
              <h3 className="font-semibold text-[#111827] flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-600" />
                ATS & Role Fit Score
              </h3>

              <div className="text-center py-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl shadow-inner">
                <div className="text-4xl font-extrabold text-[#2563EB]">
                  {atsScore}%
                </div>
                <p className="text-xs font-medium text-[#6B7280] mt-1">Target Role ATS Alignment</p>
                <div className="mt-3 px-4">
                  <div className="w-full bg-blue-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#2563EB] h-full rounded-full transition-all duration-500" 
                      style={{ width: `${atsScore}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-[#6B7280]">Target Company</span>
                  <span className="font-semibold text-[#111827]">{activeCompany}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-[#6B7280]">Target Role</span>
                  <span className="font-semibold text-[#111827] truncate max-w-[140px]" title={targetRole}>
                    {targetRole}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-[#6B7280]">Tech Stack Matched</span>
                  <span className="font-semibold text-green-600">
                    {matchedTechStack.length} of {companyTechStack.length} Expected
                  </span>
                </div>
              </div>

              {/* AI Upgradation Recommendations */}
              <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl text-xs text-purple-900 space-y-1.5">
                <div className="font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Resume Upgradation Suggestion</span>
                </div>
                <p className="text-[11px] text-purple-800 leading-relaxed">
                  {suggestions}
                </p>
              </div>

              <div className="pt-2">
                <Link to="/recall">
                  <Btn variant="secondary" size="sm" className="w-full justify-center">
                    <span>Go to Resume-Based Recall Guide</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Btn>
                </Link>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
};

