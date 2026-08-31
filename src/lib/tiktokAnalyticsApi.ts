import { requireFanAppApiBase } from "./fanAppApiBase";
import { handleMatches, resolveSocialHandle } from "./socialSources";

export type TikTokVideoAnalytics = {
  id: string;
  caption: string;
  permalink: string;
  createdAt: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  cover: string;
};

export type TikTokAnalytics = {
  syncedAt: string;
  source?: "live" | "cache";
  profile: {
    id: string;
    username: string;
    nickname: string;
    handle: string;
    permalink: string;
    biography: string;
    avatar: string;
    verified: boolean;
    followers: number;
    followersLabel: string;
    following: number;
    likes: number;
    videoCount: number;
  };
  kpis: {
    followers: number;
    following: number;
    totalLikes: number;
    totalVideos: number;
    sampledVideos: number;
    avgViews: number;
    avgLikes: number;
    engagementRate: number;
  };
  recentVideos: TikTokVideoAnalytics[];
  topVideos: TikTokVideoAnalytics[];
};

function getApiBase() {
  return (requireFanAppApiBase()).replace(/\/$/, "");
}

function isDameTikTokAnalytics(data: TikTokAnalytics | null | undefined) {
  if (!data?.profile) return false;
  const username = String(data.profile.username || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
  return username === "damianlillard" || username === "dame_lillard";
}

async function fetchJsonAnalytics(
  url: string,
  { allowEmpty = false } = {},
): Promise<TikTokAnalytics | null> {
  const response = await fetch(url, { cache: "no-store" });
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.includes("application/json")) return null;
  const data = (await response.json()) as TikTokAnalytics & { ok?: boolean };
  if (!data?.kpis) return null;
  if (isDameTikTokAnalytics(data)) return null;
  const hasSignal =
    Number(data.kpis.followers ?? 0) > 0 ||
    Number(data.kpis.avgViews ?? 0) > 0 ||
    (data.recentVideos?.length ?? 0) > 0;
  if (!allowEmpty && !hasSignal && data.source === "cache") return null;
  return data;
}

export async function fetchTikTokAnalytics(): Promise<TikTokAnalytics | null> {
  const username = await resolveSocialHandle("tiktok");
  if (!username) return null;

  const base = getApiBase();
  const q = encodeURIComponent(username);
  const urls = [
    `${base}/api/social/analytics?source=tiktok&username=${q}&refresh=1`,
    `${base}/api/tiktok/analytics?username=${q}`,
  ];

  for (const url of urls) {
    try {
      const data = await fetchJsonAnalytics(url);
      if (!data) continue;
      if (!handleMatches(username, data.profile?.username)) continue;
      return data;
    } catch {
      // try next
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

export function captionPreview(caption: string, max = 80) {
  const trimmed = caption
    .replace(/\s+created by .* with .*$/i, "")
    .trim()
    .replace(/\s+/g, " ");
  if (!trimmed) return "TikTok video";
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

export function tiktokProfileImage(profile: TikTokAnalytics["profile"]) {
  return profile.avatar || "";
}

export function tiktokVideoCover(video: TikTokVideoAnalytics) {
  return video.cover || "";
}

