import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Bot, X, Mic, MicOff, Send, Sparkles, RotateCcw, ChevronRight } from "lucide-react";
import { useSession } from "../../context/SessionContext";
import { chatApi, ChatMessagePayload } from "../../api/chat";

const GLOBAL_SUGGESTIONS = [
  "What should I study today?",
  "How can I boost my resume ATS score?",
  "Explain interview process for my target company",
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
          <strong key={pIdx} className="font-semibold text-slate-900 bg-slate-100/70 px-1 py-0.5 rounded border border-slate-200/50">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });

    if (line.trim().startsWith("• ") || line.trim().startsWith("- ")) {
      return (
        <div key={idx} className="flex items-start gap-2.5 my-1.5 pl-0.5 text-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mt-2 shrink-0 select-none shadow-xs shadow-blue-400" />
          <span className="flex-1 leading-relaxed">{formattedLine}</span>
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

  const initialGreeting = `Hi ${firstName}! 👋 I'm your **PlacementPal AI Assistant**.\n\nI have full access to your prep plan, **${profile.targetCompany}** company intelligence, Resume ATS score, Knowledge Vault, and Daily Tasks.\n\nHow can I help you today?`;

  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: initialGreeting,
    },
  ]);

  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const handleAnimatedClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing]);

  // Click Outside Detection to Minimize AI Assistant Panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        handleAnimatedClose();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const resetChat = () => {
    setMessages([{ role: "assistant", content: initialGreeting }]);
    setInput("");
  };

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
    <div
      ref={panelRef}
      className={`fixed bottom-0 right-0 top-0 w-full sm:w-[440px] md:w-[480px] bg-white border-l border-slate-100 flex flex-col z-50 shadow-2xl shadow-slate-900/15 ${
        isClosing ? "animate-drawer-slide-out" : "animate-drawer-slide-in"
      }`}
    >
      {/* Top Gradient Accent Line */}
      <div className="h-1 bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#EC4899] shrink-0" />

      {/* Header with generous breathing space & quick actions */}
      <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white/95 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#2563EB] via-[#6366F1] to-[#7C3AED] flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">PlacementPal AI</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60 text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
              <span>{profile.targetCompany}</span>
              <span>·</span>
              <span className="text-[#2563EB] font-semibold">{profile.daysRemaining} Days Left</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={resetChat}
            title="Reset Chat"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleAnimatedClose}
            title="Minimize Assistant"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages List with rich card bubbles & breathing room */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#F8FAFC]">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div
              className={`max-w-[85%] px-4.5 py-3.5 text-xs sm:text-sm leading-relaxed transition-all ${
                msg.role === "user"
                  ? "bg-gradient-to-r from-[#2563EB] to-[#4F46E5] text-white shadow-md shadow-blue-500/15 rounded-2xl rounded-tr-xs font-medium"
                  : "bg-white text-slate-700 border border-slate-100 shadow-sm hover:shadow-md rounded-2xl rounded-tl-xs"
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
            <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-100 px-4 py-3 rounded-2xl rounded-tl-xs flex gap-1.5 items-center shadow-xs">
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

      {/* Global Interactive Prompt Suggestions */}
      {messages.length <= 3 && (
        <div className="px-5 py-3.5 bg-white border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-2.5 font-bold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Suggested Questions</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {GLOBAL_SUGGESTIONS.slice(0, 4).map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="w-full text-left text-xs text-slate-700 bg-slate-50/80 hover:bg-blue-50/60 border border-slate-100 hover:border-blue-200 hover:shadow-xs hover:text-[#2563EB] transition-all duration-200 cursor-pointer rounded-xl px-3.5 py-2.5 flex items-center justify-between font-medium group"
              >
                <span className="truncate">{s}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form with modern controls */}
      <div className="p-4 bg-white border-t border-slate-100 shrink-0">
        <div className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-2xl px-4 py-2.5 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 transition-all duration-200">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Ask PlacementPal AI anything..."
            className="flex-1 text-xs sm:text-sm bg-transparent outline-none text-slate-800 placeholder:text-slate-400 font-medium"
          />
          <button
            type="button"
            onClick={toggleListening}
            title={isListening ? "Listening... Click to stop" : "Voice input"}
            className={`p-2 rounded-xl transition-all ${
              isListening
                ? "bg-red-500 text-white shadow-md shadow-red-200 animate-pulse"
                : "text-slate-400 hover:text-[#2563EB] hover:bg-blue-50"
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => sendMessage(input)}
            className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:opacity-95 text-white p-2 rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
