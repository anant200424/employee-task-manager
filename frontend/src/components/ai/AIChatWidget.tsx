"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Bot,
  Send,
  X,
  Minimize2,
  Maximize2,
  Trash2,
  Copy,
  Check,
  Loader2,
  Zap,
  Crown,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import toast from "react-hot-toast";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

const ADMIN_SUGGESTED_PROMPTS = [
  { label: "🔮 Predict delays & sprint", prompt: "Predict task delays, sprint completion timeline, and delay risks" },
  { label: "📊 Company overview", prompt: "Give me an executive summary of our sprint health and velocity" },
  { label: "🚨 Overdue & blockers", prompt: "Show all overdue, critical, and high priority blockers" },
  { label: "👥 Department workload", prompt: "Show verified team members and department workload breakdown" },
  { label: "📢 Draft broadcast", prompt: "Draft a company-wide sprint update announcement" },
];

const EMPLOYEE_SUGGESTED_PROMPTS = [
  { label: "📋 My pending tasks", prompt: "What tasks are assigned to me?" },
  { label: "⏳ My upcoming deadlines", prompt: "Show my upcoming deadlines and personal delay risk" },
  { label: "🎯 Suggest next priority", prompt: "What task should I work on next based on my priorities?" },
  { label: "👤 My profile & department", prompt: "Show my department and personal workspace information" },
  { label: "📝 Draft task update", prompt: "Draft a concise progress update for my team lead" },
];

