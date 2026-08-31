import { useEffect, useState } from "react";
import { supabase } from "../integrations/supabase/client";
import { fetchSocialSources, type SocialPlatformKey } from "./socialSources";
import { fetchYouTubeAnalytics } from "./youtubeAnalyticsApi";
import { fetchTikTokAnalytics } from "./tiktokAnalyticsApi";

/**
 * Total content views across every connected platform.
 *
 * Only real, per-athlete numbers are summed here — a platform that has no
 * view metric (or no data yet) simply contributes nothing and is listed in
 * `missing` so the UI can say which sources are still syncing.
 */
export type ContentViewsBreakdown = {
  total: number;
  perPlatform: Array<{ platform: SocialPlatformKey; label: string; views: number }>;
  /** Connected platforms that reported no view data yet. */
  missing: string[];
};

function sum(values: Array<number | null | undefined>): number {
  return values.reduce<number>((acc, value) => acc + (Number(value) || 0), 0);
}

async function youtubeViews(): Promise<number> {
  try {
    const analytics = await fetchYouTubeAnalytics();
    const total = Number(analytics?.kpis?.totalViews ?? 0);
    if (total > 0) return total;
    const sampled = sum(analytics?.recentVideos?.map((video) => video.viewCount) ?? []);
    if (sampled > 0) return sampled;
  } catch {
    // fall through to the cloud tables
  }

  const stats = await supabase.from("youtube_channel_stats").select("total_views");
  const fromStats = sum(stats.data?.map((row) => row.total_views) ?? []);
  if (fromStats > 0) return fromStats;

  const videos = await supabase.from("youtube_videos").select("view_count");
  return sum(videos.data?.map((row) => row.view_count) ?? []);
}

async function instagramViews(): Promise<number> {
  const { data } = await supabase.from("instagram_media").select("impressions, reach");
  if (!data?.length) return 0;
  const impressions = sum(data.map((row) => row.impressions));
  return impressions > 0 ? impressions : sum(data.map((row) => row.reach));
}

async function tiktokViews(): Promise<number> {
  try {
    const analytics = await fetchTikTokAnalytics();
    if (!analytics) return 0;
    const sampled = sum(analytics.recentVideos?.map((video) => video.views) ?? []);
    if (sampled > 0) return sampled;
    const avg = Number(analytics.kpis?.avgViews ?? 0);
    const count = Number(analytics.kpis?.totalVideos ?? 0);
    return avg > 0 && count > 0 ? Math.round(avg * count) : 0;
  } catch {
    return 0;
  }
}

const VIEW_FETCHERS: Partial<Record<SocialPlatformKey, () => Promise<number>>> = {
  youtube: youtubeViews,
  instagram: instagramViews,
  tiktok: tiktokViews,
};

export async function fetchContentViews(): Promise<ContentViewsBreakdown> {
  const sources = await fetchSocialSources();
  const connected = Object.values(sources).filter((source) => source.connected);

  const results = await Promise.all(
    connected.map(async (source) => {
      const fetcher = VIEW_FETCHERS[source.platform];
      if (!fetcher) return { platform: source.platform, label: source.label, views: 0 };
      try {
        return { platform: source.platform, label: source.label, views: await fetcher() };
      } catch {
        return { platform: source.platform, label: source.label, views: 0 };
      }
    }),
  );

  const perPlatform = results.filter((row) => row.views > 0);
  return {
    total: sum(perPlatform.map((row) => row.views)),
    perPlatform,
    missing: results.filter((row) => row.views <= 0).map((row) => row.label),
  };
}

export function useContentViews(refreshKey: unknown = 0) {
  const [views, setViews] = useState<ContentViewsBreakdown | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchContentViews()
      .then((next) => {
        if (!cancelled) setViews(next);
      })
      .catch(() => {
        if (!cancelled) setViews(null);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return views;
}
