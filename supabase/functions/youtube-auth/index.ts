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

/**
 * Google OAuth for YouTube.
 * - readonly + analytics scopes power the dashboard metrics
 * - youtube.upload lets the athlete publish videos from Content Studio
 */
const SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
  "https://www.googleapis.com/auth/youtube.upload",
].join(" ");

function redirectUri(req: Request) {
  const url = new URL(req.url);
  return `https://${url.host}/functions/v1/youtube-auth/callback`;
}

/** State carries the athlete id plus the app origin to return the popup to. */
function encodeState(athleteId: string | null, origin: string | null) {
  return btoa(JSON.stringify({ a: athleteId, o: origin })).replace(/=+$/, "");
}

function decodeState(raw: string): { athleteId: string | null; origin: string | null } {
  try {
    const parsed = JSON.parse(atob(raw)) as { a?: string | null; o?: string | null };
    return { athleteId: parsed.a ?? null, origin: parsed.o ?? null };
  } catch {
    return { athleteId: /^[0-9a-f-]{36}$/i.test(raw) ? raw : null, origin: null };
  }
}

/**
 * The functions gateway serves our responses as text/plain under a sandbox CSP,
 * so an HTML page here can never render. Redirect back to the app instead — the
 * /oauth/youtube page shows the connecting state and closes the popup itself.
 */
function finishPopup(message: string, ok: boolean, origin: string | null) {
  const target = origin ?? Deno.env.get("APP_ORIGIN") ?? null;
  if (target) {
    const url = new URL("/oauth/youtube", target);
    url.searchParams.set("youtube", ok ? "connected" : "error");
    url.searchParams.set("youtube_message", message);
    return new Response(null, { status: 302, headers: { ...corsHeaders, Location: url.toString() } });
  }
  return new Response(`${ok ? "YouTube connected" : "Connection failed"}: ${message}\nYou can close this window.`, {
    headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
  });
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const clientId = Deno.env.get("GOOGLE_CLIENT_ID") ?? "";
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET") ?? "";
  const url = new URL(req.url);
  const isCallback = url.pathname.endsWith("/callback");

  const state = url.searchParams.get("state") ?? "";
  const { athleteId: stateAthleteId, origin: appOrigin } = decodeState(state);

  if (!clientId || !clientSecret) {
    const msg = "Google OAuth credentials are not configured.";
    return isCallback ? finishPopup(msg, false, appOrigin) : json({ error: msg }, 400);
  }

  try {
    if (!isCallback) {
      let athleteId: string | null = null;
      let origin: string | null = null;
      try {
        const body = (await req.json()) as { athlete_id?: string; origin?: string };
        athleteId = body?.athlete_id ?? null;
        origin = body?.origin ?? null;
      } catch {
        // no body is fine
      }

      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("redirect_uri", redirectUri(req));
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", SCOPES);
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("include_granted_scopes", "true");
      authUrl.searchParams.set("prompt", "consent");
      authUrl.searchParams.set("state", encodeState(athleteId, origin));
      return json({ url: authUrl.toString() });
    }

    const oauthError = url.searchParams.get("error");
    if (oauthError) return finishPopup(oauthError, false, appOrigin);

    const code = url.searchParams.get("code");
    if (!code) return finishPopup("Missing authorization code.", false, appOrigin);

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri(req),
        grant_type: "authorization_code",
      }),
    });
    const token = (await tokenRes.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      error_description?: string;
      error?: string;
    };
    if (!tokenRes.ok || !token.access_token) {
      return finishPopup(token.error_description ?? token.error ?? "Token exchange failed.", false, appOrigin);
    }

    const channelRes = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
      { headers: { Authorization: `Bearer ${token.access_token}` } },
    );
    const channelBody = (await channelRes.json()) as {
      items?: Array<{
        id: string;
        snippet?: { title?: string; customUrl?: string };
        statistics?: { subscriberCount?: string };
      }>;
      error?: { message?: string };
    };
    if (!channelRes.ok) {
      return finishPopup(channelBody.error?.message ?? "Could not read your channel.", false, appOrigin);
    }
    const channel = channelBody.items?.[0];
    if (!channel) {
      return finishPopup("No YouTube channel is attached to that Google account.", false, appOrigin);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const athleteId = stateAthleteId;
    const handle = channel.snippet?.customUrl ?? null;

    const { error: upsertError } = await supabase.from("youtube_auth").upsert(
      {
        athlete_id: athleteId,
        channel_id: channel.id,
        channel_title: channel.snippet?.title ?? null,
        handle,
        access_token: token.access_token,
        refresh_token: token.refresh_token ?? null,
        token_expires_at: token.expires_in
          ? new Date(Date.now() + token.expires_in * 1000).toISOString()
          : null,
        connected_at: new Date().toISOString(),
      },
      { onConflict: "channel_id" },
    );
    if (upsertError) throw upsertError;

    await supabase
      .from("platform_connections")
      .update({
        connected: true,
        handle: handle ?? channel.snippet?.title ?? null,
        follower_count: Number(channel.statistics?.subscriberCount ?? 0),
        last_synced_at: new Date().toISOString(),
      })
      .eq("platform", "youtube");

    return finishPopup(
      `${channel.snippet?.title ?? "Your channel"} is now linked.`,
      true,
      appOrigin,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("youtube-auth failed:", message);
    return isCallback ? finishPopup(message, false, appOrigin) : json({ error: message }, 500);
  }
});
