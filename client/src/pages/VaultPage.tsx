import React, { useState, useEffect } from "react";
import {
  FileText, Hash, Folder, Sparkles, Search, RefreshCw, Send, Bot,
  Upload, Eye, X, Plus
} from "lucide-react";
import { GlassCard, Badge, Btn } from "../components/common/UIElements";
import { vaultApi } from "../api/vault";

interface FileItem {
  id: string;
  name: string;
  size: string;
  sizeBytes: number;
  type: string;
  date: string;
  topics: number;
  color: string;
}

interface TopicItem {
  id: string;
  name: string;
  subject: string;
  status: string;
}

interface SearchResult {
  text: string;
  sources: string[];
}

export const VaultPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicSubject, setNewTopicSubject] = useState("OS");

  const [files, setFiles] = useState<FileItem[]>([]);
  const [manualTopics, setManualTopics] = useState<TopicItem[]>([]);

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
            sizeBytes: f.size_bytes || 0,
            size: f.size_bytes ? (f.size_bytes / (1024 * 1024)).toFixed(2) + " MB" : "0.00 MB",
            type: f.suffix?.toUpperCase().replace(".", "") || "FILE",
            date: f.uploaded_at ? new Date(f.uploaded_at).toLocaleDateString() : "Recently",
            topics: f.chunks_ingested || 0,
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

  const totalStorageMB = (
    files.reduce((acc, f) => acc + (f.sizeBytes || 0), 0) / (1024 * 1024)
  ).toFixed(2);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await vaultApi.queryVault({
        query: searchQuery,
        n_results: 5,
      });

      if (res && res.data && res.data.results && res.data.results.length > 0) {
        const resultsList = res.data.results;
        const topResult = resultsList[0];
        const extractedSources = Array.from(
          new Set(
            resultsList
              .map((r: any) => r.metadata?.filename || r.metadata?.source)
              .filter(Boolean)
          )
        ) as string[];

        setSearchResult({
          text: topResult.content || topResult.document || "No document content returned.",
          sources: extractedSources.length > 0 ? extractedSources : ["Knowledge Vault Vectorstore"],
        });
      } else {
        setSearchResult({
          text: `No matching documents or notes found in your vault for "${searchQuery}". Upload relevant documents or add topics to expand your vault!`,
          sources: [],
        });
      }
    } catch (err) {
      console.error("Vault query error:", err);
      setSearchResult({
        text: `Unable to search vault at this time. Please make sure your server and vector database are running.`,
        sources: [],
      });
    } finally {
      setSearching(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      await vaultApi.uploadFile(file);
      await loadVaultData();
    } catch (err) {
      console.error("Vault upload error:", err);
    }
  };

  const handleDeleteFile = async (id: string) => {
    try {
      await vaultApi.deleteFile(id);
    } catch (err) {
      console.error("Failed to delete file from backend:", err);
    } finally {
      setFiles((prev) => prev.filter((f) => f.id !== id));
    }
  };

  const handleAddTopic = async () => {
    if (!newTopicName.trim()) return;
    try {
      await vaultApi.createTopic({
        name: newTopicName.trim(),
        category: newTopicSubject,
      });
      await loadVaultData();
    } catch (err) {
      console.error("Failed to create topic on backend:", err);
      setManualTopics((prev) => [
        ...prev,
        {
          id: "t_" + Date.now(),
          name: newTopicName.trim(),
          subject: newTopicSubject,
          status: "learning",
        },
      ]);
    } finally {
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
      {/* Dynamic Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Uploaded Files", value: files.length.toString(), icon: FileText, bg: "bg-blue-50", ic: "text-blue-600" },
          { label: "Topics & Notes", value: manualTopics.length.toString(), icon: Hash, bg: "bg-purple-50", ic: "text-purple-600" },
          { label: "Storage Used", value: `${totalStorageMB} MB`, icon: Folder, bg: "bg-green-50", ic: "text-green-600" },
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
              placeholder="Ask anything from your uploaded study materials & topics..."
              className="bg-transparent text-sm text-[#374151] outline-none flex-1 placeholder:text-gray-400 min-w-0"
            />
          </div>
          <Btn variant="gradient" onClick={handleSearch} disabled={searching}>
            {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Btn>
        </div>
        {searchResult && (
          <div className="bg-gradient-to-br from-blue-50 to-purple-50/60 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-4 h-4 text-[#2563EB]" />
              <span className="text-xs font-semibold text-[#2563EB]">Vault AI Semantic Answer</span>
            </div>
            <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-line">{searchResult.text}</p>
            {searchResult.sources.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-blue-100">
                <span className="text-xs text-[#9CA3AF]">Sources:</span>
                {searchResult.sources.map((src, idx) => (
                  <Badge key={idx} color={idx % 2 === 0 ? "blue" : "purple"}>
                    {src}
                  </Badge>
                ))}
              </div>
            )}
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
          {files.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#9CA3AF]">
              No files uploaded yet. Upload PDFs or text notes to index into ChromaDB.
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((f) => (
                <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <FileText className={`w-8 h-8 ${f.color} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#374151] truncate">{f.name}</div>
                    <div className="text-xs text-[#9CA3AF] mt-0.5">{f.size} · {f.topics} chunks indexed · {f.date}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteFile(f.id)}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all cursor-pointer"
                    title="Delete file"
                  >
                    <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
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
          {manualTopics.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#9CA3AF]">
              No manual topics added yet. Add topics you're studying to track them in MongoDB.
            </div>
          ) : (
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
          )}
        </GlassCard>
      </div>
    </div>
  );
};

