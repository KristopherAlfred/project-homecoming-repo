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

const GRAPH = "https://graph.facebook.com/v21.0";

async function graph<T>(path: string, params: Record<string, string>, token: string): Promise<T> {
  const url = new URL(`${GRAPH}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", token);
  const res = await fetch(url.toString());
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message = body?.error?.message ?? `Graph API error (${res.status})`;
    throw new Error(message);
  }
  return body as T;
}

type Insight = { name: string; values?: Array<{ value?: number }> };

function insightValue(list: Insight[] | undefined, name: string): number {
  const found = list?.find((i) => i.name === name);
  return Number(found?.values?.[0]?.value ?? 0);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const { data: auth } = await supabase
    .from("instagram_auth")
    .select("ig_user_id, access_token, token_expires_at")
    .order("connected_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const token = auth?.access_token ?? "";
  const igUserId = auth?.ig_user_id ?? "";

  if (!token || !igUserId) {
    return json({ error: "not_connected", message: "Sign in with Instagram first." }, 400);
  }

  if (auth?.token_expires_at && new Date(auth.token_expires_at).getTime() < Date.now()) {
    return json(
      { error: "token_expired", message: "Instagram login expired. Please reconnect." },
      400,
    );
  }


  try {
    const profile = await graph<{
      id: string;
      username?: string;
      name?: string;
      biography?: string;
      profile_picture_url?: string;
      website?: string;
      followers_count?: number;
      follows_count?: number;
      media_count?: number;
    }>(
      igUserId,
      {
        fields:
          "id,username,name,biography,profile_picture_url,website,followers_count,follows_count,media_count",
      },
      token,
    );

    let accountInsights: Insight[] = [];
    try {
      const res = await graph<{ data: Insight[] }>(
        `${igUserId}/insights`,
        { metric: "reach,impressions,profile_views", period: "day" },
        token,
      );
      accountInsights = res.data ?? [];
    } catch (_) {
      // Insights require instagram_manage_insights and a non-empty account; keep zeros.
    }

    const now = new Date().toISOString();

    const { error: accountError } = await supabase.from("instagram_account_stats").upsert(
      {
        ig_user_id: profile.id,
        username: profile.username ?? null,
        name: profile.name ?? null,
        biography: profile.biography ?? null,
        profile_picture_url: profile.profile_picture_url ?? null,
        website: profile.website ?? null,
        followers_count: profile.followers_count ?? 0,
        follows_count: profile.follows_count ?? 0,
        media_count: profile.media_count ?? 0,
        reach: insightValue(accountInsights, "reach"),
        impressions: insightValue(accountInsights, "impressions"),
        profile_views: insightValue(accountInsights, "profile_views"),
        last_synced_at: now,
      },
      { onConflict: "ig_user_id" },
    );
    if (accountError) throw accountError;

    const media = await graph<{
      data: Array<{
        id: string;
        caption?: string;
        media_type?: string;
        media_product_type?: string;
        media_url?: string;
        thumbnail_url?: string;
        permalink?: string;
        like_count?: number;
        comments_count?: number;
        timestamp?: string;
      }>;
    }>(
      `${igUserId}/media`,
      {
        fields:
          "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,like_count,comments_count,timestamp",
        limit: "25",
      },
      token,
    );

    const rows = [] as Record<string, unknown>[];
    for (const item of media.data ?? []) {
      let mediaInsights: Insight[] = [];
      try {
        const res = await graph<{ data: Insight[] }>(
          `${item.id}/insights`,
          { metric: "reach,impressions,saved" },
          token,
        );
        mediaInsights = res.data ?? [];
      } catch (_) {
        // Some media types don't support insights.
      }

      rows.push({
        ig_user_id: profile.id,
        media_id: item.id,
        caption: item.caption ?? null,
        media_type: item.media_type ?? null,
        media_product_type: item.media_product_type ?? null,
        media_url: item.media_url ?? null,
        thumbnail_url: item.thumbnail_url ?? item.media_url ?? null,
        permalink: item.permalink ?? null,
        like_count: item.like_count ?? 0,
        comments_count: item.comments_count ?? 0,
        saved: insightValue(mediaInsights, "saved"),
        reach: insightValue(mediaInsights, "reach"),
        impressions: insightValue(mediaInsights, "impressions"),
        timestamp: item.timestamp ?? null,
      });
    }

    if (rows.length) {
      const { error: mediaError } = await supabase
        .from("instagram_media")
        .upsert(rows, { onConflict: "media_id" });
      if (mediaError) throw mediaError;
    }

    const followers = profile.followers_count ?? 0;

    await supabase
      .from("platform_connections")
      .update({
        connected: true,
        handle: profile.username ? `@${profile.username}` : null,
        follower_count: followers,
        last_synced_at: now,
      })
      .eq("platform", "instagram");

    const { data: igAuth } = await supabase
      .from("instagram_auth")
      .select("athlete_id")
      .eq("ig_user_id", profile.id)
      .maybeSingle();

    await supabase.from("platform_follower_snapshots").upsert(
      {
        athlete_id: igAuth?.athlete_id ?? null,
        platform: "instagram",
        captured_on: now.slice(0, 10),
        follower_count: followers,
      },
      { onConflict: "athlete_id,platform,captured_on" },
    );


    return json({
      ok: true,
      synced_at: now,
      username: profile.username ?? null,
      followers,
      media_synced: rows.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("instagram-sync failed:", message);
    return json({ error: message }, 500);
  }
});
