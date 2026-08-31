import type { ExperiencePageConfig, ExperiencePageKeyName } from "./experienceConfig";
import type { ExperienceTemplate } from "./experienceTemplates";
import { TEMPLATE_PAGE_COPY } from "./templatePageCopy";
import { TEMPLATE_PAGE_ART } from "./templatePageArt";


/**
 * Builds a complete, designed page set for a template.
 *
 * Templates used to only ship the landing composition, so every other fan-app
 * page fell back to the default look. This turns one template into a full app:
 * home, social, videos, news, events, live, shop, foundation, bio, profile and
 * settings all get the template's palette, hero art, copy, feature strip, CTA
 * and layout — and every value stays editable in the studio / by the AI.
 */

type PageSpec = {
  subhead: string;
  headline: string;
  body: string;
  cta: string;
  features: [string, string, string, string];
  icons: [string, string, string, string];
  /** show the members social-proof row on this page */
  proof?: boolean;
  /** show the big hero band */
  hero?: boolean;
};

const PAGE_SPECS: Record<Exclude<ExperiencePageKeyName, "landing">, PageSpec> = {
  youreIn: {
    subhead: "WELCOME TO THE INSIDE",
    headline: "YOU'RE IN",
    body: "You're officially part of the circle. Drops, early access and behind-the-scenes are unlocked.",
    cta: "ENTER THE APP",
    features: ["MEMBER PERKS", "EARLY ACCESS", "PRIVATE DROPS", "THE COMMUNITY"],
    icons: ["crown", "clock", "gift", "users"],
    proof: true,
    hero: true,
  },
  home: {
    subhead: "TODAY IN THE CIRCLE",
    headline: "WELCOME BACK",
    body: "Everything new since your last visit — clips, news, drops and what's coming next.",
    cta: "SEE WHAT'S NEW",
    features: ["LATEST CLIPS", "NEW DROPS", "UPCOMING", "MEMBERS ONLY"],
    icons: ["video", "shop", "calendar", "lock"],
    proof: true,
    hero: true,
  },
  social: {
    subhead: "STRAIGHT FROM THE SOURCE",
    headline: "THE FEED",
    body: "Every post, story and moment from across the socials — pulled into one place.",
    cta: "FOLLOW ALONG",
    features: ["POSTS", "STORIES", "PHOTOS", "COMMUNITY"],
    icons: ["sparkle", "camera", "star", "users"],
    hero: true,
  },
  videos: {
    subhead: "PRESS PLAY",
    headline: "WATCH",
    body: "Exclusive clips, full sessions and behind-the-scenes footage you won't see anywhere else.",
    cta: "PLAY LATEST",
    features: ["EXCLUSIVES", "BEHIND SCENES", "TRAINING", "REPLAYS"],
    icons: ["video", "camera", "bolt", "clock"],
    hero: true,
  },
  news: {
    subhead: "THE LATEST",
    headline: "NEWS & NOTES",
    body: "Announcements, features and the newsletter — delivered first to members.",
    cta: "READ THE LATEST",
    features: ["ANNOUNCEMENTS", "NEWSLETTER", "FEATURES", "ARCHIVE"],
    icons: ["news", "star", "sparkle", "clock"],
  },
  events: {
    subhead: "SHOW UP. WIN STUFF.",
    headline: "EVENTS & GIVEAWAYS",
    body: "Meetups, watch parties, ticket drops and member-only giveaways.",
    cta: "ENTER THE GIVEAWAY",
    features: ["MEETUPS", "TICKETS", "GIVEAWAYS", "CALENDAR"],
    icons: ["users", "ticket", "gift", "calendar"],
    proof: true,
    hero: true,
  },
  live: {
    subhead: "WE'RE ON AIR",
    headline: "GO LIVE",
    body: "Live streams, Q&As and watch-alongs. Members get the notification first.",
    cta: "JOIN THE STREAM",
    features: ["LIVE NOW", "Q&A", "WATCH PARTY", "REPLAYS"],
    icons: ["live", "users", "video", "clock"],
    hero: true,
  },
  docAndGlo: {
    subhead: "OFFICIAL MERCH",
    headline: "THE SHOP",
    body: "Limited drops, member pricing and gear that never hits the public store.",
    cta: "SHOP THE DROP",
    features: ["NEW DROPS", "MEMBER PRICING", "LIMITED", "BUNDLES"],
    icons: ["shop", "crown", "flame", "gift"],
    proof: true,
    hero: true,
  },
  foundation: {
    subhead: "GIVING BACK",
    headline: "THE FOUNDATION",
    body: "The work off the field — programs, partners and how you can get involved.",
    cta: "GET INVOLVED",
    features: ["PROGRAMS", "PARTNERS", "DONATE", "VOLUNTEER"],
    icons: ["heart", "users", "gift", "check"],
    hero: true,
  },
  bio: {
    subhead: "EVERYTHING IN ONE PLACE",
    headline: "ALL MY LINKS",
    body: "Socials, shop, tickets and the fan app — one link that stays up to date.",
    cta: "OPEN MY LINKS",
    features: ["SOCIALS", "SHOP", "TICKETS", "FAN APP"],
    icons: ["users", "shop", "ticket", "star"],
  },
  profile: {
    subhead: "YOUR MEMBERSHIP",
    headline: "YOUR PROFILE",
    body: "Your badge, your perks and everything you've unlocked so far.",
    cta: "MANAGE MEMBERSHIP",
    features: ["MEMBER BADGE", "PERKS", "SAVED", "ACTIVITY"],
    icons: ["crown", "gift", "heart", "bolt"],
    proof: true,
  },
  settings: {
    subhead: "PREFERENCES",
    headline: "SETTINGS",
    body: "Notifications, privacy and account — exactly how you want it.",
    cta: "SAVE SETTINGS",
    features: ["NOTIFICATIONS", "PRIVACY", "ACCOUNT", "SUPPORT"],
    icons: ["bolt", "lock", "user", "heart"],
  },
};

