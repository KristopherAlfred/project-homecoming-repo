import { requireFanAppApiBase } from "./fanAppApiBase";
import type { TitleFontFamily, TitleFontSize } from "./typography";

export type NewsCategory = "newsletters" | "insights" | "news";
export type NewsStatus = "draft" | "published";

export type NewsItem = {
  id: string;
  title: string;
  description: string;
  body: string;
  thumbnail: string;
  date: string;
  publishedAt: string;
  category: NewsCategory;
  href: string;
  status: NewsStatus;
  order: number;
  source: "manual" | "players_tribune";
  titleFontFamily?: TitleFontFamily;
  titleFontSize?: TitleFontSize;
};

export type NewsFeed = {
  version: number;
  updatedAt: string;
  items: NewsItem[];
};

function getApiBase() {
  return (requireFanAppApiBase()).replace(/\/$/, "");
}

function getAdminSecret() {
  return import.meta.env.VITE_ADMIN_EXPORT_SECRET?.trim() ?? "";
}

async function newsRequest(init?: RequestInit) {
  const secret = getAdminSecret();
  const headers = new Headers(init?.headers);
  if (secret) headers.set("x-admin-secret", secret);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${getApiBase()}/api/admin/analytics?view=news`, {
    ...init,
    headers,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `News request failed (${response.status})`);
  }
  return data;
}

export async function fetchNewsFeed(): Promise<NewsFeed> {
  const data = (await newsRequest()) as { feed: NewsFeed };
  return data.feed;
}

export async function publishNewsFeed(feed: NewsFeed): Promise<NewsFeed> {
  if (!getAdminSecret()) throw new Error("Set VITE_ADMIN_EXPORT_SECRET to publish news");
  const data = (await newsRequest({
    method: "POST",
    body: JSON.stringify({ action: "publish", feed }),
  })) as { feed: NewsFeed };
  return data.feed;
}

export async function upsertNewsItem(item: NewsItem): Promise<NewsFeed> {
  if (!getAdminSecret()) throw new Error("Set VITE_ADMIN_EXPORT_SECRET to save news");
  const data = (await newsRequest({
    method: "POST",
    body: JSON.stringify({ action: "upsert", item }),
  })) as { feed: NewsFeed };
  return data.feed;
}

export async function deleteNewsItem(id: string): Promise<NewsFeed> {
  if (!getAdminSecret()) throw new Error("Set VITE_ADMIN_EXPORT_SECRET to delete news");
  const data = (await newsRequest({
    method: "POST",
    body: JSON.stringify({ action: "delete", id }),
  })) as { feed: NewsFeed };
  return data.feed;
}

export function createEmptyNewsItem(category: NewsCategory = "newsletters"): NewsItem {
  const now = new Date();
  return {
    id: `newsletter-${now.getTime().toString(36)}`,
    title: "",
    description: "",
    body: "",
    thumbnail: "",
    date: now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    publishedAt: now.toISOString(),
    category,
    href: "",
    status: "draft",
    order: 0,
    source: "manual",
  };
}

export function resolveNewsAssetUrl(src: string) {
  if (!src) return "";
  if (src.startsWith("data:") || src.startsWith("http://") || src.startsWith("https://")) return src;
  return `${getApiBase()}${src.startsWith("/") ? "" : "/"}${src}`;
}
