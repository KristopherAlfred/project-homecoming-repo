import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, RefreshCw, SendHorizonal, TrendingUp, AlertTriangle, Lightbulb, Film } from "lucide-react";
import { useAthlete } from "../contexts/AthleteContext";
import {
  askAthleteAssistant,
  fetchAthleteInsights,
  generateAthleteInsights,
  type AiChatMessage,
  type AthleteAiInsight,
} from "../lib/athleteAi";

const TYPE_META: Record<string, { label: string; Icon: typeof TrendingUp; tone: string }> = {
  trend: { label: "Trend", Icon: TrendingUp, tone: "text-dt-red" },
  opportunity: { label: "Opportunity", Icon: Lightbulb, tone: "text-amber-300" },
  risk: { label: "Watch out", Icon: AlertTriangle, tone: "text-dt-red" },
  content: { label: "Content", Icon: Film, tone: "text-sky-300" },
};

function typeMeta(type: string) {
  return TYPE_META[type] ?? { label: "Insight", Icon: Sparkles, tone: "text-dt-red" };
}

export function AiInsightsPanel() {
  const { athlete, firstName, loading: athleteLoading } = useAthlete();
  const athleteId = athlete?.id ?? null;

  const [insights, setInsights] = useState<AthleteAiInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!athleteId) {
      setInsights([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setInsights(await fetchAthleteInsights(athleteId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load insights");
    } finally {
      setLoading(false);
    }
  }, [athleteId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, asking]);

  async function generate() {
    if (!athleteId || generating) return;
    setGenerating(true);
    setError(null);
    try {
      const fresh = await generateAthleteInsights(athleteId);
      if (fresh.length) setInsights((prev) => [...fresh, ...prev].slice(0, 6));
      else await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate insights");
    } finally {
      setGenerating(false);
    }
  }

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    const text = question.trim();
    if (!text || !athleteId || asking) return;
    const history = messages;
    setMessages([...history, { role: "user", content: text }]);
    setQuestion("");
    setAsking(true);
    try {
      const answer = await askAthleteAssistant(athleteId, text, history);
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

  const disabled = !athleteId || athleteLoading;

  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-dt-border bg-dt-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Sparkles size={16} className="text-dt-red" />
            AI insights
          </h3>
          <p className="text-xs text-white/45">
            Reads {firstName}’s connected platforms, follower history and post performance.
          </p>
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={disabled || generating}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dt-red/40 bg-dt-red/10 px-3 py-1.5 text-xs font-semibold text-dt-red transition hover:bg-dt-red/20 disabled:opacity-50"
        >
          <RefreshCw size={13} className={generating ? "animate-spin" : ""} />
          {generating ? "Analyzing…" : "Generate"}
        </button>
      </div>

      {error ? (
        <p className="rounded-lg border border-dt-red/30 bg-dt-red/10 px-3 py-2 text-xs text-dt-red">{error}</p>
      ) : null}

      <div className="space-y-2">
        {loading ? (
          <p className="text-xs text-white/40">Loading insights…</p>
        ) : insights.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-xs text-white/45">
            No insights yet. Hit Generate and AI will read your latest platform data.
          </p>
        ) : (
          insights.map((insight) => {
            const { label, Icon, tone } = typeMeta(insight.insight_type);
            return (
              <div key={insight.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                <p className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide ${tone}`}>
                  <Icon size={12} />
                  {label}
                </p>
                <p className="mt-1 text-sm text-white/90">{insight.summary}</p>
                {insight.recommendation ? (
                  <p className="mt-1.5 text-xs text-white/55">→ {insight.recommendation}</p>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      <div className="mt-auto space-y-2 border-t border-white/10 pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">Ask the assistant</p>
        {messages.length ? (
          <div ref={threadRef} className="max-h-52 space-y-2 overflow-y-auto pr-1">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-xl px-3 py-2 text-xs ${
                  m.role === "user"
                    ? "ml-6 bg-dt-red/15 text-white"
                    : "mr-6 border border-white/10 bg-black/30 text-white/80"
                }`}
              >
                {m.content}
              </div>
            ))}
            {asking ? <p className="mr-6 text-xs text-white/40">Thinking…</p> : null}
          </div>
        ) : (
          <p className="text-xs text-white/40">
            e.g. “Which platform is growing fastest?” or “What should I post this week?”
          </p>
        )}
        <form onSubmit={ask} className="flex items-center gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={disabled}
            placeholder="Ask about your audience or content…"
            className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-xs text-white outline-none placeholder:text-white/30 focus:border-dt-red/50"
          />
          <button
            type="submit"
            disabled={disabled || asking || !question.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-dt-red px-3 py-2 text-xs font-semibold text-dt-bg transition hover:opacity-90 disabled:opacity-40"
          >
            <SendHorizonal size={13} />
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}
