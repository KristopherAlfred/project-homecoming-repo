import { requireFanAppApiBase } from "./fanAppApiBase";
import { isDameYouTubeAnalytics } from "./legacySocialGuards";
import { handleMatches, resolveSocialHandle } from "./socialSources";

export type YouTubeVideoAnalytics = {
  id: string;
  title: string;
  viewCount: number;
  likeCount: number;
  publishedAt: string;
  permalink: string;
  durationSeconds: number;
  commentCount?: number;
  thumbnailUrl?: string | null;
};

export type YouTubeAnalytics = {
  syncedAt: string;
  source?: "live" | "cache";
  channel: {
    id: string;
    name: string;
    handle: string;
    permalink: string;
    subscribers: number;
    subscribersLabel: string;
  };
  kpis: {
    subscribers: number;
    totalVideos: number;
    totalViews: number;
    avgViews: number;
    avgLikes: number;
    engagementRate: number;
  };
  recentVideos: YouTubeVideoAnalytics[];
  topVideos: YouTubeVideoAnalytics[];
  /** Every video we have for this channel — powers the full content library. */
  allVideos?: YouTubeVideoAnalytics[];
};

function getApiBase() {
  return (requireFanAppApiBase()).replace(/\/$/, "");
}

async function fetchJsonAnalytics(url: string): Promise<YouTubeAnalytics | null> {
  const response = await fetch(url, { cache: "no-store" });
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.includes("application/json")) return null;
  const data = (await response.json()) as YouTubeAnalytics & { ok?: boolean };
  if (!data?.kpis) return null;
  if (isDameYouTubeAnalytics(data)) return null;
  return data;
}

export async function fetchYouTubeVideosFeed(limit = 48): Promise<{
  syncedAt: string;
  source?: "live" | "cache";
  channel: {
    id: string;
    name: string;
    handle: string;
    avatar?: string;
    subscribers?: number;
    subscribersLabel?: string;
  };
  videos: Array<{
    id: string;
    title: string;
    viewCount?: number;
    likeCount?: number;
    publishedAt?: string;
    permalink?: string;
    durationSeconds?: number;
  }>;
} | null> {
  const connected = await resolveSocialHandle("youtube");
  if (!connected) return null;

  const base = getApiBase();
  const isChannelId = /^UC[\w-]{20,}$/.test(connected);
  const idParam = isChannelId
    ? `channelId=${encodeURIComponent(connected)}`
    : `handle=${encodeURIComponent(connected)}`;
  const urls = [
    `${base}/api/youtube/videos?refresh=1&limit=${limit}&${idParam}`,
    `${base}/api/social/analytics?source=youtube&view=videos&refresh=1&limit=${limit}&${idParam}`,
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      const contentType = response.headers.get("content-type") ?? "";
      if (!response.ok || !contentType.includes("application/json")) continue;
      const data = (await response.json()) as {
        ok?: boolean;
        syncedAt?: string;
        source?: "live" | "cache";
        channel?: {
          id?: string;
          name?: string;
          handle?: string;
          avatar?: string;
          subscribers?: number;
          subscribersLabel?: string;
        };
        videos?: Array<{
          id: string;
          title: string;
          viewCount?: number;
          likeCount?: number;
          publishedAt?: string;
          permalink?: string;
          durationSeconds?: number;
        }>;
      };
      if (!data?.videos?.length || !data.channel) continue;
      const channel = {
        id: data.channel.id || (isChannelId ? connected : ""),
        name: data.channel.name || "",
        handle: data.channel.handle || `@${connected}`,
        avatar: data.channel.avatar,
        subscribers: data.channel.subscribers,
        subscribersLabel: data.channel.subscribersLabel,
      };
      // Live fan API may still return Dame videos — reject those.
      if (
        isDameYouTubeAnalytics({
          channel,
          recentVideos: data.videos.map((video) => ({ title: video.title })),
        })
      ) {
        continue;
      }
      // Identity guard: only ever return the athlete's own channel.
      const matches = isChannelId
        ? handleMatches(connected, channel.id)
        : handleMatches(connected, channel.handle);
      if (!matches) continue;
      return {
        syncedAt: data.syncedAt || new Date().toISOString(),
        source: data.source,
        channel,
        videos: data.videos,
      };
    } catch {
      // try next
    }
  }

  return null;
}

