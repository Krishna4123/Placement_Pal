import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, X, CheckCircle, Bot, Sparkles } from "lucide-react";
import { GlassCard, Btn } from "../components/common/UIElements";
import { useSession } from "../context/SessionContext";
import { pipelineApi } from "../api/pipeline";
import { vaultApi } from "../api/vault";

export const NewSessionPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId, profile, setProfile, startNewSession } = useSession();

  const [notifText, setNotifText] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([
    { name: "GATE_CS_Notes_2024.pdf", size: "4.2 MB", color: "text-red-500" },
    { name: "DSA_Cheatsheet.docx", size: "1.8 MB", color: "text-blue-500" },
  ]);

  const [topics, setTopics] = useState([
    { id: 1, name: "Data Structures & Algorithms", status: "known" },
    { id: 2, name: "Operating Systems", status: "weak" },
    { id: 3, name: "Database Management Systems", status: "learning" },
    { id: 4, name: "Computer Networks", status: "weak" },
    { id: 5, name: "System Design", status: "learning" },
    { id: 6, name: "OOP Concepts", status: "known" },
  ]);

  const statusClasses: Record<string, string> = {
    known: "bg-green-50 text-green-700 border-green-200",
    weak: "bg-red-50 text-red-700 border-red-200",
    learning: "bg-amber-50 text-amber-700 border-amber-200",
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      await vaultApi.uploadFile(file);
      setUploadedFiles((prev) => [
        ...prev,
        {
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
          color: file.name.endsWith(".pdf") ? "text-red-500" : "text-blue-500",
        },
      ]);
    } catch (err) {
      console.error("Failed to upload file to vault:", err);
      // Local fallback representation
      setUploadedFiles((prev) => [
        ...prev,
        {
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
          color: "text-blue-500",
        },
      ]);
    }
  };

  const processNotification = async () => {
    setProcessing(true);
    
    // Extract target company name if mentioned in text (or default to Google)
    let detectedCompany = profile.targetCompany;
    if (notifText.toLowerCase().includes("microsoft")) detectedCompany = "Microsoft";
    else if (notifText.toLowerCase().includes("amazon")) detectedCompany = "Amazon";
    else if (notifText.toLowerCase().includes("google")) detectedCompany = "Google";
    else if (notifText.toLowerCase().includes("atlassian")) detectedCompany = "Atlassian";

    startNewSession(detectedCompany);

    try {
      // Trigger Phase 1 API
      await pipelineApi.runPhase1({
        session_id: sessionId,
        user_message: notifText || "Standard placement prep session for SDE role.",
        target_companies: [detectedCompany],
        target_roles: [profile.targetRole],
        preparation_duration_days: profile.daysRemaining,
      });

      // Trigger Phase 2 API
      await pipelineApi.runPhase2({
        session_id: sessionId,
      });

      setProfile((prev) => ({
        ...prev,
        targetCompany: detectedCompany,
      }));
    } catch (err) {
      console.error("Pipeline API error (backend graph execution):", err);
    } finally {
      await new Promise((r) => setTimeout(r, 1500));
      setProcessing(false);
      setDone(true);
      setTimeout(() => navigate("/company"), 1200);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">New Preparation Session</h1>
        <p className="text-sm text-[#6B7280] mt-1">Paste your placement notification and let AI create a personalized interview plan</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-5">
          <GlassCard className="p-5">
            <label className="text-sm font-semibold text-[#111827] block mb-1.5">Placement Notification</label>
            <p className="text-xs text-[#6B7280] mb-3">Paste the full notification text from your college placement cell</p>
            <textarea
              value={notifText}
              onChange={(e) => setNotifText(e.target.value)}
              placeholder={"Paste notification here...\n\nExample: XYZ company is visiting our campus on Feb 15, 2025 for SDE role. Requirements: B.Tech CSE/IT with 7+ CGPA. Process: Online Test → Technical Round → HR Round..."}
              className="w-full h-44 text-sm text-[#374151] bg-gray-50 border border-gray-200 rounded-xl p-3.5 resize-none outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 placeholder:text-gray-400 leading-relaxed"
            />
          </GlassCard>

          <GlassCard className="p-5">
            <label className="text-sm font-semibold text-[#111827] block mb-1.5">Upload Study Materials</label>
            <label className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer block">
              <Upload className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
              <div className="text-sm font-medium text-[#374151]">Drop files here or click to browse</div>
              <div className="text-xs text-[#6B7280] mt-1">PDF, DOCX, TXT · up to 50 MB each</div>
              <input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf,.docx,.txt" />
            </label>
            <div className="mt-3 space-y-2">
              {uploadedFiles.map((f) => (
                <div key={f.name} className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-xl">
                  <FileText className={`w-4 h-4 ${f.color} shrink-0`} />
                  <span className="text-xs text-[#374151] flex-1 truncate">{f.name}</span>
                  <span className="text-xs text-[#9CA3AF]">{f.size}</span>
                  <button
                    onClick={() => setUploadedFiles((prev) => prev.filter((item) => item.name !== f.name))}
                    className="text-gray-300 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Topics */}
        <GlassCard className="p-5">
          <label className="text-sm font-semibold text-[#111827] block mb-1">Manual Topics</label>
          <p className="text-xs text-[#6B7280] mb-4">Mark your current knowledge level for each topic</p>
          <div className="flex gap-2 mb-4">
            <input
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newTopic.trim()) {
                  setTopics((ts) => [...ts, { id: Date.now(), name: newTopic.trim(), status: "learning" }]);
                  setNewTopic("");
                }
              }}
              placeholder="Add new topic..."
              className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 placeholder:text-gray-400"
            />
            <Btn size="sm" variant="primary" onClick={() => {
              if (newTopic.trim()) {
                setTopics((ts) => [...ts, { id: Date.now(), name: newTopic.trim(), status: "learning" }]);
                setNewTopic("");
              }
            }}>Add</Btn>
          </div>
          <div className="space-y-2 overflow-y-auto max-h-72">
            {topics.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="text-sm text-[#374151] flex-1 min-w-0 truncate">{t.name}</span>
                <div className="flex gap-1 shrink-0">
                  {(["known", "weak", "learning"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setTopics((ts) => ts.map((tt) => tt.id === t.id ? { ...tt, status: s } : tt))}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition-all cursor-pointer ${t.status === s ? statusClasses[s] : "bg-white text-gray-400 border-gray-200 hover:bg-gray-100"}`}
                    >
                      {s === "known" ? "Known" : s === "weak" ? "Weak" : "Learning"}
                    </button>
                  ))}
                </div>
                <button onClick={() => setTopics((ts) => ts.filter((tt) => tt.id !== t.id))} className="text-gray-300 hover:text-red-400 transition-colors shrink-0 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Process Button / Animation */}
      <div className="flex justify-center py-4">
        {done ? (
          <div className="flex items-center gap-2.5 text-green-600 font-semibold text-sm">
            <CheckCircle className="w-5 h-5" /> Plan generated! Redirecting to Company Dashboard...
          </div>
        ) : processing ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center animate-pulse">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-[#111827]">AI Multi-Agents Working...</div>
              <div className="text-xs text-[#6B7280] mt-1">Analyzing company · Generating curriculum · Building recall guide · Scheduling tasks</div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {["Message Interpreter", "Company Intel", "Knowledge Vault", "Recall Agent", "Curriculum Architect"].map((label, i) => (
                <div key={label} className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-medium animate-pulse" style={{ animationDelay: `${i * 200}ms` }}>
                  {label}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Btn variant="gradient" size="lg" onClick={processNotification} className="px-10 shadow-lg shadow-blue-100">
            <Sparkles className="w-4 h-4" /> Process Notification & Generate Plan
          </Btn>
        )}
      </div>
    </div>
  );
};
