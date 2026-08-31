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

async function refreshIfNeeded(
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
  };
  if (!res.ok || !body.access_token) {
    throw new Error(body.error_description ?? "Could not refresh Google token");
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

/**
 * Publishes a video to the connected YouTube channel.
 * Body: { video_url, title, description?, tags?, privacy?, publish_at? }
 * The video file is streamed from `video_url` through YouTube's resumable upload.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const payload = (await req.json()) as {
      video_url?: string;
      title?: string;
      description?: string;
      tags?: string[];
      privacy?: "public" | "private" | "unlisted";
      publish_at?: string | null;
    };

    if (!payload.video_url) return json({ error: "video_url is required" }, 400);
    if (!payload.title) return json({ error: "title is required" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: auth } = await supabase
      .from("youtube_auth")
      .select("channel_id, access_token, refresh_token, token_expires_at")
      .order("connected_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!auth?.access_token) {
      return json({ error: "not_connected", message: "Connect your YouTube channel first." }, 400);
    }

    const token = await refreshIfNeeded(supabase, auth);

    const fileRes = await fetch(payload.video_url);
    if (!fileRes.ok) return json({ error: `Could not download video (${fileRes.status})` }, 400);
    const file = new Uint8Array(await fileRes.arrayBuffer());
    const contentType = fileRes.headers.get("content-type") ?? "video/*";

    const privacyStatus = payload.publish_at ? "private" : payload.privacy ?? "public";
    const metadata = {
      snippet: {
        title: payload.title,
        description: payload.description ?? "",
        tags: payload.tags ?? [],
      },
      status: {
        privacyStatus,
        selfDeclaredMadeForKids: false,
        ...(payload.publish_at ? { publishAt: payload.publish_at } : {}),
      },
    };

    const initRes = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Length": String(file.byteLength),
          "X-Upload-Content-Type": contentType,
        },
        body: JSON.stringify(metadata),
      },
    );
    if (!initRes.ok) {
      const detail = await initRes.text();
      console.error("youtube-post init failed:", initRes.status, detail);
      return json({ error: "Upload could not start", status: initRes.status, details: detail }, initRes.status);
    }

    const uploadUrl = initRes.headers.get("location");
    if (!uploadUrl) return json({ error: "YouTube did not return an upload URL" }, 502);

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType, "Content-Length": String(file.byteLength) },
      body: file,
    });
    const uploaded = await uploadRes.json().catch(() => null);
    if (!uploadRes.ok) {
      console.error("youtube-post upload failed:", uploadRes.status, JSON.stringify(uploaded));
      return json(
        { error: "Upload failed", status: uploadRes.status, details: uploaded },
        uploadRes.status,
      );
    }

    const video = uploaded as { id?: string; snippet?: { title?: string } };
    return json({
      ok: true,
      video_id: video.id ?? null,
      permalink: video.id ? `https://www.youtube.com/watch?v=${video.id}` : null,
      privacy: privacyStatus,
      scheduled_for: payload.publish_at ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("youtube-post failed:", message);
    return json({ error: message }, 500);
  }
});
