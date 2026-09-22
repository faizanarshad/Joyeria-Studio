"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { buildWhatsAppLink } from "@/lib/whatsapp";

type ChatMessage = { role: "user" | "assistant"; content: string };

const GREETING: ChatMessage = {
  role: "assistant",
  content: "Hi! I'm the Joyería Studio assistant. Ask me about products, prices, delivery or how to order.",
};

export default function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [fallback, setFallback] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  // Keep the assistant off the admin dashboard — it's a storefront helper, not a backoffice tool.
  if (pathname?.startsWith("/admin")) return null;

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const nextMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    setFallback(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.slice(-10) }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFallback(data.error ?? "Something went wrong.");
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setFallback("Network error — please check your connection or message us on WhatsApp.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 flex h-[28rem] w-80 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xl sm:w-96">
          <div className="flex items-center justify-between bg-green px-4 py-3 text-white">
            <span className="text-sm font-medium">Joyería Studio Assistant</span>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="text-white/80 hover:text-white">
              ✕
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "ml-auto bg-rose text-white"
                    : "bg-rose-soft text-foreground"
                }`}
              >
                {m.content}
              </div>
            ))}
            {sending && <div className="max-w-[85%] rounded-2xl bg-rose-soft px-3 py-2 text-sm text-muted">Typing…</div>}
            {fallback && (
              <div className="rounded-2xl bg-zinc-100 px-3 py-2 text-sm text-foreground">
                {fallback}{" "}
                <a
                  href={buildWhatsAppLink("Hi! I have a question.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-green-dark underline"
                >
                  Chat on WhatsApp
                </a>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="flex gap-2 border-t border-border p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 rounded-full border border-border px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="rounded-full bg-rose px-4 py-2 text-sm text-white hover:bg-rose-dark disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open chat"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-green text-white shadow-lg hover:bg-green-dark"
      >
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}
