import { supabase } from "../integrations/supabase/client";

export type InstagramAccountStats = {
  ig_user_id: string;
  username: string | null;
  name: string | null;
  biography: string | null;
  profile_picture_url: string | null;
  website: string | null;
  followers_count: number;
  follows_count: number;
  media_count: number;
  reach: number;
  impressions: number;
  profile_views: number;
  last_synced_at: string | null;
};

export type InstagramMediaRow = {
  media_id: string;
  caption: string | null;
  media_type: string | null;
  media_product_type: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  permalink: string | null;
  like_count: number;
  comments_count: number;
  saved: number;
  reach: number;
  impressions: number;
  timestamp: string | null;
};

export type InstagramSyncResult = {
  ok?: boolean;
  synced_at?: string;
  username?: string | null;
  followers?: number;
  media_synced?: number;
  error?: string;
};

export const META_NOT_CONFIGURED =
  "Instagram isn't set up yet — the Meta app credentials (META_APP_ID / META_APP_SECRET) still need to be added to this project.";

/** Reads the JSON error an edge function returned with a non-2xx status. */
async function readFunctionError(error: unknown): Promise<string | null> {
  const res = (error as { context?: Response } | null)?.context;
  if (!res || typeof res.text !== "function") return null;
  try {
    const body = await res.clone().text();
    return (JSON.parse(body) as { error?: string })?.error ?? body ?? null;
  } catch {
    return null;
  }
}

/** Opens the Meta login popup and resolves once the window is closed. */
export async function connectInstagram(): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>(
    "instagram-auth",
    { body: {} },
  );
  const message =
    data?.error ?? (error ? (await readFunctionError(error)) ?? error.message : null);
  if (message?.includes("Meta app credentials")) throw new Error(META_NOT_CONFIGURED);
  if (error) throw new Error(message ?? "Could not start Instagram login");
  if (!data?.url) throw new Error(message ?? "Could not start Instagram login");

  const popup = window.open(data.url, "instagram-auth", "width=600,height=760");
  if (!popup) throw new Error("Popup blocked — allow popups and try again.");

  await new Promise<void>((resolve) => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "instagram-auth") finish();
    };
    const timer = window.setInterval(() => {
      if (popup.closed) finish();
    }, 600);
    function finish() {
      window.clearInterval(timer);
      window.removeEventListener("message", onMessage);
      resolve();
    }
    window.addEventListener("message", onMessage);
  });
}

/** Pulls fresh data from the official Instagram Graph API into the backend. */
export async function syncInstagram(): Promise<InstagramSyncResult> {
  const { data, error } = await supabase.functions.invoke<InstagramSyncResult>("instagram-sync", {
    body: {},
  });
  if (error) throw new Error(data?.error ?? error.message);
  if (data?.error) throw new Error(data.error);
  return data ?? {};
}


/** Instagram tables are private; reads go through the athlete-state function. */
async function fetchInstagramBundle(limit = 12) {
  const { data, error } = await supabase.functions.invoke("athlete-state", {
    body: { action: "get_instagram", limit },
  });
  if (error) throw error;
  return (data ?? {}) as { stats?: InstagramAccountStats | null; media?: InstagramMediaRow[] };
}

export async function fetchInstagramAccountStats(): Promise<InstagramAccountStats | null> {
  const { stats } = await fetchInstagramBundle(1);
  return stats ?? null;
}

export async function fetchInstagramMedia(limit = 12): Promise<InstagramMediaRow[]> {
  const { media } = await fetchInstagramBundle(limit);
  return media ?? [];
}

export function instagramEngagementRate(
  stats: InstagramAccountStats | null,
  media: InstagramMediaRow[],
): number {
  if (!stats || !stats.followers_count || media.length === 0) return 0;
  const totalEngagement = media.reduce((sum, m) => sum + m.like_count + m.comments_count, 0);
  return (totalEngagement / media.length / stats.followers_count) * 100;
}
