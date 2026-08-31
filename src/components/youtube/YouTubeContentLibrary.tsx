import { useMemo, useState } from "react";
import { Eye, ThumbsUp, MessageCircle, Play, Search, Clock } from "lucide-react";
import { Card } from "../ui/Card";
import {
  formatDuration,
  formatMetric,
  formatPostDate,
  titlePreview,
  type YouTubeAnalytics,
  type YouTubeVideoAnalytics,
} from "../../lib/youtubeAnalyticsApi";

type SortKey = "recent" | "views" | "likes" | "comments";

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: "recent", label: "Newest" },
  { key: "views", label: "Most viewed" },
  { key: "likes", label: "Most liked" },
  { key: "comments", label: "Most discussed" },
];

function sortVideos(videos: YouTubeVideoAnalytics[], key: SortKey) {
  const list = [...videos];
  if (key === "views") return list.sort((a, b) => b.viewCount - a.viewCount);
  if (key === "likes") return list.sort((a, b) => b.likeCount - a.likeCount);
  if (key === "comments")
    return list.sort((a, b) => (b.commentCount ?? 0) - (a.commentCount ?? 0));
  return list.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

function VideoCard({ video }: { video: YouTubeVideoAnalytics }) {
  const thumb = video.thumbnailUrl ?? `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;

  return (
    <a
      href={video.permalink}
      target="_blank"
      rel="noreferrer"
      className="group relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-dt-border bg-dt-card transition-all duration-200 hover:-translate-y-0.5 hover:border-dt-red/60"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        <img
          src={thumb}
          alt={video.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          <Clock size={10} />
          {formatDuration(video.durationSeconds)}
        </span>
        <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-dt-red/90 shadow-lg">
            <Play size={18} className="translate-x-[1px] text-white" fill="currentColor" />
          </span>
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-white group-hover:text-dt-red">
          {titlePreview(video.title, 90)}
        </p>
        <p className="text-[11px] text-dt-muted">{formatPostDate(video.publishedAt)}</p>
        <div className="mt-auto flex items-center gap-3 text-[11px] font-medium text-dt-muted">
          <span className="flex items-center gap-1">
            <Eye size={12} className="text-white/70" />
            {formatMetric(video.viewCount, true)}
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp size={12} className="text-dt-green" />
            {formatMetric(video.likeCount, true)}
          </span>
          {typeof video.commentCount === "number" && (
            <span className="flex items-center gap-1">
              <MessageCircle size={12} className="text-white/70" />
              {formatMetric(video.commentCount, true)}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

export function YouTubeContentLibrary({ analytics }: { analytics: YouTubeAnalytics }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [showAll, setShowAll] = useState(false);

  const videos = analytics.allVideos?.length ? analytics.allVideos : analytics.recentVideos;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matched = needle
      ? videos.filter((video) => video.title.toLowerCase().includes(needle))
      : videos;
    return sortVideos(matched, sort);
  }, [videos, query, sort]);

  const visible = showAll ? filtered : filtered.slice(0, 12);

  return (
    <Card
      title={`All Content (${videos.length})`}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dt-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search videos"
              className="h-8 w-40 rounded-md border border-dt-border bg-black/60 pl-7 pr-2 text-xs text-white placeholder:text-dt-muted focus:border-dt-red focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1 rounded-md border border-dt-border bg-black/60 p-0.5">
            {SORTS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setSort(option.key)}
                className={`rounded px-2 py-1 text-[11px] font-semibold transition-colors ${
                  sort === option.key
                    ? "bg-dt-red text-white"
                    : "text-dt-muted hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      }
    >
      <div className="p-3">
        {visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-dt-muted">
            No videos match “{query}”.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {visible.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}

        {filtered.length > 12 && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAll((value) => !value)}
              className="rounded-full border border-dt-border px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:border-dt-red hover:text-dt-red"
            >
              {showAll ? "Show less" : `Show all ${filtered.length} videos`}
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
