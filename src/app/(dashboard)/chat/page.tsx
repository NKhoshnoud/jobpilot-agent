"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<string | null>(null);
  const [initDone, setInitDone] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "", reset: true }),
        });
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        setMessages(data.messages || []);
        setPhase(data.phase);
      } catch {
        // ignore
      } finally {
        setInitDone(true);
      }
    }
    init();
  }, [router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text?: string) {
    const userMsg = (text ?? input).trim();
    if (!userMsg || loading) return;

    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      const data = await res.json();
      setMessages(data.messages || []);
      setPhase(data.phase);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "خطا در ارتباط با ایجنت. دوباره تلاش کنید." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage();
  }

  const phaseLabel: Record<string, string> = {
    gathering_info: "آشنایی اولیه",
    matching: "پیشنهاد آگهی",
    refining: "بازخورد و بهبود",
    application: "مسیر درخواست",
    interview: "تمرین مصاحبه",
    final: "نتیجه نهایی",
  };

  const quickActions = [
    { label: "پیشنهاد آگهی", value: "پیشنهاد آگهی" },
    { label: "ساخت رزومه", value: "ساخت رزومه" },
    { label: "بهبود رزومه", value: "بهبود رزومه" },
    { label: "تمرین مصاحبه", value: "تمرین مصاحبه" },
    { label: "نتیجه نهایی", value: "نتیجه نهایی" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col" dir="rtl">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold text-slate-800 hover:text-blue-600 transition"
          >
            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
              JP
            </span>
            <span>JobPilot</span>
          </Link>
          <div className="flex items-center gap-3">
            {phase && (
              <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                {phaseLabel[phase] || phase}
              </span>
            )}
            <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-800 transition">
              داشبورد
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 overflow-y-auto">
        {!initDone ? (
          <div className="flex justify-center py-20">
            <div className="text-slate-400 text-sm">در حال آماده‌سازی ایجنت...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-7 whitespace-pre-wrap shadow-sm ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-bl-md"
                      : "bg-white border border-slate-200/80 text-slate-700 rounded-br-md"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-end">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-br-md px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5 items-center h-5">
                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </main>

      <footer className="bg-white/90 backdrop-blur-md border-t border-slate-200/80 sticky bottom-0">
        <div className="max-w-2xl mx-auto px-4 pt-3">
          <div className="flex flex-wrap gap-2 mb-3">
            {quickActions.map((action) => (
              <button
                key={action.value}
                type="button"
                onClick={() => sendMessage(action.value)}
                disabled={loading}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-200 transition disabled:opacity-50"
              >
                {action.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 pb-4">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="پیام خود را بنویسید..."
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm shadow-blue-200"
            >
              ارسال
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}
