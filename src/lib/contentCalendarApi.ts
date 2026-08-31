import { requireFanAppApiBase } from "./fanAppApiBase";
export type CalendarChannel =
  | "news"
  | "video"
  | "music"
  | "event"
  | "giveaway"
  | "notification"
  | "live"
  | "instagram"
  | "youtube"
  | "facebook"
  | "twitter";

export type CalendarEntry = {
  id: string;
  channel: CalendarChannel;
  title: string;
  subtitle: string;
  href: string;
  thumbnail: string;
  at: string;
  dayKey: string;
  status: string;
};

export type ContentCalendarResponse = {
  syncedAt: string;
  counts: Record<CalendarChannel | "all", number>;
  entries: CalendarEntry[];
};

function getApiBase() {
  return (requireFanAppApiBase()).replace(/\/$/, "");
}

function getAdminSecret() {
  return import.meta.env.VITE_ADMIN_EXPORT_SECRET?.trim() ?? "";
}

export async function fetchContentCalendar(): Promise<ContentCalendarResponse> {
  const secret = getAdminSecret();
  if (!secret) {
    throw new Error("Set VITE_ADMIN_EXPORT_SECRET to load the live content calendar");
  }

  const response = await fetch(`${getApiBase()}/api/admin/analytics?view=calendar`, {
    headers: { "x-admin-secret": secret },
  });
  const data = (await response.json()) as ContentCalendarResponse & { error?: string; ok?: boolean };
  if (!response.ok) {
    throw new Error(data.error || `Calendar request failed (${response.status})`);
  }

  const entries = Array.isArray(data.entries) ? data.entries : [];
  const emptyCounts = {
    all: entries.length,
    news: 0,
    video: 0,
    music: 0,
    event: 0,
    giveaway: 0,
    notification: 0,
    live: 0,
    instagram: 0,
    youtube: 0,
    facebook: 0,
    twitter: 0,
  } satisfies Record<CalendarChannel | "all", number>;

  return {
    syncedAt: data.syncedAt || new Date().toISOString(),
    counts: { ...emptyCounts, ...(data.counts ?? {}) },
    entries,
  };
}

export function channelLabel(channel: CalendarChannel | "all"): string {
  switch (channel) {
    case "all":
      return "All";
    case "news":
      return "News";
    case "video":
      return "Videos";
    case "music":
      return "Shop";
    case "event":
      return "Events";
    case "giveaway":
      return "Giveaways";
    case "notification":
      return "Alerts";
    case "live":
      return "Live";
    case "instagram":
      return "Instagram";
    case "youtube":
      return "YouTube";
    case "facebook":
      return "Facebook";
    case "twitter":
      return "X";
    default:
      return channel;
  }
}

export function channelTone(channel: CalendarChannel): string {
  switch (channel) {
    case "news":
      return "bg-sky-500/20 text-sky-300 border-sky-500/30";
    case "video":
      return "bg-violet-500/20 text-violet-300 border-violet-500/30";
    case "music":
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    case "event":
      return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    case "giveaway":
      return "bg-pink-500/20 text-pink-300 border-pink-500/30";
    case "notification":
      return "bg-orange-500/20 text-orange-300 border-orange-500/30";
    case "live":
      return "bg-dt-red/20 text-dt-red border-dt-red/35";
    case "instagram":
      return "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30";
    case "youtube":
      return "bg-red-500/20 text-red-300 border-red-500/30";
    case "facebook":
      return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    case "twitter":
      return "bg-white/10 text-white/80 border-white/20";
    default:
      return "bg-white/10 text-white/70 border-white/15";
  }
}

export function formatCalendarDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "—", time: "" };
  return {
    date: d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

export function monthLabel(year: number, monthIndex: number) {
  return new Date(year, monthIndex, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}
