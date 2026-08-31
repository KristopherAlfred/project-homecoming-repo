import { supabase } from "../integrations/supabase/client";

/** AI insights + assistant client. All prompts/model calls live server-side. */

export type AthleteAiInsight = {
  id: string;
  athlete_id: string;
  insight_type: string;
  summary: string;
  recommendation: string | null;
  created_at: string;
};

export type AiChatMessage = { role: "user" | "assistant"; content: string };

/** Human-friendly error for gateway failures surfaced by the edge function. */
function aiError(error: unknown, fallback: string): Error {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  if (/429|rate/i.test(raw)) return new Error("AI is busy right now — try again in a moment.");
  if (/402|credit/i.test(raw)) return new Error("AI credits are used up. Add credits to keep generating insights.");
  return new Error(raw || fallback);
}

export async function fetchAthleteInsights(athleteId: string, limit = 6): Promise<AthleteAiInsight[]> {
  const { data, error } = await supabase.functions.invoke("athlete-state", {
    body: { action: "get_insights", athlete_id: athleteId, limit },
  });
  if (error) throw new Error(error.message);
  return ((data as { insights?: AthleteAiInsight[] })?.insights ?? []) as AthleteAiInsight[];
}

export async function generateAthleteInsights(athleteId: string): Promise<AthleteAiInsight[]> {
  const { data, error } = await supabase.functions.invoke("athlete-ai", {
    body: { action: "insights", athleteId },
  });
  if (error) throw aiError(error, "Could not generate insights");
  const payload = data as { insights?: AthleteAiInsight[]; error?: string };
  if (payload?.error) throw aiError(new Error(payload.error), "Could not generate insights");
  return payload?.insights ?? [];
}

export async function askAthleteAssistant(
  athleteId: string,
  question: string,
  history: AiChatMessage[],
): Promise<string> {
  const { data, error } = await supabase.functions.invoke("athlete-ai", {
    body: { action: "ask", athleteId, question, history },
  });
  if (error) throw aiError(error, "The assistant could not answer");
  const payload = data as { answer?: string; error?: string };
  if (payload?.error) throw aiError(new Error(payload.error), "The assistant could not answer");
  return payload?.answer ?? "";
}
