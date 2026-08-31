import { useAthlete } from "../contexts/AthleteContext";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Eye,
  Film,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import { Panel, StatCard } from "../components/PageShell";
import { YouTubeAnalyticsView } from "../components/youtube/YouTubeAnalyticsDashboard";
import { SourceError, SourceLoading } from "../components/dametime/DametimeAnalyticsStates";
import { NotConnectedCard } from "../components/states/ConnectionStates";
import { useSocialSources } from "../lib/socialSources";
import {
  fetchDametimeAnalytics,
  formatMetric,
  formatRelativeTime,
  type DametimeAnalytics,
} from "../lib/dametimeAnalyticsApi";
import {
  fetchYouTubeAnalytics,
  formatMetric as formatYtMetric,
  type YouTubeAnalytics,
} from "../lib/youtubeAnalyticsApi";
import {
  createEmptyVideoItem,
  deleteVideoItem,
  extractYoutubeId,
  fetchVideoFeed,
  publishVideoFeed,
  resolveVideoAssetUrl,
  upsertVideoItem,
  type ExclusiveVideoFeed,
  type ExclusiveVideoItem,
  type VideoStatus,
} from "../lib/videosApi";
import { TypographyControls } from "../components/TypographyControls";
import { DtSelect } from "../components/DtSelect";
import { titleTypographyStyle } from "../lib/typography";

const MAX_VIDEO_UPLOAD_BYTES = 12 * 1024 * 1024;
type VideosTab = "youtube" | "exclusive";

const TABS: { id: VideosTab; label: string }[] = [
  { id: "youtube", label: "YOUTUBE" },
  { id: "exclusive", label: "EXCLUSIVE" },
];

function matchesExclusiveTarget(target: string | null | undefined, videoId: string) {
  if (!target) return false;
  const t = target.toLowerCase();
  const id = videoId.toLowerCase();
  return t === id || t.includes(`/access/videos/${id}`) || t.includes(id);
}

