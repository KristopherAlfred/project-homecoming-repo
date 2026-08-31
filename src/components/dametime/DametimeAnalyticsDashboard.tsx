import {
  Users,
  UserCheck,
  Mail,
  MousePointerClick,
  Eye,
  TrendingUp,
  Smartphone,
  Activity,
  Crown,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Card } from "../ui/Card";
import { useTheme } from "../../theme/ThemeContext";
import {
  formatMetric,
  formatRelativeTime,
  initialsFromName,
  type DametimeAnalytics,
} from "../../lib/dametimeAnalyticsApi";
import { useAnalyticsView } from "../../hooks/useAnalyticsView";
import { DametimeError, DametimeLoading } from "./DametimeAnalyticsStates";

function LoadingState({ message }: { message: string }) {
  return <DametimeLoading message={message} />;
}

function ErrorState({ message }: { message: string }) {
  return <DametimeError message={message} />;
}

function KpiGrid({ analytics }: { analytics: DametimeAnalytics }) {
  const cards = [
    { label: "Total Fans", value: formatMetric(analytics.kpis.totalFans, true), icon: Users },
    { label: "Total Points", value: formatMetric(analytics.kpis.totalPoints || 0, true), icon: Crown },
    { label: "Avg Points", value: formatMetric(analytics.kpis.avgPoints || 0, true), icon: TrendingUp },
    { label: "Email Captures", value: formatMetric(analytics.kpis.emailCaptures, true), icon: Mail },
    { label: "SMS Opt-ins", value: formatMetric(analytics.kpis.smsOptIns, true), icon: Smartphone },
    { label: "Total Clicks", value: formatMetric(analytics.kpis.totalClicks, true), icon: MousePointerClick },
    { label: "Page Views", value: formatMetric(analytics.kpis.pageViews, true), icon: Eye },
    { label: "Active Fans (7d)", value: formatMetric(analytics.kpis.activeFans7d, true), icon: UserCheck },
    { label: "Engagement (7d)", value: `${analytics.kpis.engagementRate}%`, icon: Activity },
  ];

  return (
    <div className="grid w-full min-w-0 grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-9">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="dt-surface relative min-w-0 overflow-hidden rounded-lg border border-dt-border bg-dt-card p-3 xl:p-4"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black via-black to-black/95" />
            <p className="relative text-[10px] font-medium uppercase tracking-wide text-white xl:text-[11px]">
              {card.label}
            </p>
            <p className="relative mt-1.5 text-xl font-bold text-white xl:mt-2 xl:text-2xl">{card.value}</p>
            <div className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 sm:block">
              <Icon size={20} strokeWidth={1.75} className="text-dt-red" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EventsChart({ analytics }: { analytics: DametimeAnalytics }) {
  const { palette } = useTheme();

  return (
    <Card title="App Activity (14 days)" className="h-[280px]">
      <div className="h-[230px] px-2 pb-2 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={analytics.eventsOverTime}>
            <CartesianGrid stroke="#ffffff" strokeDasharray="3 3" strokeOpacity={0.25} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#ffffff", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#ffffff", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#fff" }}
            />
            <Line
              type="monotone"
              dataKey="events"
              name="Events"
              stroke={palette.accent}
              strokeWidth={2}
              dot={{ fill: palette.accent, r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="pageViews"
              name="Page views"
              stroke="#ffffff"
              strokeWidth={2}
              dot={{ fill: "#ffffff", r: 2 }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function EventTypesChart({ analytics }: { analytics: DametimeAnalytics }) {
  const { palette } = useTheme();

  return (
    <Card title="Event Breakdown" className="h-[280px]">
      <div className="h-[230px] px-2 pb-2 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={analytics.eventTypes.slice(0, 6)} layout="vertical" margin={{ left: 8, right: 8 }}>
            <CartesianGrid stroke="#ffffff" strokeDasharray="3 3" strokeOpacity={0.15} horizontal={false} />
            <XAxis type="number" tick={{ fill: "#ffffff", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="label"
              width={110}
              tick={{ fill: "#ffffff", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#fff" }}
            />
            <Bar dataKey="count" fill={palette.accent} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function LiveActivity({ analytics }: { analytics: DametimeAnalytics }) {
  return (
    <Card
      title="Live Activity Feed"
      className="h-[280px]"
      action={
        <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[10px] font-medium text-dt-green">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-dt-green" />
          LIVE
        </span>
      }
    >
      <div className="max-h-[220px] overflow-y-auto px-3 py-2">
        {analytics.recentActivity.length === 0 ? (
          <p className="py-6 text-center text-sm text-dt-muted">No activity yet.</p>
        ) : (
          analytics.recentActivity.map((item) => (
            <div
              key={`${item.email}-${item.at}-${item.eventType}`}
              className="flex items-start gap-3 border-b border-dt-border/60 py-2.5 last:border-0"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dt-red/20 text-[10px] font-bold text-dt-red">
                {initialsFromName(item.displayName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-white">
                  <span className="font-medium">{item.displayName}</span>
                  <span className="text-white"> — {item.action}</span>
                </p>
                <p className="text-[11px] text-white">{formatRelativeTime(item.at)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function TopUsersTable({
  analytics,
  title = "Top Users",
  mode = "events",
}: {
  analytics: DametimeAnalytics;
  title?: string;
  mode?: "events" | "points";
}) {
  const rows =
    mode === "points"
      ? analytics.topByPoints ?? [...analytics.topUsers].sort((a, b) => b.points - a.points)
      : analytics.topUsers;

  return (
    <Card title={title} className="min-h-[280px]">
      <div className="overflow-x-auto px-3 py-2">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead>
            <tr className="border-b border-dt-border text-xs text-dt-muted">
              <th className="pb-2 pr-3">Fan</th>
              <th className="pb-2 pr-3">{mode === "points" ? "Points" : "Events"}</th>
              <th className="pb-2">{mode === "points" ? "Events" : "Points"}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-sm text-dt-muted">
                  No fan points yet.
                </td>
              </tr>
            ) : (
              rows.map((user) => (
                <tr key={`${mode}-${user.email}`} className="border-b border-dt-border/50 last:border-0">
                  <td className="py-2.5 pr-3">
                    <p className="font-medium text-white">
                      {user.name || (user.username ? `@${user.username}` : user.email.split("@")[0])}
                    </p>
                    <p className="truncate text-xs text-dt-muted">{user.email}</p>
                  </td>
                  <td className="py-2.5 pr-3 text-white">
                    {formatMetric(mode === "points" ? user.points : user.eventCount)}
                  </td>
                  <td className="py-2.5 text-white">
                    {formatMetric(mode === "points" ? user.eventCount : user.points)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function TopClicksTable({ analytics }: { analytics: DametimeAnalytics }) {
  return (
    <Card title="Top Clicks" className="min-h-[280px]">
      <div className="space-y-2 px-3 py-2">
        {analytics.topTargets.length === 0 ? (
          <p className="py-6 text-center text-sm text-dt-muted">No click data yet.</p>
        ) : (
          analytics.topTargets.map((target) => (
            <div key={target.target} className="border-b border-dt-border/50 py-2 last:border-0">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-medium text-white">{target.label}</p>
                <p className="shrink-0 text-sm text-dt-red">{formatMetric(target.count)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function AudienceSnapshot({ analytics }: { analytics: DametimeAnalytics }) {
  const rows = [
    { label: "Total Fans", value: formatMetric(analytics.kpis.totalFans) },
    { label: "Total Points", value: formatMetric(analytics.kpis.totalPoints || 0) },
    { label: "Avg Points / Fan", value: formatMetric(analytics.kpis.avgPoints || 0) },
    { label: "Email Captures", value: formatMetric(analytics.kpis.emailCaptures) },
    { label: "SMS Subscribers", value: formatMetric(analytics.kpis.smsOptIns) },
    { label: "Active Fans (7d)", value: formatMetric(analytics.kpis.activeFans7d) },
    { label: "Engagement Rate", value: `${analytics.kpis.engagementRate}%` },
  ];

  return (
    <Card title="Audience Snapshot" className="h-[280px]">
      <div className="space-y-2 overflow-y-auto px-3 py-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between border-b border-dt-border/50 py-2 last:border-0">
            <span className="text-sm text-dt-muted">{row.label}</span>
            <span className="text-sm font-semibold text-white">{row.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function GeoSummary({ analytics }: { analytics: DametimeAnalytics }) {
  return (
    <Card title="Top Countries" className="min-h-[280px]">
      <div className="space-y-2 px-3 py-2">
        {analytics.geo.countries.length === 0 ? (
          <p className="py-6 text-center text-sm text-dt-muted">No geo data yet.</p>
        ) : (
          analytics.geo.countries.map((country) => (
            <div key={country.country} className="flex items-center justify-between border-b border-dt-border/50 py-2 last:border-0">
              <span className="text-sm text-white">
                {country.flag} {country.country}
              </span>
              <span className="text-sm font-medium text-white">
                {country.pct}% ({formatMetric(country.count)})
              </span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

export function DametimeAnalyticsDashboard() {
  const { analytics, loading, error, refreshing, refresh } = useAnalyticsView();

  if (loading && !analytics) return <LoadingState message="Loading fan app analytics…" />;
  if (error && !analytics) return <ErrorState message={error} />;
  if (!analytics) return <ErrorState message="No analytics data available." />;

  return (
    <div className="space-y-3 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-white/40">
          Live loyalty points · synced {new Date(analytics.syncedAt).toLocaleString()}
          {refreshing ? " · refreshing…" : ""}
        </p>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:border-dt-red/40 disabled:opacity-60"
        >
          <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
          Refresh points
        </button>
      </div>

      <KpiGrid analytics={analytics} />

      <div className="grid grid-cols-12 items-stretch gap-3">
        <div className="col-span-12 lg:col-span-5">
          <EventsChart analytics={analytics} />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <EventTypesChart analytics={analytics} />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-4">
          <LiveActivity analytics={analytics} />
        </div>
      </div>

      <div className="grid grid-cols-12 items-stretch gap-3">
        <div className="col-span-12 lg:col-span-4">
          <AudienceSnapshot analytics={analytics} />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <TopUsersTable analytics={analytics} title="Top by activity" mode="events" />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <TopUsersTable analytics={analytics} title="Top by points" mode="points" />
        </div>
      </div>

      <div className="grid grid-cols-12 items-stretch gap-3">
        <div className="col-span-12 lg:col-span-8">
          <TopClicksTable analytics={analytics} />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <GeoSummary analytics={analytics} />
        </div>
      </div>
    </div>
  );
}
