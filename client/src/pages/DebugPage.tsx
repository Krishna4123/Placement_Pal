import React, { useState } from "react";
import {
  Terminal, Play, Clock, CheckCircle2, AlertCircle, Copy, Check, Search, Globe, FileText, Database, Brain, Calendar
} from "lucide-react";
import { GlassCard, Badge, Btn } from "../components/common/UIElements";
import { debugApi } from "../api/debug";

export const DebugPage: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<string>("company_intel");
  const [companyName, setCompanyName] = useState<string>("SurveySparrow");
  const [userMessage, setUserMessage] = useState<string>("SurveySparrow is hiring SDEs for React, Node, and PostgreSQL. Process: Online Test -> Tech Interview -> HR");
  const [targetRoles, setTargetRoles] = useState<string>("Software Engineer, Product Engineer");
  const [durationDays, setDurationDays] = useState<number>(14);
  const [topics, setTopics] = useState<string>("Arrays, Dynamic Programming, System Design");

  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<any | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const nodes = [
    { id: "company_intel", label: "Company Intel (Tavily)", icon: Search, desc: "Runs Tavily Web Search + LLM Company Summary" },
    { id: "tavily_raw", label: "Raw Tavily Search", icon: Globe, desc: "Returns raw Tavily API search payload without LLM processing" },
    { id: "interpret_message", label: "Message Extraction", icon: FileText, desc: "Runs LLM Extraction Chain on notification text" },
    { id: "knowledge_vault", label: "Knowledge Vault (Chroma)", icon: Database, desc: "Runs semantic vector search against ChromaDB" },
    { id: "generate_recall", label: "Recall Generator", icon: Brain, desc: "Runs Recall LLM Chain to generate questions" },
    { id: "curriculum_plan", label: "Curriculum Planner", icon: Calendar, desc: "Runs Curriculum LLM Chain to generate 14-day study plan" },
  ];

  const handleRunTest = async () => {
    setLoading(true);
    setResponse(null);
    try {
      const res = await debugApi.testNode({
        node_name: selectedNode,
        company_name: companyName,
        user_message: userMessage,
        target_roles: targetRoles.split(",").map((s) => s.trim()).filter(Boolean),
        duration_days: Number(durationDays),
        topics: topics.split(",").map((s) => s.trim()).filter(Boolean),
      });
      setResponse(res);
    } catch (err: any) {
      setResponse({
        success: false,
        error: err.response?.data?.message || err.message || "Failed to execute debug node",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!response) return;
    navigator.clipboard.writeText(JSON.stringify(response, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto pb-10 space-y-6">
      {/* Header */}
      <GlassCard className="p-6 bg-gradient-to-r from-gray-900 via-slate-800 to-slate-900 text-white border-none shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
            <Terminal className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Node Sandbox & Debugger</h1>
            <p className="text-xs text-gray-400">Test individual LangGraph backend nodes in isolation without running full pipelines</p>
          </div>
        </div>
      </GlassCard>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Node Select & Controls */}
        <div className="lg:col-span-5 space-y-5">
          {/* Node Selector */}
          <GlassCard className="p-5 space-y-3">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">
              1. Select Node to Test
            </label>
            <div className="space-y-2">
              {nodes.map((n) => {
                const Icon = n.icon;
                const isSelected = selectedNode === n.id;
                return (
                  <button
                    key={n.id}
                    onClick={() => setSelectedNode(n.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-50/80 border-blue-300 ring-2 ring-blue-100"
                        : "bg-white border-gray-100 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? "text-blue-600" : "text-gray-400"}`} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-bold ${isSelected ? "text-blue-900" : "text-gray-800"}`}>
                        {n.label}
                      </div>
                      <div className="text-[11px] text-gray-500 leading-tight mt-0.5">{n.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {/* Test Input Parameters */}
          <GlassCard className="p-5 space-y-4">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">
              2. Test Inputs
            </label>

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Notification / User Message</label>
              <textarea
                rows={3}
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Target Roles</label>
                <input
                  type="text"
                  value={targetRoles}
                  onChange={(e) => setTargetRoles(e.target.value)}
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Prep Days</label>
                <input
                  type="number"
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Topics / Skill Gaps (comma separated)</label>
              <input
                type="text"
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <Btn
              variant="gradient"
              onClick={handleRunTest}
              disabled={loading}
              className="w-full py-2.5 shadow-md shadow-blue-100"
            >
              <Play className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Executing Node..." : "Test Node Execution"}
            </Btn>
          </GlassCard>
        </div>

        {/* JSON Result Viewer */}
        <div className="lg:col-span-7">
          <GlassCard className="p-5 h-full flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Node Output</span>
                {response && (
                  <Badge color={response.success ? "green" : "red"}>
                    {response.success ? "SUCCESS" : "ERROR"}
                  </Badge>
                )}
                {response?.data?.execution_time_ms && (
                  <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-500" />
                    {response.data.execution_time_ms} ms
                  </span>
                )}
              </div>

              {response && (
                <button
                  onClick={copyToClipboard}
                  className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy JSON"}
                </button>
              )}
            </div>

            <div className="flex-1 bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-auto max-h-[600px] border border-slate-800 shadow-inner">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20 gap-3">
                  <Play className="w-6 h-6 text-blue-400 animate-spin" />
                  <span>Executing node '{selectedNode}'...</span>
                </div>
              ) : response ? (
                <pre className="whitespace-pre-wrap break-words leading-relaxed">
                  {JSON.stringify(response, null, 2)}
                </pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 py-20 gap-2">
                  <Terminal className="w-8 h-8 text-slate-600" />
                  <span>Select a node and click 'Test Node Execution' to view JSON response</span>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
