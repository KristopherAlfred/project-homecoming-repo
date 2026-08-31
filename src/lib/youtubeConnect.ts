import { supabase } from "../integrations/supabase/client";
import { resolveCurrentAthlete } from "./athletes";
import type { YouTubeAnalytics } from "./youtubeAnalyticsApi";
import { formatMetric } from "./youtubeAnalyticsApi";

export const GOOGLE_NOT_CONFIGURED =
  "YouTube isn't set up yet — the Google OAuth credentials (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) still need to be added to this project.";

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

/** Opens the Google consent popup and resolves once it closes. */
export async function connectYouTube(): Promise<void> {
  const athlete = await resolveCurrentAthlete().catch(() => null);
  const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>(
    "youtube-auth",
    { body: { athlete_id: athlete?.id ?? null, origin: window.location.origin } },
  );
  const message =
    data?.error ?? (error ? (await readFunctionError(error)) ?? error.message : null);
  if (message?.includes("Google OAuth credentials")) throw new Error(GOOGLE_NOT_CONFIGURED);
  if (!data?.url) throw new Error(message ?? "Could not start YouTube login");

  const popup = window.open(data.url, "youtube-auth", "width=620,height=780");
  if (!popup) throw new Error("Popup blocked — allow popups and try again.");

  await new Promise<void>((resolve) => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "youtube-auth") finish();
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

  // The popup can close without consent (cancelled / denied scopes). Confirm the
  // channel really landed in the backend before anyone tries to sync it.
  if (!(await isYouTubeConnected())) {
    throw new Error("YouTube wasn't connected — finish the Google sign-in and approve all scopes.");
  }
}

/** True once Google consent completed and tokens are stored for this athlete. */
export async function isYouTubeConnected(): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke<{ connected?: boolean }>("youtube-sync", {
    body: { action: "read" },
  });
  return !error && Boolean(data?.connected);
}


export type YouTubeSyncResult = {
  ok?: boolean;
  synced_at?: string;
  channel?: string | null;
  subscribers?: number;
  videos_synced?: number;
  error?: string;
};

/** Pulls fresh channel + video stats from the official YouTube Data API. */
export async function syncYouTube(): Promise<YouTubeSyncResult> {
  const { data, error } = await supabase.functions.invoke<YouTubeSyncResult>("youtube-sync", {
    body: { action: "sync" },
  });
  if (error) throw new Error(data?.error ?? (await readFunctionError(error)) ?? error.message);
  if (data?.error) throw new Error(data.error);
  return data ?? {};
}

type CloudChannel = {
  channel_id: string;
  title: string | null;
  handle: string | null;
  subscribers: number;
  total_views: number;
  total_videos: number;
  last_synced_at: string;
};

type CloudVideo = {
  video_id: string;
  title: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  published_at: string | null;
  duration_seconds: number;
  thumbnail_url?: string | null;
};

/** Analytics straight from the athlete's own connected channel (null when not connected). */
export async function fetchYouTubeAnalyticsFromCloud(): Promise<YouTubeAnalytics | null> {
  try {
    const { data, error } = await supabase.functions.invoke<{
      connected?: boolean;
      stats?: CloudChannel | null;
      videos?: CloudVideo[];
    }>("youtube-sync", { body: { action: "read" } });
    if (error || !data?.connected || !data.stats) return null;

    const stats = data.stats;
    const videos = (data.videos ?? []).map((video) => ({
      id: video.video_id,
      title: video.title ?? "Untitled video",
      viewCount: Number(video.view_count ?? 0),
      likeCount: Number(video.like_count ?? 0),
      commentCount: Number(video.comment_count ?? 0),
      publishedAt: video.published_at ?? new Date().toISOString(),
      permalink: `https://www.youtube.com/watch?v=${video.video_id}`,
      durationSeconds: Number(video.duration_seconds ?? 0),
      thumbnailUrl:
        video.thumbnail_url ?? `https://i.ytimg.com/vi/${video.video_id}/hqdefault.jpg`,
    }));

    const totalViews = Number(stats.total_views ?? 0);
    const sampleViews = videos.reduce((sum, video) => sum + video.viewCount, 0);
    const sampleLikes = videos.reduce((sum, video) => sum + video.likeCount, 0);
    const avgViews = videos.length ? Math.round(sampleViews / videos.length) : 0;
    const avgLikes = videos.length ? Math.round(sampleLikes / videos.length) : 0;
    const handle = stats.handle ?? "";

    return {
      syncedAt: stats.last_synced_at,
      source: "live",
      channel: {
        id: stats.channel_id,
        name: stats.title ?? handle.replace(/^@/, "") ?? "YouTube channel",
        handle,
        permalink: handle
          ? `https://www.youtube.com/${handle.startsWith("@") ? handle : `@${handle}`}`
          : `https://www.youtube.com/channel/${stats.channel_id}`,
        subscribers: Number(stats.subscribers ?? 0),
        subscribersLabel: `${formatMetric(Number(stats.subscribers ?? 0), true)} subscribers`,
      },
      kpis: {
        subscribers: Number(stats.subscribers ?? 0),
        totalVideos: Number(stats.total_videos ?? videos.length),
        totalViews: totalViews || sampleViews,
        avgViews,
        avgLikes,
        engagementRate: avgViews > 0 ? Math.round((avgLikes / avgViews) * 10_000) / 100 : 0,
      },
      recentVideos: videos.slice(0, 12),
      topVideos: [...videos].sort((a, b) => b.viewCount - a.viewCount).slice(0, 8),
      allVideos: videos,
    };
  } catch {
    return null;
  }
}

export type YouTubePostInput = {
  videoUrl: string;
  title: string;
  description?: string;
  tags?: string[];
  privacy?: "public" | "private" | "unlisted";
  publishAt?: string | null;
};

/** Uploads a video to the connected channel (optionally scheduled). */
export async function postToYouTube(input: YouTubePostInput): Promise<{
  video_id: string | null;
  permalink: string | null;
}> {
  const { data, error } = await supabase.functions.invoke<{
    ok?: boolean;
    video_id?: string | null;
    permalink?: string | null;
    error?: string;
    details?: unknown;
  }>("youtube-post", {
    body: {
      video_url: input.videoUrl,
      title: input.title,
      description: input.description ?? "",
      tags: input.tags ?? [],
      privacy: input.privacy ?? "public",
      publish_at: input.publishAt ?? null,
    },
  });
  if (error) throw new Error(data?.error ?? (await readFunctionError(error)) ?? error.message);
  if (data?.error) throw new Error(data.error);
  return { video_id: data?.video_id ?? null, permalink: data?.permalink ?? null };
}
