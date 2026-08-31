import { requireFanAppApiBase } from "./fanAppApiBase";
import type { TitleFontFamily, TitleFontSize } from "./typography";

export type EventKind = "event" | "giveaway";
export type EventStatus = "draft" | "published";

export type AppEventItem = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  href: string;
  type: EventKind;
  deadline: string;
  deadlineDisplay: string;
  location: string;
  dateLabel: string;
  status: EventStatus;
  enabled: boolean;
  order: number;
  publishedAt: string;
  source: "manual";
  titleFontFamily?: TitleFontFamily;
  titleFontSize?: TitleFontSize;
};

export type EventsFeed = {
  version: number;
  updatedAt: string;
  items: AppEventItem[];
};

function getApiBase() {
  return (requireFanAppApiBase()).replace(/\/$/, "");
}

function getAdminSecret() {
  return import.meta.env.VITE_ADMIN_EXPORT_SECRET?.trim() ?? "";
}

async function eventsRequest(init?: RequestInit) {
  const secret = getAdminSecret();
  const headers = new Headers(init?.headers);
  if (secret) headers.set("x-admin-secret", secret);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${getApiBase()}/api/admin/analytics?view=events`, {
    ...init,
    headers,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `Events request failed (${response.status})`);
  }
  return data;
}

export async function fetchEventsFeed(): Promise<EventsFeed> {
  const data = (await eventsRequest()) as { feed: EventsFeed };
  return data.feed;
}

export async function publishEventsFeed(feed: EventsFeed): Promise<EventsFeed> {
  if (!getAdminSecret()) throw new Error("Set VITE_ADMIN_EXPORT_SECRET to publish events");
  const data = (await eventsRequest({
    method: "POST",
    body: JSON.stringify({ action: "publish", feed }),
  })) as { feed: EventsFeed };
  return data.feed;
}

export async function upsertEventItem(item: AppEventItem): Promise<EventsFeed> {
  if (!getAdminSecret()) throw new Error("Set VITE_ADMIN_EXPORT_SECRET to save events");
  const data = (await eventsRequest({
    method: "POST",
    body: JSON.stringify({ action: "upsert", item }),
  })) as { feed: EventsFeed };
  return data.feed;
}

export async function deleteEventItem(id: string): Promise<EventsFeed> {
  if (!getAdminSecret()) throw new Error("Set VITE_ADMIN_EXPORT_SECRET to delete events");
  const data = (await eventsRequest({
    method: "POST",
    body: JSON.stringify({ action: "delete", id }),
  })) as { feed: EventsFeed };
  return data.feed;
}

export function createEmptyEventItem(type: EventKind = "event"): AppEventItem {
  const now = new Date();
  return {
    id: `${type}-${now.getTime().toString(36)}`,
    title: "",
    description: "",
    thumbnail: "/images/eventsbackground.png",
    href: "",
    type,
    deadline: "",
    deadlineDisplay: "",
    location: "",
    dateLabel: "",
    status: "draft",
    enabled: true,
    order: 0,
    publishedAt: now.toISOString(),
    source: "manual",
  };
}

export function resolveEventAssetUrl(src: string) {
  if (!src) return "";
  if (src.startsWith("data:") || src.startsWith("http://") || src.startsWith("https://")) return src;
  return `${getApiBase()}${src.startsWith("/") ? "" : "/"}${src}`;
}

export function toLocalInputValue(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInputValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

export function formatDeadlineDisplay(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
