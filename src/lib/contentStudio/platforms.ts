/**
 * Platform registry for Content Studio.
 *
 * Every destination the studio can publish to is described here — never
 * hardcoded inside a page. Capabilities drive which UI actions are enabled,
 * so a platform whose API cannot accept a content type is disabled instead of
 * pretending it will publish.
 */

export type StudioPlatformKey =
  | "fanapp"
  | "youtube"
  | "instagram"
  | "x"
  | "twitch"
  | "spotify"
  | "tiktok"
  | "facebook";

export type ContentType =
  | "post"
  | "story"
  | "reel"
  | "video"
  | "live"
  | "audio";

export const CONTENT_TYPES: { key: ContentType; label: string }[] = [
  { key: "post", label: "Post" },
  { key: "story", label: "Story" },
  { key: "reel", label: "Reel / Short" },
  { key: "video", label: "Video" },
  { key: "live", label: "Live promotion" },
  { key: "audio", label: "Audio / podcast" },
];

export type PlatformCapabilities = {
  canPublishImage: boolean;
  canPublishVideo: boolean;
  canPublishShortVideo: boolean;
  canSchedule: boolean;
  canReadProfile: boolean;
  canReadPosts: boolean;
  canReadAnalytics: boolean;
  canPublishLiveContent: boolean;
  canPublishAudio: boolean;
};

export type PlatformDefinition = {
  key: StudioPlatformKey;
  label: string;
  color: string;
  /** Key used by the athlete's connector rows (`platform_connections.platform`). */
  connectorKey: string | null;
  captionLimit: number;
  requiresTitle: boolean;
  contentTypes: ContentType[];
  capabilities: PlatformCapabilities;
};

function caps(overrides: Partial<PlatformCapabilities> = {}): PlatformCapabilities {
  return {
    canPublishImage: false,
    canPublishVideo: false,
    canPublishShortVideo: false,
    canSchedule: true,
    canReadProfile: true,
    canReadPosts: true,
    canReadAnalytics: true,
    canPublishLiveContent: false,
    canPublishAudio: false,
    ...overrides,
  };
}

export const PLATFORMS: Record<StudioPlatformKey, PlatformDefinition> = {
  fanapp: {
    key: "fanapp",
    label: "PlayersOS Fan App",
    color: "var(--theme-accent)",
    connectorKey: null,
    captionLimit: 5000,
    requiresTitle: false,
    contentTypes: ["post", "story", "reel", "video", "live", "audio"],
    capabilities: caps({
      canPublishImage: true,
      canPublishVideo: true,
      canPublishShortVideo: true,
      canPublishLiveContent: true,
      canPublishAudio: true,
    }),
  },
  instagram: {
    key: "instagram",
    label: "Instagram",
    color: "#E1306C",
    connectorKey: "instagram",
    captionLimit: 2200,
    requiresTitle: false,
    contentTypes: ["post", "story", "reel", "live"],
    capabilities: caps({
      canPublishImage: true,
      canPublishVideo: true,
      canPublishShortVideo: true,
      canPublishLiveContent: true,
    }),
  },
  tiktok: {
    key: "tiktok",
    label: "TikTok",
    color: "#25F4EE",
    connectorKey: "tiktok",
    captionLimit: 2200,
    requiresTitle: false,
    contentTypes: ["reel", "video", "live"],
    capabilities: caps({
      canPublishVideo: true,
      canPublishShortVideo: true,
      canPublishLiveContent: true,
    }),
  },
  youtube: {
    key: "youtube",
    label: "YouTube",
    color: "#FF0000",
    connectorKey: "youtube",
    captionLimit: 5000,
    requiresTitle: true,
    contentTypes: ["reel", "video", "live", "post"],
    capabilities: caps({
      canPublishVideo: true,
      canPublishShortVideo: true,
      canPublishLiveContent: true,
      canPublishImage: true,
    }),
  },
  x: {
    key: "x",
    label: "X (Twitter)",
    color: "#FFFFFF",
    connectorKey: "x",
    captionLimit: 280,
    requiresTitle: false,
    contentTypes: ["post", "video", "live"],
    capabilities: caps({
      canPublishImage: true,
      canPublishVideo: true,
      canPublishLiveContent: true,
    }),
  },
  facebook: {
    key: "facebook",
    label: "Facebook",
    color: "#1877F2",
    connectorKey: "facebook",
    captionLimit: 5000,
    requiresTitle: false,
    contentTypes: ["post", "story", "reel", "video", "live"],
    capabilities: caps({
      canPublishImage: true,
      canPublishVideo: true,
      canPublishShortVideo: true,
      canPublishLiveContent: true,
    }),
  },
  twitch: {
    key: "twitch",
    label: "Twitch",
    color: "#9146FF",
    connectorKey: "twitch",
    captionLimit: 500,
    requiresTitle: true,
    contentTypes: ["live", "video"],
    capabilities: caps({
      canPublishVideo: true,
      canPublishLiveContent: true,
    }),
  },
  spotify: {
    key: "spotify",
    label: "Spotify",
    color: "#1DB954",
    connectorKey: "spotify",
    captionLimit: 4000,
    requiresTitle: true,
    contentTypes: ["audio"],
    capabilities: caps({
      canPublishAudio: true,
      canSchedule: true,
    }),
  },
};

export const PLATFORM_ORDER: StudioPlatformKey[] = [
  "fanapp",
  "instagram",
  "tiktok",
  "youtube",
  "x",
  "facebook",
  "twitch",
  "spotify",
];

export function platformList(): PlatformDefinition[] {
  return PLATFORM_ORDER.map((key) => PLATFORMS[key]);
}

export type ConnectionState =
  | "connected"
  | "needs_reauth"
  | "disconnected"
  | "permission_required"
  | "error";

export const CONNECTION_LABELS: Record<ConnectionState, string> = {
  connected: "Connected",
  needs_reauth: "Needs reauthorization",
  disconnected: "Not connected",
  permission_required: "Permission required",
  error: "Connection error",
};

export function supportsContentType(key: StudioPlatformKey, type: ContentType) {
  return PLATFORMS[key].contentTypes.includes(type);
}

export function contentTypesFor(keys: StudioPlatformKey[]): ContentType[] {
  if (!keys.length) return CONTENT_TYPES.map((t) => t.key);
  const set = new Set<ContentType>();
  for (const key of keys) for (const t of PLATFORMS[key].contentTypes) set.add(t);
  return CONTENT_TYPES.map((t) => t.key).filter((t) => set.has(t));
}
