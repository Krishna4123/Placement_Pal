import React, { useState } from "react";
import { Bot, X, Mic, Send } from "lucide-react";
import { useSession } from "../../context/SessionContext";

import { vaultApi } from "../../api/vault";

export const ChatPanel = ({ onClose }: { onClose: () => void }) => {
  const { profile } = useSession();
  const firstName = profile.name.split(" ")[0] || "Student";

  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: `Hi ${firstName}! 👋 I'm your PlacementPal AI. I've analyzed your current prep status and today's schedule. How can I help you prepare for ${profile.targetCompany}?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const suggestions = [
    "What should I study today?",
    "Explain Deadlock in OS",
    "Show my weak topics",
    "Generate tomorrow's schedule",
  ];

  const responses: Record<string, string> = {
    "What should I study today?": `Based on your ${profile.daysRemaining}-day ${profile.targetCompany} prep plan, today focus on:\n\n1. Binary Trees — LeetCode #102, 104, 107 (2h)\n2. OS Process Scheduling — FCFS, SJF, Round Robin (1.5h)\n3. Mock Interview — System Design fundamentals (2h)\n\nYou're on track. Stay focused! 🎯`,
    "Explain Deadlock in OS": `A Deadlock is a situation where processes are permanently blocked, each waiting for a resource held by the other.\n\nFour Necessary Conditions:\n• Mutual Exclusion\n• Hold & Wait\n• No Preemption\n• Circular Wait\n\nPrevention: Break any one condition.\nDetection: Use Resource Allocation Graph.\n\nThis is a high-priority topic for ${profile.targetCompany} — review your OS notes! 📚`,
    "Show my weak topics": `Based on your Knowledge Vault analysis, your weak topics are:\n\n🔴 High Priority:\n• OS Process Scheduling\n• Computer Networks — TCP/IP\n• System Design\n\n🟡 Medium Priority:\n• DBMS Transactions\n• DP on Trees (LeetCode)\n\nShall I create a focused revision plan for these?`,
    "Generate tomorrow's schedule": `Optimized schedule for tomorrow:\n\n⏰ 9:00 AM — Linked List problems (LeetCode #206, 141) · 2h\n⏰ 11:30 AM — DBMS Normalization revision · 1.5h\n⏰ 2:00 PM — Aptitude: Time & Work sets · 45m\n⏰ 3:00 PM — CN: OSI Model deep dive · 1h\n\nTotal: ~5.25 hours. Want me to adjust for your availability?`,
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setTyping(true);

    let reply = "";
    try {
      const res = await vaultApi.queryVault({ query: text, n_results: 3 });
      if (res && res.data && res.data.results && res.data.results.length > 0) {
        reply = res.data.results[0].document;
      }
    } catch (err) {
      console.warn("Vault query in chat panel used local fallback response", err);
    }

    if (!reply) {
      reply =
        responses[text] ||
        `That's a great question! Based on your current preparation status for ${profile.targetCompany}, I recommend focusing on your core weak areas first (OS & System Design). Would you like a custom daily plan for those?`;
    }

    setTyping(false);
    setMessages((m) => [...m, { role: "assistant", content: reply }]);
  };

  return (
    <div className="fixed bottom-0 right-0 top-0 w-80 bg-white border-l border-gray-100 flex flex-col z-50 shadow-2xl shadow-black/10">
      {/* Header */}
      <div className="h-14 flex items-center gap-3 px-4 border-b border-gray-100 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-[#111827]">PlacementPal AI</div>
          <div className="text-[10px] text-green-500 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Online
          </div>
        </div>
        <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <X className="w-4 h-4 text-[#6B7280]" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3 h-3 text-white" />
              </div>
            )}
            <div
              className={`max-w-[82%] px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                msg.role === "user"
                  ? "bg-[#2563EB] text-white rounded-2xl rounded-tr-sm"
                  : "bg-gray-100 text-[#374151] rounded-2xl rounded-tl-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center shrink-0">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 160}ms` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="px-3 pb-2">
          <div className="text-[10px] text-[#9CA3AF] mb-1.5 font-semibold tracking-wide">SUGGESTIONS</div>
          <div className="space-y-1">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="w-full text-left text-xs text-[#374151] bg-gray-50 hover:bg-blue-50 hover:text-[#2563EB] px-3 py-2 rounded-xl border border-gray-100 hover:border-blue-100 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-gray-100 shrink-0">
        <div className="flex gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-50 transition-all">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Ask anything..."
            className="flex-1 text-sm bg-transparent outline-none text-[#374151] placeholder:text-gray-400"
          />
          <button className="text-gray-400 hover:text-[#2563EB] transition-colors">
            <Mic className="w-4 h-4" />
          </button>
          <button onClick={() => sendMessage(input)} className="text-[#2563EB] hover:text-[#1d4ed8] transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
