import { useAthlete } from "../contexts/AthleteContext";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  Eye,
  Loader2,
  MapPin,
  MousePointerClick,
  Navigation,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  fetchDametimeAnalytics,
  formatMetric,
  formatRelativeTime,
  initialsFromName,
  type AnalyticsTimeRange,
  type DametimeAnalytics,
} from "../lib/dametimeAnalyticsApi";
import { fanDisplayName, fetchFansList, formatFanJoined, type FanContact } from "../lib/fansApi";
import { DtSelect } from "../components/DtSelect";

const POLL_MS = 30_000;
const CHART_COLORS = ["var(--theme-accent)", "#ffffff", "var(--theme-traffic-2)", "#94a3b8", "var(--theme-traffic-1)", "#64748b"];

const TIME_RANGE_OPTIONS = [
  { value: "1", label: "Last 24 hours" },
  { value: "7", label: "Last 7 days" },
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
  { value: "custom", label: "Pick a day…" },
];

/** Local calendar date as YYYY-MM-DD (not UTC). */
function localDateIso(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Midnight → 11:59:59.999 local for a YYYY-MM-DD calendar day, as ISO strings for the API. */
function localDayBounds(isoDate: string): { from: string; to: string } {
  const [y, m, d] = isoDate.split("-").map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const end = new Date(y, m - 1, d, 23, 59, 59, 999);
  return { from: start.toISOString(), to: end.toISOString() };
}

function formatPickedDay(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Turn an hourly bucket key (UTC) into a local 12-hour clock label. */
function formatLocalHourLabel(dateKey: string) {
  const iso = dateKey.includes("T")
    ? dateKey.length <= 13
      ? `${dateKey}:00:00.000Z`
      : dateKey
    : `${dateKey}T12:00:00.000Z`;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return dateKey;
  return parsed.toLocaleTimeString(undefined, { hour: "numeric" });
}

function tooltipStyle() {
  return {
    background: "#0c0c0c",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12,
    fontSize: 12,
    boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
  };
}

function eventCount(analytics: DametimeAnalytics, type: string) {
  return analytics.eventTypes.find((item) => item.type === type)?.count ?? 0;
}

function Surface({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-dt-border bg-dt-card ${className}`}>
      <div className="flex items-start justify-between gap-3 border-b border-dt-border px-4 py-3">
        <div>
          <h3 className="font-display text-sm font-semibold tracking-wide text-white">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-[11px] text-white/40">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function TrafficOverviewPage() {
  const { fanAppName } = useAthlete();
  const [analytics, setAnalytics] = useState<DametimeAnalytics | null>(null);
  const [fans, setFans] = useState<FanContact[]>([]);
  const [fanEmail, setFanEmail] = useState("");
  const [fanQuery, setFanQuery] = useState("");
  const [fanMenuOpen, setFanMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [timePreset, setTimePreset] = useState("14");
  const [appliedDay, setAppliedDay] = useState("");
  const [draftDay, setDraftDay] = useState("");
  const [customOpen, setCustomOpen] = useState(false);

  const timeRange = useMemo<AnalyticsTimeRange | undefined>(() => {
    if (timePreset === "custom") {
      if (!appliedDay) return { days: 14 };
      return localDayBounds(appliedDay);
    }
    const days = Number(timePreset);
    return Number.isFinite(days) ? { days: Math.min(30, days) } : { days: 14 };
  }, [timePreset, appliedDay]);

  const timeRangeLabel = useMemo(() => {
    if (timePreset === "custom" && appliedDay) {
      return `${formatPickedDay(appliedDay)} · 12 AM – 12 AM`;
    }
    return TIME_RANGE_OPTIONS.find((option) => option.value === timePreset)?.label ?? "Last 14 days";
  }, [timePreset, appliedDay]);

  const timeRangeOptions = useMemo(
    () =>
      TIME_RANGE_OPTIONS.map((option) =>
        option.value === "custom" && appliedDay
          ? { ...option, label: formatPickedDay(appliedDay) }
          : option,
      ),
    [appliedDay],
  );

  const load = useCallback(
    async (isRefresh = false, email = fanEmail) => {
      if (isRefresh) setRefreshing(true);
      if (!isRefresh) setError(null);
      try {
        const data = await fetchDametimeAnalytics(email || undefined, timeRange);
        setAnalytics(data);
        setError(null);
        const fanLabel = email
          ? fans.find((fan) => fan.email === email)
            ? fanDisplayName(fans.find((fan) => fan.email === email)!)
            : email
          : null;
        setStatus(
          fanLabel
            ? `Filtered to ${fanLabel} · synced ${new Date(data.syncedAt).toLocaleString()}`
            : isRefresh
              ? `Refreshed from Supabase · ${new Date(data.syncedAt).toLocaleString()}`
              : `Live from ${fanAppName} fan_events · synced ${new Date(data.syncedAt).toLocaleString()}`,
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load traffic analytics";
        // Keep last good snapshot on background refresh so a blip doesn't blank the page.
        if (isRefresh) {
          setStatus(`Refresh paused — ${message}`);
        } else {
          setError(message);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fanEmail, fans, timeRange],
  );

  useEffect(() => {
    void fetchFansList()
      .then((data) => setFans(data.fans))
      .catch((err) => {
        setFans([]);
        setStatus(
          err instanceof Error
            ? `Fan search unavailable — ${err.message}`
            : "Fan search unavailable — check admin secret",
        );
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    void load(false, fanEmail);
    const interval = window.setInterval(() => {
      void load(true, fanEmail);
    }, POLL_MS);
    return () => window.clearInterval(interval);
  }, [fanEmail, load]);

  const selectedFan = useMemo(
    () => fans.find((fan) => fan.email === fanEmail) ?? null,
    [fans, fanEmail],
  );

  const fanOptions = useMemo(() => {
    const q = fanQuery.trim().toLowerCase();
    const list = !q
      ? fans
      : fans.filter((fan) => {
          const haystack = [fan.email, fan.name ?? "", fan.username ?? "", fan.phone ?? ""]
            .join(" ")
            .toLowerCase();
          return haystack.includes(q);
        });
    return list.slice(0, 40);
  }, [fans, fanQuery]);

  const derived = useMemo(() => {
    if (!analytics) return null;
    const navClicks = eventCount(analytics, "nav_click");
    const cardClicks = eventCount(analytics, "card_click");
    const externalLinks = eventCount(analytics, "external_link");
    const pie = analytics.eventTypes.slice(0, 6).map((item) => ({
      name: item.label,
      value: item.count,
      type: item.type,
    }));
    const timeline = analytics.eventsOverTime.map((point) => {
      const hourly = point.date.includes("T");
      return {
        ...point,
        label: hourly ? formatLocalHourLabel(point.date) : point.label,
        clicks: point.clicks ?? 0,
        navClicks: point.navClicks ?? 0,
      };
    });
    return { navClicks, cardClicks, externalLinks, pie, timeline };
  }, [analytics]);

  function selectFan(email: string) {
    setFanEmail(email);
    setFanQuery("");
    setFanMenuOpen(false);
    setError(null);
    setLoading(true);
  }

  function clearFanFilter() {
    setFanEmail("");
    setFanQuery("");
    setFanMenuOpen(false);
    setError(null);
    setLoading(true);
  }

  if (loading && !analytics) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-white/70">
        <Loader2 className="mr-2 animate-spin" size={18} /> Loading live app traffic…
      </div>
    );
  }

  if (!analytics || !derived) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error || "No traffic analytics available."}
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
      <div className="relative z-20 rounded-2xl border border-dt-border bg-dt-card">
        <div className="relative overflow-hidden rounded-t-2xl border-b border-dt-border bg-gradient-to-br from-black via-[#0c0c0c] to-[#051a12] px-5 py-5 sm:px-7 sm:py-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_12%_0%,rgba(var(--theme-accent-rgb),0.22),transparent_52%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-dt-red/30 bg-dt-red/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-dt-red">
                <Activity size={12} />
                Live app traffic
                <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  AUTO 30s
                </span>
              </div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {selectedFan
                  ? `Traffic for ${fanDisplayName(selectedFan)}`
                  : `Clicks, page views & nav from ${fanAppName}`}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                {selectedFan
                  ? `Showing only ${selectedFan.email}'s page views, clicks, and navigation from Supabase fan_events.`
                  : "Pulled from Supabase fan_events — filter by fan to inspect one member’s page views, clicks, and navigation."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-[92px] rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Page views</p>
                <p className="mt-1 text-lg font-bold text-white">{formatMetric(analytics.kpis.pageViews)}</p>
              </div>
              <div className="min-w-[92px] rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Clicks</p>
                <p className="mt-1 text-lg font-bold text-white">{formatMetric(analytics.kpis.totalClicks)}</p>
              </div>
              <div className="min-w-[92px] rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Nav</p>
                <p className="mt-1 text-lg font-bold text-white">{formatMetric(derived.navClicks)}</p>
              </div>
              <div className="min-w-[92px] rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Events</p>
                <p className="mt-1 text-lg font-bold text-white">{formatMetric(analytics.kpis.totalEvents)}</p>
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

        <div className="relative z-30 border-b border-dt-border px-5 py-4">
          {fanMenuOpen ? (
            <button
              type="button"
              aria-label="Close fan menu"
              className="fixed inset-0 z-[80] cursor-default bg-transparent"
              onMouseDown={(event) => {
                event.preventDefault();
                setFanMenuOpen(false);
              }}
            />
          ) : null}
          <div className="relative z-[90] flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">Filter by fan</p>
              <p className="mt-0.5 text-xs text-white/40">
                {selectedFan
                  ? `Showing traffic for ${fanDisplayName(selectedFan)}`
                  : "All fans — search email, name, or username"}
              </p>
            </div>
            <div className="flex w-full max-w-xl flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
                <input
                  value={fanMenuOpen || !selectedFan ? fanQuery : fanDisplayName(selectedFan)}
                  onChange={(e) => {
                    setFanQuery(e.target.value);
                    setFanMenuOpen(true);
                  }}
                  onFocus={() => {
                    setFanMenuOpen(true);
                    if (selectedFan) setFanQuery("");
                  }}
                  placeholder="Search fans…"
                  className="w-full rounded-xl border border-dt-border bg-black/50 py-2.5 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-dt-red/55 focus:ring-1 focus:ring-dt-red/25"
                />
                {fanMenuOpen ? (
                  <div
                    className="absolute left-0 right-0 top-full z-[100] mt-2 max-h-72 overflow-y-auto rounded-xl border border-dt-border bg-[#0c0c0c] shadow-[0_20px_50px_rgba(0,0,0,0.65)]"
                    onMouseDown={(event) => event.stopPropagation()}
                  >
                    <button
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        clearFanFilter();
                      }}
                      className="flex w-full items-center gap-2 border-b border-white/8 px-3 py-2.5 text-left text-sm text-white/70 hover:bg-white/[0.04]"
                    >
                      <Users size={14} /> All fans
                    </button>
                    {fanOptions.map((fan) => (
                      <button
                        key={fan.email}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          selectFan(fan.email);
                        }}
                        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/[0.04] ${
                          fan.email === fanEmail ? "bg-dt-red/10" : ""
                        }`}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-[10px] font-bold text-white/70">
                          {initialsFromName(fanDisplayName(fan))}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">{fanDisplayName(fan)}</p>
                          <p className="truncate text-[11px] text-white/40">{fan.email}</p>
                        </div>
                      </button>
                    ))}
                    {!fanOptions.length ? (
                      <p className="px-3 py-6 text-center text-xs text-white/40">
                        {fans.length
                          ? "No fans match that search"
                          : "Fan list unavailable — check VITE_ADMIN_EXPORT_SECRET"}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
              {fanEmail ? (
                <button
                  type="button"
                  onClick={clearFanFilter}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 px-3 py-2.5 text-xs font-semibold text-white/75 hover:border-dt-red/40"
                >
                  <X size={13} /> Clear
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {error ? (
          <div className="border-b border-dt-border px-5 py-3">
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
          </div>
        ) : null}
      </div>

      {fanEmail ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dt-red/35 bg-gradient-to-r from-dt-red/20 via-[#051a12] to-dt-card px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-dt-red/40 bg-dt-red/20 text-sm font-bold text-white">
              {initialsFromName(
                selectedFan ? fanDisplayName(selectedFan) : fanEmail.split("@")[0] || fanEmail,
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dt-red">
                Viewing fan
              </p>
              <p className="truncate font-display text-xl font-semibold tracking-tight text-white sm:text-2xl">
                {selectedFan ? fanDisplayName(selectedFan) : fanEmail.split("@")[0] || fanEmail}
              </p>
              <p className="truncate text-sm text-white/55">{selectedFan?.email || fanEmail}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/60">
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} className="text-dt-red" />
                  {analytics.geo.points[0]?.label || "Location not captured"}
                </span>
                {selectedFan?.created_at ? (
                  <span>Signed up {formatFanJoined(selectedFan.created_at)}</span>
                ) : null}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearFanFilter}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-black/30 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-dt-red/50"
          >
            <X size={14} /> Clear filter
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {[
          { label: "Page views", value: formatMetric(analytics.kpis.pageViews), Icon: Eye },
          { label: "Total clicks", value: formatMetric(analytics.kpis.totalClicks), Icon: MousePointerClick },
          { label: "Nav clicks", value: formatMetric(derived.navClicks), Icon: Navigation },
          { label: "Card clicks", value: formatMetric(derived.cardClicks), Icon: MousePointerClick },
          { label: "Active fans (7d)", value: formatMetric(analytics.kpis.activeFans7d), Icon: Users },
          { label: "Engagement", value: `${analytics.kpis.engagementRate}%`, Icon: TrendingUp },
        ].map(({ label, value, Icon }) => (
          <div
            key={label}
            className="relative overflow-hidden rounded-2xl border border-dt-border bg-dt-card p-4"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(var(--theme-accent-rgb),0.18),transparent_55%)]" />
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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Surface
          title="Activity over time"
          subtitle={
            timePreset === "custom" && appliedDay
              ? `Hourly activity for ${formatPickedDay(appliedDay)} · 12 AM – 12 AM`
              : `Events, page views, clicks & nav — ${timeRangeLabel.toLowerCase()}`
          }
          action={
            <div className="relative flex flex-col items-end gap-2">
              <DtSelect
                value={timePreset}
                options={timeRangeOptions}
                aria-label="Timeline range"
                className="w-[180px]"
                onChange={(value) => {
                  if (value === "custom") {
                    setDraftDay(appliedDay || localDateIso());
                    setCustomOpen(true);
                    return;
                  }
                  setCustomOpen(false);
                  setTimePreset(value);
                }}
              />
              {customOpen ? (
                <div className="absolute right-0 top-full z-40 mt-2 w-[280px] rounded-xl border border-dt-border bg-[#0c0c0c] p-3 shadow-[0_18px_40px_rgba(0,0,0,0.65)]">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-white/45">
                    Pick a day
                  </p>
                  <p className="mb-2 text-[11px] leading-relaxed text-white/45">
                    Chart that day from 12 AM to 12 AM in your local time.
                  </p>
                  <label className="mb-3 block">
                    <span className="text-[11px] text-white/50">Date</span>
                    <input
                      type="date"
                      value={draftDay}
                      max={localDateIso()}
                      onChange={(e) => setDraftDay(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-dt-border bg-black/50 px-3 py-2 text-sm text-white outline-none transition [color-scheme:dark] focus:border-dt-red/55"
                    />
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCustomOpen(false)}
                      className="flex-1 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/70 transition hover:border-white/30"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!draftDay}
                      onClick={() => {
                        setAppliedDay(draftDay);
                        setTimePreset("custom");
                        setCustomOpen(false);
                      }}
                      className="flex-1 rounded-lg bg-dt-red px-3 py-2 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          }
        >
          <div className="h-[320px] px-2 py-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={derived.timeline}>
                <defs>
                  <linearGradient id="trafficEvents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--theme-accent)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--theme-accent)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="trafficViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle()} labelStyle={{ color: "#fff" }} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#fff" }} />
                <Area
                  type="monotone"
                  dataKey="events"
                  name="Events"
                  stroke="var(--theme-accent)"
                  fill="url(#trafficEvents)"
                  strokeWidth={2.5}
                />
                <Area
                  type="monotone"
                  dataKey="pageViews"
                  name="Page views"
                  stroke="#ffffff"
                  fill="url(#trafficViews)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  name="Clicks"
                  stroke="var(--theme-traffic-2)"
                  fill="transparent"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="navClicks"
                  name="Nav clicks"
                  stroke="#94a3b8"
                  fill="transparent"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Surface>

        <Surface title="Event mix" subtitle="Breakdown of logged fan_events">
          <div className="grid h-[320px] grid-cols-1 gap-2 p-3 sm:grid-cols-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={derived.pie}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={86}
                  paddingAngle={3}
                >
                  {derived.pie.map((entry, index) => (
                    <Cell key={entry.type} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle()} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 overflow-y-auto pr-1">
              {analytics.eventTypes.map((item, index) => {
                const total = analytics.kpis.totalEvents || 1;
                const pct = Math.round((item.count / total) * 1000) / 10;
                return (
                  <div key={item.type} className="rounded-xl border border-white/8 bg-black/30 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm text-white">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        {item.label}
                      </span>
                      <span className="text-sm font-semibold text-white">{formatMetric(item.count)}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-dt-red"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-white/40">{pct}% of events</p>
                  </div>
                );
              })}
            </div>
          </div>
        </Surface>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Surface title="Event types" subtitle="Counts by interaction type">
          <div className="h-[300px] px-2 py-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.eventTypes} layout="vertical" margin={{ left: 12, right: 12 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={120}
                  tick={{ fill: "#e5e7eb", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle()} />
                <Bar dataKey="count" name="Count" fill="var(--theme-accent)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Surface>

        <Surface
          title="Live activity"
          subtitle="Recent fan_events from the app"
          action={
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Live
            </span>
          }
        >
          <div className="max-h-[300px] overflow-y-auto px-3 py-2">
            {analytics.recentActivity.length === 0 ? (
              <p className="py-10 text-center text-sm text-white/40">No activity logged yet.</p>
            ) : (
              analytics.recentActivity.map((item) => (
                <div
                  key={`${item.email}-${item.at}-${item.eventType}-${item.target ?? ""}`}
                  className="flex items-start gap-3 border-b border-white/[0.05] py-3 last:border-0"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dt-red/30 bg-dt-red/15 text-[10px] font-bold text-dt-red">
                    {initialsFromName(item.displayName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-white">
                      <span className="font-semibold">{item.displayName}</span>
                      <span className="text-white/70"> — {item.action}</span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/40">
                      {item.eventType.replace(/_/g, " ")} · {formatRelativeTime(item.at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Surface>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Surface title="Top pages & click targets" subtitle="Most tapped destinations in the app">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-dt-border text-[11px] uppercase tracking-wide text-white/40">
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Target</th>
                  <th className="px-4 py-3 font-semibold">Clicks</th>
                  <th className="px-4 py-3 font-semibold">Share</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topTargets.map((target, index) => {
                  const pct = Math.round((target.count / maxTarget) * 100);
                  return (
                    <tr key={target.target} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-white/40">{index + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{target.label}</p>
                        <p className="truncate text-[11px] text-white/35">{target.target}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-dt-red">{formatMetric(target.count)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-dt-red" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-white/45">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!analytics.topTargets.length ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-white/40">
                      No click targets yet
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Surface>

        <Surface title="Most active fans" subtitle="Click a fan to filter traffic">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-dt-border text-[11px] uppercase tracking-wide text-white/40">
                  <th className="px-4 py-3 font-semibold">Fan</th>
                  <th className="px-4 py-3 font-semibold">Events</th>
                  <th className="px-4 py-3 font-semibold">Points</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topUsers.map((user) => (
                  <tr
                    key={user.email}
                    className={`cursor-pointer border-b border-white/[0.04] hover:bg-white/[0.02] ${
                      fanEmail === user.email ? "bg-dt-red/10" : ""
                    }`}
                    onClick={() => selectFan(user.email)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-[10px] font-bold text-white/70">
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
                    <td className="px-4 py-3 text-white/80">{formatMetric(user.points)}</td>
                  </tr>
                ))}
                {!analytics.topUsers.length ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-sm text-white/40">
                      No fan activity yet
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Surface>
      </div>

      {status && !error ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {status}
        </div>
      ) : null}
    </div>
  );
}
