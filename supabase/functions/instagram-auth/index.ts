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

const SCOPES = [
  "instagram_basic",
  "instagram_manage_insights",
  "pages_show_list",
  "pages_read_engagement",
].join(",");

function redirectUri(req: Request) {
  const url = new URL(req.url);
  return `https://${url.host}/functions/v1/instagram-auth/callback`;
}


async function graph<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${GRAPH}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error?.message ?? `Graph API error (${res.status})`);
  return body as T;
}

function htmlClose(message: string, ok: boolean) {
  return new Response(
    `<!doctype html><html><body style="background:#0b0f0d;color:#fff;font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0">
      <div style="text-align:center;max-width:520px;padding:24px">
        <h1 style="color:${ok ? "#8FE3B8" : "#ff8484"};font-size:20px">${ok ? "Instagram connected" : "Connection failed"}</h1>
        <p style="opacity:.7;font-size:14px">${message}</p>
        <p style="opacity:.5;font-size:12px">You can close this window.</p>
      </div>
      <script>try{window.opener&&window.opener.postMessage({type:"instagram-auth",ok:${ok}},"*")}catch(e){}<\/script>
    </body></html>`,
    { headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } },
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const appId = Deno.env.get("META_APP_ID") ?? "";
  const appSecret = Deno.env.get("META_APP_SECRET") ?? "";
  const url = new URL(req.url);
  const isCallback = url.pathname.endsWith("/callback");

  if (!appId || !appSecret) {
    const msg = "Meta app credentials are not configured.";
    return isCallback ? htmlClose(msg, false) : json({ error: msg }, 400);
  }

  try {
    if (!isCallback) {
      const authUrl = new URL("https://www.facebook.com/v21.0/dialog/oauth");
      authUrl.searchParams.set("client_id", appId);
      authUrl.searchParams.set("redirect_uri", redirectUri(req));
      authUrl.searchParams.set("scope", SCOPES);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("state", crypto.randomUUID());
      return json({ url: authUrl.toString() });
    }

    const error = url.searchParams.get("error_description") ?? url.searchParams.get("error");
    if (error) return htmlClose(error, false);

    const code = url.searchParams.get("code");
    if (!code) return htmlClose("Missing authorization code.", false);

    const shortToken = await graph<{ access_token: string }>("oauth/access_token", {
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri(req),
      code,
    });

    const longToken = await graph<{ access_token: string; expires_in?: number }>(
      "oauth/access_token",
      {
        grant_type: "fb_exchange_token",
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: shortToken.access_token,
      },
    );

    const accounts = await graph<{
      data: Array<{
        id: string;
        name?: string;
        access_token?: string;
        instagram_business_account?: { id: string; username?: string };
      }>;
    }>("me/accounts", {
      fields: "id,name,access_token,instagram_business_account{id,username}",
      access_token: longToken.access_token,
    });

    const page = (accounts.data ?? []).find((p) => p.instagram_business_account?.id);
    if (!page) {
      return htmlClose(
        "No Instagram Business account is linked to your Facebook Pages. Link one in the Instagram app under Settings → Account type.",
        false,
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const expiresAt = longToken.expires_in
      ? new Date(Date.now() + longToken.expires_in * 1000).toISOString()
      : null;

    await supabase.from("instagram_auth").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    const { error: insertError } = await supabase.from("instagram_auth").insert({
      ig_user_id: page.instagram_business_account!.id,
      username: page.instagram_business_account!.username ?? null,
      page_id: page.id,
      page_name: page.name ?? null,
      access_token: page.access_token ?? longToken.access_token,
      token_expires_at: expiresAt,
    });
    if (insertError) throw insertError;

    return htmlClose(
      `@${page.instagram_business_account!.username ?? "account"} is now linked. Head back to the dashboard and hit Sync now.`,
      true,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("instagram-auth failed:", message);
    return isCallback ? htmlClose(message, false) : json({ error: message }, 500);
  }
});
