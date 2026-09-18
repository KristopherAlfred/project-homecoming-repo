/**
 * Data model for the cinematic "link-in-bio" creator hero.
 *
 * Everything the CreatorLinkPage renders comes from here, so an athlete can
 * swap video, photo, name, handle, socials, follower count, bio and featured
 * card without touching layout code.
 */

export type CreatorSocialLink = {
  id: string;
  /** brandIconMap key: tiktok | x | youtube | facebook | instagram | twitch | spotify | custom */
  platform: string;
  url: string;
  /** Optional label used when the platform has no brand mark. */
  label?: string;
  /** Optional badge background override (defaults to white). */
  badgeColor?: string;
};

/** Free-move / resize data shared by blocks and items (design units = phone px). */
export type CreatorFrameLayout = {
  /** Horizontal nudge from the natural slot. */
  x?: number;
  /** Vertical nudge from the natural slot. */
  y?: number;
  /** Width as a percent of the column (30–100). */
  w?: number;
  /** Height in design units (links only). */
  h?: number;
};

export type CreatorFeaturedCard = CreatorFrameLayout & {
  id: string;
  /** Image or poster art for the card. */
  image: string;
  /** Optional oversized title graphic laid over the art. */
  titleImage?: string;
  /** Oversized display title rendered when no titleImage is set. */
  overlayTitle?: string;
  /** Bold caption under the card. */
  caption?: string;
  url?: string;
};

export type CreatorFeature = CreatorFrameLayout & {
  id: string;
  icon: string;
  label: string;
  description: string;
};

export type CreatorBlockId = "identity" | "cta" | "bio" | "fans" | "perks" | "links";

export type CreatorBlockLayout = CreatorFrameLayout & {
  id: CreatorBlockId;
  hidden?: boolean;
};

export const CREATOR_BLOCK_ORDER: CreatorBlockId[] = ["identity", "cta", "bio", "fans", "perks", "links"];

export const CREATOR_BLOCK_LABELS: Record<CreatorBlockId, string> = {
  identity: "Name",
  cta: "Join button",
  bio: "Bio",
  fans: "Joining now",
  perks: "Perks",
  links: "Live links",
};

export const DEFAULT_CREATOR_LAYOUT: CreatorBlockLayout[] = CREATOR_BLOCK_ORDER.map((id) => ({ id }));

export const DEFAULT_LINK_HEIGHT = 176;

export type CreatorProfile = {
  enabled: boolean;
  /** Shared visual composition; never inferred from an athlete's name. */
  layoutVariant: "standard" | "top-video-glass" | "wallpaper";
  /** Full-bleed looping background video behind the hero. */
  videoSrc: string;
  /** Poster/fallback still shown before the video paints. */
  videoPoster: string;
  photo: string;
  name: string;
  verified: boolean;
  handle: string;
  socials: CreatorSocialLink[];
  followerCount: string;
  followerLabel: string;
  bio: string;
  secondaryHandle: string;
  ctaLabel: string;
  joinMicrocopy: string;
  features: CreatorFeature[];
  proofHeadline: string;
  proofSupporting: string;
  featured: CreatorFeaturedCard[];
  /** Section order, visibility and free-move offsets. */
  layout: CreatorBlockLayout[];
  /** Default embedded-link card height (design units). */
  linkHeight: number;
  /** Background focal point (object-position percent) and zoom percent. */
  mediaX: number;
  mediaY: number;
  mediaScale: number;
  /** Tint colour of the translucent glass panel below the video. */
  sheetColor: string;
  /** Opacity percent of that glass panel (0 = fully see-through). */
  sheetOpacity: number;
  fansLabel: string;
  perksLabel: string;
  linksLabel: string;
};

export const DEFAULT_CREATOR_PROFILE: CreatorProfile = {
  enabled: true,
  layoutVariant: "standard",
  videoSrc: "",
  videoPoster: "",
  photo: "",
  name: "",
  verified: true,
  handle: "",
  socials: [
    { id: "tiktok", platform: "tiktok", url: "" },
    { id: "x", platform: "x", url: "" },
    { id: "youtube", platform: "youtube", url: "" },
    { id: "facebook", platform: "facebook", url: "" },
    { id: "instagram", platform: "instagram", url: "" },
  ],
  followerCount: "",
  followerLabel: "Total Followers",
  bio: "",
  secondaryHandle: "",
  ctaLabel: "Join My Circle",
  joinMicrocopy: "By joining, you agree to receive occasional updates.",
  features: [
    { id: "early", icon: "clock", label: "Early Access", description: "Be first in line" },
    { id: "drops", icon: "gift", label: "Exclusive Drops", description: "Members-only releases" },
    { id: "content", icon: "sparkles", label: "Exclusive Content", description: "Closer to the action" },
  ],
  proofHeadline: "100K+ Fans Already Joined",
  proofSupporting: "Be part of the inner circle",
  featured: [],
  layout: DEFAULT_CREATOR_LAYOUT.map((b) => ({ ...b })),
  linkHeight: DEFAULT_LINK_HEIGHT,
  mediaX: 50,
  mediaY: 50,
  mediaScale: 100,
  sheetColor: "#0c1015",
  sheetOpacity: 34,
  fansLabel: "Joining now",
  perksLabel: "Membership perks",
  linksLabel: "Live links",
};

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown, fallback: number, min = -Infinity, max = Infinity): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function optNum(value: unknown, min: number, max: number): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : undefined;
}