/** Layout used by every non-landing page: hero band up top, content stacked under. */
function pageStage(spec: PageSpec, accent: string, text: string, glow: boolean, cards: boolean) {
  const g = { glow: false, glowColor: accent, glowIntensity: 0 };
  const top = spec.hero ? 44 : 14;
  return [
    { id: "logo", x: 5, y: 3, w: 11, z: 22, ...g },
    { id: "wordmark", x: 18, y: 3.5, w: 52, z: 21, ...g, glowColor: text },
    { id: "tagline", x: 18, y: 7.5, w: 55, z: 20, hidden: true, ...g },
    { id: "hero", x: 0, y: 0, w: 100, h: 100, z: 5, hidden: !spec.hero, ...g },
    { id: "titleArt", x: 10, y: 40, w: 70, z: 12, hidden: true, ...g },
    { id: "joinedBadge", x: 5, y: 20, w: 90, z: 19, hidden: true, ...g },
    { id: "subhead", x: 6, y: top, w: 88, z: 14, align: "left" as const, ...g, glowIntensity: glow ? 18 : 0 },
    { id: "headline", x: 6, y: top + 4, w: 88, z: 15, scale: 106, align: "left" as const, ...g, glowColor: text },
    { id: "body", x: 6, y: top + 13, w: 82, z: 13, align: "left" as const, ...g, glowColor: text },
    { id: "cardGrid", x: 4, y: top + 20, w: 92, z: 16, hidden: !cards, ...g },
    { id: "featureRow", x: 4, y: top + 20, w: 92, z: 16, hidden: cards, ...g },
    { id: "cta", x: 5, y: spec.proof ? 79 : 84, w: 90, z: 18, glow, glowColor: accent, glowIntensity: glow ? 28 : 0 },
    { id: "memberProof", x: 5, y: 88, w: 90, z: 17, hidden: !spec.proof, ...g },
  ];
}

/**
 * The "You're In" welcome screen gets its own hero-first, centered composition:
 * full-bleed art, glowing verified badge, centered copy, perks strip and a
 * glossy enter button. Every layer stays draggable and editable.
 */
function youreInStage(accent: string, text: string, glow: boolean, cards: boolean) {
  const g = { glow: false, glowColor: accent, glowIntensity: 0 };
  return [
    { id: "hero", x: 0, y: 0, w: 100, h: 100, z: 5, ...g },
    { id: "logo", x: 44, y: 5, w: 13, z: 22, ...g },
    { id: "wordmark", x: 20, y: 13, w: 60, z: 21, align: "center" as const, ...g, glowColor: text },
    { id: "tagline", x: 20, y: 17, w: 60, z: 20, hidden: true, ...g },
    { id: "titleArt", x: 15, y: 22, w: 70, z: 12, hidden: true, ...g },
    { id: "joinedBadge", x: 5, y: 24, w: 90, z: 19, glow, glowColor: accent, glowIntensity: glow ? 30 : 0 },
    { id: "subhead", x: 8, y: 45, w: 84, z: 14, align: "center" as const, ...g, glowIntensity: glow ? 18 : 0 },
    { id: "headline", x: 6, y: 49, w: 88, z: 15, scale: 118, align: "center" as const, ...g, glowColor: text },
    { id: "body", x: 10, y: 60, w: 80, z: 13, align: "center" as const, ...g, glowColor: text },
    { id: "cardGrid", x: 5, y: 68, w: 90, z: 16, hidden: !cards, ...g },
    { id: "featureRow", x: 4, y: 68, w: 92, z: 16, hidden: cards, ...g },
    { id: "cta", x: 6, y: 79, w: 88, z: 18, glow, glowColor: accent, glowIntensity: glow ? 34 : 0 },
    { id: "memberProof", x: 6, y: 88, w: 88, z: 17, ...g },
  ];
}


