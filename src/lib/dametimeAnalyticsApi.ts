import { requireFanAppApiBase } from "./fanAppApiBase";
export type DametimeAnalyticsKpis = {
  totalFans: number;
  emailCaptures: number;
  smsOptIns: number;
  totalEvents: number;
  totalClicks: number;
  pageViews: number;
  signups: number;
  activeFans7d: number;
  engagementRate: number;
  totalPoints: number;
  avgPoints: number;
};

export type DametimeAnalyticsEventPoint = {
  date: string;
  label: string;
  events: number;
  pageViews: number;
  clicks?: number;
  navClicks?: number;
};

export type DametimeAnalyticsEventType = {
  type: string;
  label: string;
  count: number;
};

export type DametimeAnalyticsTopUser = {
  email: string;
  name: string | null;
  username: string | null;
  points: number;
  eventCount: number;
};

export type DametimeAnalyticsTopTarget = {
  target: string;
  label: string;
  count: number;
};

export type DametimeAnalyticsYoutubeClick = {
  target: string;
  videoId: string;
  label: string;
  count: number;
};

export type DametimeAnalyticsActivity = {
  email: string;
  displayName: string;
  eventType: string;
  action: string;
  target: string | null;
  at: string;
};

export type DametimeAnalyticsGeo = {
  totalFans: number;
  mappedFans: number;
  countries: {
    country: string;
    flag: string;
    pct: number;
    count: number;
    countryCode?: string;
  }[];
  points: {
    lat: number;
    lng: number;
    count: number;
    label: string;
    countryCode?: string | null;
    countryName?: string | null;
  }[];
};

export type DametimeAnalytics = {
  syncedAt: string;
  kpis: DametimeAnalyticsKpis;
  eventsOverTime: DametimeAnalyticsEventPoint[];
  eventTypes: DametimeAnalyticsEventType[];
  topUsers: DametimeAnalyticsTopUser[];
  topByPoints?: DametimeAnalyticsTopUser[];
  topTargets: DametimeAnalyticsTopTarget[];
  youtubeClicks?: DametimeAnalyticsYoutubeClick[];
  recentActivity: DametimeAnalyticsActivity[];
  geo: DametimeAnalyticsGeo;
};

function getApiBase() {
  return (requireFanAppApiBase()).replace(/\/$/, "");
}

function getAdminSecret() {
  return import.meta.env.VITE_ADMIN_EXPORT_SECRET?.trim() ?? "";
}

export type AnalyticsTimeRange = {
  /** Days back (1–365), "all" for all time, or undefined for the default 14. */
  days?: number | "all";
  /** Custom range as YYYY-MM-DD — takes priority over days. */
  from?: string;
  to?: string;
};

export async function fetchDametimeAnalytics(
  fanEmail?: string,
  range?: AnalyticsTimeRange,
): Promise<DametimeAnalytics> {
  const secret = getAdminSecret();
  if (!secret) {
    throw new Error(
      "Set VITE_ADMIN_EXPORT_SECRET on the dashboard (must match the fan app ADMIN_EXPORT_SECRET), then redeploy.",
    );
  }

  const params = new URLSearchParams();
  const fan = fanEmail?.trim().toLowerCase();
  if (fan) params.set("fan", fan);
  if (range?.from) {
    params.set("from", range.from);
    if (range.to) params.set("to", range.to);
  } else if (range?.days != null) {
    params.set("days", String(range.days));
  }
  // Bust intermediary caches so loyalty points stay current on each poll.
  params.set("_", String(Date.now()));
  const query = params.toString();
  let response: Response;
  try {
    // Only send x-admin-secret — extra headers like cache-control fail CORS preflight.
    response = await fetch(`${getApiBase()}/api/admin/analytics${query ? `?${query}` : ""}`, {
      headers: {
        "x-admin-secret": secret,
      },
      cache: "no-store",
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "network error";
    throw new Error(
      `Failed to reach fan app API (${getApiBase()}). ${detail}. If this keeps happening, confirm VITE_DAME_BIO_API_URL and that ADMIN_EXPORT_SECRET matches on both apps.`,
    );
  }
  if (response.status === 401) {
    throw new Error(
      "Unauthorized — dashboard VITE_ADMIN_EXPORT_SECRET does not match the fan app ADMIN_EXPORT_SECRET (redeploy after updating).",
    );
  }
  if (!response.ok) {
    throw new Error(`fan app analytics unavailable (${response.status}).`);
  }
  const data = (await response.json()) as DametimeAnalytics & { ok?: boolean };
  if (!data?.kpis) {
    throw new Error("fan app analytics returned an unexpected payload.");
  }
  return {
    ...data,
    kpis: {
      ...data.kpis,
      totalPoints: Number(data.kpis.totalPoints) || 0,
      avgPoints: Number(data.kpis.avgPoints) || 0,
    },
    topByPoints: Array.isArray(data.topByPoints) ? data.topByPoints : data.topUsers,
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
  return `${days}d ago`;
}

export function initialsFromName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return value.slice(0, 2).toUpperCase();
}
