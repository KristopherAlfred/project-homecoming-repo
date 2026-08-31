import { requireFanAppApiBase } from "./fanAppApiBase";
import { isDameInstagramAnalytics } from "./legacySocialGuards";
import { handleMatches, resolveSocialHandle } from "./socialSources";


export type InstagramPostAnalytics = {
  id: string;
  code: string;
  caption: string;
  likes: number;
  comments: number;
  mediaType: "image" | "video" | "carousel" | "unknown";
  thumbnailUrl: string;
  image?: string;
  permalink: string;
  takenAt: string;
};

export type InstagramAnalytics = {
  syncedAt: string;
  source?: "live" | "cache";
  profile: {
    username: string;
    fullName: string;
    biography: string;
    profilePicUrl: string;
    profilePicImage?: string;
    followers: number;
    following: number;
    posts: number;
    isVerified: boolean;
    externalUrl: string | null;
    permalink: string;
  };
  kpis: {
    followers: number;
    following: number;
    totalPosts: number;
    avgLikes: number;
    avgComments: number;
    engagementRate: number;
  };
  recentPosts: InstagramPostAnalytics[];
  topPosts: InstagramPostAnalytics[];
};

function getApiBase() {
  return (requireFanAppApiBase()).replace(/\/$/, "");
}

function proxiedCdnUrl(url: string) {
  return `${getApiBase()}/api/instagram/image?url=${encodeURIComponent(url)}`;
}

export function instagramPostImage(post: InstagramPostAnalytics) {
  if (post.image) return `${getApiBase()}${post.image}`;
  if (post.thumbnailUrl.includes("cdninstagram.com") || post.thumbnailUrl.includes("fbcdn.net")) {
    return proxiedCdnUrl(post.thumbnailUrl);
  }
  return post.thumbnailUrl;
}

export function instagramProfileImage(profile: InstagramAnalytics["profile"]) {
  if (profile.profilePicImage) return `${getApiBase()}${profile.profilePicImage}`;
  if (
    profile.profilePicUrl.includes("cdninstagram.com") ||
    profile.profilePicUrl.includes("fbcdn.net")
  ) {
    return proxiedCdnUrl(profile.profilePicUrl);
  }
  return profile.profilePicUrl;
}

async function readInstagramAnalytics(url: string): Promise<InstagramAnalytics | null> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    const data = (await response.json()) as InstagramAnalytics & { ok?: boolean };
    if (!data?.kpis) return null;
    if (isDameInstagramAnalytics(data)) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Live Instagram analytics for the logged-in athlete only. Returns `null` when
 * they have not connected Instagram, or when the API answers with a different
 * account — never falls back to another athlete's cached data.
 */
export async function fetchInstagramAnalytics(): Promise<InstagramAnalytics | null> {
  const username = await resolveSocialHandle("instagram");
  if (!username) return null;

  const base = getApiBase();
  const urls = [
    `${base}/api/social/analytics?source=instagram&username=${encodeURIComponent(username)}&refresh=1`,
    `${base}/api/instagram/analytics?username=${encodeURIComponent(username)}&refresh=1`,
  ];

  for (const url of urls) {
    const data = await readInstagramAnalytics(url);
    if (!data) continue;
    if (!handleMatches(username, data.profile?.username)) continue;
    return data;
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

export function captionPreview(caption: string, max = 80) {
  const trimmed = caption.trim().replace(/\s+/g, " ");
  if (!trimmed) return "No caption";
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

export function mediaTypeLabel(type: InstagramPostAnalytics["mediaType"]) {
  if (type === "video") return "Reel";
  if (type === "carousel") return "Album";
  if (type === "image") return "Photo";
  return "Post";
}
