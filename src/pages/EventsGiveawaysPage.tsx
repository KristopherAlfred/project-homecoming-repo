import { useAthlete } from "../contexts/AthleteContext";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Eye,
  EyeOff,
  Gift,
  Link2,
  Loader2,
  MapPin,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import {
  createEmptyEventItem,
  deleteEventItem,
  fetchEventsFeed,
  formatDeadlineDisplay,
  fromLocalInputValue,
  publishEventsFeed,
  resolveEventAssetUrl,
  toLocalInputValue,
  upsertEventItem,
  type AppEventItem,
  type EventKind,
  type EventStatus,
  type EventsFeed,
} from "../lib/eventsApi";
import { TypographyControls } from "../components/TypographyControls";
import { DtSelect } from "../components/DtSelect";
import { titleTypographyStyle } from "../lib/typography";

function fieldClass() {
  return "w-full rounded-xl border border-dt-border bg-black/50 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-dt-red/55 focus:ring-1 focus:ring-dt-red/25";
}

function PosterPreview({
  item,
  selected,
  onClick,
}: {
  item: AppEventItem;
  selected?: boolean;
  onClick?: () => void;
}) {
  const meta = item.deadlineDisplay || item.dateLabel || item.location;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative aspect-[3/4] w-full overflow-hidden rounded-xl border text-left transition ${
        selected
          ? "border-dt-red shadow-[0_0_0_1px_rgba(var(--theme-accent-rgb),0.45),0_8px_24px_rgba(var(--theme-accent-rgb),0.18)]"
          : "border-white/10 hover:border-white/25"
      }`}
    >
      <img
        src={resolveEventAssetUrl(item.thumbnail)}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      <div className="relative z-10 flex h-full flex-col justify-end p-2.5">
        {item.type === "giveaway" ? (
          <span className="mb-1 w-fit rounded bg-dt-red px-1.5 py-0.5 font-display text-[0.5rem] font-extrabold tracking-[0.1em] text-white">
            GIVEAWAY
          </span>
        ) : null}
        <p
          className="line-clamp-3 font-display text-[11px] font-extrabold leading-tight tracking-[0.05em] text-white"
          style={titleTypographyStyle(item)}
        >
          {item.title || "Untitled"}
        </p>
        {meta ? (
          <p className="mt-1 font-display text-[9px] font-extrabold uppercase tracking-[0.1em] text-white/65">
            {meta}
          </p>
        ) : null}
      </div>
      {!item.enabled ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60">
          <span className="rounded-full border border-white/20 bg-black/50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/80">
            Hidden
          </span>
        </div>
      ) : null}
    </button>
  );
}

export function EventsGiveawaysPage() {
  const { fanAppName } = useAthlete();
  const [feed, setFeed] = useState<EventsFeed | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AppEventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | EventKind>("all");
  const [previewTab, setPreviewTab] = useState<"upcoming" | "giveaways">("upcoming");

  useEffect(() => {
    void fetchEventsFeed()
      .then((next) => {
        setFeed(next);
        const first = next.items[0];
        if (first) {
          setSelectedId(first.id);
          setDraft({ ...first });
          setPreviewTab(first.type === "giveaway" ? "giveaways" : "upcoming");
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load events"))
      .finally(() => setLoading(false));
  }, []);

  const items = useMemo(() => {
    let list = feed?.items ?? [];
    if (typeFilter !== "all") list = list.filter((item) => item.type === typeFilter);
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q),
    );
  }, [feed, query, typeFilter]);

  const stats = useMemo(() => {
    const all = feed?.items ?? [];
    return {
      events: all.filter((i) => i.type === "event").length,
      giveaways: all.filter((i) => i.type === "giveaway").length,
      published: all.filter((i) => i.status === "published" && i.enabled).length,
    };
  }, [feed]);

  const previewItems = useMemo(() => {
    const all = (feed?.items ?? []).filter((i) => i.status === "published" && i.enabled);
    const filtered =
      previewTab === "giveaways"
        ? all.filter((i) => i.type === "giveaway")
        : all.filter((i) => i.type === "event");

    // If drafting a matching type, show draft in preview as override of same id
    if (draft && draft.enabled) {
      const draftMatches =
        (previewTab === "giveaways" && draft.type === "giveaway") ||
        (previewTab === "upcoming" && draft.type === "event");
      if (draftMatches) {
        const without = filtered.filter((i) => i.id !== draft.id);
        return [draft, ...without].slice(0, 4);
      }
    }
    return filtered.slice(0, 4);
  }, [feed, previewTab, draft]);

  function selectItem(item: AppEventItem) {
    setSelectedId(item.id);
    setDraft({ ...item });
    setPreviewTab(item.type === "giveaway" ? "giveaways" : "upcoming");
    setStatus(null);
    setError(null);
  }

  function startNew(type: EventKind) {
    const item = createEmptyEventItem(type);
    setSelectedId(item.id);
    setDraft(item);
    setPreviewTab(type === "giveaway" ? "giveaways" : "upcoming");
    setStatus(`New ${type} — fill details, then Publish to App`);
    setError(null);
  }

  function patchDraft(patch: Partial<AppEventItem>) {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      if (patch.type) setPreviewTab(patch.type === "giveaway" ? "giveaways" : "upcoming");
      return next;
    });
  }

  async function saveDraft(nextStatus?: EventStatus) {
    if (!draft) return;
    if (!draft.title.trim()) {
      setError("Title is required");
      return;
    }

    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      const deadline = draft.deadline.trim();
      const payload: AppEventItem = {
        ...draft,
        title: draft.title.trim(),
        description: draft.description.trim(),
        thumbnail: draft.thumbnail.trim() || "/images/eventsbackground.png",
        href: draft.href.trim(),
        location: draft.location.trim(),
        dateLabel: draft.dateLabel.trim(),
        deadline,
        deadlineDisplay: draft.deadlineDisplay.trim() || formatDeadlineDisplay(deadline),
        status: nextStatus ?? draft.status,
        publishedAt: nextStatus === "published" ? new Date().toISOString() : draft.publishedAt,
        source: "manual",
      };
      const nextFeed = await upsertEventItem(payload);
      setFeed(nextFeed);
      setDraft(payload);
      setSelectedId(payload.id);
      setStatus(
        payload.status === "published"
          ? `Published — live in ${fanAppName} ${payload.type === "giveaway" ? "Giveaways" : "Upcoming"}`
          : "Draft saved",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function removeItem() {
    if (!draft) return;
    if (!window.confirm(`Delete “${draft.title || "this item"}”?`)) return;
    setSaving(true);
    setError(null);
    try {
      const nextFeed = await deleteEventItem(draft.id);
      setFeed(nextFeed);
      const next = nextFeed.items[0] ?? null;
      setSelectedId(next?.id ?? null);
      setDraft(next ? { ...next } : null);
      setStatus("Deleted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  }

  async function republishAll() {
    if (!feed) return;
    setSaving(true);
    setError(null);
    try {
      const next = await publishEventsFeed({
        ...feed,
        version: (feed.version || 1) + 1,
        updatedAt: new Date().toISOString(),
      });
      setFeed(next);
      setStatus("Full events feed republished to app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setSaving(false);
    }
  }

  function onUploadThumbnail(file: File | null) {
    if (!file || !draft) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") patchDraft({ thumbnail: reader.result });
    };
    reader.readAsDataURL(file);
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-white/70">
        <Loader2 className="mr-2 animate-spin" size={18} /> Loading events…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <style>{`
        @keyframes events-phone-glow {
          0%, 100% { box-shadow: 0 0 0 1px rgba(255,255,255,0.08), 0 24px 60px rgba(0,0,0,0.55); }
          50% { box-shadow: 0 0 0 1px rgba(var(--theme-accent-rgb),0.28), 0 28px 70px rgba(var(--theme-accent-rgb),0.14); }
        }
        .events-phone-shell { animation: events-phone-glow 4.5s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
        <div className="relative border-b border-dt-border bg-gradient-to-br from-black via-[#0c0c0c] to-[#051a12] px-5 py-5 sm:px-7 sm:py-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_12%_0%,rgba(var(--theme-accent-rgb),0.22),transparent_52%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-dt-red/30 bg-dt-red/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-dt-red">
                <Gift size={12} />
                Events & giveaways
              </div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Publish posters fans unlock in the app
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                Create Upcoming events or Giveaways with thumbnail, deadline, description, and link — they appear in the {fanAppName} events grid after publish.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-[96px] rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Events</p>
                <p className="mt-1 text-lg font-bold text-white">{stats.events}</p>
              </div>
              <div className="min-w-[96px] rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Giveaways</p>
                <p className="mt-1 text-lg font-bold text-white">{stats.giveaways}</p>
              </div>
              <div className="min-w-[96px] rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Live</p>
                <p className="mt-1 text-lg font-bold text-dt-green">{stats.published}</p>
              </div>
              <button
                type="button"
                onClick={() => void (draft ? saveDraft("published") : startNew("event"))}
                disabled={saving}
                className="inline-flex min-h-[52px] items-center gap-2 rounded-xl bg-dt-red px-5 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(var(--theme-accent-rgb),0.35)] transition hover:brightness-110 disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {draft ? "Publish to app" : "New event"}
              </button>
            </div>
          </div>
        </div>

        {(error || status) && (
          <div className="space-y-2 border-b border-dt-border px-5 py-3">
            {error ? (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
            ) : null}
            {status ? (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                {status}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_360px]">
        {/* Library */}
        <section className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
          <div className="border-b border-dt-border px-4 py-3">
            <h3 className="font-display text-sm font-semibold tracking-wide text-white">Library</h3>
            <p className="text-[11px] text-white/40">Events & giveaways queue</p>
          </div>

          <div className="space-y-3 p-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => startNew("event")}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-dt-red px-3 py-2.5 text-xs font-semibold text-white"
              >
                <Plus size={13} /> Event
              </button>
              <button
                type="button"
                onClick={() => startNew("giveaway")}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2.5 text-xs font-semibold text-white/85 hover:border-dt-red/40"
              >
                <Plus size={13} /> Giveaway
              </button>
            </div>

            <div className="flex gap-1.5 rounded-xl border border-white/10 bg-black/30 p-1">
              {([
                ["all", "All"],
                ["event", "Events"],
                ["giveaway", "Giveaways"],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTypeFilter(id)}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition ${
                    typeFilter === id ? "bg-dt-red text-white" : "text-white/55 hover:text-white/80"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles…"
              className={fieldClass()}
            />

            <ul className="max-h-[48vh] space-y-2 overflow-y-auto pr-1">
              {items.length === 0 ? (
                <li className="rounded-xl border border-dashed border-white/15 px-3 py-10 text-center text-sm text-white/45">
                  No items yet. Create an event or giveaway.
                </li>
              ) : (
                items.map((item) => {
                  const live = item.status === "published" && item.enabled;
                  const Icon = item.type === "giveaway" ? Gift : CalendarDays;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => selectItem(item)}
                        className={`flex w-full gap-3 rounded-xl border p-2.5 text-left transition ${
                          selectedId === item.id
                            ? "border-dt-red/70 bg-dt-red/15"
                            : "border-white/10 bg-black/25 hover:border-white/20"
                        }`}
                      >
                        <img
                          src={resolveEventAssetUrl(item.thumbnail)}
                          alt=""
                          className="h-16 w-12 shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">{item.title || "Untitled"}</p>
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-white/45">
                            <Icon size={11} />
                            {item.type === "giveaway" ? "Giveaway" : "Event"}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                live
                                  ? "bg-dt-green/15 text-dt-green"
                                  : item.status === "draft"
                                    ? "bg-white/10 text-white/55"
                                    : "bg-dt-orange/15 text-dt-orange"
                              }`}
                            >
                              {live ? "Live" : item.enabled ? item.status : "Hidden"}
                            </span>
                            <span className="text-[10px] text-white/35">
                              {item.deadlineDisplay || item.dateLabel || "No deadline"}
                            </span>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>

            <button
              type="button"
              onClick={() => void republishAll()}
              disabled={saving || !(feed?.items.length)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.03] px-3 py-2.5 text-xs font-medium text-white/70 transition hover:bg-white/[0.06] disabled:opacity-50"
            >
              Republish all to app
            </button>
          </div>
        </section>

        {/* Phone preview */}
        <section className="relative flex min-h-[560px] items-center justify-center overflow-hidden rounded-2xl border border-dt-border bg-[radial-gradient(ellipse_at_50%_0%,rgba(var(--theme-accent-rgb),0.14),transparent_45%),linear-gradient(180deg,#121212_0%,#070707_55%,#050505_100%)] px-4 py-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-dt-red/10 to-transparent" />
          <div className="events-phone-shell relative w-full max-w-[320px] overflow-hidden rounded-[2.35rem] border border-white/15 bg-black">
            <div className="absolute left-1/2 top-2 z-20 h-5 w-28 -translate-x-1/2 rounded-full bg-black/90" />
            <div className="border-b border-white/10 bg-[#0d0d0d] px-4 pb-3 pt-8 text-center">
              <p className="text-[10px] font-semibold tracking-[0.28em] text-white/55">EVENTS</p>
            </div>
            <div className="space-y-2 bg-[radial-gradient(circle_at_top,_#321018_0%,_#0a0a0a_52%)] p-3 pb-5">
              <div className="flex rounded-full border border-white/10 bg-black/40 p-1">
                {(["upcoming", "giveaways"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setPreviewTab(tab)}
                    className={`flex-1 rounded-full py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] transition ${
                      previewTab === tab ? "bg-dt-red text-white" : "text-white/50"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {previewItems.length === 0 ? (
                <div className="grid grid-cols-2 gap-1.5">
                  {Array.from({ length: 4 }, (_, i) => (
                    <div
                      key={i}
                      className="flex aspect-[3/4] items-center justify-center rounded-xl border border-white/10 bg-black/40 px-2 text-center text-[10px] font-semibold text-white/45"
                    >
                      {previewTab === "giveaways" ? "Giveaways soon!" : "No events now"}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  {previewItems.map((item) => (
                    <PosterPreview
                      key={item.id}
                      item={item}
                      selected={selectedId === item.id}
                      onClick={() => selectItem(item)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Editor */}
        <section className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
          {!draft ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/40">
                <CalendarDays size={22} />
              </div>
              <p className="text-sm text-white/55">Select an item or create a new event / giveaway.</p>
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => startNew("event")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-dt-red px-4 py-2 text-sm font-semibold text-white"
                >
                  <Plus size={14} /> Event
                </button>
                <button
                  type="button"
                  onClick={() => startNew("giveaway")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white/85"
                >
                  <Plus size={14} /> Giveaway
                </button>
              </div>
            </div>
          ) : (
            <div className="flex max-h-[calc(100dvh-220px)] flex-col">
              <div className="flex items-center justify-between gap-2 border-b border-dt-border px-4 py-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-dt-red/30 bg-dt-red/15 text-dt-red">
                    {draft.type === "giveaway" ? <Gift size={16} /> : <CalendarDays size={16} />}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-sm font-semibold tracking-wide text-white">
                      Edit {draft.type === "giveaway" ? "giveaway" : "event"}
                    </h3>
                    <p className="truncate text-[11px] uppercase tracking-[0.12em] text-white/40">
                      {draft.status} · {draft.enabled ? "visible" : "hidden"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void removeItem()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-2.5 py-1.5 text-xs text-red-200 transition hover:bg-red-500/10"
                >
                  <Trash2 size={12} /> Remove
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto p-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void saveDraft("draft")}
                    className="rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2 text-sm text-white/80 disabled:opacity-50"
                  >
                    Save draft
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void saveDraft("published")}
                    className="inline-flex items-center gap-2 rounded-xl bg-dt-red px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    Publish to app
                  </button>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-white/45">Title</span>
                  <input
                    value={draft.title}
                    onChange={(e) => patchDraft({ title: e.target.value })}
                    className={fieldClass()}
                    placeholder="Meet & Greet — Milwaukee"
                    style={titleTypographyStyle(draft)}
                  />
                </label>

                <TypographyControls
                  fontFamily={draft.titleFontFamily || "default"}
                  fontSize={draft.titleFontSize || "md"}
                  onFontFamilyChange={(titleFontFamily) => patchDraft({ titleFontFamily })}
                  onFontSizeChange={(titleFontSize) => patchDraft({ titleFontSize })}
                />

                <label className="block space-y-1.5">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-white/45">Description</span>
                  <textarea
                    value={draft.description}
                    onChange={(e) => patchDraft({ description: e.target.value })}
                    rows={3}
                    className={fieldClass()}
                    placeholder="What fans need to know"
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-white/45">Type</span>
                    <DtSelect
                      value={draft.type}
                      aria-label="Type"
                      onChange={(value) => patchDraft({ type: value as EventKind })}
                      options={[
                        { value: "event", label: "Event (Upcoming)" },
                        { value: "giveaway", label: "Giveaway" },
                      ]}
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-white/45">Status</span>
                    <DtSelect
                      value={draft.status}
                      aria-label="Status"
                      onChange={(value) => patchDraft({ status: value as EventStatus })}
                      options={[
                        { value: "draft", label: "Draft" },
                        { value: "published", label: "Published" },
                      ]}
                    />
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-white/45">Deadline</span>
                    <input
                      type="datetime-local"
                      value={toLocalInputValue(draft.deadline)}
                      onChange={(e) => {
                        const iso = fromLocalInputValue(e.target.value);
                        patchDraft({
                          deadline: iso,
                          deadlineDisplay: formatDeadlineDisplay(iso),
                        });
                      }}
                      className={fieldClass()}
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-white/45">Date label</span>
                    <input
                      value={draft.dateLabel}
                      onChange={(e) => patchDraft({ dateLabel: e.target.value })}
                      className={fieldClass()}
                      placeholder="Jul 20 · 7PM CT"
                    />
                  </label>
                </div>

                <label className="block space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-white/45">
                    <MapPin size={11} /> Location
                  </span>
                  <input
                    value={draft.location}
                    onChange={(e) => patchDraft({ location: e.target.value })}
                    className={fieldClass()}
                    placeholder="Fiserv Forum"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-white/45">
                    <Link2 size={11} /> Link
                  </span>
                  <input
                    value={draft.href}
                    onChange={(e) => patchDraft({ href: e.target.value })}
                    className={fieldClass()}
                    placeholder="https://…"
                  />
                </label>

                <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">Thumbnail</p>
                  <div className="mx-auto w-36 overflow-hidden rounded-xl border border-white/10">
                    <img
                      src={resolveEventAssetUrl(draft.thumbnail)}
                      alt=""
                      className="aspect-[3/4] w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/85 hover:bg-white/[0.08]">
                      <Upload size={13} /> Upload
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => onUploadThumbnail(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    <input
                      value={draft.thumbnail.startsWith("data:") ? "(uploaded image)" : draft.thumbnail}
                      onChange={(e) => {
                        if (!e.target.value.startsWith("(")) patchDraft({ thumbnail: e.target.value });
                      }}
                      className={`min-w-[180px] flex-1 ${fieldClass()}`}
                      placeholder="URL or /images/..."
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => patchDraft({ enabled: !draft.enabled })}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${
                    draft.enabled
                      ? "border-dt-green/35 bg-dt-green/10 text-dt-green"
                      : "border-white/15 bg-black/40 text-white/60"
                  }`}
                >
                  {draft.enabled ? <Eye size={15} /> : <EyeOff size={15} />}
                  {draft.enabled ? "Visible in app" : "Hidden in app"}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
