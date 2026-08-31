import { useEffect, useState } from "react";
import { fetchSocialSources, type SocialPlatformKey } from "./socialSources";
import { fetchYouTubeAnalytics } from "./youtubeAnalyticsApi";
import { fetchTikTokAnalytics } from "./tiktokAnalyticsApi";
import { fetchInstagramAnalytics } from "./instagramAnalyticsApi";
import { fetchTwitterAnalytics } from "./twitterAnalyticsApi";
import { fetchFacebookAnalytics } from "./facebookAnalyticsApi";

/**
 * Engagement rate across every connected platform (YouTube included).
 * Only platforms reporting a real rate contribute; others are listed in
 * `missing` so the UI can name what is still syncing.
 */
export type EngagementBreakdown = {
  /** Average of every reported platform rate, in percent. */
  average: number;
  perPlatform: Array<{ platform: SocialPlatformKey; label: string; rate: number }>;
  missing: string[];
};

const RATE_FETCHERS: Partial<Record<SocialPlatformKey, () => Promise<number>>> = {
  youtube: async () => Number((await fetchYouTubeAnalytics())?.kpis?.engagementRate ?? 0),
  instagram: async () => Number((await fetchInstagramAnalytics())?.kpis?.engagementRate ?? 0),
  tiktok: async () => Number((await fetchTikTokAnalytics())?.kpis?.engagementRate ?? 0),
  x: async () => Number((await fetchTwitterAnalytics())?.kpis?.engagementRate ?? 0),
  facebook: async () => Number((await fetchFacebookAnalytics())?.kpis?.engagementRate ?? 0),
};

export async function fetchEngagementRates(): Promise<EngagementBreakdown> {
  const sources = await fetchSocialSources();
  const connected = Object.values(sources).filter((source) => source.connected);

  const results = await Promise.all(
    connected.map(async (source) => {
      const fetcher = RATE_FETCHERS[source.platform];
      if (!fetcher) return { platform: source.platform, label: source.label, rate: 0 };
      try {
        const rate = await fetcher();
        return {
          platform: source.platform,
          label: source.label,
          rate: Number.isFinite(rate) ? rate : 0,
        };
      } catch {
        return { platform: source.platform, label: source.label, rate: 0 };
      }
    }),
  );

  const perPlatform = results.filter((row) => row.rate > 0);
  const average = perPlatform.length
    ? Math.round((perPlatform.reduce((sum, row) => sum + row.rate, 0) / perPlatform.length) * 100) /
      100
    : 0;

  return {
    average,
    perPlatform,
    missing: results.filter((row) => row.rate <= 0).map((row) => row.label),
  };
}

export function useEngagementRates(refreshKey: unknown = 0) {
  const [rates, setRates] = useState<EngagementBreakdown | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchEngagementRates()
      .then((next) => {
        if (!cancelled) setRates(next);
      })
      .catch(() => {
        if (!cancelled) setRates(null);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return rates;
}
