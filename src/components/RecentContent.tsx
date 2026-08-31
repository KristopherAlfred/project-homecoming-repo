import { useAthlete } from "../contexts/AthleteContext";
import { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import { Loader2, MoreHorizontal, Pencil, Play, Search } from "lucide-react";
import { Card } from "./ui/Card";
import { fetchEventsFeed, resolveEventAssetUrl, type AppEventItem } from "../lib/eventsApi";
import { fetchNewsFeed, resolveNewsAssetUrl, type NewsItem } from "../lib/newsApi";
import { fetchVideoFeed, resolveVideoAssetUrl, type ExclusiveVideoItem } from "../lib/videosApi";
import {
  fetchYouTubeAnalytics,
  formatDuration,
  formatMetric,
  type YouTubeVideoAnalytics,
} from "../lib/youtubeAnalyticsApi";
import { DtSelect } from "./DtSelect";

const tabs = ["All Content", "Videos", "Events", "Giveaways", "Newsletters"] as const;
type ContentTab = (typeof tabs)[number];
type VideoSourceFilter = "all" | "youtube" | "exclusive";

type RecentRow = {
  id: string;
  title: string;
  type: "YouTube" | "Exclusive" | "Giveaway" | "Newsletter" | "News" | "Event";
  status: "Published" | "Draft";
  published: string;
  publishedAt: number;
  meta: string;
  detail: string;
  thumbUrl: string;
  isVideo: boolean;
  editPath: string;
};

function formatPublished(iso: string, fallback = "") {
  const raw = iso || fallback;
  if (!raw) return "—";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  const now = Date.now();
  const diff = now - date.getTime();
  if (diff >= 0 && diff < 1000 * 60 * 60 * 36) return "Recent";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function statusLabel(status: string): "Published" | "Draft" {
  return String(status).toLowerCase() === "published" ? "Published" : "Draft";
}

function mapExclusiveVideo(item: ExclusiveVideoItem): RecentRow {
  return {
    id: `exclusive-${item.id}`,
    title: item.title || "Untitled exclusive",
    type: "Exclusive",
    status: statusLabel(item.status),
    published: formatPublished(item.publishedAt, item.date),
    publishedAt: new Date(item.publishedAt || item.date || 0).getTime() || 0,
    meta: item.duration || "Exclusive",
    detail: item.description?.trim() || "Exclusive drop",
    thumbUrl: resolveVideoAssetUrl(item.thumbnail),
    isVideo: true,
    editPath: "/content/videos",
  };
}

function mapYouTubeVideo(item: YouTubeVideoAnalytics): RecentRow {
  return {
    id: `youtube-${item.id}`,
    title: item.title || "Untitled YouTube video",
    type: "YouTube",
    status: "Published",
    published: formatPublished(item.publishedAt),
    publishedAt: new Date(item.publishedAt || 0).getTime() || 0,
    meta: formatMetric(item.viewCount, true),
    detail: `${formatMetric(item.likeCount, true)} likes · ${formatDuration(item.durationSeconds)}`,
    thumbUrl: `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
    isVideo: true,
    editPath: "/content/videos",
  };
}

function mapNews(item: NewsItem): RecentRow {
  const isNewsletter = item.category === "newsletters";
  return {
    id: `news-${item.id}`,
    title: item.title || "Untitled article",
    type: isNewsletter ? "Newsletter" : "News",
    status: statusLabel(item.status),
    published: formatPublished(item.publishedAt, item.date),
    publishedAt: new Date(item.publishedAt || item.date || 0).getTime() || 0,
    meta: isNewsletter ? "Newsletter" : item.category === "insights" ? "Insight" : "News",
    detail:
      item.description?.trim() ||
      (item.source === "players_tribune" ? "Players' Tribune" : "Fan app news"),
    thumbUrl: resolveNewsAssetUrl(item.thumbnail),
    isVideo: false,
    editPath: "/content/news",
  };
}

function mapEvent(item: AppEventItem): RecentRow {
  const isGiveaway = item.type === "giveaway";
  return {
    id: `event-${item.id}`,
    title: item.title || "Untitled event",
    type: isGiveaway ? "Giveaway" : "Event",
    status: item.status === "published" && item.enabled !== false ? "Published" : statusLabel(item.status),
    published: formatPublished(item.publishedAt, item.dateLabel),
    publishedAt: new Date(item.publishedAt || item.deadline || 0).getTime() || 0,
    meta: item.location || item.dateLabel || (isGiveaway ? "Giveaway" : "Event"),
    detail: item.description?.trim() || item.deadlineDisplay || "Fan app events",
    thumbUrl: resolveEventAssetUrl(item.thumbnail),
    isVideo: false,
    editPath: "/content/events",
  };
}

function LiveThumb({ src, isVideo }: { src: string; isVideo: boolean }) {
  return (
    <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded border border-dt-border bg-zinc-800">
      {src ? <img src={src} alt="" className="h-full w-full object-cover object-center" /> : null}
      {isVideo ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/35">
          <Play size={14} className="fill-white text-white" />
        </div>
      ) : null}
    </div>
  );
}

export function RecentContent() {
  const { fanAppName } = useAthlete();
  const [activeTab, setActiveTab] = useState<ContentTab>("All Content");
  const [videoSource, setVideoSource] = useState<VideoSourceFilter>("all");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Published" | "Draft">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | RecentRow["type"]>("all");
  const [rows, setRows] = useState<RecentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [news, exclusive, events, youtube] = await Promise.all([
          fetchNewsFeed().catch(() => ({ items: [] as NewsItem[] })),
          fetchVideoFeed().catch(() => ({ items: [] as ExclusiveVideoItem[] })),
          fetchEventsFeed().catch(() => ({ items: [] as AppEventItem[] })),
          fetchYouTubeAnalytics().catch(() => null),
        ]);

        if (cancelled) return;

        const next = [
          ...(youtube?.recentVideos ?? []).map(mapYouTubeVideo),
          ...exclusive.items.map(mapExclusiveVideo),
          ...news.items.map(mapNews),
          ...events.items.map(mapEvent),
        ].sort((a, b) => b.publishedAt - a.publishedAt);

        setRows(next);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load fan app content");
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeTab !== "Videos") setVideoSource("all");
  }, [activeTab]);

  const videoCounts = useMemo(() => {
    const youtube = rows.filter((row) => row.type === "YouTube").length;
    const exclusive = rows.filter((row) => row.type === "Exclusive").length;
    return { youtube, exclusive, all: youtube + exclusive };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesTab =
        activeTab === "All Content" ||
        (activeTab === "Videos" && (row.type === "YouTube" || row.type === "Exclusive")) ||
        (activeTab === "Events" && row.type === "Event") ||
        (activeTab === "Giveaways" && row.type === "Giveaway") ||
        (activeTab === "Newsletters" && (row.type === "Newsletter" || row.type === "News"));

      const matchesVideoSource =
        activeTab !== "Videos" ||
        videoSource === "all" ||
        (videoSource === "youtube" && row.type === "YouTube") ||
        (videoSource === "exclusive" && row.type === "Exclusive");

      const matchesStatus = statusFilter === "all" || row.status === statusFilter;
      const matchesType = typeFilter === "all" || row.type === typeFilter;
      const matchesQuery =
        !normalizedQuery ||
        row.title.toLowerCase().includes(normalizedQuery) ||
        row.detail.toLowerCase().includes(normalizedQuery);

      return matchesTab && matchesVideoSource && matchesStatus && matchesType && matchesQuery;
    });
  }, [activeTab, query, rows, statusFilter, typeFilter, videoSource]);

  return (
    <Card className="flex h-full w-full flex-col">
      <div className="border-b border-dt-border bg-gradient-to-r from-black via-[#080808] to-black px-4 py-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Recent Content</h3>
            <p className="mt-0.5 text-[11px] text-white/45">
              Live from {fanAppName} — YouTube, exclusives, news, and events
            </p>
          </div>
          {loading ? <Loader2 size={14} className="animate-spin text-dt-red" /> : null}
        </div>
        <div className="mb-3 flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === tab
                  ? "bg-dt-red text-white"
                  : "text-white/80 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Videos" ? (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {(
              [
                { id: "all", label: `All videos (${videoCounts.all})` },
                { id: "youtube", label: `YouTube (${videoCounts.youtube})` },
                { id: "exclusive", label: `Exclusive (${videoCounts.exclusive})` },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setVideoSource(option.id)}
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                  videoSource === option.id
                    ? "border-dt-red bg-dt-red/20 text-white"
                    : "border-dt-border text-white/65 hover:border-white/25 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-md border border-dt-border bg-dt-bg px-3 py-1.5">
            <Search size={14} className="text-white" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search content..."
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/50"
            />
          </div>
          <DtSelect
            value={statusFilter}
            aria-label="Status filter"
            className="w-[120px]"
            onChange={(value) => setStatusFilter(value as typeof statusFilter)}
            options={[
              { value: "all", label: "Status" },
              { value: "Published", label: "Published" },
              { value: "Draft", label: "Draft" },
            ]}
          />
          <DtSelect
            value={typeFilter}
            aria-label="Type filter"
            className="w-[130px]"
            onChange={(value) => setTypeFilter(value as typeof typeFilter)}
            options={[
              { value: "all", label: "Types" },
              { value: "YouTube", label: "YouTube" },
              { value: "Exclusive", label: "Exclusive" },
              { value: "Newsletter", label: "Newsletter" },
              { value: "News", label: "News" },
              { value: "Giveaway", label: "Giveaway" },
              { value: "Event", label: "Event" },
            ]}
          />
        </div>
      </div>

      {error ? (
        <div className="border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-200">{error}</div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-dt-border text-[11px] uppercase tracking-wide text-white">
              <th className="px-4 py-2.5 font-medium">Content</th>
              <th className="px-3 py-2.5 font-medium">Type</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 font-medium">Published</th>
              <th className="px-3 py-2.5 font-medium">Info</th>
              <th className="px-3 py-2.5 font-medium">Detail</th>
              <th className="px-4 py-2.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-dt-muted">
                  Loading {fanAppName} content…
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-dt-muted">
                  {activeTab === "Videos" && videoSource === "exclusive"
                    ? "No exclusive videos published yet — add them under Content → Videos → Exclusive."
                    : `No ${activeTab === "All Content" ? "content" : activeTab.toLowerCase()} found in the app feeds.`}
                </td>
              </tr>
            ) : (
              filteredRows.slice(0, 12).map((row) => (
                <tr key={row.id} className="border-b border-dt-border/60 hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 align-middle">
                    <div className="flex items-center gap-3">
                      <LiveThumb src={row.thumbUrl} isVideo={row.isVideo} />
                      <span className="max-w-[200px] truncate font-medium text-white">{row.title}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 align-middle text-white">{row.type}</td>
                  <td className="px-3 py-2.5 align-middle">
                    <span
                      className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                        row.status === "Published"
                          ? "bg-green-500/15 text-dt-green"
                          : "bg-orange-500/15 text-dt-orange"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 align-middle text-white">{row.published}</td>
                  <td className="px-3 py-2.5 align-middle text-white">{row.meta}</td>
                  <td className="max-w-[160px] truncate px-3 py-2.5 align-middle text-white/80">{row.detail}</td>
                  <td className="px-4 py-2.5 align-middle">
                    <div className="flex gap-1">
                      <Link
                        to={row.editPath}
                        className="rounded p-1 text-white hover:bg-dt-border hover:text-white"
                        title={`Manage in ${row.editPath.replace("/content/", "")}`}
                      >
                        <Pencil size={14} />
                      </Link>
                      <Link
                        to={row.editPath}
                        className="rounded p-1 text-white hover:bg-dt-border hover:text-white"
                        title="Open content manager"
                      >
                        <MoreHorizontal size={14} />
                      </Link>
                    </div>
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
