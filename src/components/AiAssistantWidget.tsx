import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, SendHorizonal, Loader2, Bot } from "lucide-react";
import { useAthlete } from "../contexts/AthleteContext";
import { askAthleteAssistant, type AiChatMessage } from "../lib/athleteAi";

/**
 * Floating AI assistant. Bottom-right on every dashboard page, answering
 * questions about the athlete's own data, insights and next best actions.
 */
export function AiAssistantWidget() {
  const { athlete, firstName, fanAppName } = useAthlete();
  const athleteId = athlete?.id ?? null;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, asking, open]);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || !athleteId || asking) return;
    const history = messages;
    setMessages([...history, { role: "user", content: clean }]);
    setQuestion("");
    setAsking(true);
    try {
      const answer = await askAthleteAssistant(athleteId, clean, history);
      setMessages((prev) => [...prev, { role: "assistant", content: answer || "No answer came back." }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: err instanceof Error ? err.message : "The assistant could not answer." },
      ]);
    } finally {
      setAsking(false);
    }
  }

  const prompts = [
    "Which platform is growing fastest?",
    "What should I post this week?",
    "Summarize my audience data",
  ];

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open ? (
        <div className="flex h-[min(520px,75dvh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-dt-border bg-dt-card shadow-2xl shadow-black/70">
          <div className="flex items-center justify-between gap-2 border-b border-dt-border px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-dt-red/15 text-dt-red">
                <Bot size={16} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{fanAppName} assistant</p>
                <p className="truncate text-[11px] text-white/45">Insights, data and suggestions</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close assistant"
              onClick={() => setOpen(false)}
              className="rounded-md p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div ref={threadRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
            {messages.length === 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-white/50">
                  Hey {firstName} — ask me anything about your platforms, fans or content.
                </p>
                {prompts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => void send(p)}
                    disabled={!athleteId}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-left text-xs text-white/75 transition hover:border-dt-red/40 hover:text-white disabled:opacity-50"
                  >
                    {p}
                  </button>
                ))}
              </div>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={`whitespace-pre-wrap rounded-xl px-3 py-2 text-xs ${
                    m.role === "user"
                      ? "ml-6 bg-dt-red text-dt-bg"
                      : "mr-6 border border-white/10 bg-black/30 text-white/85"
                  }`}
                >
                  {m.content}
                </div>
              ))
            )}
            {asking ? (
              <p className="mr-6 flex items-center gap-1.5 text-xs text-white/45">
                <Loader2 size={12} className="animate-spin" /> Thinking…
              </p>
            ) : null}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(question);
            }}
            className="flex items-center gap-2 border-t border-dt-border px-3 py-3"
          >
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={!athleteId}
              placeholder="Ask about your data…"
              className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-xs text-white outline-none placeholder:text-white/30 focus:border-dt-red/50"
            />
            <button
              type="submit"
              disabled={!athleteId || asking || !question.trim()}
              aria-label="Send message"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-dt-red text-dt-bg transition hover:opacity-90 disabled:opacity-40"
            >
              <SendHorizonal size={14} />
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-dt-red text-dt-bg shadow-lg shadow-black/50 transition hover:brightness-110"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>
    </div>
  );
}
