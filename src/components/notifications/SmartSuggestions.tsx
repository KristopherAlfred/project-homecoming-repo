import { useEffect, useMemo, useState } from "react";
import { Loader2, Link2, Sparkles, Wand2 } from "lucide-react";
import { useAthlete } from "../../contexts/AthleteContext";
import { fetchAthleteInsights, type AthleteAiInsight } from "../../lib/athleteAi";

/**
 * Turns AI insights and bio-link milestones into one-tap notification drafts.
 * Purely a suggestion surface — nothing publishes until the athlete saves.
 */

export type NotificationSuggestion = {
  id: string;
  kind: "ai" | "milestone";
  label: string;
  message: string;
  detail?: string | null;
};

const MILESTONES = [100, 500, 1000, 5000, 10000, 50000];

function compactNumber(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K` : String(value);
}

/** Squeeze an insight recommendation into a punchy toast line. */
function toToastLine(insight: AthleteAiInsight, fanApp: string): string {
  const source = (insight.recommendation || insight.summary || "").trim();
  const firstSentence = source.split(/(?<=[.!?])\s+/)[0] ?? source;
  const trimmed = firstSentence.replace(/\s+/g, " ").replace(/[.]$/, "");
  const capped = trimmed.length > 90 ? `${trimmed.slice(0, 87).trimEnd()}…` : trimmed;
  return capped || `New drop inside ${fanApp} 🔥`;
}

function milestoneSuggestions(clicks: number, fanApp: string): NotificationSuggestion[] {
  const reached = MILESTONES.filter((m) => clicks >= m).pop();
  const next = MILESTONES.find((m) => clicks < m);
  const out: NotificationSuggestion[] = [];

  if (reached) {
    out.push({
      id: `milestone-reached-${reached}`,
      kind: "milestone",
      label: `${compactNumber(reached)} bio link taps`,
      message: `${compactNumber(reached)} fans tapped through to ${fanApp} — thank you! 🙌`,
      detail: `${clicks.toLocaleString()} total taps on your bio link`,
    });
  }
  if (next) {
    out.push({
      id: `milestone-next-${next}`,
      kind: "milestone",
      label: `Push to ${compactNumber(next)}`,
      message: `Only ${(next - clicks).toLocaleString()} taps to ${compactNumber(next)} — share ${fanApp} today 🚀`,
      detail: `${clicks.toLocaleString()} of ${next.toLocaleString()} taps`,
    });
  }
  return out;
}

export function SmartSuggestions({
  onUse,
}: {
  onUse: (suggestion: NotificationSuggestion) => void;
}) {
  const { athlete, bioLink, fanAppName } = useAthlete();
  const [insights, setInsights] = useState<AthleteAiInsight[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!athlete?.id) return;
    let alive = true;
    setLoading(true);
    void fetchAthleteInsights(athlete.id, 4)
      .then((rows) => alive && setInsights(rows))
      .catch(() => alive && setInsights([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [athlete?.id]);

  const suggestions = useMemo<NotificationSuggestion[]>(() => {
    const fromAi = insights.map((insight) => ({
      id: `ai-${insight.id}`,
      kind: "ai" as const,
      label: insight.insight_type.replace(/_/g, " "),
      message: toToastLine(insight, fanAppName),
      detail: insight.summary,
    }));
    return [...milestoneSuggestions(Number(bioLink?.click_count ?? 0), fanAppName), ...fromAi];
  }, [insights, bioLink?.click_count, fanAppName]);

  return (
    <section className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
      <div className="flex items-center justify-between gap-3 border-b border-dt-border px-4 py-3">
        <div>
          <h3 className="flex items-center gap-2 font-display text-sm font-semibold tracking-wide text-white">
            <Wand2 size={14} className="text-dt-red" /> Smart suggestions
          </h3>
          <p className="text-[11px] text-white/40">
            Built from your AI insights and bio link milestones — tap to start a draft
          </p>
        </div>
        {loading ? <Loader2 size={15} className="animate-spin text-white/40" /> : null}
      </div>

      {suggestions.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-white/45">
          {loading ? "Looking for suggestions…" : "Generate AI insights on the dashboard to see suggested toasts here."}
        </p>
      ) : (
        <ul className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-3">
          {suggestions.map((suggestion) => (
            <li key={suggestion.id}>
              <button
                type="button"
                onClick={() => onUse(suggestion)}
                className="flex h-full w-full flex-col gap-2 rounded-xl border border-white/10 bg-black/25 p-3 text-left transition hover:border-dt-red/50 hover:bg-dt-red/[0.07]"
              >
                <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/60">
                  {suggestion.kind === "ai" ? <Sparkles size={10} /> : <Link2 size={10} />}
                  {suggestion.label}
                </span>
                <span className="text-sm font-medium leading-snug text-white">{suggestion.message}</span>
                {suggestion.detail ? (
                  <span className="line-clamp-2 text-[11px] leading-relaxed text-white/40">{suggestion.detail}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
