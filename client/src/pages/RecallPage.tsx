import React, { useState, useEffect } from "react";
import { Bot, Sparkles, Brain, CheckCircle2, ChevronDown, ChevronUp, RefreshCw, FileText, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GlassCard, Badge, Btn } from "../components/common/UIElements";
import { AILoader } from "../components/animations/AILoader";
import { useSession } from "../context/SessionContext";
import { pipelineApi } from "../api/pipeline";

interface RecallQuestion {
  question: string;
  answer?: string;
  difficulty?: string;
  question_type?: string;
}

export const RecallPage: React.FC = () => {
  const { profile, placementState, resumeData, sessionId } = useSession();

  const targetCompany = profile.targetCompany || "Target Company";

  // Derive topics directly from candidate's resume!
  const resumeSkills: string[] = React.useMemo(() => {
    const extracted = resumeData?.extracted_skills || resumeData?.extractedSkills;
    if (extracted && Array.isArray(extracted) && extracted.length > 0) {
      return extracted;
    }
    return [
      "Data Structures & Algorithms",
      "System Design",
      "Python",
      "C++",
      "SQL & Database Systems",
      "REST APIs & Microservices",
      "Operating Systems",
      "Computer Networks"
    ];
  }, [resumeData]);

  const [selectedTopic, setSelectedTopic] = useState<string>(resumeSkills[0] || "Data Structures & Algorithms");
  const [topicQuestions, setTopicQuestions] = useState<RecallQuestion[]>([]);
  const [loadingRecall, setLoadingRecall] = useState<boolean>(false);
  const [expandedAnswers, setExpandedAnswers] = useState<Record<number, boolean>>({});
  const [userAssessments, setUserAssessments] = useState<Record<number, "mastered" | "review" | "weak">>({});

  // Sync selected topic when resumeSkills load
  useEffect(() => {
    if (resumeSkills.length > 0 && !resumeSkills.includes(selectedTopic)) {
      setSelectedTopic(resumeSkills[0]);
    }
  }, [resumeSkills]);

  // Fetch or generate recall questions when selectedTopic changes
  useEffect(() => {
    let isMounted = true;
    const fetchRecallForTopic = async () => {
      setLoadingRecall(true);
      setExpandedAnswers({});
      
      // Check if state already has recall questions for this topic
      const existingInState = (placementState?.recall_questions || []).find(
        (rq: any) => rq.topic?.toLowerCase() === selectedTopic.toLowerCase()
      );

      if (existingInState && existingInState.questions?.length) {
        const formatted = existingInState.questions.map((q: any) =>
          typeof q === "string" ? { question: q, difficulty: "Medium" } : q
        );
        if (isMounted) {
          setTopicQuestions(formatted);
          setLoadingRecall(false);
        }
        return;
      }

      // Generate on-demand via LLM endpoint
      try {
        const res = await pipelineApi.generateTopicRecall(selectedTopic, targetCompany, sessionId);
        if (isMounted && res && res.data && res.data.questions) {
          setTopicQuestions(res.data.questions);
        }
      } catch (err) {
        console.warn("Failed to fetch on-demand recall, using fallback:", err);
        if (isMounted) {
          setTopicQuestions([
            {
              question: `What are the core fundamentals of ${selectedTopic}?`,
              answer: `Fundamentals of ${selectedTopic} focus on efficient algorithm execution, memory layout, and key data structures.`,
              difficulty: "Medium",
              question_type: "conceptual"
            },
            {
              question: `How do you handle edge cases and memory constraints in ${selectedTopic}?`,
              answer: `Validate bounds, manage reference lifetimes, and use optimal space complexity structures.`,
              difficulty: "Hard",
              question_type: "problem-solving"
            },
            {
              question: `What real-world engineering trade-offs apply when using ${selectedTopic} at ${targetCompany}?`,
              answer: `Trade-offs include balancing throughput vs latency, caching strategies, and concurrency safety.`,
              difficulty: "Hard",
              question_type: "deep-dive"
            }
          ]);
        }
      } finally {
        if (isMounted) setLoadingRecall(false);
      }
    };

    fetchRecallForTopic();
    return () => {
      isMounted = false;
    };
  }, [selectedTopic, targetCompany, sessionId]);

  const toggleAnswer = (idx: number) => {
    setExpandedAnswers((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const markAssessment = (idx: number, status: "mastered" | "review" | "weak") => {
    setUserAssessments((prev) => ({ ...prev, [idx]: status }));
  };

  return (
    <div className="max-w-5xl mx-auto pb-10 space-y-6">
      {/* AI Summary Banner */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <GlassCard className="p-6 bg-gradient-to-r from-blue-50/70 dark:from-blue-950/30 via-indigo-50/50 dark:via-indigo-950/20 to-purple-50/70 dark:to-purple-950/20 border-blue-100 dark:border-blue-900/40">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                Resume-Driven Active Recall Guide
              </span>
            </div>
            <h2 className="text-lg font-bold text-foreground">
              {targetCompany} Preparation — Active Memory Testing
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
              These active recall topics are derived directly from the skills listed on your candidate <strong className="text-foreground">Resume</strong>. Click any topic below to trigger instant AI flashcards and test your recall depth.
            </p>
          </div>
          <Badge color="purple" className="shrink-0 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            <span>Resume Skill Verified</span>
          </Badge>
        </div>
      </GlassCard>
      </motion.div>

      {/* Resume Skills Topic Selector */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
      <GlassCard className="p-5 space-y-3">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
          Select Resume Skill / Topic to Test Recall ({resumeSkills.length})
        </label>
        <div className="flex flex-wrap gap-2.5">
          {resumeSkills.map((skill, i) => {
            const isSelected = selectedTopic.toLowerCase() === skill.toLowerCase();
            return (
              <motion.button
                key={skill}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                onClick={() => setSelectedTopic(skill)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border chip-hover ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-sm chip-active"
                    : "bg-secondary text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                <span>{skill}</span>
              </motion.button>
            );
          })}
        </div>
      </GlassCard>
      </motion.div>

      {/* Active Question Cards for Selected Topic */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
      <GlassCard className="p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="font-bold text-foreground text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Active Recall: <span className="text-primary">{selectedTopic}</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Practice questions tailored for <span className="font-semibold text-foreground">{targetCompany}</span> technical interview evaluations
            </p>
          </div>

          <Btn
            variant="secondary"
            size="sm"
            disabled={loadingRecall}
            onClick={() => {
              setLoadingRecall(true);
              pipelineApi.generateTopicRecall(selectedTopic, targetCompany, sessionId).then((res) => {
                if (res?.data?.questions) setTopicQuestions(res.data.questions);
              }).finally(() => setLoadingRecall(false));
            }}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loadingRecall ? "animate-spin text-blue-600" : ""}`} />
            <span>Regenerate Questions</span>
          </Btn>
        </div>

        {/* Loading State */}
        {loadingRecall ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
              className="w-12 h-12 rounded-2xl bg-accent border border-border flex items-center justify-center text-primary">
              <Bot className="w-6 h-6" />
            </motion.div>
            <div className="text-xs font-semibold text-foreground">Generating Active Recall Items for {selectedTopic}...</div>
            <div className="text-[11px] text-muted-foreground">LLM multi-agents tailoring questions to {targetCompany} standards</div>
            <AILoader size="md" />
          </div>
        ) : topicQuestions.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">
            No questions available for this topic. Click "Regenerate Questions" above.
          </div>
        ) : (
          <div className="space-y-4">
            {topicQuestions.map((qObj, idx) => {
              const isExpanded = expandedAnswers[idx] || false;
              const assessment = userAssessments[idx];

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="p-4 bg-secondary border border-border rounded-2xl space-y-3 hover:border-primary/30 transition-colors card-hover"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-accent text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        Q{idx + 1}
                      </div>
                      <div className="text-sm font-semibold text-foreground leading-snug">
                        {qObj.question}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {qObj.question_type && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-900/50">
                          {qObj.question_type}
                        </span>
                      )}
                      <Badge color={qObj.difficulty?.toLowerCase() === "hard" ? "red" : qObj.difficulty?.toLowerCase() === "easy" ? "green" : "amber"}>
                        {qObj.difficulty || "Medium"}
                      </Badge>
                    </div>
                  </div>

                  {/* Toggle Answer Button */}
                  {qObj.answer && (
                    <div>
                      <button
                        onClick={() => toggleAnswer(idx)}
                        className="text-xs font-medium text-primary hover:opacity-80 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>{isExpanded ? "Hide Solution & Answer" : "Show Solution & Answer"}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="mt-2.5 p-3.5 bg-card border border-primary/20 rounded-xl text-xs text-foreground leading-relaxed space-y-1 shadow-sm overflow-hidden"
                          >
                            <span className="font-semibold text-primary block text-[11px] uppercase tracking-wide">
                              Model Answer & Key Concept:
                            </span>
                            <p className="text-muted-foreground">{qObj.answer}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Self Assessment Controls */}
                  <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
                    <span className="text-[11px] text-muted-foreground">Self Assessment:</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => markAssessment(idx, "mastered")}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border cursor-pointer transition-all ${
                          assessment === "mastered"
                            ? "bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300 border-green-300 dark:border-green-800 font-bold"
                            : "bg-card text-muted-foreground border-border hover:bg-green-50 dark:hover:bg-green-950/30 hover:text-green-700"
                        }`}
                      >
                        Mastered
                      </button>
                      <button
                        onClick={() => markAssessment(idx, "review")}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border cursor-pointer transition-all ${
                          assessment === "review"
                            ? "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-bold"
                            : "bg-card text-muted-foreground border-border hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-700"
                        }`}
                      >
                        Needs Review
                      </button>
                      <button
                        onClick={() => markAssessment(idx, "weak")}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border cursor-pointer transition-all ${
                          assessment === "weak"
                            ? "bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800 font-bold"
                            : "bg-card text-muted-foreground border-border hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700"
                        }`}
                      >
                        Weak Concept
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </GlassCard>
      </motion.div>
    </div>
  );
};

