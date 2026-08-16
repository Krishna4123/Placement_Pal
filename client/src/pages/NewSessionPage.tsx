import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, X, CheckCircle, Bot, Sparkles, UserCheck } from "lucide-react";
import { motion } from "motion/react";
import { GlassCard, Btn } from "../components/common/UIElements";
import { AILoader } from "../components/animations/AILoader";
import { useSession } from "../context/SessionContext";
import { pipelineApi } from "../api/pipeline";
import { vaultApi } from "../api/vault";
import { parseApi } from "../api/parse";

export const NewSessionPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, startNewSession, refreshState, refreshResume, applyParsedNotification } = useSession();

  const [notifText, setNotifText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  
  // Study Materials (ChromaDB Vault)
  const [uploadedStudyFile, setUploadedStudyFile] = useState<File | null>(null);

  // Candidate Resume (ATS + Skills Parsing)
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const handleStudyFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedStudyFile(e.target.files[0]);
    }
  };

  const handleResumeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const processNotification = async () => {
    setProcessing(true);
    
    const newSessionId = startNewSession();

    try {
      // ── TRIGGER 1: Fast Notification parse (Company, Role, Dates) ────────
      let parsedCompany = profile.targetCompany || "Target Company";
      if (notifText.trim()) {
        try {
          const parsed = await parseApi.parseNotification(newSessionId, notifText);
          applyParsedNotification(parsed, parsed.company || undefined);
          if (parsed.company) parsedCompany = parsed.company;
        } catch (parseErr) {
          console.warn("Notification parse failed, using regex fallback:", parseErr);
          const match = notifText.match(/([A-Z][A-Za-z0-9]+)\s+(?:is|will|campus|placement|drive)/i);
          if (match) parsedCompany = match[1];
        }
      }

      // ── TRIGGER 2 & 3: Run Document Upload & Resume Parsing concurrently ──
      const tasks: Promise<any>[] = [];

      if (uploadedStudyFile) {
        tasks.push(
          vaultApi.uploadFile(uploadedStudyFile).catch((err) => {
            console.warn("Study material upload error:", err);
          })
        );
      }

      if (resumeFile) {
        tasks.push(
          vaultApi.uploadResume(resumeFile, parsedCompany, profile.targetRole, newSessionId)
            .then(() => refreshResume(newSessionId))
            .catch((err) => {
              console.warn("Resume ATS parsing error:", err);
            })
        );
      }

      await Promise.all(tasks);

      // Refresh session state to ensure company overview and resume data are loaded
      await refreshState(newSessionId);

      // Navigate after data initialization completes
      navigate("/company");

      // ── BACKGROUND GRAPH EXECUTION (Phase 1 & Phase 2) ──────────────────
      pipelineApi.runPhase1({
        session_id: newSessionId,
        user_message: notifText || `Placement prep session for ${parsedCompany}`,
        target_companies: [parsedCompany],
        target_roles: [profile.targetRole],
        preparation_duration_days: profile.daysRemaining,
      }).then(() => {
        pipelineApi.runPhase2({ session_id: newSessionId }).then(() => {
          refreshState(newSessionId);
        });
      }).catch(err => {
        console.warn("Background pipeline execution error:", err);
      });

    } catch (err) {
      console.error("Session start error:", err);
      navigate("/company");
    } finally {
      setProcessing(false);
      setDone(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-foreground">New Preparation Session</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Paste placement notification, attach study notes & your resume to generate an ATS-aligned preparation plan.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column: Placement Notification & Study Materials */}
        <div className="space-y-5">
          <GlassCard className="p-5">
            <label className="text-sm font-semibold text-foreground block mb-1.5">Placement Notification</label>
            <p className="text-xs text-muted-foreground mb-3">Paste the job notification text from your placement cell</p>
            <textarea
              value={notifText}
              onChange={(e) => setNotifText(e.target.value)}
              placeholder={"Paste notification here...\n\nExample: Google is visiting campus for SDE role on March 15. Rounds: Online Assessment → Technical Interview → HR..."}
              className="w-full h-44 text-sm text-foreground bg-background border border-border rounded-xl p-3.5 resize-none outline-none focus:ring-2 focus:ring-accent focus:border-accent/50 placeholder:text-muted-foreground leading-relaxed"
            />
          </GlassCard>

          <GlassCard className="p-5">
            <label className="text-sm font-semibold text-foreground block mb-1.5">Upload Study Materials (Vault)</label>
            <label className="border-2 border-dashed border-border rounded-xl p-5 text-center hover:border-accent hover:bg-accent/10 transition-all cursor-pointer block">
              <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-1.5" />
              <div className="text-xs font-medium text-foreground">
                {uploadedStudyFile ? uploadedStudyFile.name : "Drop study notes or click to browse"}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">PDF, DOCX, TXT · up to 50 MB</div>
              <input type="file" onChange={handleStudyFileUpload} className="hidden" accept=".pdf,.docx,.txt" />
            </label>
            {uploadedStudyFile && (
              <div className="mt-2.5 flex items-center justify-between p-2 bg-accent/20 border border-border rounded-lg text-xs">
                <span className="text-foreground font-medium truncate max-w-[240px]">{uploadedStudyFile.name}</span>
                <button onClick={() => setUploadedStudyFile(null)} className="text-destructive hover:text-destructive/80">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right Column */}
        <motion.div className="space-y-5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.45 }}>
          <GlassCard className="p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <UserCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <label className="text-sm font-semibold text-foreground">Candidate Resume</label>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Upload your resume for company ATS matching, skill extraction, and personalized recall guides.
              </p>

              <label className="border-2 border-dashed border-purple-200 dark:border-purple-800/50 rounded-2xl p-8 text-center hover:border-purple-400 hover:bg-purple-50/30 dark:hover:bg-purple-950/20 transition-all cursor-pointer block">
                <FileText className="w-8 h-8 text-purple-400 dark:text-purple-500 mx-auto mb-2" />
                <div className="text-sm font-medium text-foreground">
                  {resumeFile ? resumeFile.name : "Drop resume file here or click to browse"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">PDF, DOCX, or TXT formats supported</div>
                <input type="file" onChange={handleResumeFileUpload} className="hidden" accept=".pdf,.docx,.doc,.txt" />
              </label>

              {resumeFile && (
                <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-purple-900 dark:text-purple-300 truncate">{resumeFile.name}</div>
                      <div className="text-[10px] text-purple-600 dark:text-purple-400">{(resumeFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for ATS parse</div>
                    </div>
                  </div>
                  <button onClick={() => setResumeFile(null)} className="text-muted-foreground hover:text-destructive">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 p-3 bg-gradient-to-r from-accent to-accent/50 border border-border rounded-xl text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">✨ Automated Workflow:</span>
              <p className="text-[11px] mt-0.5 leading-relaxed">
                Clicking "Start Agent" will simultaneously parse the placement notification, index study notes, and evaluate your resume's ATS match score against the target company.
              </p>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Process Button / Execution Status */}
      <div className="flex justify-center py-4">
        {done ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2.5 text-green-600 dark:text-green-400 font-semibold text-sm"
          >
            <CheckCircle className="w-5 h-5" /> Plan & ATS evaluation generated! Redirecting...
          </motion.div>
        ) : processing ? (
          <div className="flex flex-col items-center gap-4">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center shadow-lg"
            >
              <Bot className="w-7 h-7 text-white" />
            </motion.div>
            <div className="text-center">
              <div className="text-sm font-semibold text-foreground">AI Multi-Agents Processing...</div>
              <div className="text-xs text-muted-foreground mt-1">
                Parsing Notification · Indexing Vault · Evaluating Resume ATS Score · Designing Curriculum
              </div>
            </div>
            <AILoader size="md" />
            <div className="flex flex-wrap gap-2 justify-center">
              {["Company Parser", "Knowledge Vault", "Resume ATS Analyzer", "Recall Agent", "Curriculum Architect"].map((label, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                  className="px-2.5 py-1 bg-accent text-primary border border-border rounded-lg text-xs font-medium"
                >
                  {label}
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Btn variant="gradient" size="lg" onClick={processNotification} className="px-10 shadow-lg shadow-blue-500/20">
              <Sparkles className="w-4 h-4" /> Start Agent & Generate Plan
            </Btn>
          </motion.div>
        )}
      </div>
    </div>
  );
};
