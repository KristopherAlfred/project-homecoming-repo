import type { OverviewMetrics } from "./overviewAnalytics";
import { formatMetric } from "./overviewAnalytics";
import type { ContentViewsBreakdown } from "./contentViews";
import type { EngagementBreakdown } from "./engagementRates";
import type { PlatformConnection } from "./platformConnections";

export type StatIcon = "users" | "user-check" | "mail" | "heart" | "eye" | "trending-up";

export type DashboardStat = {
  label: string;
  /** Platform keys (from `platform_connections.platform`) this stat needs. */
  requires: string[];
  /** Human label of the missing source, shown when disconnected. */
  icon: StatIcon;
  value: string;
  hint: string;
  connected: boolean;
};

const NOT_CONNECTED = "Not connected";
const AWAITING = "Awaiting sync";

function isConnected(connections: PlatformConnection[], keys: string[]) {
  if (keys.length === 0) return connections.some((c) => c.connected);
  return keys.some((key) =>
    connections.some((c) => c.connected && c.platform.toLowerCase() === key),
  );
}

function growthLabel(metrics: OverviewMetrics | null) {
  const history = metrics?.followersOverTime ?? [];
  if (history.length < 2) return null;
  const first = history[0].followers;
  const last = history[history.length - 1].followers;
  if (!first) return null;
  const pct = ((last - first) / first) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

/**
 * Each stat independently checks whether its own data source is connected.
 * A stat whose source is missing always renders "—" / "Not connected" —
 * never a zero or placeholder number.
 */
export function buildDashboardStats(
  connections: PlatformConnection[],
  metrics: OverviewMetrics | null,
  contentViews?: ContentViewsBreakdown | null,
  engagement?: EngagementBreakdown | null,
): DashboardStat[] {
  const anyConnected = connections.some((c) => c.connected);
  const connectedList = connections.filter((c) => c.connected);
  const growth = growthLabel(metrics);

  const stats: Array<Omit<DashboardStat, "connected" | "value" | "hint"> & {
    resolve: () => { value: string; hint: string };
  }> = [
    {
      label: "Total Followers",
      requires: [],
      icon: "users",
      resolve: () => ({
        value: metrics ? formatMetric(metrics.overallFollowers, true) : AWAITING,
        hint: growth ?? "No history yet",
      }),
    },
    {
      label: "Follower Growth",
      requires: [],
      icon: "trending-up",
      resolve: () => ({
        value: growth ?? AWAITING,
        hint: growth ? "Last 90 days" : "Needs 2+ daily snapshots",
      }),
    },
    {
      label: "Content Views",
      // Views come from any platform that reports them (YouTube, Instagram, TikTok…).
      requires: ["youtube", "instagram", "tiktok", "facebook", "x"],
      icon: "eye",
      resolve: () => {
        if (!contentViews) return { value: AWAITING, hint: "Loading platform views" };
        if (contentViews.total > 0) {
          const sources = contentViews.perPlatform.map((row) => row.label).join(" + ");
          return {
            value: formatMetric(contentViews.total, true),
            hint: `Across ${sources}`,
          };
        }
        return {
          value: "0",
          hint: contentViews.missing.length
            ? `No views reported yet (${contentViews.missing.join(", ")})`
            : "No views reported yet",
        };
      },
    },
    {
      label: "Engagement Rate",
      // Engagement comes from any platform that reports it, YouTube included.
      requires: ["youtube", "instagram", "tiktok", "x", "facebook"],
      icon: "heart",
      resolve: () => {
        if (!engagement) return { value: AWAITING, hint: "Loading platform engagement" };
        if (engagement.perPlatform.length > 0) {
          const sources = engagement.perPlatform.map((row) => row.label).join(" + ");
          return {
            value: `${engagement.average.toFixed(2)}%`,
            hint: `Avg across ${sources}`,
          };
        }
        return {
          value: "0%",
          hint: engagement.missing.length
            ? `No engagement reported yet (${engagement.missing.join(", ")})`
            : "No engagement reported yet",
        };
      },
    },
    {
      label: "Email/SMS Captures",
      requires: ["mailchimp"],
      icon: "mail",
      resolve: () => ({ value: AWAITING, hint: "Mailchimp sync pending" }),
    },
    {
      label: "Platforms Connected",
      requires: [],
      icon: "user-check",
      resolve: () => ({
        value: String(connectedList.length),
        hint: `${connections.length} available`,
      }),
    },
  ];

  return stats.map((stat) => {
    const connected = isConnected(connections, stat.requires) && (anyConnected || false);
    if (!connected) {
      return {
        label: stat.label,
        requires: stat.requires,
        icon: stat.icon,
        value: "—",
        hint: NOT_CONNECTED,
        connected: false,
      };
    }
    const { value, hint } = stat.resolve();
    return { label: stat.label, requires: stat.requires, icon: stat.icon, value, hint, connected: true };
  });
}
