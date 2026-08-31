import {
  Users,
  UserCheck,
  Mail,
  Heart,
  Eye,
  TrendingUp,
} from "lucide-react";
import { useOverviewMetrics } from "../contexts/OverviewMetricsContext";
import { buildDashboardStats } from "../lib/dashboardStats";
import { useContentViews } from "../lib/contentViews";
import { useEngagementRates } from "../lib/engagementRates";

const iconMap: Record<string, typeof Users> = {
  users: Users,
  "user-check": UserCheck,
  mail: Mail,
  heart: Heart,
  eye: Eye,
  "trending-up": TrendingUp,
};

function AccentLoader({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex h-6 w-6 items-center justify-center xl:h-7 xl:w-7 ${className}`}
      aria-hidden
    >
      <span
        className="h-full w-full animate-spin rounded-full border-2 border-dt-green/25 border-t-dt-green"
        style={{
          filter:
            "drop-shadow(0 0 6px rgba(var(--theme-accent-rgb),0.95)) drop-shadow(0 0 14px rgba(var(--theme-accent-rgb),0.55))",
        }}
      />
    </span>
  );
}

export function KpiCards() {
  const { metrics, connections, loading } = useOverviewMetrics();
  const contentViews = useContentViews(connections.length);
  const engagement = useEngagementRates(connections.length);
  const stats = buildDashboardStats(connections, metrics, contentViews, engagement);

  return (
    <div data-tour="kpi-cards" className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((stat) => {
        const Icon = iconMap[stat.icon] ?? Users;
        return (
          <div
            key={stat.label}
            className="dt-surface relative min-w-0 overflow-hidden rounded-xl border border-dt-border bg-dt-card p-4 pr-14"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black via-black to-black/95" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(var(--theme-accent-rgb),0.04),transparent_55%)]" />
            <p className="relative text-xs font-semibold uppercase tracking-wide text-white">
              {stat.label}
            </p>
            {loading ? (
              <div className="relative mt-1.5 flex min-h-[24px] items-center xl:min-h-[28px]">
                <AccentLoader />
              </div>
            ) : (
              <>
                <p
                  className={`relative mt-2 text-2xl font-bold ${
                    stat.connected ? "text-white" : "text-white/40"
                  }`}
                >
                  {stat.value}
                </p>
                <p
                  className={`relative mt-2 text-xs font-medium ${
                    stat.connected ? "text-dt-green" : "text-dt-muted"
                  }`}
                >
                  {stat.hint}
                </p>
              </>
            )}
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
              <Icon
                size={24}
                strokeWidth={1.75}
                className={stat.connected ? "text-dt-green" : "text-white/20"}
                style={
                  stat.connected
                    ? {
                        filter:
                          "drop-shadow(0 0 4px color-mix(in srgb, var(--theme-accent) 90%, transparent)) drop-shadow(0 0 14px color-mix(in srgb, var(--theme-accent) 55%, transparent))",
                      }
                    : undefined
                }
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