/**
 * Turn a template into per-page partial configs (every field still editable).
 */
export function buildTemplatePages(
  template: ExperienceTemplate,
): Partial<Record<ExperiencePageKeyName, Partial<ExperiencePageConfig>>> {
  const theme = template.theme;
  const landing = template.landing ?? {};
  const accent = theme.accent || landing.accentColor || "#8FE3B8";
  const text = theme.text || "#FFFFFF";
  const muted = theme.muted || "rgba(255,255,255,0.62)";
  const bg = theme.bg || "#050505";
  const ctaBg = theme.buttonBg || accent;
  const ctaText = theme.buttonText || "#04140f";
  const radius = theme.buttonRadius ?? 12;
  const light = String(bg).toLowerCase().startsWith("#f") || landing.effectPreset === "soft";
  const art = landing.heroImage || template.photo || "";
  const glow = template.effects?.glow !== false && !light;
  const panel = light ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.045)";
  const line = light ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.12)";

  const out: Partial<Record<ExperiencePageKeyName, Partial<ExperiencePageConfig>>> = {};

  const copyMap = TEMPLATE_PAGE_COPY[template.id] ?? {};

  (Object.keys(PAGE_SPECS) as (keyof typeof PAGE_SPECS)[]).forEach((key) => {
    const base = PAGE_SPECS[key];
    const copy = copyMap[key] ?? {};
    const spec: PageSpec = {
      ...base,
      subhead: copy.subhead ?? base.subhead,
      headline: copy.headline ?? base.headline,
      body: copy.body ?? base.body,
      cta: copy.cta ?? base.cta,
      features: copy.features ?? base.features,
      icons: copy.icons ?? base.icons,
    };
    const pageArt = TEMPLATE_PAGE_ART[template.id]?.[key] || "";
    const heroArt = pageArt || (spec.hero ? art : "");
    spec.hero = !!heroArt;
    const cards = copy.cards ?? [];

    out[key] = {
      studioLabel: copy.label ?? "",
      backgroundColor: bg,
      backgroundGradientFrom: light ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.12)",
      backgroundGradientTo: bg,
      useGradientBg: true,
      accentColor: accent,
      effectPreset: light ? "soft" : landing.effectPreset || "glass",
      layoutMode: "freeform",
      heroImage: heroArt,
      heroFit: "cover",
      heroPosition: "center",
      heroScale: 100,
      subhead: spec.subhead,
      headline: spec.headline,
      headlineGradientFrom: landing.headlineGradientFrom || text,
      headlineGradientTo: landing.headlineGradientTo || text,
      body: spec.body,
      ctaLabel: spec.cta,
      ctaBg,
      ctaText,
      ctaGradientFrom: landing.ctaGradientFrom || ctaBg,
      ctaGradientTo: landing.ctaGradientTo || ctaBg,
      ctaGradientAngle: landing.ctaGradientAngle ?? 90,
      ctaRadius: landing.ctaRadius ?? radius,
      ctaShowArrow: true,
      showMenuButton: true,
      menuButtonColor: light ? "rgba(0,0,0,0.65)" : "rgba(255,255,255,0.8)",
      featureBg: panel,
      featureBorderColor: line,
      featureIconColor: accent,
      featureTextColor: text,
      featureRadius: Math.min(20, Math.max(8, radius)),
      features: spec.features.map((label, i) => ({
        id: `f${i + 1}`,
        icon: spec.icons[i],
        label,
      })),
      cardBg: panel,
      cardBorderColor: line,
      cardRadius: 18,
      cardTitleColor: text,
      cardTextColor: muted,
      cardIconColor: accent,
      cardColumns: 2,
      cards: cards.map(([title, subtitle], i) => ({
        id: `c${i + 1}`,
        title,
        subtitle,
        icon: spec.icons[i] ?? "star",
        image: "",
        linkPageKey: (["videos", "news", "docAndGlo", "profile"][i] ??
          "home") as ExperiencePageKeyName,
      })),
      memberProof: {
        ...(landing.memberProof ?? {}),
        count: landing.memberProof?.count || "25K+",
        label: landing.memberProof?.label || "Members",
        extraLabel: landing.memberProof?.extraLabel || "+12",
        avatars: [],
        thumbs: [],
        bg: panel,
        borderColor: line,
        countColor: accent,
        labelColor: muted,
        radius: 14,
      } as ExperiencePageConfig["memberProof"],
      heroOverlayFrom: light ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.12)",
      heroOverlayTo: light ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.92)",
      heroOverlayOpacity: key === "youreIn" ? 100 : 92,
      stage: (key === "youreIn"
        ? youreInStage(accent, text, glow, cards.length > 0)
        : pageStage(spec, accent, text, glow, cards.length > 0)) as ExperiencePageConfig["stage"],
      // reset per-word styling so template copy renders in the new palette
      headlineRuns: [],
      subheadRuns: [],
      bodyRuns: [],
    };
  });


  return out;
}
