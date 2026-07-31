import React, { useState, useRef, useEffect } from "react";
import { fetchApi } from "../lib/api";
import {
  Bot,
  X,
  Send,
  Sparkles,
  ShieldCheck,
  User,
  Trash2,
  HelpCircle,
} from "lucide-react";

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  langUrdu: boolean;
}

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  langUrdu,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-1",
      sender: "bot",
      text: langUrdu
        ? "السلام علیکم! میں پاک سٹیزن آن لائن سروس اسسٹنٹ ہوں۔ میں پاسپورٹ، ایف بی آر ٹیکس، نادرا قومی شناختی کارڈ اور دیگر سرکاری خدمات سے متعلق آپ کی رہنمائی کے لیے حاضر ہوں۔"
        : "Assalam-o-Alaikum! I am PakCitizen AI Assist, your virtual guide for Pakistan National Citizen Services. How can I assist you today with passport renewals, FBR Iris tax filings, CNIC verifications, or utility payments?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen) return null;

  const quickPrompts = [
    "What documents are needed for urgent passport renewal?",
    "How is income tax calculated on PKR 2.4M salary?",
    "What is Active Taxpayer List (ATL) status?",
    "How to book a biometric appointment at Islamabad Passport Office?",
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputPrompt;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: "usr-" + Date.now(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputPrompt("");
    setIsLoading(true);

    try {
      const data = await fetchApi<{ response?: string }>("/api/gemini/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: query }),
      });
      setIsLoading(false);

      const botMsg: ChatMessage = {
        id: "bot-" + Date.now(),
        sender: "bot",
        text: data.response || "I am here to assist with your national citizen service inquiry.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error("[AiAssistant Error Response]:", {
        message: err?.message,
        status: err?.status,
        responseData: err?.responseData,
        stack: err?.stack,
      });
      setIsLoading(false);
      const errorMsg: ChatMessage = {
        id: "err-" + Date.now(),
        sender: "bot",
        text: err?.message || "Requirements for official passport renewal: 1) Original CNIC/NICOP, 2) Current Passport copy, 3) Biometric verification receipt, 4) Fee paid via e-Khidmat gateway.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-zinc-900 border-l border-emerald-900/10 dark:border-emerald-500/20 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
      {/* Drawer Header */}
      <div className="p-4 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white flex items-center justify-between border-b border-emerald-800/40">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-700/80 border border-emerald-500/40 flex items-center justify-center">
            <Bot className="w-5 h-5 text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <span className="font-bold text-sm tracking-tight">PakCitizen AI Assist</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500 text-emerald-950">
                GEMINI AI
              </span>
            </div>
            <p className="text-[10px] text-emerald-200">Official Virtual Service Assistant</p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() =>
              setMessages([
                {
                  id: "msg-1",
                  sender: "bot",
                  text: "Chat cleared. Ask me any question about government citizen services.",
                  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },
              ])
            }
            className="p-1.5 rounded-lg hover:bg-white/10 text-emerald-200 transition"
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-emerald-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50 dark:bg-zinc-950/50 text-xs">
        {messages.map((msg) => {
          const isBot = msg.sender === "bot";
          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-2 ${isBot ? "" : "flex-row-reverse space-x-reverse"}`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isBot
                    ? "bg-emerald-800 text-emerald-100 dark:bg-emerald-600"
                    : "bg-zinc-800 text-zinc-100"
                }`}
              >
                {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[80%] p-3.5 rounded-2xl space-y-1 ${
                  isBot
                    ? "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 shadow-xs"
                    : "bg-emerald-800 text-white dark:bg-emerald-600 shadow-xs"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                <span
                  className={`block text-[9px] text-right ${
                    isBot ? "text-zinc-400" : "text-emerald-200"
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-semibold text-xs p-2">
            <Bot className="w-4 h-4 animate-spin" />
            <span>Consulting Official Service Knowledge Base...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick Suggestions */}
      <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center space-x-1">
          <Sparkles className="w-3 h-3 text-emerald-600" />
          <span>Quick Citizen Questions</span>
        </p>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp)}
              className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-[11px] font-medium text-emerald-900 dark:text-emerald-300 whitespace-nowrap hover:bg-emerald-100 transition shrink-0"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2 pt-1"
        >
          <input
            type="text"
            placeholder="Type your question about passport, tax, CNIC..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <button
            type="submit"
            disabled={isLoading || !inputPrompt.trim()}
            className="p-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-600 text-white transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
