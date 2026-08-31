import { requireFanAppApiBase } from "./fanAppApiBase";
export type NotificationStatus = "draft" | "published";
export type NotificationSurface = "all" | "home";

export type AppNotification = {
  id: string;
  message: string;
  status: NotificationStatus;
  enabled: boolean;
  frequencySeconds: number;
  displayDurationMs: number;
  scheduleStart: string | null;
  scheduleEnd: string | null;
  surface: NotificationSurface;
  order: number;
};

export type NotificationFeed = {
  version: number;
  updatedAt: string;
  items: AppNotification[];
};

function getApiBase() {
  return (requireFanAppApiBase()).replace(/\/$/, "");
}

function getAdminSecret() {
  return import.meta.env.VITE_ADMIN_EXPORT_SECRET?.trim() ?? "";
}

async function notificationsRequest(init?: RequestInit) {
  const secret = getAdminSecret();
  const headers = new Headers(init?.headers);
  if (secret) headers.set("x-admin-secret", secret);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${getApiBase()}/api/admin/analytics?view=notifications`, {
    ...init,
    headers,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `Notifications request failed (${response.status})`);
  }
  return data;
}

export async function fetchNotificationFeed(): Promise<NotificationFeed> {
  const data = (await notificationsRequest()) as { feed: NotificationFeed };
  return data.feed;
}

export async function publishNotificationFeed(feed: NotificationFeed): Promise<NotificationFeed> {
  if (!getAdminSecret()) throw new Error("Set VITE_ADMIN_EXPORT_SECRET to publish notifications");
  const data = (await notificationsRequest({
    method: "POST",
    body: JSON.stringify({ action: "publish", feed }),
  })) as { feed: NotificationFeed };
  return data.feed;
}

export async function upsertNotificationItem(item: AppNotification): Promise<NotificationFeed> {
  if (!getAdminSecret()) throw new Error("Set VITE_ADMIN_EXPORT_SECRET to save notifications");
  const data = (await notificationsRequest({
    method: "POST",
    body: JSON.stringify({ action: "upsert", item }),
  })) as { feed: NotificationFeed };
  return data.feed;
}

export async function deleteNotificationItem(id: string): Promise<NotificationFeed> {
  if (!getAdminSecret()) throw new Error("Set VITE_ADMIN_EXPORT_SECRET to delete notifications");
  const data = (await notificationsRequest({
    method: "POST",
    body: JSON.stringify({ action: "delete", id }),
  })) as { feed: NotificationFeed };
  return data.feed;
}

export function createEmptyNotification(): AppNotification {
  return {
    id: `notice-${Date.now().toString(36)}`,
    message: "",
    status: "draft",
    enabled: true,
    frequencySeconds: 30,
    displayDurationMs: 3000,
    scheduleStart: null,
    scheduleEnd: null,
    surface: "all",
    order: 0,
  };
}

export function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInputValue(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