export function VideosContentPage() {
  const [tab, setTab] = useState<VideosTab>("youtube");
  const activeIndex = TABS.findIndex((item) => item.id === tab);

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
        <div className="relative border-b border-dt-border bg-gradient-to-br from-black via-[#0c0c0c] to-[#051a12] px-5 py-5 sm:px-7 sm:py-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_12%_0%,rgba(var(--theme-accent-rgb),0.22),transparent_52%)]" />
          <div className="relative max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-dt-red/30 bg-dt-red/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-dt-red">
              <Film size={12} />
              Videos
              <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-emerald-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                LIVE
              </span>
            </div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              YouTube analytics & Exclusive uploads
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/65">
              Same tabs fans use in your fan app — switch to Exclusive to upload clips and track opens once they go live.
            </p>
          </div>
        </div>

        <div className="px-4 py-3 sm:px-5">
          <div
            role="tablist"
            aria-label="Video categories"
            className="relative grid grid-cols-2 overflow-hidden rounded-xl border border-white/10 bg-black/40 p-1"
          >
            <div
              className="pointer-events-none absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/2)] rounded-lg bg-dt-red shadow-[0_8px_24px_rgba(var(--theme-accent-rgb),0.35)] transition-transform duration-300 ease-out"
              style={{ transform: `translateX(${activeIndex * 100}%)` }}
              aria-hidden
            />
            {TABS.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(item.id)}
                  className={`relative z-10 truncate px-2 py-2.5 text-[11px] font-bold tracking-[0.12em] transition sm:text-xs ${
                    active ? "text-white" : "text-white/45 hover:text-white/75"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {tab === "youtube" ? <YouTubeVideosPanel /> : <ExclusiveVideosPanel />}
    </div>
  );
}

function YouTubeVideosPanel() {
  const { fanAppName } = useAthlete();
  const { sources, loading: sourcesLoading } = useSocialSources();
  const [analytics, setAnalytics] = useState<YouTubeAnalytics | null>(null);
  const [dameAnalytics, setDameAnalytics] = useState<DametimeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connected = sources?.youtube.connected ?? false;

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [data, dame] = await Promise.all([
        fetchYouTubeAnalytics(),
        fetchDametimeAnalytics().catch(() => null),
      ]);
      setAnalytics(data);
      setDameAnalytics(dame);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load YouTube");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (sourcesLoading) return;
    if (!connected) {
      setLoading(false);
      return;
    }
    void load();
  }, [load, connected, sourcesLoading]);

  const youtubeAppClicks = useMemo(() => {
    const fromApi = dameAnalytics?.youtubeClicks ?? [];
    if (fromApi.length) {
      const titleById = new Map(
        [...(analytics?.recentVideos ?? []), ...(analytics?.topVideos ?? [])].map((video) => [
          video.id,
          video.title,
        ]),
      );
      return fromApi.map((row) => ({
        ...row,
        title: titleById.get(row.videoId) || row.label,
      }));
    }

    // Fallback if older analytics payload has no youtubeClicks field yet.
    return (dameAnalytics?.topTargets ?? [])
      .filter((row) => row.target.startsWith("youtube:"))
      .map((row) => {
        const videoId = row.target.slice("youtube:".length);
        return {
          target: row.target,
          videoId,
          label: row.label,
          title: row.label,
          count: row.count,
        };
      });
  }, [dameAnalytics, analytics]);

  const totalAppOpens = useMemo(
    () => youtubeAppClicks.reduce((sum, row) => sum + row.count, 0),
    [youtubeAppClicks],
  );

  if (sourcesLoading || (loading && !analytics && connected)) {
    return <SourceLoading message="Loading YouTube analytics…" />;
  }

  if (!connected) {
    return (
      <NotConnectedCard
        platform="YouTube"
        message="Connect your YouTube channel to see live video analytics"
      />
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-3">
        <SourceError title="Could not load YouTube analytics" message={error || "No data available."} />
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">Public YouTube channel</p>
          <p className="text-[11px] text-white/40">
            Live API · Synced {new Date(analytics.syncedAt).toLocaleString()} ·{" "}
            {formatYtMetric(analytics.kpis.subscribers, true)} subscribers
            {analytics.source ? ` · ${analytics.source}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-dt-red/40 disabled:opacity-60"
        >
          {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </div>
      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="In-app YouTube opens" value={formatMetric(totalAppOpens)} />
        <StatCard label="Videos with clicks" value={String(youtubeAppClicks.length)} />
        <StatCard
          label="Channel subscribers"
          value={formatYtMetric(analytics.kpis.subscribers, true)}
          hint="YouTube public stats"
        />
      </div>

      <Panel title="In-app YouTube clicks">
        <p className="mb-3 text-[11px] text-white/40">
          Fans tapping your YouTube videos in the {fanAppName} app — stored in Supabase `fan_events`
        </p>
        {youtubeAppClicks.length === 0 ? (
          <p className="py-6 text-center text-sm text-dt-muted">
            No in-app YouTube clicks yet. Opens appear here when fans tap videos in the app.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b border-dt-border text-[11px] uppercase tracking-wide text-dt-muted">
                  <th className="px-2 py-2 font-medium">Video</th>
                  <th className="px-2 py-2 font-medium">Target</th>
                  <th className="px-2 py-2 text-right font-medium">Opens</th>
                </tr>
              </thead>
              <tbody>
                {youtubeAppClicks.map((row) => (
                  <tr key={row.target} className="border-b border-dt-border/60 last:border-0">
                    <td className="px-2 py-2.5 text-white">{row.title}</td>
                    <td className="px-2 py-2.5 font-mono text-[11px] text-dt-muted">{row.target}</td>
                    <td className="px-2 py-2.5 text-right font-semibold text-dt-red">{formatMetric(row.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <YouTubeAnalyticsView analytics={analytics} />
    </div>
  );
}

function ExclusiveVideosPanel() {
  const { fanAppName } = useAthlete();
  const [feed, setFeed] = useState<ExclusiveVideoFeed | null>(null);
  const [analytics, setAnalytics] = useState<DametimeAnalytics | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ExclusiveVideoItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [studioMode, setStudioMode] = useState<"analytics" | "upload">("analytics");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextFeed, nextAnalytics] = await Promise.all([
        fetchVideoFeed(),
        fetchDametimeAnalytics().catch(() => null),
      ]);
      setFeed(nextFeed);
      setAnalytics(nextAnalytics);
      const first = nextFeed.items[0];
      if (first) {
        setSelectedId(first.id);
        setDraft({ ...first });
        setStudioMode("upload");
      } else {
        setSelectedId(null);
        setDraft(null);
        setStudioMode("analytics");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load exclusive videos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const items = useMemo(() => {
    const list = feed?.items ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.videoUrl.toLowerCase().includes(q),
    );
  }, [feed, query]);

  const stats = useMemo(() => {
    const all = feed?.items ?? [];
    return {
      total: all.length,
      drafts: all.filter((i) => i.status === "draft").length,
      published: all.filter((i) => i.status === "published").length,
    };
  }, [feed]);

  const videoPerformance = useMemo(() => {
    const published = (feed?.items ?? []).filter((item) => item.status === "published");
    return published
      .map((video) => {
        const opens =
          (analytics?.topTargets ?? [])
            .filter((row) => matchesExclusiveTarget(row.target, video.id))
            .reduce((sum, row) => sum + row.count, 0) ||
          (analytics?.recentActivity ?? []).filter((row) => matchesExclusiveTarget(row.target, video.id))
            .length;
        return { video, opens };
      })
      .sort((a, b) => b.opens - a.opens);
  }, [feed, analytics]);

  const totalOpens = useMemo(
    () => videoPerformance.reduce((sum, row) => sum + row.opens, 0),
    [videoPerformance],
  );

  const recentExclusiveActivity = useMemo(() => {
    const publishedIds = new Set(
      (feed?.items ?? []).filter((item) => item.status === "published").map((item) => item.id),
    );
    if (!publishedIds.size || !analytics) return [];
    return analytics.recentActivity
      .filter((row) => [...publishedIds].some((id) => matchesExclusiveTarget(row.target, id)))
      .slice(0, 8);
  }, [feed, analytics]);

  function selectItem(item: ExclusiveVideoItem) {
    setSelectedId(item.id);
    setDraft({ ...item });
    setStudioMode("upload");
    setStatus(null);
    setError(null);
  }

  function startNew() {
    const item = createEmptyVideoItem();
    setSelectedId(item.id);
    setDraft(item);
    setStudioMode("upload");
    setStatus("New exclusive video — add title, video, thumbnail, then Publish to App");
    setError(null);
  }

  function patchDraft(patch: Partial<ExclusiveVideoItem>) {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function applyVideoUrl(url: string) {
    setDraft((prev) => {
      if (!prev) return prev;
      const youtubeId = extractYoutubeId(url);
      const shouldAutoThumb =
        !prev.thumbnail ||
        prev.thumbnail.includes("dameexclusive") ||
        prev.thumbnail.includes("ytimg");
      return {
        ...prev,
        videoUrl: url,
        ...(youtubeId && shouldAutoThumb
          ? { thumbnail: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` }
          : {}),
      };
    });
  }

  async function saveDraft(nextStatus?: VideoStatus) {
    if (!draft) return;
    if (!draft.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!draft.videoUrl.trim()) {
      setError("Add a video URL or upload a video file");
      return;
    }

    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      const payload: ExclusiveVideoItem = {
        ...draft,
        title: draft.title.trim(),
        description: draft.description.trim(),
        videoUrl: draft.videoUrl.trim(),
        thumbnail: draft.thumbnail.trim() || "/images/dameexclusive.png",
        duration: draft.duration.trim(),
        status: nextStatus ?? draft.status,
        publishedAt: nextStatus === "published" ? new Date().toISOString() : draft.publishedAt,
        date:
          nextStatus === "published"
            ? new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : draft.date,
        source: "manual",
      };
      const nextFeed = await upsertVideoItem(payload);
      setFeed(nextFeed);
      setDraft(payload);
      setSelectedId(payload.id);
      setStatus(
        payload.status === "published"
          ? `Published — live in ${fanAppName} Exclusive Videos`
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
    if (!window.confirm(`Delete “${draft.title || "this video"}”?`)) return;
    setSaving(true);
    setError(null);
    try {
      const nextFeed = await deleteVideoItem(draft.id);
      setFeed(nextFeed);
      const next = nextFeed.items[0] ?? null;
      setSelectedId(next?.id ?? null);
      setDraft(next ? { ...next } : null);
      setStatus("Deleted");
      if (!next) setStudioMode("analytics");
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
      const next = await publishVideoFeed({
        ...feed,
        version: (feed.version || 1) + 1,
        updatedAt: new Date().toISOString(),
      });
      setFeed(next);
      setStatus("Full video feed republished to app");
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

  function onUploadVideo(file: File | null) {
    if (!file || !draft) return;
    if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
      setError(
        `Video file is too large (${Math.round(file.size / (1024 * 1024))}MB). Use a YouTube/mp4 URL for big files, or upload a clip under ~12MB.`,
      );
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        patchDraft({ videoUrl: reader.result });
        setStatus("Video file attached — publish when ready");
      }
    };
    reader.readAsDataURL(file);
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-white/60">
        <Loader2 className="mr-2 animate-spin" size={18} /> Loading exclusive videos…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-white/10 bg-black/30 p-1">
          <button
            type="button"
            onClick={() => setStudioMode("analytics")}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
              studioMode === "analytics" ? "bg-dt-red text-white" : "text-white/55 hover:text-white"
            }`}
          >
            Analytics
          </button>
          <button
            type="button"
            onClick={() => setStudioMode("upload")}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
              studioMode === "upload" ? "bg-dt-red text-white" : "text-white/55 hover:text-white"
            }`}
          >
            Upload
          </button>
        </div>
        <button
          type="button"
          onClick={startNew}
          className="inline-flex items-center gap-2 rounded-xl bg-dt-red px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(var(--theme-accent-rgb),0.35)]"
        >
          <Plus size={14} /> New exclusive video
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Exclusive videos" value={String(stats.total)} />
        <StatCard label="Published" value={String(stats.published)} />
        <StatCard label="Drafts" value={String(stats.drafts)} />
        <StatCard label="App opens" value={formatMetric(totalOpens)} hint={`From ${fanAppName} fan_events`} />
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
      ) : null}
      {status ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
          {status}
        </div>
      ) : null}

      {studioMode === "analytics" ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <section className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
            <div className="border-b border-dt-border px-4 py-3.5">
              <h3 className="font-display text-sm font-semibold tracking-wide text-white">Exclusive performance</h3>
              <p className="text-[11px] text-white/40">
                Opens of each exclusive video detail page in the {fanAppName} app
              </p>
            </div>
            {stats.published === 0 ? (
              <div className="px-4 py-14 text-center">
                <Eye size={22} className="mx-auto text-dt-red" />
                <p className="mt-3 text-sm font-semibold text-white">No exclusive videos yet</p>
                <p className="mt-1 text-xs text-white/45">
                  Same as the app Exclusive tab — publish a video to start tracking analytics here.
                </p>
                <button
                  type="button"
                  onClick={startNew}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-dt-red px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <Plus size={14} /> Upload exclusive
                </button>
              </div>
            ) : (
              <div className="divide-y divide-dt-border">
                {videoPerformance.map(({ video, opens }, index) => (
                  <button
                    key={video.id}
                    type="button"
                    onClick={() => selectItem(video)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/[0.03]"
                  >
                    <span className="w-5 shrink-0 text-center text-xs font-bold text-white/35">{index + 1}</span>
                    <img
                      src={resolveVideoAssetUrl(video.thumbnail)}
                      alt=""
                      className="h-12 w-20 shrink-0 rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{video.title}</p>
                      <p className="text-[11px] text-white/40">
                        {video.duration || "Exclusive"} · {video.date}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums text-white">{formatMetric(opens)}</p>
                      <p className="text-[10px] text-white/40">opens</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
            <div className="border-b border-dt-border px-4 py-3.5">
              <h3 className="font-display text-sm font-semibold tracking-wide text-white">Recent exclusive activity</h3>
              <p className="text-[11px] text-white/40">Live fan opens tied to exclusive video IDs</p>
            </div>
            {recentExclusiveActivity.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-white/40">
                {stats.published
                  ? "Waiting for fans to open exclusive videos in the app…"
                  : "Publish an exclusive video to start collecting opens."}
              </p>
            ) : (
              <div className="divide-y divide-dt-border">
                {recentExclusiveActivity.map((item, idx) => (
                  <div key={`${item.at}-${item.email}-${idx}`} className="px-4 py-3">
                    <p className="text-sm text-white">
                      <span className="font-medium">{item.displayName || item.email}</span>
                      <span className="text-white/45"> · {item.action}</span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/40">
                      {formatRelativeTime(item.at)}
                      {item.target ? ` · ${item.target}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}

      {studioMode === "upload" ? (
        <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <Panel title="Exclusive library">
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={startNew}
                className="inline-flex items-center gap-1 rounded-md bg-dt-red px-3 py-2 text-xs font-semibold text-white"
              >
                <Plus size={13} /> New video
              </button>
              <button
                type="button"
                onClick={() => void republishAll()}
                disabled={saving}
                className="inline-flex items-center gap-1 rounded-md border border-dt-border px-3 py-2 text-xs text-white/70 disabled:opacity-50"
              >
                Republish all
              </button>
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles…"
              className="mb-3 w-full rounded-md border border-dt-border bg-dt-bg px-3 py-2 text-sm outline-none"
            />

            <ul className="max-h-[58vh] space-y-2 overflow-y-auto pr-1">
              {items.length === 0 ? (
                <li className="rounded-md border border-dashed border-dt-border px-3 py-6 text-center text-sm text-dt-muted">
                  No exclusive videos yet. Upload one for the app.
                </li>
              ) : (
                items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => selectItem(item)}
                      className={`flex w-full gap-3 rounded-lg border p-2.5 text-left transition ${
                        selectedId === item.id
                          ? "border-dt-red/60 bg-dt-red/10"
                          : "border-dt-border bg-dt-bg/50 hover:border-dt-red/30"
                      }`}
                    >
                      <img
                        src={resolveVideoAssetUrl(item.thumbnail)}
                        alt=""
                        className="h-14 w-20 shrink-0 rounded object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{item.title || "Untitled"}</p>
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-dt-muted">
                          <Film size={11} />
                          Exclusive · {item.status}
                        </p>
                        <p className="text-[10px] text-dt-muted">{item.date}</p>
                      </div>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </Panel>

          <Panel title={draft ? "Compose exclusive video" : "Editor"}>
            {!draft ? (
              <p className="text-sm text-dt-muted">Select a video or create a new exclusive upload.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void saveDraft("draft")}
                    className="rounded-md border border-dt-border px-3 py-2 text-sm text-white/80 disabled:opacity-50"
                  >
                    Save draft
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void saveDraft("published")}
                    className="inline-flex items-center gap-2 rounded-md bg-dt-red px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                    Publish to app
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void removeItem()}
                    className="ml-auto inline-flex items-center gap-1 rounded-md border border-red-500/30 px-3 py-2 text-sm text-red-200"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-xs text-dt-muted">Title</span>
                  <input
                    value={draft.title}
                    onChange={(e) => patchDraft({ title: e.target.value })}
                    className="w-full rounded-md border border-dt-border bg-dt-bg px-3 py-2 text-sm outline-none focus:border-dt-red/50"
                    placeholder="EXCLUSIVE WORKOUT SESSION"
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
                  <span className="text-xs text-dt-muted">Description</span>
                  <textarea
                    value={draft.description}
                    onChange={(e) => patchDraft({ description: e.target.value })}
                    rows={3}
                    className="w-full rounded-md border border-dt-border bg-dt-bg px-3 py-2 text-sm outline-none focus:border-dt-red/50"
                    placeholder="What fans will see under the title"
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-xs text-dt-muted">Duration label</span>
                    <input
                      value={draft.duration}
                      onChange={(e) => patchDraft({ duration: e.target.value })}
                      className="w-full rounded-md border border-dt-border bg-dt-bg px-3 py-2 text-sm outline-none focus:border-dt-red/50"
                      placeholder="8:24"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs text-dt-muted">Status</span>
                    <DtSelect
                      value={draft.status}
                      aria-label="Status"
                      onChange={(value) => patchDraft({ status: value as VideoStatus })}
                      options={[
                        { value: "draft", label: "Draft" },
                        { value: "published", label: "Published" },
                      ]}
                    />
                  </label>
                </div>

                <div className="space-y-2 rounded-lg border border-dt-border bg-dt-bg/40 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-dt-muted">Video</p>
                  <label className="block space-y-1.5">
                    <span className="text-xs text-dt-muted">YouTube / mp4 URL</span>
                    <input
                      value={draft.videoUrl.startsWith("data:") ? "(uploaded video file)" : draft.videoUrl}
                      onChange={(e) => {
                        if (!e.target.value.startsWith("(")) applyVideoUrl(e.target.value);
                      }}
                      className="w-full rounded-md border border-dt-border bg-dt-bg px-3 py-2 text-sm outline-none focus:border-dt-red/50"
                      placeholder="https://youtube.com/watch?v=… or https://….mp4"
                    />
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dt-border px-3 py-2 text-xs text-white/80 hover:border-dt-red/40">
                    <Video size={13} />
                    Upload video file
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => onUploadVideo(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  <p className="text-[11px] leading-relaxed text-dt-muted">
                    Best for YouTube links or hosted mp4 URLs. Direct uploads work for short clips (~12MB max).
                  </p>
                </div>

                <div className="space-y-2 rounded-lg border border-dt-border bg-dt-bg/40 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-dt-muted">Thumbnail</p>
                  <img
                    src={resolveVideoAssetUrl(draft.thumbnail)}
                    alt=""
                    className="h-36 w-full rounded-md object-cover"
                  />
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dt-border px-3 py-2 text-xs text-white/80">
                      <Upload size={13} /> Upload thumbnail
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
                      className="min-w-[220px] flex-1 rounded-md border border-dt-border bg-dt-bg px-3 py-2 text-xs outline-none"
                      placeholder="Thumbnail URL or /images/..."
                    />
                  </div>
                </div>
              </div>
            )}
          </Panel>
        </div>
      ) : null}
    </div>
  );
}
