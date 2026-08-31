import { useAthlete } from "../contexts/AthleteContext";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Eye,
  Loader2,
  MousePointerClick,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import {
  fetchDametimeAnalytics,
  formatMetric,
  formatRelativeTime,
  initialsFromName,
  type DametimeAnalytics,
} from "../lib/dametimeAnalyticsApi";

const POLL_MS = 30_000;

function eventCount(analytics: DametimeAnalytics, type: string) {
  return analytics.eventTypes.find((item) => item.type === type)?.count ?? 0;
}

export function FanActivityPage() {
  const { fanAppName } = useAthlete();
  const [analytics, setAnalytics] = useState<DametimeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    try {
      const data = await fetchDametimeAnalytics();
      setAnalytics(data);
      setStatus(
        isRefresh
          ? `Refreshed · ${new Date(data.syncedAt).toLocaleString()}`
          : `Live ${fanAppName} fan activity · synced ${new Date(data.syncedAt).toLocaleString()}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fan activity");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(true), POLL_MS);
    return () => window.clearInterval(interval);
  }, [load]);

  const activity = useMemo(() => {
    if (!analytics) return [];
    if (typeFilter === "all") return analytics.recentActivity;
    return analytics.recentActivity.filter((item) => item.eventType === typeFilter);
  }, [analytics, typeFilter]);

  if (loading && !analytics) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-white/70">
        <Loader2 className="mr-2 animate-spin" size={18} /> Loading live fan activity…
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error || "No engagement data available."}
        </div>
        <button
          type="button"
          onClick={() => void load(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-dt-red px-4 py-2.5 text-sm font-semibold text-white"
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const maxTarget = Math.max(...analytics.topTargets.map((item) => item.count), 1);

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
        <div className="relative border-b border-dt-border bg-gradient-to-br from-black via-[#0c0c0c] to-[#051a12] px-5 py-5 sm:px-7 sm:py-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_12%_0%,rgba(var(--theme-accent-rgb),0.22),transparent_52%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-dt-red/30 bg-dt-red/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-dt-red">
                <Activity size={12} />
                Fan activity
                <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  LIVE
                </span>
              </div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                What fans are doing in the app
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                Live from {fanAppName} `fan_events` — page views, nav taps, card opens, buys, and more as they happen.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-[96px] rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Events</p>
                <p className="mt-1 text-lg font-bold text-white">{formatMetric(analytics.kpis.totalEvents)}</p>
              </div>
              <div className="min-w-[96px] rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Clicks</p>
                <p className="mt-1 text-lg font-bold text-white">{formatMetric(analytics.kpis.totalClicks)}</p>
              </div>
              <div className="min-w-[96px] rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Active 7d</p>
                <p className="mt-1 text-lg font-bold text-white">{formatMetric(analytics.kpis.activeFans7d)}</p>
              </div>
              <button
                type="button"
                onClick={() => void load(true)}
                disabled={refreshing}
                className="inline-flex min-h-[52px] items-center gap-2 rounded-xl bg-dt-red px-5 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(var(--theme-accent-rgb),0.35)] transition hover:brightness-110 disabled:opacity-60"
              >
                {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Refresh
              </button>
            </div>
          </div>
        </div>

        {(error || status) && (
          <div className="space-y-2 border-b border-dt-border px-5 py-3">
            {error ? (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
            ) : null}
            {status && !error ? (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                {status}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Page views", value: formatMetric(analytics.kpis.pageViews), Icon: Eye },
          { label: "Card clicks", value: formatMetric(eventCount(analytics, "card_click")), Icon: MousePointerClick },
          { label: "Nav clicks", value: formatMetric(eventCount(analytics, "nav_click")), Icon: Activity },
          { label: "Engagement", value: `${analytics.kpis.engagementRate}%`, Icon: TrendingUp },
        ].map(({ label, value, Icon }) => (
          <div key={label} className="relative overflow-hidden rounded-2xl border border-dt-border bg-dt-card p-4">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(var(--theme-accent-rgb),0.16),transparent_55%)]" />
            <div className="relative flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">{label}</p>
                <p className="mt-2 text-2xl font-bold text-white">{value}</p>
              </div>
              <Icon size={18} className="mt-0.5 text-dt-red" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
          <div className="flex flex-col gap-3 border-b border-dt-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-sm font-semibold tracking-wide text-white">Live activity feed</h3>
              <p className="text-[11px] text-white/40">Latest fan_events from the {fanAppName} app</p>
            </div>
            <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
              <button
                type="button"
                onClick={() => setTypeFilter("all")}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${
                  typeFilter === "all" ? "bg-dt-red text-white" : "text-white/55 hover:text-white/80"
                }`}
              >
                All
              </button>
              {analytics.eventTypes.slice(0, 5).map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setTypeFilter(item.type)}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${
                    typeFilter === item.type ? "bg-dt-red text-white" : "text-white/55 hover:text-white/80"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-[520px] overflow-y-auto px-3 py-2">
            {activity.length === 0 ? (
              <p className="py-12 text-center text-sm text-white/40">No activity for this filter yet.</p>
            ) : (
              activity.map((item) => (
                <div
                  key={`${item.email}-${item.at}-${item.eventType}-${item.target ?? ""}`}
                  className="flex items-start gap-3 border-b border-white/[0.05] py-3 last:border-0"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dt-red/30 bg-dt-red/15 text-[11px] font-bold text-dt-red">
                    {initialsFromName(item.displayName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white">
                      <span className="font-semibold">{item.displayName}</span>
                      <span className="text-white/70"> — {item.action}</span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/40">
                      {item.eventType.replace(/_/g, " ")}
                      {item.target ? ` · ${item.target}` : ""} · {formatRelativeTime(item.at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="space-y-4">
          <section className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
            <div className="border-b border-dt-border px-4 py-3">
              <h3 className="font-display text-sm font-semibold tracking-wide text-white">Top taps</h3>
              <p className="text-[11px] text-white/40">Most clicked targets in the app</p>
            </div>
            <div className="space-y-2 p-3">
              {analytics.topTargets.map((target) => {
                const pct = Math.round((target.count / maxTarget) * 100);
                return (
                  <div key={target.target} className="rounded-xl border border-white/8 bg-black/25 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium text-white">{target.label}</p>
                      <p className="shrink-0 text-sm font-semibold text-dt-red">{formatMetric(target.count)}</p>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-dt-red" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {!analytics.topTargets.length ? (
                <p className="py-8 text-center text-sm text-white/40">No click targets yet</p>
              ) : null}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
            <div className="border-b border-dt-border px-4 py-3">
              <h3 className="font-display text-sm font-semibold tracking-wide text-white">Most engaged fans</h3>
              <p className="text-[11px] text-white/40">Top event counts + points</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-dt-border text-[11px] uppercase tracking-wide text-white/40">
                    <th className="px-4 py-3 font-semibold">Fan</th>
                    <th className="px-4 py-3 font-semibold">Events</th>
                    <th className="px-4 py-3 font-semibold">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topUsers.map((user) => (
                    <tr key={user.email} className="border-b border-white/[0.04]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-[10px] font-bold text-white/70">
                            {initialsFromName(
                              user.name || (user.username ? `@${user.username}` : user.email.split("@")[0]),
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-white">
                              {user.name || (user.username ? `@${user.username}` : user.email.split("@")[0])}
                            </p>
                            <p className="truncate text-[11px] text-white/40">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">{formatMetric(user.eventCount)}</td>
                      <td className="px-4 py-3 text-white/75">{formatMetric(user.points)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