function frame(f: Partial<CreatorFrameLayout>): CreatorFrameLayout {
  const out: CreatorFrameLayout = {};
  const x = optNum(f.x, -400, 400);
  const y = optNum(f.y, -600, 600);
  const w = optNum(f.w, 30, 100);
  const h = optNum(f.h, 72, 640);
  if (x) out.x = x;
  if (y) out.y = y;
  if (w !== undefined) out.w = w;
  if (h !== undefined) out.h = h;
  return out;
}

export function normalizeCreatorLayout(raw: unknown): CreatorBlockLayout[] {
  const seen = new Set<CreatorBlockId>();
  const out: CreatorBlockLayout[] = [];
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const b = item as Partial<CreatorBlockLayout>;
      const id = b.id as CreatorBlockId;
      if (!CREATOR_BLOCK_ORDER.includes(id) || seen.has(id)) continue;
      seen.add(id);
      out.push({ id, ...(b.hidden ? { hidden: true } : {}), ...frame(b) });
    }
  }
  for (const id of CREATOR_BLOCK_ORDER) if (!seen.has(id)) out.push({ id });
  return out;
}

export function normalizeCreatorProfile(raw: unknown): CreatorProfile {
  const c = (raw ?? {}) as Partial<CreatorProfile>;
  const socials = Array.isArray(c.socials)
    ? c.socials
        .filter((s): s is CreatorSocialLink => Boolean(s) && typeof s === "object")
        .map((s, i) => ({
          id: str(s.id, `social_${i}`),
          platform: str(s.platform, "x").toLowerCase(),
          url: str(s.url),
          label: s.label ? str(s.label) : undefined,
          badgeColor: s.badgeColor ? str(s.badgeColor) : undefined,
        }))
        .slice(0, 8)
    : DEFAULT_CREATOR_PROFILE.socials.map((s) => ({ ...s }));

  const featured = Array.isArray(c.featured)
    ? c.featured
        .filter((f): f is CreatorFeaturedCard => Boolean(f) && typeof f === "object")
        .map((f, i) => ({
          id: str(f.id, `card_${i}`),
          image: str(f.image),
          titleImage: f.titleImage ? str(f.titleImage) : undefined,
          overlayTitle: f.overlayTitle ? str(f.overlayTitle) : undefined,
          caption: f.caption ? str(f.caption) : undefined,
          url: f.url ? str(f.url) : undefined,
          ...frame(f),
        }))
        .slice(0, 12)
    : [];

  const features = Array.isArray(c.features)
    ? c.features
        .filter((f): f is CreatorFeature => Boolean(f) && typeof f === "object")
        .map((f, i) => ({
          id: str(f.id, `feature_${i}`),
          icon: str(f.icon, "star"),
          label: str(f.label, "Member Access"),
          description: str(f.description, "Made for the circle"),
          ...frame(f),
        }))
        .slice(0, 3)
    : DEFAULT_CREATOR_PROFILE.features.map((f) => ({ ...f }));

  return {
    enabled: c.enabled !== false,
    layoutVariant:
      c.layoutVariant === "top-video-glass" || c.layoutVariant === "wallpaper"
        ? c.layoutVariant
        : DEFAULT_CREATOR_PROFILE.layoutVariant,
    videoSrc: str(c.videoSrc),
    videoPoster: str(c.videoPoster),
    photo: str(c.photo),
    name: str(c.name),
    verified: c.verified !== false,
    handle: str(c.handle),
    socials,
    followerCount: str(c.followerCount),
    followerLabel: str(c.followerLabel, DEFAULT_CREATOR_PROFILE.followerLabel),
    bio: str(c.bio),
    secondaryHandle: str(c.secondaryHandle),
    ctaLabel: str(c.ctaLabel, DEFAULT_CREATOR_PROFILE.ctaLabel),
    joinMicrocopy: str(c.joinMicrocopy, DEFAULT_CREATOR_PROFILE.joinMicrocopy),
    features,
    proofHeadline: str(c.proofHeadline, DEFAULT_CREATOR_PROFILE.proofHeadline),
    proofSupporting: str(c.proofSupporting, DEFAULT_CREATOR_PROFILE.proofSupporting),
    featured,
    layout: normalizeCreatorLayout(c.layout),
    linkHeight: num(c.linkHeight, DEFAULT_LINK_HEIGHT, 72, 640),
    mediaX: num(c.mediaX, 50, 0, 100),
    mediaY: num(c.mediaY, 50, 0, 100),
    mediaScale: num(c.mediaScale, 100, 100, 220),
    sheetColor: str(c.sheetColor, DEFAULT_CREATOR_PROFILE.sheetColor) || DEFAULT_CREATOR_PROFILE.sheetColor,
    sheetOpacity: num(c.sheetOpacity, DEFAULT_CREATOR_PROFILE.sheetOpacity, 0, 90),
    fansLabel: str(c.fansLabel, DEFAULT_CREATOR_PROFILE.fansLabel),
    perksLabel: str(c.perksLabel, DEFAULT_CREATOR_PROFILE.perksLabel),
    linksLabel: str(c.linksLabel, DEFAULT_CREATOR_PROFILE.linksLabel),
  };
}
