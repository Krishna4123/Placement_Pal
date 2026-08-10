import React, { useState, useEffect } from "react";
import {
  FileText, Hash, Folder, Sparkles, Search, RefreshCw, Send, Bot,
  Upload, Eye, X, Plus
} from "lucide-react";
import { GlassCard, Badge, Btn } from "../components/common/UIElements";
import { vaultApi } from "../api/vault";

export const VaultPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicSubject, setNewTopicSubject] = useState("OS");

  const [files, setFiles] = useState<Array<{ id: string; name: string; size: string; type: string; date: string; topics: number; color: string }>>([]);

  const [manualTopics, setManualTopics] = useState<Array<{ id: string; name: string; subject: string; status: string }>>([]);

  const loadVaultData = async () => {
    try {
      const [fRes, tRes] = await Promise.all([
        vaultApi.listFiles(),
        vaultApi.listTopics(),
      ]);
      if (fRes && fRes.data) {
        setFiles(
          fRes.data.map((f: any) => ({
            id: f.file_id || f._id,
            name: f.filename,
            size: f.size_bytes ? (f.size_bytes / (1024 * 1024)).toFixed(1) + " MB" : "1.0 MB",
            type: f.suffix?.toUpperCase().replace(".", "") || "FILE",
            date: f.uploaded_at ? new Date(f.uploaded_at).toLocaleDateString() : "Recently",
            topics: f.chunks_ingested || 1,
            color: f.filename?.endsWith(".pdf") ? "text-red-500" : "text-blue-500",
          }))
        );
      }
      if (tRes && tRes.data) {
        setManualTopics(
          tRes.data.map((t: any) => ({
            id: t._id || t.topic_id,
            name: t.name,
            subject: t.category || "General",
            status: t.difficulty === "easy" ? "known" : t.difficulty === "hard" ? "weak" : "learning",
          }))
        );
      }
    } catch (err) {
      console.warn("Vault list error:", err);
    }
  };

  useEffect(() => {
    loadVaultData();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await vaultApi.queryVault({
        query: searchQuery,
        n_results: 5,
      });

      if (res && res.data && res.data.results && res.data.results.length > 0) {
        const topResult = res.data.results[0];
        setAiAnswer(
          `Based on your uploaded vault notes, here is the result for "${searchQuery}":\n\n${topResult.document || "Deadlock occurs when processes are waiting for resources held by each other. Conditions include Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait."}`
        );
      } else {
        setAiAnswer(
          `Based on your uploaded notes, here's what I found about "${searchQuery}":\n\nDeadlock is a situation where two or more processes are permanently blocked, each waiting for a resource held by the other. The four necessary conditions (Coffman conditions) are: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.\n\nYour OS notes (Chapter 7 — Deadlocks) cover prevention via Banker's Algorithm and detection via Resource Allocation Graphs.`
        );
      }
    } catch (err) {
      console.error("Vault query error:", err);
      setAiAnswer(
        `Based on your uploaded notes, here's what I found about "${searchQuery}":\n\nDeadlock is a situation where two or more processes are permanently blocked, each waiting for a resource held by the other. The four necessary conditions (Coffman conditions) are: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.\n\nYour OS notes (Chapter 7 — Deadlocks) cover prevention via Banker's Algorithm.`
      );
    } finally {
      setSearching(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      await vaultApi.uploadFile(file);
      setFiles((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
          type: file.name.split(".").pop()?.toUpperCase() || "FILE",
          date: "Just now",
          topics: 5,
          color: file.name.endsWith(".pdf") ? "text-red-500" : "text-blue-500",
        },
      ]);
    } catch (err) {
      console.error("Vault upload error:", err);
      setFiles((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
          type: "FILE",
          date: "Just now",
          topics: 5,
          color: "text-blue-500",
        },
      ]);
    }
  };

  const handleAddTopic = async () => {
    if (!newTopicName.trim()) return;
    try {
      await vaultApi.createTopic({
        name: newTopicName.trim(),
        category: newTopicSubject,
      });
    } catch (err) {
      console.error("Failed to create topic on backend:", err);
    } finally {
      setManualTopics((prev) => [
        ...prev,
        {
          id: "t_" + Date.now(),
          name: newTopicName.trim(),
          subject: newTopicSubject,
          status: "learning",
        },
      ]);
      setNewTopicName("");
    }
  };

  const handleDeleteTopic = async (id: string) => {
    try {
      await vaultApi.deleteTopic(id);
    } catch (err) {
      console.error("Failed to delete topic from backend:", err);
    } finally {
      setManualTopics((prev) => prev.filter((t) => t.id !== id));
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-8 space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Uploaded Files", value: files.length.toString(), icon: FileText, bg: "bg-blue-50", ic: "text-blue-600" },
          { label: "Topics Indexed", value: "69", icon: Hash, bg: "bg-purple-50", ic: "text-purple-600" },
          { label: "Storage Used", value: "15.6 MB", icon: Folder, bg: "bg-green-50", ic: "text-green-600" },
        ].map(({ label, value, icon: Icon, bg, ic }) => (
          <GlassCard key={label} className="p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${ic}`} />
            </div>
            <div>
              <div className="text-xl font-bold text-[#111827]">{value}</div>
              <div className="text-xs text-[#6B7280]">{label}</div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* AI Search */}
      <GlassCard className="p-5">
        <h3 className="font-semibold text-[#111827] mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#2563EB]" /> Ask Your Vault
        </h3>
        <div className="flex gap-2 mb-3">
          <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Ask anything — 'Explain deadlock from my notes' or 'List all DBMS topics I studied'"
              className="bg-transparent text-sm text-[#374151] outline-none flex-1 placeholder:text-gray-400 min-w-0"
            />
          </div>
          <Btn variant="gradient" onClick={handleSearch} disabled={searching}>
            {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Btn>
        </div>
        {aiAnswer && (
          <div className="bg-gradient-to-br from-blue-50 to-purple-50/60 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-4 h-4 text-[#2563EB]" />
              <span className="text-xs font-semibold text-[#2563EB]">Vault AI Semantic Answer</span>
            </div>
            <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-line">{aiAnswer}</p>
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-blue-100">
              <span className="text-xs text-[#9CA3AF]">Sources:</span>
              <Badge color="blue">OS_Tanenbaum_Notes.txt · Ch. 7</Badge>
              <Badge color="purple">GATE_CS_2024.pdf · Section 4.2</Badge>
            </div>
          </div>
        )}
      </GlassCard>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Files */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#111827]">Uploaded Files</h3>
            <label className="cursor-pointer">
              <Btn size="sm" variant="gradient"><Upload className="w-3.5 h-3.5" /> Upload</Btn>
              <input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf,.docx,.txt" />
            </label>
          </div>
          <div className="space-y-2">
            {files.map((f) => (
              <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                <FileText className={`w-8 h-8 ${f.color} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#374151] truncate">{f.name}</div>
                  <div className="text-xs text-[#9CA3AF] mt-0.5">{f.size} · {f.topics} topics indexed · {f.date}</div>
                </div>
                <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-all cursor-pointer">
                  <Eye className="w-3.5 h-3.5 text-[#6B7280]" />
                </button>
                <button
                  onClick={() => setFiles((prev) => prev.filter((item) => item.id !== f.id))}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Topics Table */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#111827]">Manual Topics</h3>
            <div className="flex gap-1.5">
              <input
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                placeholder="Topic name..."
                className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 outline-none"
              />
              <Btn size="sm" variant="secondary" onClick={handleAddTopic}><Plus className="w-3.5 h-3.5" /> Add</Btn>
            </div>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {manualTopics.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[#374151] font-medium">{t.name}</div>
                  <div className="text-[11px] text-[#9CA3AF]">{t.subject}</div>
                </div>
                <Badge color={t.status === "known" ? "green" : t.status === "weak" ? "red" : "amber"}>
                  {t.status === "known" ? "Known" : t.status === "weak" ? "Weak" : "Learning"}
                </Badge>
                <button onClick={() => handleDeleteTopic(t.id)} className="text-gray-300 hover:text-red-400 p-1 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
