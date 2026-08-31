import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ error: "Invalid request" }, 400);

    const { action } = body as { action?: string };
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    if (action === "set_platform_connected") {
      const { id, connected, handle } = body as {
        id?: unknown;
        connected?: unknown;
        handle?: unknown;
      };
      const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (typeof id !== "string" || !uuid.test(id)) return json({ error: "Invalid id" }, 400);
      if (typeof connected !== "boolean") return json({ error: "Invalid connected" }, 400);

      let cleanHandle: string | null = null;
      if (handle !== undefined && handle !== null) {
        if (typeof handle !== "string") return json({ error: "Invalid handle" }, 400);
        cleanHandle = handle.trim().replace(/^@/, "").slice(0, 120);
        if (cleanHandle.length === 0) cleanHandle = null;
      }

      const patch: Record<string, unknown> = {
        connected,
        last_synced_at: connected ? new Date().toISOString() : null,
      };
      if (!connected) patch.handle = null;
      else if (cleanHandle) patch.handle = cleanHandle;

      const { error } = await supabase.from("platform_connections").update(patch).eq("id", id);
      if (error) throw error;
      return json({ ok: true });
    }


    if (action === "set_onboarding_complete") {
      const { profile_key, complete } = body as { profile_key?: unknown; complete?: unknown };
      if (typeof profile_key !== "string" || profile_key.length === 0 || profile_key.length > 64) {
        return json({ error: "Invalid profile_key" }, 400);
      }
      if (typeof complete !== "boolean") return json({ error: "Invalid complete" }, 400);

      const { error } = await supabase.from("onboarding_state").upsert(
        {
          profile_key,
          has_completed_onboarding: complete,
          completed_at: complete ? new Date().toISOString() : null,
        },
        { onConflict: "profile_key" },
      );
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    console.error("dashboard-state failed:", err instanceof Error ? err.message : String(err));
    return json({ error: "Request failed" }, 500);
  }
});
