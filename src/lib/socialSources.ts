import { useCallback, useEffect, useState } from "react";
import { fetchPlatformConnections, type PlatformConnection } from "./platformConnections";

/**
 * Single source of truth for "which social accounts has THIS athlete connected".
 *
 * Every analytics fetcher goes through here, so a platform that the logged-in
 * athlete has not connected returns `null` instead of falling back to cached or
 * example data from another athlete. Connections are already scoped to the
 * current athlete_id inside `fetchPlatformConnections()`.
 */

export type SocialPlatformKey =
  | "instagram"
  | "x"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "spotify"
  | "twitch"
  | "mailchimp";

export type SocialSource = {
  platform: SocialPlatformKey;
  label: string;
  connected: boolean;
  /** Platform handle / page slug / channel id captured when connecting. */
  handle: string | null;
  followerCount: number | null;
  lastSyncedAt: string | null;
};

export const PLATFORM_LABELS: Record<SocialPlatformKey, string> = {
  instagram: "Instagram",
  x: "X",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  spotify: "Spotify",
  twitch: "Twitch",
  mailchimp: "Mailchimp",
};

/** Where the "not connected" empty states send the athlete. */
export const CONNECT_PLATFORMS_ROUTE = "/platforms";

function normalizeHandle(value: string | null | undefined): string | null {
  const clean = String(value ?? "")
    .trim()
    .replace(/^@/, "")
    .replace(/\/+$/, "");
  if (!clean) return null;
  // Accept pasted profile URLs too — keep the last meaningful path segment.
  if (/^https?:\/\//i.test(clean)) {
    const segments = clean.split("/").filter(Boolean);
    return segments[segments.length - 1]?.replace(/^@/, "") ?? null;
  }
  return clean;
}

function toSource(row: PlatformConnection | undefined, platform: SocialPlatformKey): SocialSource {
  return {
    platform,
    label: PLATFORM_LABELS[platform],
    connected: Boolean(row?.connected),
    handle: row?.connected ? normalizeHandle(row.handle) : null,
    followerCount: row?.connected ? row.follower_count ?? null : null,
    lastSyncedAt: row?.connected ? row.last_synced_at ?? null : null,
  };
}

export type SocialSourceMap = Record<SocialPlatformKey, SocialSource>;

function buildMap(rows: PlatformConnection[]): SocialSourceMap {
  const byPlatform = new Map(rows.map((row) => [row.platform.toLowerCase(), row]));
  const keys = Object.keys(PLATFORM_LABELS) as SocialPlatformKey[];
  return keys.reduce((acc, key) => {
    // "x" rows may still be stored as "twitter" in older seeds.
    const row = byPlatform.get(key) ?? (key === "x" ? byPlatform.get("twitter") : undefined);
    acc[key] = toSource(row, key);
    return acc;
  }, {} as SocialSourceMap);
}

let cache: { at: number; promise: Promise<SocialSourceMap> } | null = null;
const TTL_MS = 30_000;

export async function fetchSocialSources(force = false): Promise<SocialSourceMap> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache.promise;
  const promise = fetchPlatformConnections()
    .then(buildMap)
    .catch(() => buildMap([]));
  cache = { at: Date.now(), promise };
  return promise;
}

export function invalidateSocialSources() {
  cache = null;
}

export async function getSocialSource(platform: SocialPlatformKey): Promise<SocialSource> {
  const map = await fetchSocialSources();
  return map[platform];
}

/** `null` whenever the athlete has not connected that platform. */
export async function resolveSocialHandle(platform: SocialPlatformKey): Promise<string | null> {
  const source = await getSocialSource(platform);
  return source.connected ? source.handle : null;
}

export async function isPlatformConnected(platform: SocialPlatformKey): Promise<boolean> {
  return (await getSocialSource(platform)).connected;
}

/** Case-insensitive identity guard so a shared API can never return someone else's profile. */
export function handleMatches(expected: string | null, actual: string | null | undefined): boolean {
  const a = normalizeHandle(expected);
  const b = normalizeHandle(actual);
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
}

export { normalizeHandle };

export function useSocialSources() {
  const [sources, setSources] = useState<SocialSourceMap | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async (force = false) => {
    setLoading(true);
    try {
      setSources(await fetchSocialSources(force));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { sources, loading, reload };
}
