import { requireFanAppApiBase } from "./fanAppApiBase";
import { isDameTwitterAnalytics } from "./legacySocialGuards";
import { handleMatches, resolveSocialHandle } from "./socialSources";

export type TwitterPostAnalytics = {
  id: string;
  text: string;
  permalink: string;
  createdAt: string;
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
};

export type TwitterAnalytics = {
  syncedAt: string;
  source?: "live" | "cache";
  profile: {
    screenName: string;
    name: string;
    handle: string;
    permalink: string;
    followers: number;
    followersLabel: string;
    following: number;
    totalPosts: number;
  };
  kpis: {
    followers: number;
    following: number;
    sampledPosts: number;
    avgLikes: number;
    avgReplies: number;
    avgReposts: number;
    engagementRate: number;
  };
  recentPosts: TwitterPostAnalytics[];
  topPosts: TwitterPostAnalytics[];
};

function getApiBase() {
  return (requireFanAppApiBase()).replace(/\/$/, "");
}

async function fetchJsonAnalytics(url: string, { allowEmpty = false } = {}): Promise<TwitterAnalytics | null> {
  const response = await fetch(url, { cache: "no-store" });
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.includes("application/json")) return null;
  const data = (await response.json()) as TwitterAnalytics & { ok?: boolean };
  if (!data?.kpis) return null;
  if (isDameTwitterAnalytics(data)) return null;
  const hasEngagement =
    Number(data.kpis.avgLikes ?? 0) + Number(data.kpis.avgReplies ?? 0) + Number(data.kpis.avgReposts ?? 0) > 0;
  if (!allowEmpty && !hasEngagement && data.source === "cache") return null;
  return data;
}

export function normalizePost(post: {
  id: string;
  text?: string;
  permalink?: string;
  createdAt?: string;
  likes?: number;
  replies?: number;
  reposts?: number;
  quotes?: number;
  stats?: { likes?: number; replies?: number; reposts?: number; quotes?: number };
}): TwitterPostAnalytics {
  return {
    id: post.id,
    text: post.text?.trim() || "Post on X",
    permalink: post.permalink || `https://x.com/i/web/status/${post.id}`,
    createdAt: post.createdAt || new Date().toISOString(),
    likes: Number(post.likes ?? post.stats?.likes ?? 0),
    replies: Number(post.replies ?? post.stats?.replies ?? 0),
    reposts: Number(post.reposts ?? post.stats?.reposts ?? 0),
    quotes: Number(post.quotes ?? post.stats?.quotes ?? 0),
  };
}

export function buildTwitterAnalyticsFromPosts(
  posts: TwitterPostAnalytics[],
  profile?: Partial<TwitterAnalytics["profile"]>,
): TwitterAnalytics | null {
  if (!posts.length) return null;

  const recentPosts = posts.slice(0, 12);
  const topPosts = [...posts]
    .sort((a, b) => b.likes + b.replies + b.reposts - (a.likes + a.replies + a.reposts))
    .slice(0, 8);
  const totalLikes = posts.reduce((sum, post) => sum + post.likes, 0);
  const totalReplies = posts.reduce((sum, post) => sum + post.replies, 0);
  const totalReposts = posts.reduce((sum, post) => sum + post.reposts, 0);
  const count = posts.length;
  const avgLikes = Math.round(totalLikes / count);
  const avgReplies = Math.round(totalReplies / count);
  const avgReposts = Math.round(totalReposts / count);
  const followers = Number(profile?.followers ?? 0);
  const screenName = (profile?.screenName ?? profile?.handle ?? "").replace(/^@/, "");

  return {
    syncedAt: new Date().toISOString(),
    source: "cache",
    profile: {
      screenName,
      name: profile?.name ?? (screenName || "Connected X account"),
      handle: profile?.handle ?? (screenName ? `@${screenName}` : ""),
      permalink: profile?.permalink ?? (screenName ? `https://x.com/${screenName}` : ""),
      followers,
      followersLabel:
        profile?.followersLabel ??
        (followers ? `${formatMetric(followers, true)} followers` : "Followers unavailable"),
      following: Number(profile?.following ?? 0),
      totalPosts: Number(profile?.totalPosts ?? count),
    },
    kpis: {
      followers,
      following: Number(profile?.following ?? 0),
      sampledPosts: count,
      avgLikes,
      avgReplies,
      avgReposts,
      engagementRate:
        followers > 0
          ? Math.round(((avgLikes + avgReplies + avgReposts) / followers) * 10_000) / 100
          : 0,
    },
    recentPosts,
    topPosts,
  };
}

export async function fetchTwitterAnalytics(): Promise<TwitterAnalytics | null> {
  const screen = await resolveSocialHandle("x");
  if (!screen) return null;

  const base = getApiBase();
  const q = encodeURIComponent(screen);
  const urls = [
    `${base}/api/social/analytics?source=twitter&screen_name=${q}&refresh=1`,
    `${base}/api/twitter/analytics?screen_name=${q}`,
    `${base}/api/x/analytics?screen_name=${q}`,
  ];

  for (const url of urls) {
    try {
      const data = await fetchJsonAnalytics(url);
      if (!data || isDameTwitterAnalytics(data)) continue;
      const actual = data.profile?.screenName ?? data.profile?.handle;
      if (!handleMatches(screen, actual)) continue;
      return data;
    } catch {
      // try next source
    }
  }

  return null;
}

export function formatMetric(value: number, compact = false) {
  if (compact) {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString();
}

export function formatPostDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function textPreview(text: string, max = 80) {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return "Post on X";
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}
