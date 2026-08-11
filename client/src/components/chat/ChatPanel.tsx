import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Bot, X, Mic, MicOff, Send, Sparkles } from "lucide-react";
import { useSession } from "../../context/SessionContext";
import { chatApi, ChatMessagePayload } from "../../api/chat";

const GLOBAL_SUGGESTIONS = [
  "What should I study today?",
  "How can I boost my resume ATS score?",
  "Explain interview rounds for my target company",
  "Quiz me on Dynamic Programming & OS",
  "Search my Knowledge Vault notes",
  "Summarize my master preparation plan",
];

// Formatting helper for Markdown-style bold, lists, and code blocks
const renderFormattedText = (text: string) => {
  const lines = text.split("\n");
  return lines.map((line, idx) => {
    // Format bold text **text**
    const parts = line.split(/(\*\*.*?\*\*)/g);
    const formattedLine = parts.map((part, pIdx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={pIdx} className="font-semibold text-[#111827]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });

    if (line.trim().startsWith("• ") || line.trim().startsWith("- ")) {
      return (
        <div key={idx} className="flex items-start gap-2 my-1 pl-1 text-slate-700">
          <span className="text-[#2563EB] font-bold select-none">•</span>
          <span className="flex-1">{formattedLine}</span>
        </div>
      );
    }

    return (
      <React.Fragment key={idx}>
        {formattedLine}
        {idx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

export const ChatPanel = ({ onClose }: { onClose: () => void }) => {
  const location = useLocation();
  const { profile, sessionId } = useSession();
  const firstName = profile.name.split(" ")[0] || "Student";

  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: `Hi ${firstName}! 👋 I'm your **PlacementPal AI Assistant**.\n\nI have full access to your prep plan, **${profile.targetCompany}** company intelligence, Resume ATS score, Knowledge Vault, and Daily Tasks.\n\nHow can I help you today?`,
    },
  ]);

  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing]);

  // Voice Input Speech Recognition Setup
  const toggleListening = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Voice input is not supported in your browser. Please try Chrome or Edge.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setInput(transcript);
      }
    };

    recognition.start();
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg = { role: "user" as const, content: text };
    const historyPayload: ChatMessagePayload[] = messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    try {
      const res = await chatApi.sendMessage({
        session_id: sessionId || "active_session",
        message: text,
        history: historyPayload,
        current_page: location.pathname,
      });

      if (res && res.data && res.data.reply) {
        setMessages((m) => [...m, { role: "assistant", content: res.data.reply }]);
      } else {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: `Based on your **${profile.targetCompany}** prep status: Keep working through your active day tasks!`,
          },
        ]);
      }
    } catch (err) {
      console.warn("Chat API call failed, using offline fallback response", err);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `Here is advice tailored for **${profile.targetCompany}** (${profile.targetRole}):\n\n• **Days Remaining:** ${profile.daysRemaining} days\n• **Focus Area:** Core CS Fundamentals (DSA, OS, System Design).\n\nFeel free to ask another technical or interview preparation question!`,
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="fixed bottom-0 right-0 top-0 w-full sm:w-[420px] md:w-[460px] bg-white border-l border-gray-100 flex flex-col z-50 shadow-2xl shadow-black/15 transition-all">
      {/* Header with generous breathing space */}
      <div className="h-16 px-5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center shrink-0 shadow-md shadow-blue-200/50">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#111827]">PlacementPal AI</h3>
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
            </div>
            <p className="text-xs text-[#6B7280]">
              {profile.targetCompany} · {profile.daysRemaining} days remaining
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages List with generous padding and line height */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#F8FAFC]">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div
              className={`max-w-[85%] px-4 py-3 text-xs md:text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#2563EB] text-white rounded-2xl rounded-tr-xs shadow-sm font-normal"
                  : "bg-white text-[#374151] border border-gray-100 rounded-2xl rounded-tl-xs shadow-sm"
              }`}
            >
              {msg.role === "user" ? msg.content : renderFormattedText(msg.content)}
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center shrink-0 shadow-sm">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-xs flex gap-1.5 items-center shadow-sm">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-[#2563EB] animate-bounce"
                  style={{ animationDelay: `${i * 160}ms` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Global Suggestions */}
      {messages.length <= 3 && (
        <div className="px-5 py-3 bg-white border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-[11px] text-[#9CA3AF] mb-2 font-bold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Suggested Questions</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {GLOBAL_SUGGESTIONS.slice(0, 4).map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="w-full text-left text-xs text-[#374151] bg-gray-50 hover:bg-blue-50 hover:text-[#2563EB] px-3.5 py-2.5 rounded-xl border border-gray-100 hover:border-blue-100 transition-all font-medium truncate"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form with spacious padding */}
      <div className="p-4 bg-white border-t border-gray-100 shrink-0">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Ask PlacementPal AI anything..."
            className="flex-1 text-xs md:text-sm bg-transparent outline-none text-[#374151] placeholder:text-gray-400"
          />
          <button
            type="button"
            onClick={toggleListening}
            title={isListening ? "Listening... Click to stop" : "Voice input"}
            className={`p-1.5 rounded-xl transition-colors ${
              isListening ? "text-red-500 animate-pulse bg-red-50" : "text-gray-400 hover:text-[#2563EB]"
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => sendMessage(input)}
            className="p-1.5 text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
