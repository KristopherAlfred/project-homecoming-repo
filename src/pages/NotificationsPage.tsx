import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarClock,
  Eye,
  EyeOff,
  Home,
  LayoutGrid,
  Loader2,
  Plus,
  Sparkles,
  Timer,
  Trash2,
} from "lucide-react";
import {
  createEmptyNotification,
  deleteNotificationItem,
  fetchNotificationFeed,
  fromLocalInputValue,
  publishNotificationFeed,
  toLocalInputValue,
  upsertNotificationItem,
  type AppNotification,
  type NotificationFeed,
  type NotificationStatus,
  type NotificationSurface,
} from "../lib/notificationsApi";
import { DtSelect } from "../components/DtSelect";
import { useAthlete } from "../contexts/AthleteContext";
import {
  SmartSuggestions,
  type NotificationSuggestion,
} from "../components/notifications/SmartSuggestions";

const FREQUENCY_PRESETS = [
  { label: "Every 15 seconds", value: 15 },
  { label: "Every 30 seconds", value: 30 },
  { label: "Every 1 minute", value: 60 },
  { label: "Every 2 minutes", value: 120 },
  { label: "Every 5 minutes", value: 300 },
  { label: "Every 10 minutes", value: 600 },
  { label: "Once a login", value: 0 },
  { label: "Custom…", value: -1 },
];

function fieldClass() {
  return "w-full rounded-xl border border-dt-border bg-black/50 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-dt-red/55 focus:ring-1 focus:ring-dt-red/25";
}

function formatFrequency(seconds: number) {
  if (seconds === 0) return "Once a login";
  if (seconds < 60) return `Every ${seconds}s`;
  if (seconds % 60 === 0) return `Every ${seconds / 60}m`;
  return `Every ${seconds}s`;
}

function isFrequencyPreset(seconds: number) {
  return FREQUENCY_PRESETS.some((p) => p.value === seconds);
}

function PreviewToast({ message, pulsing = false }: { message: string; pulsing?: boolean }) {
  return (
    <div className={`mx-auto w-full max-w-[210px] ${pulsing ? "notif-toast-pulse" : ""}`}>
      <div
        className="relative overflow-hidden rounded-[10px] border bg-black"
        style={{
          borderColor: "rgba(227, 24, 55, 0.75)",
          boxShadow: "inset 0 0 18px rgba(0,0,0,0.45), 0 8px 28px rgba(var(--theme-accent-rgb),0.18)",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(125deg, rgba(80, 0, 12, 0.95) 0%, rgba(180, 12, 32, 0.88) 42%, rgba(120, 0, 18, 0.92) 72%, rgba(40, 0, 8, 0.98) 100%)",
            boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.08)",
          }}
          aria-hidden
        />
        <p className="relative z-[1] m-0 px-2.5 py-2 text-center font-display text-[11px] font-black uppercase leading-tight tracking-[0.08em] text-white">
          {message || "Notification preview"}
        </p>
      </div>
    </div>
  );
}

