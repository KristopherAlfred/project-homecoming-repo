import { requireFanAppApiBase } from "./fanAppApiBase";
import { isDameFacebookAnalytics } from "./legacySocialGuards";
import { handleMatches, resolveSocialHandle } from "./socialSources";

export type FacebookPostAnalytics = {
  id: string;
  text: string;
  permalink: string;
  createdAt: string;
  likes: number;
  comments: number;
  shares: number;
};

export type FacebookAnalytics = {
  syncedAt: string;
  source?: "live" | "cache";
  page: {
    id: string;
    name: string;
    slug: string;
    permalink: string;
    followers: number;
    followersLabel: string;
    talkingAbout: number;
  };
  kpis: {
    followers: number;
    totalPosts: number;
    avgLikes: number;
    avgComments: number;
    avgShares: number;
    engagementRate: number;
  };
  recentPosts: FacebookPostAnalytics[];
  topPosts: FacebookPostAnalytics[];
};

function getApiBase() {
  return (requireFanAppApiBase()).replace(/\/$/, "");
}

async function fetchJsonAnalytics(url: string, { allowEmpty = false } = {}): Promise<FacebookAnalytics | null> {
  const response = await fetch(url, { cache: "no-store" });
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.includes("application/json")) return null;
  const data = (await response.json()) as FacebookAnalytics & { ok?: boolean };
  if (!data?.kpis) return null;
  if (isDameFacebookAnalytics(data)) return null;
  const hasEngagement =
    Number(data.kpis.avgLikes ?? 0) + Number(data.kpis.avgComments ?? 0) + Number(data.kpis.avgShares ?? 0) > 0;
  if (!allowEmpty && !hasEngagement && data.source === "cache") return null;
  return data;
}

export function normalizePost(post: {
  id: string;
  text?: string;
  permalink?: string;
  createdAt?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  stats?: { likes?: number; comments?: number; shares?: number };
}): FacebookPostAnalytics {
  return {
    id: post.id,
    text: post.text?.trim() || "Facebook post",
    permalink: post.permalink || "",
    createdAt: post.createdAt || new Date().toISOString(),
    likes: Number(post.likes ?? post.stats?.likes ?? 0),
    comments: Number(post.comments ?? post.stats?.comments ?? 0),
    shares: Number(post.shares ?? post.stats?.shares ?? 0),
  };
}

export function buildFacebookAnalyticsFromPosts(
  posts: FacebookPostAnalytics[],
  page?: Partial<FacebookAnalytics["page"]>,
): FacebookAnalytics | null {
  if (!posts.length) return null;

  const recentPosts = posts.slice(0, 12);
  const topPosts = [...posts]
    .sort((a, b) => b.likes + b.comments + b.shares - (a.likes + a.comments + a.shares))
    .slice(0, 8);
  const totalLikes = posts.reduce((sum, post) => sum + post.likes, 0);
  const totalComments = posts.reduce((sum, post) => sum + post.comments, 0);
  const totalShares = posts.reduce((sum, post) => sum + post.shares, 0);
  const count = posts.length;
  const avgLikes = Math.round(totalLikes / count);
  const avgComments = Math.round(totalComments / count);
  const avgShares = Math.round(totalShares / count);
  const followers = Number(page?.followers ?? 0);

  return {
    syncedAt: new Date().toISOString(),
    source: "cache",
    page: {
      id: page?.id ?? "",
      name: page?.name ?? "",
      slug: page?.slug ?? "",
      permalink: page?.permalink ?? "",
      followers,
      followersLabel:
        page?.followersLabel ??
        (followers ? `${formatMetric(followers, true)} followers` : "Followers unavailable"),
      talkingAbout: Number(page?.talkingAbout ?? 0),
    },
    kpis: {
      followers,
      totalPosts: count,
      avgLikes,
      avgComments,
      avgShares,
      engagementRate:
        followers > 0
          ? Math.round(((avgLikes + avgComments + avgShares) / followers) * 10_000) / 100
          : 0,
    },
    recentPosts,
    topPosts,
  };
}

export async function fetchFacebookAnalytics(): Promise<FacebookAnalytics | null> {
  const slug = await resolveSocialHandle("facebook");
  if (!slug) return null;

  const base = getApiBase();
  const q = encodeURIComponent(slug);
  const urls = [
    `${base}/api/social/analytics?source=facebook&page=${q}&refresh=1`,
    `${base}/api/facebook/analytics?page=${q}`,
    `${base}/api/facebook-analytics?page=${q}`,
  ];

  for (const url of urls) {
    try {
      const data = await fetchJsonAnalytics(url);
      if (!data || isDameFacebookAnalytics(data)) continue;
      if (!handleMatches(slug, data.page?.slug) && !handleMatches(slug, data.page?.id)) continue;
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

export function textPreview(text: string, max = 80) {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return "Facebook post";
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}
