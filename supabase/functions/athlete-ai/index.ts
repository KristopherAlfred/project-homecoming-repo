import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { streamText } from "npm:ai";
import { z } from "npm:zod";
import { createLovableAiGatewayProvider } from "../_shared/ai-gateway.ts";

/**
 * AI insights + assistant for a single athlete. All model calls, prompts and
 * keys stay server-side; the client only sends an athlete id and a question.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MODEL = "google/gemini-3-flash-preview";

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );
}

/** Everything the model is allowed to reason about for this athlete. */
async function buildSnapshot(db: ReturnType<typeof admin>, athleteId: string) {
  const [athlete, theme, bioLink, connections, snapshots, igStats, igMedia] = await Promise.all([
    db.from("athletes").select("full_name, display_name, sport, gender, team_or_league, bio_short").eq("id", athleteId).maybeSingle(),
    db.from("athlete_theme").select("fan_app_name, template_id, is_published").eq("athlete_id", athleteId).maybeSingle(),
    db.from("athlete_bio_links").select("slug, is_published, click_count").eq("athlete_id", athleteId).maybeSingle(),
    db.from("platform_connections").select("platform, handle, connected, follower_count, last_synced_at").eq("athlete_id", athleteId),
    db
      .from("platform_follower_snapshots")
      .select("platform, captured_on, follower_count")
      .eq("athlete_id", athleteId)
      .order("captured_on", { ascending: false })
      .limit(120),
    db.from("instagram_account_stats").select("username, followers_count, media_count, reach, impressions, profile_views, last_synced_at").limit(1),
    db
      .from("instagram_media")
      .select("caption, media_type, like_count, comments_count, saved, reach, impressions, timestamp")
      .order("timestamp", { ascending: false })
      .limit(12),
  ]);

  return {
    athlete: athlete.data ?? null,
    fanApp: theme.data ?? null,
    bioLink: bioLink.data ?? null,
    connections: connections.data ?? [],
    followerHistory: snapshots.data ?? [],
    instagram: { account: igStats.data?.[0] ?? null, recentPosts: igMedia.data ?? [] },
  };
}

const insightSchema = z.object({
  insights: z
    .array(
      z.object({
        insight_type: z.enum(["trend", "opportunity", "risk", "content"]),
        summary: z.string(),
        recommendation: z.string(),
      }),
    )
    .min(1)
    .max(4),
});

function systemPrompt(snapshot: unknown) {
  return [
    "You are the analytics strategist inside PlayersOS, a platform athletes use to grow and monetize their fanbase.",
    "You only reason about the athlete data provided below. Never invent numbers; if data is missing, say what to connect.",
    "Be concrete, short and actionable. Reference platforms, follower deltas and post performance when they exist.",
    "",
    `ATHLETE DATA (JSON): ${JSON.stringify(snapshot)}`,
  ].join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return json({ error: "AI is not configured yet" }, 500);

  try {
    const body = (await req.json().catch(() => null)) as
      | { action?: string; athleteId?: string; question?: string; history?: { role: string; content: string }[] }
      | null;
    if (!body || !body.athleteId || !UUID.test(body.athleteId)) return json({ error: "Invalid request" }, 400);

    const db = admin();
    const snapshot = await buildSnapshot(db, body.athleteId);
    const gateway = createLovableAiGatewayProvider(key);

    if (body.action === "insights") {
      const result = streamText({
        model: gateway(MODEL),
        system: systemPrompt(snapshot),
        prompt: [
          "Generate the 3 most valuable insights for this athlete right now.",
          "Reply with JSON only, no markdown fences, shaped exactly:",
          '{"insights":[{"insight_type":"trend|opportunity|risk|content","summary":"one sentence on what the data shows","recommendation":"one specific action for this week"}]}',
        ].join("\n"),
      });
      const raw = (await result.text).replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
      const parsed = insightSchema.safeParse(JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)));
      if (!parsed.success) return json({ error: "AI returned an unexpected response — try again" }, 502);
      const output = parsed.data;

      const rows = output.insights.map((i) => ({
        athlete_id: body.athleteId,
        insight_type: i.insight_type,
        summary: i.summary,
        recommendation: i.recommendation,
        data_snapshot: snapshot as unknown as Record<string, unknown>,
      }));
      const { data, error } = await db.from("athlete_ai_insights").insert(rows).select("*");
      if (error) return json({ error: error.message }, 500);
      return json({ insights: data });
    }

    if (body.action === "ask") {
      const question = (body.question ?? "").trim().slice(0, 1000);
      if (!question) return json({ error: "Ask a question first" }, 400);
      const history = (body.history ?? [])
        .slice(-8)
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role as "user" | "assistant", content: String(m.content).slice(0, 2000) }));

      const result = streamText({
        model: gateway(MODEL),
        system: systemPrompt(snapshot),
        messages: [...history, { role: "user", content: question }],
      });
      return json({ answer: await result.text });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    const status = /429|rate/i.test(message) ? 429 : /402|credit/i.test(message) ? 402 : 500;
    return json({ error: message }, status);
  }
});
