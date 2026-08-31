import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Columns3, List, Plus } from "lucide-react";
import { PlatformIcon } from "./PlatformIcon";
import { useContentStudio, type ContentRecord, type ContentStatus } from "../../lib/contentStudio/store";
import { platformList, type StudioPlatformKey } from "../../lib/contentStudio/platforms";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dayKey(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function timeLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    .replace(" ", "")
    .toUpperCase();
}

const STATUS_TONE: Record<ContentStatus, string> = {
  draft: "border-white/15 bg-white/[0.05] text-white/70",
  scheduled: "border-sky-500/35 bg-sky-500/10 text-sky-200",
  publishing: "border-amber-500/35 bg-amber-500/10 text-amber-200",
  published: "border-dt-green/35 bg-dt-green/10 text-dt-green",
  failed: "border-dt-red/40 bg-dt-red/10 text-dt-red",
};

const STATUSES: ContentStatus[] = ["draft", "scheduled", "publishing", "published", "failed"];

type View = "list" | "week" | "month";

const VIEW_META: { key: View; icon: typeof List; label: string }[] = [
  { key: "list", icon: List, label: "List" },
  { key: "week", icon: Columns3, label: "Week" },
  { key: "month", icon: CalendarDays, label: "Month" },
];

function tzLabel() {
  const offsetMin = -new Date().getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  return `GMT ${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

/** Planner-style calendar of everything this workspace has drafted, scheduled or published. */
export function StudioCalendar({
  onSelect,
  onCreate,
}: {
  onSelect?: (record: ContentRecord) => void;
  onCreate?: (dateIso: string) => void;
}) {
  const { content } = useContentStudio();
  const [cursor, setCursor] = useState(() => new Date());
  const [view, setView] = useState<View>("week");
  const [statusFilter, setStatusFilter] = useState<ContentStatus[]>([]);
  const [platformFilter, setPlatformFilter] = useState<StudioPlatformKey[]>([]);
  const [openMenu, setOpenMenu] = useState<"accounts" | "status" | null>(null);

  const filtered = useMemo(
    () =>
      content.filter((record) => {
        if (statusFilter.length && !statusFilter.includes(record.status)) return false;
        if (platformFilter.length && !record.platforms.some((p) => platformFilter.includes(p))) return false;
        return true;
      }),
    [content, statusFilter, platformFilter],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, ContentRecord[]>();
    for (const record of filtered) {
      const iso = record.scheduledAt ?? record.createdAt;
      const key = dayKey(iso);
      map.set(key, [...(map.get(key) ?? []), record]);
    }
    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          new Date(a.scheduledAt ?? a.createdAt).getTime() - new Date(b.scheduledAt ?? b.createdAt).getTime(),
      );
    }
    return map;
  }, [filtered]);

  const days = useMemo(() => {
    if (view === "month") {
      const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      const start = new Date(first);
      start.setDate(1 - first.getDay());
      return Array.from({ length: 42 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
      });
    }
    const start = new Date(cursor);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor, view]);

  const listItems = useMemo(
    () =>
      [...filtered].sort(
        (a, b) =>
          new Date(a.scheduledAt ?? a.createdAt).getTime() - new Date(b.scheduledAt ?? b.createdAt).getTime(),
      ),
    [filtered],
  );

  function shift(delta: number) {
    const next = new Date(cursor);
    if (view === "month") next.setMonth(next.getMonth() + delta);
    else next.setDate(next.getDate() + delta * 7);
    setCursor(next);
  }

  const rangeLabel = useMemo(() => {
    if (view === "month") return cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const start = days[0];
    const end = days[days.length - 1];
    if (!start || !end) return "";
    const sameMonth = start.getMonth() === end.getMonth();
    const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const endStr = end.toLocaleDateString("en-US", sameMonth ? { day: "numeric" } : { month: "short", day: "numeric" });
    return `${startStr} – ${endStr}, ${end.getFullYear()}`;
  }, [cursor, days, view]);

  const todayKey = dayKey(new Date());

  function toggleStatus(status: ContentStatus) {
    setStatusFilter((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]));
  }

  function togglePlatform(key: StudioPlatformKey) {
    setPlatformFilter((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  }

  function renderCard(record: ContentRecord, compact = false) {
    const iso = record.scheduledAt ?? record.createdAt;
    return (
      <button
        key={record.id}
        type="button"
        onClick={() => onSelect?.(record)}
        className={`w-full rounded-lg border px-2 py-1.5 text-left transition hover:brightness-125 ${STATUS_TONE[record.status]}`}
      >
        <div className="flex items-center gap-1.5">
          <span className="flex gap-0.5">
            {record.platforms.slice(0, 3).map((platform) => (
              <PlatformIcon key={platform} platform={platform} size={compact ? 9 : 11} />
            ))}
          </span>
          <span className="text-[10px] font-bold tabular-nums">{timeLabel(iso)}</span>
          {!compact && (
            <span className="ml-auto text-[9px] font-semibold uppercase tracking-wide opacity-70">
              {record.status}
            </span>
          )}
        </div>
        <p className={`mt-0.5 truncate ${compact ? "text-[10px]" : "text-[11px]"} font-medium`}>
          {record.title || record.caption || "Untitled"}
        </p>
      </button>
    );
  }

  return (
    <div className="dt-surface rounded-2xl border border-dt-border bg-dt-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-dt-border px-4 py-3">
        {/* Filters */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenu(openMenu === "accounts" ? null : "accounts")}
            className="rounded-full border border-dt-border px-3 py-1.5 text-[11px] font-semibold text-white/70 hover:text-white"
          >
            Social accounts {platformFilter.length ? `(${platformFilter.length})` : ""}
          </button>
          {openMenu === "accounts" && (
            <div className="absolute left-0 top-full z-20 mt-1 w-52 rounded-xl border border-dt-border bg-dt-card p-1.5 shadow-xl">
              {platformList().map((platform) => (
                <button
                  key={platform.key}
                  type="button"
                  onClick={() => togglePlatform(platform.key)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] text-white/75 hover:bg-white/5"
                >
                  <span
                    className={`h-3 w-3 rounded-[4px] border ${
                      platformFilter.includes(platform.key) ? "border-dt-red bg-dt-red" : "border-white/25"
                    }`}
                  />
                  <PlatformIcon platform={platform.key} size={12} />
                  {platform.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenu(openMenu === "status" ? null : "status")}
            className="rounded-full border border-dt-border px-3 py-1.5 text-[11px] font-semibold text-white/70 hover:text-white"
          >
            Post status {statusFilter.length ? `(${statusFilter.length})` : ""}
          </button>
          {openMenu === "status" && (
            <div className="absolute left-0 top-full z-20 mt-1 w-44 rounded-xl border border-dt-border bg-dt-card p-1.5 shadow-xl">
              {STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => toggleStatus(status)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] capitalize text-white/75 hover:bg-white/5"
                >
                  <span
                    className={`h-3 w-3 rounded-[4px] border ${
                      statusFilter.includes(status) ? "border-dt-red bg-dt-red" : "border-white/25"
                    }`}
                  />
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mx-1 h-5 w-px bg-dt-border" />

        <div className="flex rounded-lg border border-dt-border p-0.5">
          {VIEW_META.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              type="button"
              aria-label={label}
              onClick={() => setView(key)}
              className={`rounded-md p-1.5 transition ${view === key ? "bg-white/12 text-white" : "text-white/45"}`}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCursor(new Date())}
            className="rounded-full border border-dt-border px-3 py-1.5 text-[11px] font-semibold text-white/70 hover:text-white"
          >
            Today
          </button>
          <button
            type="button"
            aria-label="Previous"
            onClick={() => shift(-1)}
            className="rounded-full border border-dt-border p-1.5 text-white/60 hover:text-white"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => shift(1)}
            className="rounded-full border border-dt-border p-1.5 text-white/60 hover:text-white"
          >
            <ChevronRight size={14} />
          </button>
          <span className="rounded-full border border-dt-border px-3 py-1.5 text-[11px] font-semibold text-white">
            {rangeLabel}
          </span>
        </div>
      </div>

      {view === "list" ? (
        <div className="divide-y divide-dt-border">
          <div className="flex items-center justify-between px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-dt-muted">
            <span>All posts · times in {tzLabel()}</span>
            <span>{listItems.length} items</span>
          </div>
          {listItems.length === 0 && (
            <p className="px-4 py-8 text-center text-[12px] text-dt-muted">Nothing scheduled yet.</p>
          )}
          {listItems.map((record) => {
            const iso = record.scheduledAt ?? record.createdAt;
            const d = new Date(iso);
            return (
              <button
                key={record.id}
                type="button"
                onClick={() => onSelect?.(record)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/[0.03]"
              >
                <div className="w-24 shrink-0">
                  <p className="text-[11px] font-semibold text-white">
                    {d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </p>
                  <p className="text-[10px] tabular-nums text-dt-muted">{timeLabel(iso)}</p>
                </div>
                <span className="flex gap-1">
                  {record.platforms.slice(0, 5).map((platform) => (
                    <PlatformIcon key={platform} platform={platform} size={13} />
                  ))}
                </span>
                <p className="flex-1 truncate text-[12px] text-white/80">
                  {record.title || record.caption || "Untitled"}
                </p>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_TONE[record.status]}`}
                >
                  {record.status}
                </span>
              </button>
            );
          })}
        </div>
      ) : view === "week" ? (
        <div className="overflow-x-auto">
          <div className="grid min-w-[840px] grid-cols-[64px_repeat(7,minmax(0,1fr))]">
            <div className="border-b border-r border-dt-border px-2 py-3 text-[10px] font-semibold leading-tight text-dt-muted">
              {tzLabel()}
            </div>
            {days.map((day) => {
              const key = dayKey(day);
              const count = (byDay.get(key) ?? []).length;
              return (
                <div
                  key={key}
                  className={`border-b border-r border-dt-border px-3 py-2 ${key === todayKey ? "bg-white/[0.04]" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-dt-muted">
                      {day.toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                    <span className="rounded border border-dt-border px-1 text-[9px] font-semibold text-white/60">
                      {count}
                    </span>
                  </div>
                  <p className="font-display text-2xl font-semibold text-white/85">{day.getDate()}</p>
                </div>
              );
            })}

            <div className="border-r border-dt-border" />
            {days.map((day) => {
              const key = dayKey(day);
              const items = byDay.get(key) ?? [];
              return (
                <div
                  key={`${key}-col`}
                  className={`group min-h-[320px] space-y-1.5 border-r border-dt-border p-1.5 ${
                    key === todayKey ? "bg-white/[0.02]" : ""
                  }`}
                >
                  {items.map((record) => renderCard(record))}
                  <button
                    type="button"
                    onClick={() => onCreate?.(day.toISOString())}
                    className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-dt-border py-1.5 text-[10px] font-semibold text-white/35 opacity-0 transition group-hover:opacity-100 hover:text-white"
                  >
                    <Plus size={11} /> Add
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 border-b border-dt-border">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-dt-muted"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const key = dayKey(day);
              const items = byDay.get(key) ?? [];
              const outside = day.getMonth() !== cursor.getMonth();
              return (
                <div
                  key={key}
                  className={`group relative min-h-[112px] border-b border-r border-dt-border p-1.5 ${
                    outside ? "opacity-35" : ""
                  } ${key === todayKey ? "bg-white/[0.03]" : ""}`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-white/55">{day.getDate()}</span>
                    <button
                      type="button"
                      aria-label="Create content"
                      onClick={() => onCreate?.(day.toISOString())}
                      className="rounded p-0.5 text-white/40 opacity-0 transition group-hover:opacity-100 hover:text-white"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {items.slice(0, 3).map((record) => renderCard(record, true))}
                    {items.length > 3 && (
                      <p className="pl-1 text-[9px] text-dt-muted">+{items.length - 3} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