export const AIChatWidget: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isAdmin = user?.role?.toLowerCase() === "admin";
  const activeSuggestedPrompts = isAdmin ? ADMIN_SUGGESTED_PROMPTS : EMPLOYEE_SUGGESTED_PROMPTS;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-msg",
      sender: "ai",
      text: `Hello! 👋 I'm your **EmpSphere AI Assistant**.\n\nI have live access to your workspace tasks and deadlines. Ask me anything about your workload, sprint status, or team deliverables!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  // Dynamically tailor initial welcome message to Admin vs Employee
  useEffect(() => {
    if (user) {
      setMessages([
        {
          id: "welcome-msg",
          sender: "ai",
          text: isAdmin
            ? `Hello **${user.firstName}**! 🛡️ I am your **EmpSphere Executive AI Copilot**.\n\nI have full, live access to your company database, employee directory, task pipelines, and **predictive forecasting models**.\n\nAsk me to predict task delays, sprint completion velocity, department workloads, or draft executive broadcasts!`
            : `Hello **${user.firstName}**! 👋 I am your **EmpSphere Personal AI Assistant**.\n\nI am connected to your personal workspace with strict data privacy. Ask me about your assigned deliverables, upcoming deadlines, or next priority actions!`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [user?.role, user?.firstName, isAdmin]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  // Listen for custom trigger event from dashboard or workspace hub
  useEffect(() => {
    const handleOpenAI = (e: CustomEvent<{ prompt?: string }>) => {
      setIsOpen(true);
      if (e.detail?.prompt) {
        handleSendMessage(e.detail.prompt);
      }
    };
    window.addEventListener("open-ai-chat" as any, handleOpenAI);
    return () => window.removeEventListener("open-ai-chat" as any, handleOpenAI);
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputPrompt("");
    setLoading(true);

    try {
      const res = await api.post("/ai/chat", {
        prompt: query,
      });

      const aiText = res.data?.data?.response || "I have analyzed your workspace context.";

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error("AI Chat Error:", err);
      const errMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: "ai",
        text: `⚠️ **Unable to process query right now.** Please check your connection or try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "ai",
        text: isAdmin
          ? `Chat cleared. Ready for your next executive workspace query or delay forecast! 🚀`
          : `Chat cleared. Ready for your next personal task question! 🚀`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  // Markdown parser supporting headers, tables, lists, blockquotes, code
  const renderFormattedMessage = (content: string) => {
    const rawLines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < rawLines.length) {
      const line = rawLines[i];

      // Table block detection: consecutive lines starting and ending with '|'
      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        const tableLines: string[] = [];
        while (i < rawLines.length && rawLines[i].trim().startsWith("|") && rawLines[i].trim().endsWith("|")) {
          tableLines.push(rawLines[i].trim());
          i++;
        }

        if (tableLines.length >= 2) {
          const parseRow = (rowStr: string) =>
            rowStr
              .slice(1, -1)
              .split("|")
              .map((c) => c.trim());

          const headers = parseRow(tableLines[0]);
          const dataRows = tableLines.slice(1).filter((r) => !r.includes("---"));

          elements.push(
            <div key={`table-${i}`} className="my-2.5 overflow-x-auto rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 shadow-2xs">
              <table className="w-full text-left text-[12px] border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 dark:bg-slate-700/60 border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                    {headers.map((h, hIdx) => (
                      <th key={hIdx} className="px-3 py-2 font-black uppercase tracking-wider text-[11px]">
                        {formatInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {dataRows.map((rowStr, rIdx) => {
                    const cells = parseRow(rowStr);
                    return (
                      <tr key={rIdx} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                        {cells.map((c, cIdx) => (
                          <td key={cIdx} className="px-3 py-2 font-medium text-slate-700 dark:text-slate-300">
                            {formatInline(c)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // Headers (H4 / H3)
      if (line.startsWith("#### ")) {
        elements.push(
          <h5 key={i} className="text-[13px] font-black text-slate-800 dark:text-slate-200 mt-2 mb-0.5">
            {line.replace("#### ", "")}
          </h5>
        );
      } else if (line.startsWith("### ")) {
        elements.push(
          <h4 key={i} className="text-[14px] font-black text-indigo-600 dark:text-indigo-400 mt-2.5 mb-1 flex items-center gap-1.5">
            {line.replace("### ", "")}
          </h4>
        );
      } else if (line.startsWith("## ")) {
        elements.push(
          <h3 key={i} className="text-[15px] font-black text-slate-900 dark:text-white mt-3 mb-1">
            {line.replace("## ", "")}
          </h3>
        );
      } else if (line.startsWith("> ")) {
        elements.push(
          <blockquote
            key={i}
            className="border-l-3 border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 px-3 py-2 rounded-r-xl text-slate-700 dark:text-slate-300 font-medium my-1.5 text-[12.5px]"
          >
            {formatInline(line.replace("> ", ""))}
          </blockquote>
        );
      } else if (line.startsWith("* ") || line.startsWith("- ")) {
        elements.push(
          <div key={i} className="flex items-start gap-2 pl-1 my-0.5">
            <span className="text-indigo-500 font-bold shrink-0 mt-0.5">•</span>
            <span className="flex-1">{formatInline(line.substring(2))}</span>
          </div>
        );
      } else if (line.trim() === "---") {
        elements.push(<hr key={i} className="border-slate-200 dark:border-slate-800 my-2" />);
      } else if (!line.trim()) {
        elements.push(<div key={i} className="h-1" />);
      } else {
        elements.push(<p key={i} className="my-0.5">{formatInline(line)}</p>);
      }

      i++;
    }

    return <div className="space-y-1 text-[13px] leading-relaxed">{elements}</div>;
  };

  const formatInline = (text: string) => {
    // Replace **bold**
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-extrabold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-[#5B5FEF] dark:text-indigo-300 font-mono text-[11.5px] font-bold border border-indigo-200/60 dark:border-indigo-900/50">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* =========================================================================
          1. FLOATING AI LAUNCHER BUTTON (Bottom-Right Floating AI Logo)
         ========================================================================= */}
      <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 select-none">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 h-11 px-3.5 rounded-full bg-gradient-to-r from-[#5B5FEF] via-[#7C3AED] to-[#EC4899] text-white shadow-lg hover:shadow-2xl hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer ring-3 ring-indigo-500/25"
            title="Ask EmpSphere AI Copilot"
          >
            {/* Pulsing Aura Indicator */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500 border-2 border-white dark:border-slate-900" />
            </span>

            {/* AI Icon with Rotating Sparkles */}
            <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner group-hover:rotate-12 transition-transform duration-300">
              <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
            </div>

            <div className="flex items-center gap-1.5 pr-0.5">
              <span className="text-[12.5px] font-black tracking-tight leading-none">
                AI Copilot
              </span>
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8.5px] font-black bg-white/20 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
          </button>
        )}
      </div>

      {/* =========================================================================
          2. FLOATING AI CHAT WINDOW
         ========================================================================= */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 transition-all duration-300 overflow-hidden backdrop-blur-xl ${
            isExpanded
              ? "w-[94vw] sm:w-[680px] h-[86vh] max-h-[850px]"
              : "w-[94vw] sm:w-[420px] md:w-[450px] h-[580px] max-h-[82vh]"
          }`}
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-[#5B5FEF] via-[#6366F1] to-[#7C3AED] text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
                {isAdmin ? <Crown className="w-5 h-5 text-amber-200" /> : <Bot className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[14px] sm:text-[14.5px] font-black tracking-tight">
                    {isAdmin ? "EmpSphere Executive Copilot" : "EmpSphere Workspace Copilot"}
                  </h3>
                  <span
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      isAdmin
                        ? "bg-amber-500/30 text-amber-200 border border-amber-400/40"
                        : "bg-emerald-500/30 text-emerald-200 border border-emerald-400/40"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                        isAdmin ? "bg-amber-400" : "bg-emerald-400"
                      }`}
                    />
                    {isAdmin ? "Admin Full Access" : "Personal Scope"}
                  </span>
                </div>
                <p className="text-[11px] text-indigo-100 font-medium">
                  {isAdmin
                    ? "Company-Wide Scope • Predictive Delay & Sprint Forecasting"
                    : "Personal Assigned Work • Strict Enterprise Data Privacy"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-white/80">
              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-lg hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
                title="Clear chat history"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg hover:bg-white/20 hover:text-white transition-colors cursor-pointer hidden sm:block"
                title={isExpanded ? "Collapse window" : "Expand window"}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
                title="Close AI assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Suggested Quick Prompts */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
            {activeSuggestedPrompts.map((item, idx) => (
              <button
                key={idx}
                disabled={loading}
                onClick={() => handleSendMessage(item.prompt)}
                className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-[#5B5FEF] dark:hover:text-indigo-400 border border-slate-200/80 dark:border-slate-700 text-[11px] font-bold whitespace-nowrap transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50 dark:bg-[#0B0F17]/50">
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Sender Avatar */}
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-2xs font-bold text-[11px] ${
                      isUser
                        ? "bg-[#5B5FEF] text-white"
                        : "bg-gradient-to-tr from-indigo-600 to-purple-600 text-white"
                    }`}
                  >
                    {isUser ? (
                      user?.firstName?.[0] || "U"
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`max-w-[85%] space-y-1 ${isUser ? "items-end" : "items-start"}`}>
                    <div
                      className={`p-3.5 rounded-2xl relative group shadow-sm transition-all ${
                        isUser
                          ? "bg-[#5B5FEF] text-white rounded-tr-xs"
                          : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-xs"
                      }`}
                    >
                      {isUser ? (
                        <p className="text-[13px] font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      ) : (
                        renderFormattedMessage(msg.text)
                      )}

                      {/* Copy Message Action Button */}
                      {!isUser && (
                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="absolute -bottom-2.5 right-2 p-1 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-2xs text-slate-400 hover:text-slate-700 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>

                    <div
                      className={`flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold px-1 ${
                        isUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                      {!isUser && <span>• EmpSphere AI</span>}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Loader Indicator */}
            {loading && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-xs shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#5B5FEF]" />
                  <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400">
                    EmpSphere AI is analyzing workspace...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Ask AI about tasks, workload, team, or drafts..."
                className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 text-[13px] font-medium border border-transparent focus:border-[#5B5FEF] focus:bg-white dark:focus:bg-slate-950 focus:outline-none transition-all shadow-inner"
              />

              <button
                type="submit"
                disabled={!inputPrompt.trim() || loading}
                className="p-2.5 rounded-2xl bg-[#5B5FEF] hover:bg-[#4E52E2] disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
                title="Send query"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold px-2 pt-1.5">
              <span>Press <kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-600 dark:text-slate-300">Enter</kbd> to send</span>
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" /> 100% Free LLM Engine
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