export async function fetchYouTubeAnalytics(): Promise<YouTubeAnalytics | null> {
  // Official YouTube Data API (OAuth connector) first — it is the athlete's own channel.
  const { fetchYouTubeAnalyticsFromCloud } = await import("./youtubeConnect");
  const live = await fetchYouTubeAnalyticsFromCloud();
  if (live) return live;

  const connected = await resolveSocialHandle("youtube");
  if (!connected) return null;


  const feed = await fetchYouTubeVideosFeed(48);
  if (feed?.videos.length) {
    const built = buildYouTubeAnalyticsFromFeed({
      syncedAt: feed.syncedAt,
      channel: feed.channel,
      videos: feed.videos,
    });
    if (built && !isDameYouTubeAnalytics(built)) {
      return { ...built, source: feed.source ?? "live" } as YouTubeAnalytics;
    }
  }

  const base = getApiBase();
  const isChannelId = /^UC[\w-]{20,}$/.test(connected);
  const idParam = isChannelId
    ? `channelId=${encodeURIComponent(connected)}`
    : `handle=${encodeURIComponent(connected)}`;
  const apiUrls = [
    `${base}/api/social/analytics?source=youtube&refresh=1&${idParam}`,
    `${base}/api/youtube/analytics?refresh=1&${idParam}`,
  ];

  for (const url of apiUrls) {
    try {
      const data = await fetchJsonAnalytics(url);
      if (!data) continue;
      const matches = isChannelId
        ? handleMatches(connected, data.channel?.id)
        : handleMatches(connected, data.channel?.handle);
      if (!matches) continue;
      return data;
    } catch {
      // try next source
    }
  }

  return null;
}


function buildYouTubeAnalyticsFromFeed(feed: {
  channel?: {
    id?: string;
    name?: string;
    handle?: string;
    subscribers?: number;
    subscribersLabel?: string;
  };
  videos?: Array<{
    id: string;
    title: string;
    viewCount?: number;
    likeCount?: number;
    publishedAt?: string;
    permalink?: string;
    durationSeconds?: number;
  }>;
  syncedAt?: string;
}): YouTubeAnalytics | null {
  const videos = (feed.videos ?? []).map((video) => ({
    id: video.id,
    title: video.title,
    viewCount: Number(video.viewCount ?? 0),
    likeCount: Number(video.likeCount ?? 0),
    publishedAt: video.publishedAt || new Date().toISOString(),
    permalink: video.permalink || `https://www.youtube.com/watch?v=${video.id}`,
    durationSeconds: Number(video.durationSeconds ?? 0),
    thumbnailUrl: `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
  }));

  if (!videos.length) return null;

  const recentVideos = videos.slice(0, 12);
  const topVideos = [...videos].sort((a, b) => b.viewCount - a.viewCount).slice(0, 8);
  const totalViews = videos.reduce((sum, video) => sum + video.viewCount, 0);
  const totalLikes = videos.reduce((sum, video) => sum + video.likeCount, 0);
  const avgViews = Math.round(totalViews / videos.length);
  const avgLikes = Math.round(totalLikes / videos.length);
  const subscribers = Number(feed.channel?.subscribers ?? 0);
  const handle = feed.channel?.handle ?? "";

  return {
    syncedAt: feed.syncedAt || new Date().toISOString(),
    source: "live",
    channel: {
      id: feed.channel?.id ?? "",
      name: feed.channel?.name ?? (handle.replace(/^@/, "") || "Connected YouTube channel"),
      handle,
      permalink: handle ? `https://www.youtube.com/${handle.replace(/^@?/, "@")}` : "",
      subscribers,
      subscribersLabel: feed.channel?.subscribersLabel ?? (subscribers ? `${formatMetric(subscribers, true)} subscribers` : "Subscribers unavailable"),
    },
    kpis: {
      subscribers,
      totalVideos: videos.length,
      totalViews,
      avgViews,
      avgLikes,
      engagementRate: avgViews > 0 ? Math.round((avgLikes / avgViews) * 10_000) / 100 : 0,
    },
    recentVideos,
    topVideos,
    allVideos: videos,
  };
}

export function formatMetric(value: number, compact = false) {
  if (compact) {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString();
}

export function formatRelativeTime(iso: string) {
  const deltaMs = Date.now() - Date.parse(iso);
  if (!Number.isFinite(deltaMs) || deltaMs < 0) return "just now";

  const seconds = Math.floor(deltaMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function formatPostDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function titlePreview(title: string, max = 80) {
  const trimmed = title.trim().replace(/\s+/g, " ");
  if (!trimmed) return "Untitled video";
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

export function formatDuration(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remaining = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
  }
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}
