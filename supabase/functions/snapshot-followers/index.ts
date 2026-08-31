import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: connections, error } = await supabase
      .from("platform_connections")
      .select("platform, connected, follower_count, athlete_id")
      .eq("connected", true);

    if (error) throw error;

    const today = new Date().toISOString().slice(0, 10);
    const rows = (connections ?? [])
      .filter((c) => typeof c.follower_count === "number" && c.follower_count > 0)
      .map((c) => ({
        athlete_id: c.athlete_id ?? null,
        platform: c.platform,
        captured_on: today,
        follower_count: c.follower_count,
      }));


    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ recorded: 0, message: "No connected platforms with follower counts" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { error: upsertError } = await supabase
      .from("platform_follower_snapshots")
      .upsert(rows, { onConflict: "athlete_id,platform,captured_on" });

    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({ recorded: rows.length, captured_on: today }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("snapshot-followers failed:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