export function NotificationsPage() {
  const [feed, setFeed] = useState<NotificationFeed | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AppNotification | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [customFrequency, setCustomFrequency] = useState(false);
  const { fanAppName } = useAthlete();

  function useSuggestion(suggestion: NotificationSuggestion) {
    const item = createEmptyNotification();
    const next = { ...item, message: suggestion.message };
    setSelectedId(next.id);
    setDraft(next);
    setCustomFrequency(false);
    setError(null);
    setStatus(
      suggestion.kind === "ai"
        ? "Draft started from an AI insight — review, then Publish"
        : "Draft started from a bio link milestone — review, then Publish",
    );
  }

  useEffect(() => {
    void fetchNotificationFeed()
      .then((next) => {
        setFeed(next);
        const first = next.items[0];
        if (first) {
          setSelectedId(first.id);
          setDraft({ ...first });
          setCustomFrequency(!isFrequencyPreset(first.frequencySeconds));
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load notifications"))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const all = feed?.items ?? [];
    return {
      total: all.length,
      published: all.filter((i) => i.status === "published" && i.enabled).length,
      drafts: all.filter((i) => i.status === "draft").length,
      paused: all.filter((i) => !i.enabled).length,
    };
  }, [feed]);

  function selectItem(item: AppNotification) {
    setSelectedId(item.id);
    setDraft({ ...item });
    setCustomFrequency(!isFrequencyPreset(item.frequencySeconds));
    setStatus(null);
    setError(null);
  }

  function startNew() {
    const item = createEmptyNotification();
    setSelectedId(item.id);
    setDraft(item);
    setCustomFrequency(false);
    setStatus("New notification — set message, frequency, schedule, then Publish");
    setError(null);
  }

  function patchDraft(patch: Partial<AppNotification>) {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  async function saveDraft(nextStatus?: NotificationStatus) {
    if (!draft) return;
    if (!draft.message.trim()) {
      setError("Message is required");
      return;
    }

    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      const freq = Math.round(draft.frequencySeconds || 0);
      const payload: AppNotification = {
        ...draft,
        message: draft.message.trim(),
        status: nextStatus ?? draft.status,
        // 0 = once a login; otherwise clamp to 5–3600s
        frequencySeconds: freq === 0 ? 0 : Math.min(3600, Math.max(5, freq || 30)),
        displayDurationMs: Math.min(15000, Math.max(1500, Math.round(draft.displayDurationMs || 3000))),
      };
      const nextFeed = await upsertNotificationItem(payload);
      setFeed(nextFeed);
      setDraft(payload);
      setSelectedId(payload.id);
      setStatus(
        payload.status === "published"
          ? `Published — live in ${fanAppName} app toasts`
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
    if (!window.confirm("Delete this notification?")) return;
    setSaving(true);
    setError(null);
    try {
      const nextFeed = await deleteNotificationItem(draft.id);
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
      const next = await publishNotificationFeed({
        ...feed,
        version: (feed.version || 1) + 1,
        updatedAt: new Date().toISOString(),
      });
      setFeed(next);
      setStatus("All notifications republished to app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-white/70">
        <Loader2 className="mr-2 animate-spin" size={18} /> Loading notifications…
      </div>
    );
  }

  const frequencySelectValue = customFrequency
    ? -1
    : FREQUENCY_PRESETS.some((p) => p.value === draft?.frequencySeconds)
      ? draft?.frequencySeconds ?? 30
      : -1;

  const EXAMPLE_TOAST = "+10 points! Login tomorrow to earn more 🔥";
  const showingExamplePreview = !draft?.message.trim();
  const previewMessage = draft?.message.trim() || EXAMPLE_TOAST;

  return (
    <div className="space-y-5">
      <style>{`
        @keyframes notif-toast-pulse {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(-3px); opacity: 0.96; }
        }
        .notif-toast-pulse { animation: notif-toast-pulse 2.4s ease-in-out infinite; }
        @keyframes notif-phone-glow {
          0%, 100% { box-shadow: 0 0 0 1px rgba(255,255,255,0.08), 0 24px 60px rgba(0,0,0,0.55); }
          50% { box-shadow: 0 0 0 1px rgba(var(--theme-accent-rgb),0.28), 0 28px 70px rgba(var(--theme-accent-rgb),0.14); }
        }
        .notif-phone-shell { animation: notif-phone-glow 4.5s ease-in-out infinite; }
      `}</style>

      {/* Studio header */}
      <div className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
        <div className="relative border-b border-dt-border bg-gradient-to-br from-black via-[#0c0c0c] to-[#051a12] px-5 py-5 sm:px-7 sm:py-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_12%_0%,rgba(var(--theme-accent-rgb),0.22),transparent_52%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-dt-red/30 bg-dt-red/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-dt-red">
                <Bell size={12} />
                In-app toasts
              </div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Schedule {fanAppName} notifications
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                Write extra messages that pop in the fan app with the same red-gradient toast look — set frequency, duration, and schedule windows.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-white/45">
                The built-in “+10 points! Login tomorrow…” toast is separate. It always stays in the app for daily login rewards and is not listed here — creating or deleting items on this page will not remove it.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-[96px] rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Total</p>
                <p className="mt-1 text-lg font-bold text-white">{stats.total}</p>
              </div>
              <div className="min-w-[96px] rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Live</p>
                <p className="mt-1 text-lg font-bold text-dt-green">{stats.published}</p>
              </div>
              <div className="min-w-[96px] rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Drafts</p>
                <p className="mt-1 text-lg font-bold text-white">{stats.drafts}</p>
              </div>
              <button
                type="button"
                onClick={() => void (draft ? saveDraft("published") : startNew())}
                disabled={saving}
                className="inline-flex min-h-[52px] items-center gap-2 rounded-xl bg-dt-red px-5 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(var(--theme-accent-rgb),0.35)] transition hover:brightness-110 disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {draft ? "Publish to app" : "New notification"}
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

      <SmartSuggestions onUse={useSuggestion} />

      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_360px]">
        {/* List */}
        <section className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
          <div className="flex items-center justify-between border-b border-dt-border px-4 py-3">
            <div>
              <h3 className="font-display text-sm font-semibold tracking-wide text-white">Notifications</h3>
              <p className="text-[11px] text-white/40">Scheduled toasts you publish</p>
            </div>
            <button
              type="button"
              onClick={startNew}
              className="inline-flex items-center gap-1 rounded-lg bg-dt-red/90 px-2.5 py-1.5 text-xs font-semibold text-white hover:brightness-110"
            >
              <Plus size={13} /> New
            </button>
          </div>

          <ul className="max-h-[62vh] space-y-2 overflow-y-auto p-3">
            {(feed?.items ?? []).length === 0 ? (
              <li className="rounded-xl border border-dashed border-white/15 px-3 py-8 text-center">
                <p className="text-sm text-white/55">No scheduled notifications yet.</p>
                <p className="mt-2 text-[11px] leading-relaxed text-white/40">
                  The “+10 points” login reward toast is built into the app — it won’t appear in this list, and publishing here won’t replace or delete it.
                </p>
              </li>
            ) : (
              (feed?.items ?? []).map((item) => {
                const live = item.status === "published" && item.enabled;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => selectItem(item)}
                      className={`flex w-full gap-3 rounded-xl border p-3 text-left transition ${
                        selectedId === item.id
                          ? "border-dt-red/70 bg-dt-red/15 shadow-[inset_0_0_0_1px_rgba(var(--theme-accent-rgb),0.2)]"
                          : "border-white/10 bg-black/25 hover:border-white/20 hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-dt-red/30 bg-gradient-to-br from-dt-red/25 to-black/40 text-dt-red">
                        <Bell size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium text-white">{item.message}</p>
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
                            {live ? "Live" : item.enabled ? item.status : "Paused"}
                          </span>
                          <span className="text-[10px] uppercase tracking-wide text-white/35">
                            {formatFrequency(item.frequencySeconds)}
                          </span>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          <div className="border-t border-dt-border p-3">
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
        <section className="relative flex min-h-[560px] flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-dt-border bg-[radial-gradient(ellipse_at_50%_0%,rgba(var(--theme-accent-rgb),0.14),transparent_45%),linear-gradient(180deg,#121212_0%,#070707_55%,#050505_100%)] px-4 py-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-dt-red/10 to-transparent" />
          {showingExamplePreview ? (
            <div className="relative z-[1] max-w-[320px] rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200">Example only</p>
              <p className="mt-1 text-[11px] leading-relaxed text-amber-100/80">
                Preview of the built-in login-points toast. Not in the left queue — creating or deleting scheduled notifications will not remove it.
              </p>
            </div>
          ) : (
            <div className="relative z-[1] max-w-[320px] rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">Live draft preview</p>
              <p className="mt-1 text-[11px] leading-relaxed text-white/45">
                This is your scheduled notification — not the built-in login-points toast.
              </p>
            </div>
          )}
          <div className="notif-phone-shell relative w-full max-w-[320px] overflow-hidden rounded-[2.35rem] border border-white/15 bg-black">
            <div className="absolute left-1/2 top-2 z-20 h-5 w-28 -translate-x-1/2 rounded-full bg-black/90" />
            <div className="border-b border-white/10 bg-[#0d0d0d] px-4 pb-3 pt-8 text-center">
              <p className="text-[10px] font-semibold tracking-[0.28em] text-white/55">DAMETIME APP</p>
            </div>
            <div className="relative min-h-[420px] bg-[radial-gradient(circle_at_top,_#321018_0%,_#0a0a0a_52%)] px-3 pb-6 pt-4">
              <div className="absolute inset-x-0 top-5 z-20 flex justify-center px-6">
                <PreviewToast message={previewMessage} pulsing />
              </div>

              <div className="mt-24 space-y-2 opacity-40">
                <div className="h-24 rounded-2xl border border-white/10 bg-white/[0.04]" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-28 rounded-2xl border border-white/10 bg-white/[0.04]" />
                  <div className="h-28 rounded-2xl border border-white/10 bg-white/[0.04]" />
                  <div className="h-28 rounded-2xl border border-white/10 bg-white/[0.04]" />
                  <div className="h-28 rounded-2xl border border-white/10 bg-white/[0.04]" />
                </div>
              </div>

              <p className="absolute inset-x-0 bottom-5 text-center text-[10px] uppercase tracking-[0.16em] text-white/35">
                {showingExamplePreview ? "Example look — not queued" : "Your toast preview"}
              </p>
            </div>
          </div>
        </section>

        {/* Editor */}
        <section className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
          {!draft ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/40">
                <Bell size={22} />
              </div>
              <p className="text-sm text-white/55">Select a notification or create a new toast.</p>
              <button
                type="button"
                onClick={startNew}
                className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-dt-red px-4 py-2 text-sm font-semibold text-white"
              >
                <Plus size={14} /> New notification
              </button>
            </div>
          ) : (
            <div className="flex max-h-[calc(100dvh-220px)] flex-col">
              <div className="flex items-center justify-between gap-2 border-b border-dt-border px-4 py-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-dt-red/30 bg-dt-red/15 text-dt-red">
                    <Bell size={16} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-sm font-semibold tracking-wide text-white">Edit toast</h3>
                    <p className="truncate text-[11px] uppercase tracking-[0.12em] text-white/40">
                      {formatFrequency(draft.frequencySeconds)} · {draft.surface === "home" ? "Home" : "All screens"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeItem}
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
                  <span className="text-[11px] font-medium uppercase tracking-wide text-white/45">Message</span>
                  <textarea
                    value={draft.message}
                    onChange={(e) => patchDraft({ message: e.target.value })}
                    rows={3}
                    className={fieldClass()}
                    placeholder="Write your toast message…"
                  />
                  <span className="block text-[11px] leading-relaxed text-white/40">
                    Placeholder style matches the login-points toast. Publishing this adds a separate scheduled notification — it does not replace or delete the built-in “+10 points” toast.
                  </span>
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-white/45">
                      <Timer size={11} /> Frequency
                    </span>
                    <DtSelect
                      value={String(frequencySelectValue)}
                      aria-label="Frequency"
                      onChange={(raw) => {
                        const v = Number(raw);
                        if (v === -1) {
                          setCustomFrequency(true);
                          return;
                        }
                        setCustomFrequency(false);
                        patchDraft({ frequencySeconds: v });
                      }}
                      options={FREQUENCY_PRESETS.map((p) => ({
                        value: String(p.value),
                        label: p.label,
                      }))}
                    />
                    {draft.frequencySeconds === 0 && !customFrequency ? (
                      <span className="block text-[11px] leading-relaxed text-white/40">
                        Shows once per login session, then stays hidden until the fan signs in again.
                      </span>
                    ) : null}
                  </label>

                  {(customFrequency || frequencySelectValue === -1) && (
                    <label className="block space-y-1.5">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-white/45">Custom seconds</span>
                      <input
                        type="number"
                        min={5}
                        max={3600}
                        value={draft.frequencySeconds}
                        onChange={(e) => patchDraft({ frequencySeconds: Number(e.target.value) || 30 })}
                        className={fieldClass()}
                      />
                    </label>
                  )}

                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-white/45">On-screen time</span>
                    <DtSelect
                      value={String(draft.displayDurationMs)}
                      aria-label="On-screen time"
                      onChange={(value) => patchDraft({ displayDurationMs: Number(value) })}
                      options={[
                        { value: "2000", label: "2 seconds" },
                        { value: "3000", label: "3 seconds (points toast)" },
                        { value: "4000", label: "4 seconds" },
                        { value: "5000", label: "5 seconds" },
                        { value: "8000", label: "8 seconds" },
                      ]}
                    />
                  </label>

                  <label className="block space-y-1.5">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-white/45">
                      {draft.surface === "home" ? <Home size={11} /> : <LayoutGrid size={11} />} Show on
                    </span>
                    <DtSelect
                      value={draft.surface}
                      aria-label="Show on"
                      onChange={(value) => patchDraft({ surface: value as NotificationSurface })}
                      options={[
                        { value: "all", label: "All app screens" },
                        { value: "home", label: "Home only" },
                      ]}
                    />
                  </label>
                </div>

                <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-3.5">
                  <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                    <CalendarClock size={12} /> Schedule window
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block space-y-1.5">
                      <span className="text-[11px] text-white/40">Starts</span>
                      <input
                        type="datetime-local"
                        value={toLocalInputValue(draft.scheduleStart)}
                        onChange={(e) => patchDraft({ scheduleStart: fromLocalInputValue(e.target.value) })}
                        className={fieldClass()}
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-[11px] text-white/40">Ends</span>
                      <input
                        type="datetime-local"
                        value={toLocalInputValue(draft.scheduleEnd)}
                        onChange={(e) => patchDraft({ scheduleEnd: fromLocalInputValue(e.target.value) })}
                        className={fieldClass()}
                      />
                    </label>
                  </div>
                  <p className="text-[11px] leading-relaxed text-white/40">
                    Leave blank to run anytime. Frequency waits after each toast before the next pop.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-white/45">Status</span>
                    <DtSelect
                      value={draft.status}
                      aria-label="Status"
                      onChange={(value) => patchDraft({ status: value as NotificationStatus })}
                      options={[
                        { value: "draft", label: "Draft" },
                        { value: "published", label: "Published" },
                      ]}
                    />
                  </label>
                  <div className="flex items-end">
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
                      {draft.enabled ? "Enabled" : "Paused"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
