import {
  fetchFollowerSnapshots,
  fetchPlatformConnections,
  type FollowerSnapshot,
  type PlatformConnection,
} from "./platformConnections";

export type PlatformShare = {
  name: string;
  followers: number;
  value: number;
};

export type OverviewKpi = {
  label: string;
  value: string;
  change: string;
  icon: "users" | "user-check" | "mail" | "heart" | "eye" | "trending-up";
};

export type OverviewMetrics = {
  syncedAt: string;
  overallFollowers: number;
  platformShares: PlatformShare[];
  kpis: OverviewKpi[];
  audienceSnapshot: Array<{ label: string; value: string }>;
  followersOverTime: Array<{ date: string; followers: number }>;
};

export function formatMetric(value: number, compact = false) {
  if (!Number.isFinite(value)) return "—";
  if (compact) {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return value.toLocaleString();
}

function pctShare(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10;
}

function buildPlatformShares(
  platforms: Array<{ name: string; followers: number }>,
): PlatformShare[] {
  const total = platforms.reduce((sum, platform) => sum + platform.followers, 0);
  return platforms.map((platform) => ({
    name: platform.name,
    followers: platform.followers,
    value: pctShare(platform.followers, total),
  }));
}

/* ------------------------------------------------------------------ */
/* Connector-backed metrics (Lovable Cloud `platform_connections`)      */
/* — the only source of truth for the overview surfaces. Nothing here */
/* is ever fabricated: an athlete with no connections gets `null`.    */
/* ------------------------------------------------------------------ */

function formatDayLabel(iso: string) {
  const date = new Date(`${iso}T00:00:00Z`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function buildHistoryFromSnapshots(
  snapshots: FollowerSnapshot[],
  platforms: string[],
): Array<{ date: string; followers: number }> {
  const allowed = new Set(platforms);
  const byDate = new Map<string, number>();
  for (const snapshot of snapshots) {
    if (!allowed.has(snapshot.platform)) continue;
    byDate.set(
      snapshot.captured_on,
      (byDate.get(snapshot.captured_on) ?? 0) + Number(snapshot.follower_count ?? 0),
    );
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, followers]) => ({ date: formatDayLabel(date), followers }));
}

function changeLabel(current: number, previous: number | undefined) {
  if (!previous || previous <= 0 || !current) return "No history yet";
  const pct = ((current - previous) / previous) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

const KPI_ICONS: OverviewKpi["icon"][] = [
  "users",
  "user-check",
  "heart",
  "eye",
  "trending-up",
  "mail",
];

export function buildConnectorMetrics(
  connections: PlatformConnection[],
  snapshots: FollowerSnapshot[],
): OverviewMetrics | null {
  const connected = connections.filter(
    (c) => c.connected && typeof c.follower_count === "number" && (c.follower_count ?? 0) > 0,
  );
  if (connected.length === 0) return null;

  const platformKeys = connected.map((c) => c.platform);
  const overallFollowers = connected.reduce((sum, c) => sum + (c.follower_count ?? 0), 0);

  // Per-platform change from the earliest snapshot in range.
  const firstByPlatform = new Map<string, number>();
  for (const snapshot of snapshots) {
    if (!firstByPlatform.has(snapshot.platform)) {
      firstByPlatform.set(snapshot.platform, Number(snapshot.follower_count ?? 0));
    }
  }

  const history = buildHistoryFromSnapshots(snapshots, platformKeys);
  const overallStart = history.length > 1 ? history[0].followers : undefined;

  const kpis: OverviewKpi[] = [
    {
      label: "Overall Followers",
      value: formatMetric(overallFollowers, true),
      change: changeLabel(overallFollowers, overallStart),
      icon: "users",
    },
    ...connected.slice(0, 5).map((c, index) => ({
      label: c.display_name,
      value: formatMetric(c.follower_count ?? 0, true),
      change: changeLabel(c.follower_count ?? 0, firstByPlatform.get(c.platform)),
      icon: KPI_ICONS[index % KPI_ICONS.length],
    })),
  ];

  const latestSync = connected
    .map((c) => c.last_synced_at)
    .filter((value): value is string => Boolean(value))
    .sort()
    .reverse()[0];

  return {
    syncedAt: latestSync ?? new Date().toISOString(),
    overallFollowers,
    platformShares: buildPlatformShares(
      connected.map((c) => ({ name: c.display_name, followers: c.follower_count ?? 0 })),
    ),
    kpis,
    audienceSnapshot: [
      ...connected.map((c) => ({
        label: `${c.display_name} Followers`,
        value: formatMetric(c.follower_count ?? 0),
      })),
      { label: "Platforms Connected", value: String(connected.length) },
      {
        label: "History Points",
        value: history.length ? String(history.length) : "Awaiting first snapshot",
      },
    ],
    // Never blend synthetic history alongside real connector data.
    followersOverTime: history.length > 1 ? history : [],
  };
}

export async function fetchConnectorOverviewMetrics(): Promise<OverviewMetrics | null> {
  const [connections, snapshots] = await Promise.all([
    fetchPlatformConnections(),
    fetchFollowerSnapshots(90).catch(() => [] as FollowerSnapshot[]),
  ]);
  return buildConnectorMetrics(connections, snapshots);
}

/** `null` whenever this athlete has no live connected platforms — never fabricated numbers. */
export async function fetchOverviewMetrics(): Promise<OverviewMetrics | null> {
  try {
    return await fetchConnectorOverviewMetrics();
  } catch (error) {
    console.warn("Connector metrics unavailable", error);
    return null;
  }
}
