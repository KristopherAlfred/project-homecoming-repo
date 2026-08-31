import { useEffect, useState } from "react";
import { Loader2, Play } from "lucide-react";
import { Card } from "./ui/Card";
import {
  fetchFacebookAnalytics,
  formatMetric as formatFbMetric,
} from "../lib/facebookAnalyticsApi";
import {
  fetchInstagramAnalytics,
  formatMetric as formatIgMetric,
  instagramPostImage,
} from "../lib/instagramAnalyticsApi";
import {
  fetchTwitterAnalytics,
  formatMetric as formatTwMetric,
} from "../lib/twitterAnalyticsApi";
import {
  fetchYouTubeAnalytics,
  formatMetric as formatYtMetric,
} from "../lib/youtubeAnalyticsApi";

type TopItem = {
  id: string;
  platform: "Instagram" | "Facebook" | "X" | "YouTube";
  title: string;
  likes: number;
  likesLabel: string;
  thumbUrl: string;
  isVideo: boolean;
};

function formatLikes(value: number, formatter: (n: number, compact?: boolean) => string) {
  return `${formatter(value, true)} likes`;
}

function previewText(text: string, max = 48) {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return "Post";
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

function LiveThumb({ src, isVideo }: { src: string; isVideo: boolean }) {
  return (
    <div className="relative h-9 w-14 shrink-0 overflow-hidden rounded border border-dt-border bg-zinc-800">
      {src ? <img src={src} alt="" className="h-full w-full object-cover object-center" /> : null}
      {isVideo ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/35">
          <Play size={10} className="fill-white text-white" />
        </div>
      ) : null}
    </div>
  );
}

async function loadTopPerforming(): Promise<TopItem[]> {
  const [instagram, facebook, twitter, youtube] = await Promise.allSettled([
    fetchInstagramAnalytics(),
    fetchFacebookAnalytics(),
    fetchTwitterAnalytics(),
    fetchYouTubeAnalytics(),
  ]);

  const items: TopItem[] = [];

  const ig = instagram.status === "fulfilled" ? instagram.value : null;
  for (const post of ig?.topPosts ?? ig?.recentPosts ?? []) {
    items.push({
      id: `ig-${post.id}`,
      platform: "Instagram",
      title: previewText(post.caption || "Instagram post"),
      likes: post.likes,
      likesLabel: formatLikes(post.likes, formatIgMetric),
      thumbUrl: instagramPostImage(post),
      isVideo: post.mediaType === "video",
    });
  }

  const fb = facebook.status === "fulfilled" ? facebook.value : null;
  for (const post of fb?.topPosts ?? fb?.recentPosts ?? []) {
    items.push({
      id: `fb-${post.id}`,
      platform: "Facebook",
      title: previewText(post.text || "Facebook post"),
      likes: post.likes,
      likesLabel: formatLikes(post.likes, formatFbMetric),
      thumbUrl: "",
      isVideo: false,
    });
  }

  const tw = twitter.status === "fulfilled" ? twitter.value : null;
  for (const post of tw?.topPosts ?? tw?.recentPosts ?? []) {
    items.push({
      id: `x-${post.id}`,
      platform: "X",
      title: previewText(post.text || "Post on X"),
      likes: post.likes,
      likesLabel: formatLikes(post.likes, formatTwMetric),
      thumbUrl: "",
      isVideo: false,
    });
  }

  const yt = youtube.status === "fulfilled" ? youtube.value : null;
  for (const video of yt?.topVideos ?? yt?.recentVideos ?? []) {
    items.push({
      id: `yt-${video.id}`,
      platform: "YouTube",
      title: video.title || "YouTube video",
      likes: video.likeCount,
      likesLabel: formatLikes(video.likeCount, formatYtMetric),
      thumbUrl: `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
      isVideo: true,
    });
  }

  const ranked = items
    .filter((item) => Number.isFinite(item.likes) && item.likes > 0)
    .sort((a, b) => b.likes - a.likes);

  // Seed with the top item from each platform so X viral posts don't fill the whole list,
  // then fill remaining slots by likes (cap 2 per platform).
  const byPlatform = new Map<TopItem["platform"], TopItem[]>();
  for (const item of ranked) {
    const list = byPlatform.get(item.platform) ?? [];
    list.push(item);
    byPlatform.set(item.platform, list);
  }

  const selected: TopItem[] = [];
  const selectedIds = new Set<string>();
  const platformCount = new Map<TopItem["platform"], number>();

  const take = (item: TopItem) => {
    if (selectedIds.has(item.id) || selected.length >= 5) return;
    const count = platformCount.get(item.platform) ?? 0;
    if (count >= 2) return;
    selected.push(item);
    selectedIds.add(item.id);
    platformCount.set(item.platform, count + 1);
  };

  for (const list of byPlatform.values()) {
    if (list[0]) take(list[0]);
  }
  for (const item of ranked) {
    take(item);
  }

  return selected
    .sort((a, b) => b.likes - a.likes)
    .map((item) => ({
      ...item,
      title: `${item.platform} — ${item.title}`,
    }));
}

export function TopPerformingContent() {
  const [items, setItems] = useState<TopItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    loadTopPerforming()
      .then((next) => {
        if (!cancelled) setItems(next);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card title="Top Performing Content" className="flex h-full w-full flex-col">
      {loading ? (
        <div className="flex flex-1 items-center justify-center gap-2 py-10 text-sm text-dt-muted">
          <Loader2 size={16} className="animate-spin text-dt-red" />
          Loading top content…
        </div>
      ) : items.length === 0 ? (
        <p className="flex-1 px-4 py-10 text-center text-sm text-dt-muted">No top content yet.</p>
      ) : (
        <ol className="flex-1 divide-y divide-dt-border px-2">
          {items.map((item, index) => (
            <li key={item.id} className="flex items-center gap-3 px-2 py-2">
              <span className="w-4 text-center text-xs font-bold text-dt-red">{index + 1}</span>
              <LiveThumb src={item.thumbUrl} isVideo={item.isVideo} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-medium text-white">{item.title}</p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-dt-green">{item.likesLabel}</span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
