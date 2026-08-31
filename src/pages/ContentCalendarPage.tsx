import { useAthlete } from "../contexts/AthleteContext";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  channelLabel,
  channelTone,
  fetchContentCalendar,
  formatCalendarDateTime,
  monthLabel,
  type CalendarChannel,
  type CalendarEntry,
  type ContentCalendarResponse,
} from "../lib/contentCalendarApi";

const POLL_MS = 60_000;

const CHANNEL_TABS: Array<CalendarChannel | "all"> = [
  "all",
  "news",
  "video",
  "music",
  "event",
  "giveaway",
  "live",
  "instagram",
  "youtube",
  "facebook",
  "twitter",
  "notification",
];

function todayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function localDayKey(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildMonthCells(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: Array<{ day: number | null; key: string | null }> = [];

  for (let i = 0; i < startOffset; i += 1) {
    cells.push({ day: null, key: null });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ day, key });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: null, key: null });
  }
  return cells;
}

export function ContentCalendarPage() {
  const { fanAppName, firstName } = useAthlete();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const [channel, setChannel] = useState<CalendarChannel | "all">("all");
  const [selectedDay, setSelectedDay] = useState<string>(todayKey());
  const [data, setData] = useState<ContentCalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    try {
      const calendar = await fetchContentCalendar();
      setData(calendar);
      setStatus(
        isRefresh
          ? `Refreshed · ${new Date(calendar.syncedAt).toLocaleString()}`
          : `Live from ${fanAppName} · synced ${new Date(calendar.syncedAt).toLocaleString()}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load content calendar");
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

  useEffect(() => {
    if (!data?.entries.length) return;
    const hasSelected = data.entries.some((item) => (localDayKey(item.at) || item.dayKey) === selectedDay);
    if (hasSelected) return;
    const latest = data.entries[0];
    const key = localDayKey(latest.at) || latest.dayKey;
    if (!key) return;
    const d = new Date(latest.at);
    setSelectedDay(key);
    setYear(d.getFullYear());
    setMonthIndex(d.getMonth());
  }, [data, selectedDay]);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (channel === "all") return data.entries;
    return data.entries.filter((item) => item.channel === channel);
  }, [data, channel]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const item of filtered) {
      const key = localDayKey(item.at) || item.dayKey;
      if (!key) continue;
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return map;
  }, [filtered]);

  const monthEntries = useMemo(() => {
    const prefix = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
    return filtered.filter((item) => (localDayKey(item.at) || item.dayKey).startsWith(prefix));
  }, [filtered, year, monthIndex]);

  const dayEntries = useMemo(() => {
    return (byDay.get(selectedDay) ?? []).slice().sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  }, [byDay, selectedDay]);

  const cells = useMemo(() => buildMonthCells(year, monthIndex), [year, monthIndex]);

  function shiftMonth(delta: number) {
    const next = new Date(year, monthIndex + delta, 1);
    setYear(next.getFullYear());
    setMonthIndex(next.getMonth());
  }

  if (loading && !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-white/70">
        <Loader2 className="mr-2 animate-spin" size={18} /> Loading live content calendar…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error || "No calendar data available."}
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

  const selectedLabel = (() => {
    const d = new Date(`${selectedDay}T12:00:00`);
    if (Number.isNaN(d.getTime())) return selectedDay;
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  })();

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
        <div className="relative border-b border-dt-border bg-gradient-to-br from-black via-[#0c0c0c] to-[#051a12] px-5 py-5 sm:px-7 sm:py-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_12%_0%,rgba(var(--theme-accent-rgb),0.22),transparent_52%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-dt-red/30 bg-dt-red/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-dt-red">
                <CalendarDays size={12} />
                Content calendar
                <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  LIVE
                </span>
              </div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                What {firstName} posted, by exact date &amp; time
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                Live from {fanAppName} + synced social — tap a day to see everything that went live that day.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-[96px] rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Posts</p>
                <p className="mt-1 text-lg font-bold text-white">{data.counts.all}</p>
              </div>
              <div className="min-w-[96px] rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">This month</p>
                <p className="mt-1 text-lg font-bold text-white">{monthEntries.length}</p>
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

        <div className="flex gap-2 overflow-x-auto px-4 py-3">
          {CHANNEL_TABS.map((tab) => {
            const count = data.counts[tab] ?? 0;
            if (tab !== "all" && count === 0) return null;
            const active = channel === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setChannel(tab)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-dt-red bg-dt-red text-white"
                    : "border-white/10 bg-black/30 text-white/70 hover:border-white/25 hover:text-white"
                }`}
              >
                {channelLabel(tab)}
                <span className={`tabular-nums ${active ? "text-white/80" : "text-white/40"}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)]">
        <section className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
          <div className="flex items-center justify-between border-b border-dt-border px-4 py-3.5">
            <div>
              <h3 className="font-display text-sm font-semibold tracking-wide text-white">
                {monthLabel(year, monthIndex)}
              </h3>
              <p className="text-[11px] text-white/40">{monthEntries.length} items this month</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => shiftMonth(-1)}
                className="rounded-lg border border-white/10 p-2 text-white/70 transition hover:border-white/25 hover:text-white"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => shiftMonth(1)}
                className="rounded-lg border border-white/10 p-2 text-white/70 transition hover:border-white/25 hover:text-white"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="p-3 sm:p-4">
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-white/35">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="py-2">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell, index) => {
                if (!cell.key || cell.day == null) {
                  return <div key={`empty-${index}`} className="min-h-[76px] rounded-lg bg-transparent sm:min-h-[88px]" />;
                }
                const dayItems = byDay.get(cell.key) ?? [];
                const selected = selectedDay === cell.key;
                const isToday = cell.key === todayKey();
                return (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => setSelectedDay(cell.key!)}
                    className={`min-h-[76px] rounded-lg border p-1.5 text-left transition sm:min-h-[88px] ${
                      selected
                        ? "border-dt-red bg-dt-red/15 ring-1 ring-dt-red/40"
                        : dayItems.length
                          ? "border-white/10 bg-white/[0.03] hover:border-dt-red/35"
                          : "border-white/5 bg-black/20 hover:border-white/15"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-[11px] font-semibold ${
                          isToday ? "text-dt-red" : selected ? "text-white" : "text-white/55"
                        }`}
                      >
                        {cell.day}
                      </span>
                      {dayItems.length > 0 ? (
                        <span className="rounded-full bg-dt-red/20 px-1.5 text-[9px] font-bold tabular-nums text-dt-red">
                          {dayItems.length}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {dayItems.slice(0, 2).map((item) => (
                        <p
                          key={item.id}
                          className="truncate rounded bg-black/40 px-1 py-0.5 text-[9px] text-white/75"
                        >
                          {item.title}
                        </p>
                      ))}
                      {dayItems.length > 2 ? (
                        <p className="px-1 text-[9px] text-white/40">+{dayItems.length - 2} more</p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
          <div className="border-b border-dt-border px-4 py-3.5">
            <h3 className="font-display text-sm font-semibold tracking-wide text-white">{selectedLabel}</h3>
            <p className="text-[11px] text-white/40">
              {dayEntries.length
                ? `${dayEntries.length} post${dayEntries.length === 1 ? "" : "s"} with exact timestamps`
                : "Nothing posted this day"}
            </p>
          </div>

          <div className="max-h-[640px] divide-y divide-dt-border overflow-y-auto">
            {dayEntries.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-white/40">
                Pick another day or switch tabs to see posts.
              </p>
            ) : (
              dayEntries.map((item) => {
                const { date, time } = formatCalendarDateTime(item.at);
                return (
                  <article key={item.id} className="px-4 py-3.5">
                    <div className="flex items-start gap-3">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-lg border border-white/10 object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[10px] font-bold uppercase text-white/50">
                          {channelLabel(item.channel).slice(0, 2)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${channelTone(item.channel)}`}
                          >
                            {channelLabel(item.channel)}
                          </span>
                          <span className="text-[11px] font-medium tabular-nums text-dt-red">
                            {time}
                          </span>
                          <span className="text-[11px] text-white/35">{date}</span>
                        </div>
                        <h4 className="text-sm font-semibold leading-snug text-white">{item.title}</h4>
                        {item.subtitle ? (
                          <p className="mt-1 line-clamp-2 text-xs text-white/45">{item.subtitle}</p>
                        ) : null}
                        {item.href ? (
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-dt-red hover:brightness-125"
                          >
                            Open <ExternalLink size={11} />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
