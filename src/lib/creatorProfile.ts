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

export type CreatorFeaturedCard = {
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

export type CreatorProfile = {
  enabled: boolean;
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
  featured: CreatorFeaturedCard[];
};

export const DEFAULT_CREATOR_PROFILE: CreatorProfile = {
  enabled: true,
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
  featured: [],
};

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
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
        }))
        .slice(0, 12)
    : [];

  return {
    enabled: c.enabled !== false,
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
    featured,
  };
}
