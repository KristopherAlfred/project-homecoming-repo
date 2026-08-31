import { requireFanAppApiBase } from "./fanAppApiBase";
import type { TitleFontFamily, TitleFontSize } from "./typography";

export type VideoStatus = "draft" | "published";

export type ExclusiveVideoItem = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  duration: string;
  date: string;
  publishedAt: string;
  status: VideoStatus;
  order: number;
  source: "manual";
  titleFontFamily?: TitleFontFamily;
  titleFontSize?: TitleFontSize;
};

export type ExclusiveVideoFeed = {
  version: number;
  updatedAt: string;
  items: ExclusiveVideoItem[];
};

function getApiBase() {
  return (requireFanAppApiBase()).replace(/\/$/, "");
}

function getAdminSecret() {
  return import.meta.env.VITE_ADMIN_EXPORT_SECRET?.trim() ?? "";
}

async function videosRequest(init?: RequestInit) {
  const secret = getAdminSecret();
  const headers = new Headers(init?.headers);
  if (secret) headers.set("x-admin-secret", secret);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${getApiBase()}/api/admin/analytics?view=videos`, {
    ...init,
    headers,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `Videos request failed (${response.status})`);
  }
  return data;
}

export async function fetchVideoFeed(): Promise<ExclusiveVideoFeed> {
  const data = (await videosRequest()) as { feed: ExclusiveVideoFeed };
  return data.feed;
}

export async function publishVideoFeed(feed: ExclusiveVideoFeed): Promise<ExclusiveVideoFeed> {
  if (!getAdminSecret()) throw new Error("Set VITE_ADMIN_EXPORT_SECRET to publish videos");
  const data = (await videosRequest({
    method: "POST",
    body: JSON.stringify({ action: "publish", feed }),
  })) as { feed: ExclusiveVideoFeed };
  return data.feed;
}

export async function upsertVideoItem(item: ExclusiveVideoItem): Promise<ExclusiveVideoFeed> {
  if (!getAdminSecret()) throw new Error("Set VITE_ADMIN_EXPORT_SECRET to save videos");
  const data = (await videosRequest({
    method: "POST",
    body: JSON.stringify({ action: "upsert", item }),
  })) as { feed: ExclusiveVideoFeed };
  return data.feed;
}

export async function deleteVideoItem(id: string): Promise<ExclusiveVideoFeed> {
  if (!getAdminSecret()) throw new Error("Set VITE_ADMIN_EXPORT_SECRET to delete videos");
  const data = (await videosRequest({
    method: "POST",
    body: JSON.stringify({ action: "delete", id }),
  })) as { feed: ExclusiveVideoFeed };
  return data.feed;
}

export function createEmptyVideoItem(): ExclusiveVideoItem {
  const now = new Date();
  return {
    id: `exclusive-${now.getTime().toString(36)}`,
    title: "",
    description: "",
    thumbnail: "",
    videoUrl: "",
    duration: "",
    date: now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    publishedAt: now.toISOString(),
    status: "draft",
    order: 0,
    source: "manual",
  };
}

export function resolveVideoAssetUrl(src: string) {
  if (!src) return "";
  if (src.startsWith("data:") || src.startsWith("http://") || src.startsWith("https://")) return src;
  return `${getApiBase()}${src.startsWith("/") ? "" : "/"}${src}`;
}

export function extractYoutubeId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^[a-zA-Z0-9_-]{6,}$/.test(trimmed) && !trimmed.includes("/")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace(/^\//, "").split("/")[0] || null;
    }
    const v = parsed.searchParams.get("v");
    if (v) return v;
    const parts = parsed.pathname.split("/").filter(Boolean);
    const embedIdx = parts.findIndex((p) => p === "embed" || p === "shorts" || p === "live");
    if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1];
  } catch {
    /* ignore */
  }
  const match = trimmed.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([a-zA-Z0-9_-]{6,})/);
  return match?.[1] ?? null;
}
