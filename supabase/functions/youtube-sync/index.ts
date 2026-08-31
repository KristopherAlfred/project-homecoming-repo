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

const API = "https://www.googleapis.com/youtube/v3";

function parseDuration(iso: string | undefined): number {
  const match = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso ?? "");
  if (!match) return 0;
  const [, d, h, m, s] = match;
  return Number(d ?? 0) * 86400 + Number(h ?? 0) * 3600 + Number(m ?? 0) * 60 + Number(s ?? 0);
}

/** Refreshes the Google access token when it is expired (or close to it). */
export async function ensureAccessToken(
  supabase: ReturnType<typeof createClient>,
  auth: {
    channel_id: string;
    access_token: string;
    refresh_token: string | null;
    token_expires_at: string | null;
  },
): Promise<string> {
  const expiresAt = auth.token_expires_at ? Date.parse(auth.token_expires_at) : 0;
  if (expiresAt && expiresAt - Date.now() > 60_000) return auth.access_token;
  if (!auth.refresh_token) return auth.access_token;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_CLIENT_ID") ?? "",
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET") ?? "",
      refresh_token: auth.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const body = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error_description?: string;
    error?: string;
  };
  if (!res.ok || !body.access_token) {
    throw new Error(body.error_description ?? body.error ?? "Could not refresh Google token");
  }

  await supabase
    .from("youtube_auth")
    .update({
      access_token: body.access_token,
      token_expires_at: body.expires_in
        ? new Date(Date.now() + body.expires_in * 1000).toISOString()
        : null,
    })
    .eq("channel_id", auth.channel_id);

  return body.access_token;
}

async function api<T>(path: string, params: Record<string, string>, token: string): Promise<T> {
  const url = new URL(`${API}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      (body as { error?: { message?: string } })?.error?.message ?? `YouTube API error (${res.status})`,
    );
  }
  return body as T;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  let action = "sync";
  try {
    const body = (await req.json()) as { action?: string };
    if (body?.action) action = body.action;
  } catch {
    // default action
  }

  const { data: auth } = await supabase
    .from("youtube_auth")
    .select("channel_id, athlete_id, access_token, refresh_token, token_expires_at")
    .order("connected_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (action === "read") {
    if (!auth) return json({ connected: false });
    const [{ data: stats }, { data: videos }] = await Promise.all([
      supabase.from("youtube_channel_stats").select("*").eq("channel_id", auth.channel_id).maybeSingle(),
      supabase
        .from("youtube_videos")
        .select("*")
        .eq("channel_id", auth.channel_id)
        .order("published_at", { ascending: false })
        .limit(500),
    ]);
    return json({ connected: true, stats: stats ?? null, videos: videos ?? [] });
  }

  if (!auth?.access_token) {
    return json({ error: "not_connected", message: "Connect your YouTube channel first." }, 400);
  }

  try {
    const token = await ensureAccessToken(supabase, auth);

    const channelBody = await api<{
      items?: Array<{
        id: string;
        snippet?: { title?: string; customUrl?: string; thumbnails?: { high?: { url?: string } } };
        statistics?: { subscriberCount?: string; viewCount?: string; videoCount?: string };
        contentDetails?: { relatedPlaylists?: { uploads?: string } };
      }>;
    }>("channels", { part: "snippet,statistics,contentDetails", mine: "true" }, token);

    const channel = channelBody.items?.[0];
    if (!channel) throw new Error("No channel found on this Google account.");

    const now = new Date().toISOString();
    const subscribers = Number(channel.statistics?.subscriberCount ?? 0);
    const handle = channel.snippet?.customUrl ?? null;

    await supabase.from("youtube_channel_stats").upsert(
      {
        channel_id: channel.id,
        athlete_id: auth.athlete_id ?? null,
        title: channel.snippet?.title ?? null,
        handle,
        subscribers,
        total_views: Number(channel.statistics?.viewCount ?? 0),
        total_videos: Number(channel.statistics?.videoCount ?? 0),
        thumbnail_url: channel.snippet?.thumbnails?.high?.url ?? null,
        last_synced_at: now,
      },
      { onConflict: "channel_id" },
    );

    const uploads = channel.contentDetails?.relatedPlaylists?.uploads;
    let videoRows: Record<string, unknown>[] = [];

    if (uploads) {
      // Walk the whole uploads playlist (capped) so the dashboard can show ALL content.
      const ids: string[] = [];
      let pageToken: string | undefined;
      for (let page = 0; page < 10; page += 1) {
        const playlist = await api<{
          nextPageToken?: string;
          items?: Array<{ contentDetails?: { videoId?: string } }>;
        }>(
          "playlistItems",
          {
            part: "contentDetails",
            playlistId: uploads,
            maxResults: "50",
            ...(pageToken ? { pageToken } : {}),
          },
          token,
        );
        for (const item of playlist.items ?? []) {
          const id = item.contentDetails?.videoId;
          if (id) ids.push(id);
        }
        pageToken = playlist.nextPageToken;
        if (!pageToken) break;
      }

      for (let index = 0; index < ids.length; index += 50) {
        const batch = ids.slice(index, index + 50);
        const details = await api<{
          items?: Array<{
            id: string;
            snippet?: {
              title?: string;
              description?: string;
              publishedAt?: string;
              thumbnails?: { high?: { url?: string }; medium?: { url?: string } };
            };
            statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
            contentDetails?: { duration?: string };
          }>;
        }>(
          "videos",
          { part: "snippet,statistics,contentDetails", id: batch.join(","), maxResults: "50" },
          token,
        );

        videoRows = videoRows.concat(
          (details.items ?? []).map((video) => ({
            video_id: video.id,
            channel_id: channel.id,
            athlete_id: auth.athlete_id ?? null,
            title: video.snippet?.title ?? null,
            description: video.snippet?.description ?? null,
            thumbnail_url:
              video.snippet?.thumbnails?.high?.url ?? video.snippet?.thumbnails?.medium?.url ?? null,
            published_at: video.snippet?.publishedAt ?? null,
            duration_seconds: parseDuration(video.contentDetails?.duration),
            view_count: Number(video.statistics?.viewCount ?? 0),
            like_count: Number(video.statistics?.likeCount ?? 0),
            comment_count: Number(video.statistics?.commentCount ?? 0),
            last_synced_at: now,
          })),
        );
      }

      if (videoRows.length) {
        const { error: videoError } = await supabase
          .from("youtube_videos")
          .upsert(videoRows, { onConflict: "video_id" });
        if (videoError) throw videoError;
      }
    }

    {
      let connQuery = supabase
        .from("platform_connections")
        .update({
          connected: true,
          handle: handle ?? channel.snippet?.title ?? null,
          follower_count: subscribers,
          last_synced_at: now,
        })
        .eq("platform", "youtube");
      if (auth.athlete_id) connQuery = connQuery.eq("athlete_id", auth.athlete_id);
      await connQuery;
    }

    await supabase.from("platform_follower_snapshots").upsert(
      {
        athlete_id: auth.athlete_id ?? null,
        platform: "youtube",
        captured_on: now.slice(0, 10),
        follower_count: subscribers,
      },
      { onConflict: "athlete_id,platform,captured_on" },
    );


    return json({
      ok: true,
      synced_at: now,
      channel: channel.snippet?.title ?? null,
      subscribers,
      videos_synced: videoRows.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("youtube-sync failed:", message);
    return json({ error: message }, 500);
  }
});
