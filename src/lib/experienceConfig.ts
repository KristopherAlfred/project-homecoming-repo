import type { TitleFontFamily } from "./typography";
import { normalizeTitleFontFamily } from "./typography";
import {
  DEFAULT_FANS_PROOF_BODY,
  DEFAULT_FANS_PROOF_TITLE,
  DEFAULT_FOLLOW_TITLE,
  DEFAULT_FOOTER_LINE,
  DEFAULT_LANDING_SOCIALS,
  HOT_PINK,
  normalizeLandingSocials,
  type LandingSocialStat,
} from "./landingSocials";

export type ExperienceEffectPreset = "none" | "glow" | "shimmer" | "glass" | "neon" | "burst" | "rays" | "soft";

export type ExperienceBrand = {
  logoSrc: string;
  logoColor: string;
  /** Recolor illustrated logos with logoColor (mask tint). */
  logoTint: boolean;
  wordmark: string;
  wordmarkColor: string;
  wordmarkFontFamily?: TitleFontFamily;
  tagline: string;
  taglineColor: string;
  showLogoImage: boolean;
};

export type ExperienceTheme = {
  bg: string;
  bgGradientFrom: string;
  bgGradientVia: string;
  bgGradientTo: string;
  bgGradientAngle: number;
  useGradientBg: boolean;
  /** Optional full-bleed image behind the whole app chrome */
  backgroundImage: string;
  surface: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accentHover: string;
  buttonBg: string;
  buttonText: string;
  buttonBorder: string;
  buttonRadius: number;
  fontDisplay?: TitleFontFamily;
  fontBody?: TitleFontFamily;
};

export type ExperienceEffects = {
  glow: boolean;
  glowColor: string;
  glowIntensity: number;
  particles: boolean;
  particleColor: string;
  noise: boolean;
  noiseOpacity: number;
  shimmer: boolean;
  blurBackdrop: boolean;
  vignette: boolean;
  animatedGradient: boolean;
  glassmorphism: boolean;
};

export type ExperienceBuiltinStageId =
  | "logo"
  | "wordmark"
  | "tagline"
  | "hero"
  | "subhead"
  | "headline"
  | "body"
  | "cta"
  | "featureRow"
  | "memberProof"
  | "titleArt"
  | "navBar"
  | "signature"
  | "joinedBadge"
  | "cardGrid";


/** Built-in stage ids, or stamp instance ids like `stamp_…`. */
export type ExperienceStageItemId = ExperienceBuiltinStageId | (string & {});

export type ExperienceStageItem = {
  id: string;
  /** Built-in role, or "stamp" for reusable logo placements. Defaults to id when builtin. */
  role?: ExperienceBuiltinStageId | "stamp";
  /** When role is stamp, points at ExperienceStamp.id */
  stampId?: string;
  /** Percent of stage width (0–100) */
  x: number;
  /** Percent of stage height (0–100) */
  y: number;
  /** Optional width percent */
  w: number;
  /** Optional height percent of the stage (0 = auto height) */
  h?: number;
  z: number;
  glow: boolean;
  glowColor: string;
  glowIntensity: number;
  /** Display scale percent (40–200), default 100 */
  scale?: number;
  hidden?: boolean;
  /** Text/content alignment inside the layer box. Defaults to center. */
  align?: "left" | "center" | "right";
  fillFrom?: string;
  fillTo?: string;
  borderColor?: string;
};

/** Tailwind text-align class for a layer (defaults to centered). */
export function stageAlignClass(item?: { align?: "left" | "center" | "right" }): string {
  if (item?.align === "left") return "text-left";
  if (item?.align === "right") return "text-right";
  return "text-center";
}

/** Crop focal point (object-position) for a page's hero art. */
export function heroObjectPosition(page: {
  heroOffsetX?: number;
  heroOffsetY?: number;
  heroPosition?: string;
}): string {
  if (typeof page.heroOffsetX === "number" || typeof page.heroOffsetY === "number") {
    return `${page.heroOffsetX ?? 50}% ${page.heroOffsetY ?? 50}%`;
  }
  return page.heroPosition || "top center";
}

/** Combined scale + rotation transform for a page's hero art. */
export function heroTransform(page: { heroScale?: number; heroRotate?: number }, scale?: number): string {
  const s = scale ?? (page.heroScale || 100) / 100;
  const r = page.heroRotate || 0;
  return `scale(${s})${r ? ` rotate(${r}deg)` : ""}`;
}


/** Saved reusable logos you can drop on any page. */
export type ExperienceStamp = {
  id: string;
  label: string;
  src: string;
};


export type ExperienceTextRun = {
  text: string;
  color?: string;
  fontFamily?: TitleFontFamily;
  /** Font size in px */
  fontSize?: number;
};


/** Extra call-to-action buttons the athlete (or the AI designer) can add to a page. */
export type ExperienceButton = {
  id: string;
  label: string;
  href: string;
  style: "solid" | "outline" | "ghost";
  bg: string;
  text: string;
  borderColor: string;
  radius: number;
  glow: boolean;
  glowColor: string;
  fullWidth: boolean;
  icon?: string;
};

/** Icon + label chip inside the feature strip (Exclusive drops / Early access / …). */
export type ExperienceFeature = {
  id: string;
  icon: string;
  label: string;
};

/**
 * Self-contained feature card in the landing card grid. Every part is its own
 * editable field — photo, title, subtitle, icon and destination page.
 */
export type ExperienceCard = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  image: string;
  /** Page key in the fan app this card routes to. */
  linkPageKey: string;
};



/** Social-proof row: member avatars, a count and content thumbnails. */
export type ExperienceMemberProof = {
  count: string;
  label: string;
  avatars: string[];
  thumbs: string[];
  extraLabel: string;
  bg: string;
  borderColor: string;
  countColor: string;
  labelColor: string;
  radius: number;
};


export type ExperiencePageConfig = {
  /** Custom page name shown in the studio / navigator / tab pickers (templates can rename pages). */
  studioLabel: string;
  backgroundColor: string;
  backgroundGradientFrom: string;
  backgroundGradientTo: string;
  useGradientBg: boolean;
  backgroundImage: string;
  headline: string;
  subhead: string;
  body: string;
  ctaLabel: string;
  ctaBg: string;
  ctaText: string;
  accentColor: string;
  heroImage: string;
  titleImage: string;
  /** Hero art scale percent (40–180). */
  heroScale: number;
  heroFit: "contain" | "cover";
  heroPosition: string;
  /** Free crop: horizontal focal point 0–100 (overrides heroPosition when set). */
  heroOffsetX?: number;
  /** Free crop: vertical focal point 0–100. */
  heroOffsetY?: number;
  /** Rotation in degrees (-180 to 180). */
  heroRotate?: number;
  /** Content studio: green/hero band height in px */
  heroBandHeight: number;
  /** Content studio: vertical offset of tabs+list under the hero (px, can be negative) */
  contentOffsetY: number;
  /** stack = classic flow; freeform = drag/overlap on phone canvas */
  layoutMode: "stack" | "freeform";
  stage: ExperienceStageItem[];
  effectPreset: ExperienceEffectPreset;
  loaderLabel?: string;
  title?: string;
  logoutLabel?: string;
  /** Join / unlock slide-in copy & style (landing) */
  unlockHeadline: string;
  unlockBody: string;
  unlockFooter: string;
  unlockGlowColor: string;
  unlockPanelBorderColor: string;
  unlockPanelBgFrom: string;
  unlockPanelBgTo: string;
  fansProofTitle: string;
  fansProofBody: string;
  followTitle: string;
  footerLine: string;
  landingSocials: LandingSocialStat[];
  headlineRuns: ExperienceTextRun[];
  subheadRuns: ExperienceTextRun[];
  bodyRuns: ExperienceTextRun[];
  /** Extra buttons rendered under the primary CTA */
  extraButtons: ExperienceButton[];
  /** Any-color gradient for the primary CTA (both ends required to activate) */
  ctaGradientFrom: string;
  ctaGradientTo: string;
  ctaGradientAngle: number;
  ctaRadius: number;
  /** Circular arrow badge on the right of the CTA */
  ctaShowArrow: boolean;
  /** Gradient-filled headline text (both ends required to activate) */
  headlineGradientFrom: string;
  headlineGradientTo: string;
  /** Hamburger button in the top-right corner */
  showMenuButton: boolean;
  menuButtonColor: string;
  /** Feature strip */
  features: ExperienceFeature[];
  featureBg: string;
  featureBorderColor: string;
  featureIconColor: string;
  featureTextColor: string;
  featureRadius: number;
  /** Columns in the feature strip (2 = cards grid, 4 = single centered row) */
  featureColumns?: number;
  /** Member social-proof row */
  memberProof: ExperienceMemberProof;
  /** Dark readability wash rendered between the background photo and the text layers */
  heroOverlayFrom: string;
  heroOverlayTo: string;
  /** 0–100 strength of that wash */
  heroOverlayOpacity: number;
  /** Top nav layer: page label, community badge, bell, avatar */
  navLabel: string;
  navTextColor: string;
  navBadgeLabel: string;
  navBadgeColor: string;
  navBadgeBorderColor: string;
  navBadgeRadius: number;
  showNavBadge: boolean;
  showNavBell: boolean;
  showNavAvatar: boolean;
  navAvatarSrc: string;
  /** Signature / personal mark layer — script text or an uploaded signature image */
  signatureText: string;
  signatureImage: string;
  signatureColor: string;
  signatureFont: TitleFontFamily;
  /** Feature card grid (own photo, title, subtitle, icon and destination per card) */
  cards: ExperienceCard[];
  cardBg: string;
  cardBorderColor: string;
  cardRadius: number;
  cardTitleColor: string;
  cardTextColor: string;
  cardIconColor: string;
  cardColumns: number;
};


export type ExperienceBuiltinPages = {
  landing: ExperiencePageConfig;
  youreIn: ExperiencePageConfig;
  settings: ExperiencePageConfig;
  home: ExperiencePageConfig;
  videos: ExperiencePageConfig;
  news: ExperiencePageConfig;
  docAndGlo: ExperiencePageConfig;
  social: ExperiencePageConfig;
  profile: ExperiencePageConfig;
  foundation: ExperiencePageConfig;
  events: ExperiencePageConfig;
  live: ExperiencePageConfig;
  bio: ExperiencePageConfig;
};

/** Built-in pages plus any custom pages the athlete/AI adds. */
export type ExperiencePages = ExperienceBuiltinPages &
  Record<string, ExperiencePageConfig>;

export type ExperienceBuiltinPageKey = keyof ExperienceBuiltinPages;
export type ExperiencePageKeyName = string;

/** Every built-in editable fan-app page, in studio order. */
export const EXPERIENCE_PAGE_KEYS: ExperienceBuiltinPageKey[] = [
  "landing",
  "youreIn",
  "home",
  "social",
  "videos",
  "news",
  "events",
  "live",
  "docAndGlo",
  "foundation",
  "bio",
  "profile",
  "settings",
];

export const EXPERIENCE_PAGE_LABELS: Record<string, string> = {
  landing: "Landing",
  youreIn: "You're In",
  home: "Home",
  social: "Social",
  videos: "Videos",
  news: "News",
  events: "Events",
  live: "Live",
  docAndGlo: "Shop",
  foundation: "Foundation",
  bio: "Bio link",
  profile: "Profile",
  settings: "Settings",
};

export const CUSTOM_PAGE_PREFIX = "custom_";

export function isCustomExperiencePage(key: string): boolean {
  return key.startsWith(CUSTOM_PAGE_PREFIX);
}

function prettifyPageKey(key: string): string {
  const raw = isCustomExperiencePage(key) ? key.slice(CUSTOM_PAGE_PREFIX.length) : key;
  const cleaned = raw.replace(/[_-]+/g, " ").replace(/\d{6,}/g, "").trim();
  if (!cleaned) return "New page";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/** Page name shown in the studio: the template/athlete override when set, else the default. */
export function experiencePageLabel(
  pages: ExperiencePages | undefined,
  key: ExperiencePageKeyName,
): string {
  const custom = pages?.[key]?.studioLabel?.trim();
  return custom || EXPERIENCE_PAGE_LABELS[key] || prettifyPageKey(key);
}

/** All page keys for a config, in studio order (built-ins + custom pages). */
export function experiencePageKeys(config: {
  pages: ExperiencePages;
  pageOrder?: string[];
}): string[] {
  const available = Object.keys(config.pages ?? {});
  const ordered: string[] = [];
  for (const key of config.pageOrder ?? []) {
    if (available.includes(key) && !ordered.includes(key)) ordered.push(key);
  }
  for (const key of EXPERIENCE_PAGE_KEYS) {
    if (available.includes(key) && !ordered.includes(key)) ordered.push(key);
  }
  for (const key of available) {
    if (!ordered.includes(key)) ordered.push(key);
  }
  return ordered;
}

/** Bottom tab bar of the fan app — fully reorderable / restylable. */
export type ExperienceNavTab = {
  id: string;
  label: string;
  /** Feature icon name (see FEATURE_ICONS) */
  icon: string;
  /** Page this tab opens */
  pageKey: ExperiencePageKeyName;
  hidden?: boolean;
};

export type ExperienceNav = {
  tabs: ExperienceNavTab[];
  bg: string;
  borderColor: string;
  activeColor: string;
  inactiveColor: string;
  radius: number;
  showLabels: boolean;
  hidden: boolean;
};

export const DEFAULT_EXPERIENCE_NAV: ExperienceNav = {
  tabs: [
    { id: "home", label: "Home", icon: "home", pageKey: "home" },
    { id: "social", label: "Social", icon: "users", pageKey: "social" },
    { id: "videos", label: "Videos", icon: "video", pageKey: "videos" },
    { id: "news", label: "News", icon: "news", pageKey: "news" },
    { id: "profile", label: "Profile", icon: "user", pageKey: "profile" },
  ],
  bg: "#050505",
  borderColor: "rgba(255,255,255,0.10)",
  activeColor: "#8FE3B8",
  inactiveColor: "rgba(255,255,255,0.45)",
  radius: 0,
  showLabels: true,
  hidden: false,
};

export type WidgetVisualStyle = {
  backgroundColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  textColor?: string;
  accentColor?: string;
  borderColor?: string;
  effect?: ExperienceEffectPreset;
  overlayOpacity?: number;
};

export type ExperienceConfig = {
  brand: ExperienceBrand;
  theme: ExperienceTheme;
  effects: ExperienceEffects;
  pages: ExperiencePages;
  /** Studio order of pages, including custom pages added by the athlete or AI */
  pageOrder?: string[];
  /** Reusable logo stamps — click to place on the current page */
  stamps: ExperienceStamp[];
  /** Fan-app bottom tab bar */
  nav: ExperienceNav;
};

export const DEFAULT_EXPERIENCE_BRAND: ExperienceBrand = {
  logoSrc: "/experience/logos/logo-ai-racquet.png",
  logoColor: "#8FE3B8",
  logoTint: true,
  wordmark: "",
  wordmarkColor: "#FFFFFF",
  wordmarkFontFamily: "default",
  tagline: "One Circle. One Glow.",
  taglineColor: "#8FE3B8",
  showLogoImage: true,
};

export const DEFAULT_EXPERIENCE_THEME: ExperienceTheme = {
  bg: "#050505",
  bgGradientFrom: "#050505",
  bgGradientVia: "#0a1a12",
  bgGradientTo: "#05140e",
  bgGradientAngle: 160,
  useGradientBg: true,
  backgroundImage: "",
  surface: "#0c0c0c",
  card: "#121212",
  border: "rgba(255,255,255,0.12)",
  text: "#FFFFFF",
  muted: "rgba(255,255,255,0.55)",
  accent: "#8FE3B8",
  accentHover: "#A8F0CC",
  buttonBg: "#8FE3B8",
  buttonText: "#04140c",
  buttonBorder: "transparent",
  buttonRadius: 999,
  fontDisplay: "default",
  fontBody: "source_sans",
};

export const DEFAULT_EXPERIENCE_EFFECTS: ExperienceEffects = {
  glow: true,
  glowColor: "#8FE3B8",
  glowIntensity: 45,
  particles: false,
  particleColor: "#8FE3B8",
  noise: true,
  noiseOpacity: 8,
  shimmer: false,
  blurBackdrop: true,
  vignette: true,
  animatedGradient: false,
  glassmorphism: true,
};

export const STAGE_ITEM_IDS: ExperienceBuiltinStageId[] = [
  "logo",
  "wordmark",
  "tagline",
  "hero",
  "titleArt",
  "navBar",
  "subhead",
  "headline",
  "signature",
  "body",
  "cardGrid",
  "featureRow",
  "joinedBadge",
  "cta",
  "memberProof",
];


export const DEFAULT_CONTENT_STAGE: ExperienceStageItem[] = [
  { id: "titleArt", x: 55, y: 8, w: 42, z: 8, scale: 100, glow: true, glowColor: "#8FE3B8", glowIntensity: 40 },
  {
    id: "headline",
    x: 4,
    y: 6,
    w: 50,
    z: 12,
    glow: false,
    glowColor: "#FFFFFF",
    glowIntensity: 30,
    fillFrom: "rgba(0,0,0,0.55)",
    fillTo: "rgba(0,0,0,0.2)",
    borderColor: "rgba(var(--theme-accent-rgb),0.45)",
  },
  {
    id: "subhead",
    x: 4,
    y: 16,
    w: 50,
    z: 11,
    glow: false,
    glowColor: "#8FE3B8",
    glowIntensity: 30,
    fillFrom: "rgba(0,0,0,0.5)",
    fillTo: "rgba(0,0,0,0.15)",
    borderColor: "rgba(var(--theme-accent-rgb),0.35)",
  },
  {
    id: "body",
    x: 4,
    y: 22,
    w: 55,
    z: 10,
    glow: false,
    glowColor: "#8FE3B8",
    glowIntensity: 30,
    fillFrom: "rgba(0,0,0,0.45)",
    fillTo: "rgba(0,0,0,0.12)",
    borderColor: "rgba(255,255,255,0.12)",
  },
];

export const DEFAULT_LANDING_STAGE: ExperienceStageItem[] = [
  { id: "logo", x: 4, y: 4, w: 14, z: 22, glow: true, glowColor: "#8FE3B8", glowIntensity: 40 },
  { id: "wordmark", x: 20, y: 5, w: 55, z: 21, glow: false, glowColor: "#FFFFFF", glowIntensity: 30 },
  { id: "tagline", x: 20, y: 9.5, w: 55, z: 20, glow: false, glowColor: "#8FE3B8", glowIntensity: 30 },
  { id: "navBar", x: 4, y: 13, w: 92, z: 24, glow: false, glowColor: "#FFFFFF", glowIntensity: 20 },
  { id: "hero", x: 8, y: 16, w: 84, z: 5, glow: true, glowColor: "#8FE3B8", glowIntensity: 35 },
  { id: "titleArt", x: 10, y: 48, w: 70, z: 12, glow: false, glowColor: "#8FE3B8", glowIntensity: 40 },
  { id: "subhead", x: 8, y: 52, w: 84, z: 14, glow: false, glowColor: "#8FE3B8", glowIntensity: 40 },
  { id: "headline", x: 8, y: 60, w: 84, z: 15, glow: true, glowColor: "#FFFFFF", glowIntensity: 25 },
  { id: "signature", x: 8, y: 68, w: 46, z: 19, glow: false, glowColor: "#FFFFFF", glowIntensity: 25 },
  { id: "body", x: 8, y: 68, w: 84, z: 13, glow: false, glowColor: "#8FE3B8", glowIntensity: 30 },
  { id: "cardGrid", x: 5, y: 73, w: 90, z: 16, glow: false, glowColor: "#8FE3B8", glowIntensity: 20 },
  { id: "featureRow", x: 6, y: 76, w: 88, z: 16, glow: false, glowColor: "#8FE3B8", glowIntensity: 25 },
  { id: "cta", x: 8, y: 84, w: 84, z: 18, glow: true, glowColor: "#8FE3B8", glowIntensity: 45 },
  { id: "memberProof", x: 6, y: 91, w: 88, z: 17, glow: false, glowColor: "#8FE3B8", glowIntensity: 20 },
];


export const DEFAULT_YOUREIN_STAGE: ExperienceStageItem[] = [
  { id: "hero", x: 0, y: 0, w: 100, h: 100, z: 5, glow: false, glowColor: "#8FE3B8", glowIntensity: 0 },
  { id: "logo", x: 44, y: 5, w: 13, z: 22, glow: false, glowColor: "#8FE3B8", glowIntensity: 0 },
  { id: "wordmark", x: 20, y: 13, w: 60, z: 21, align: "center", glow: false, glowColor: "#FFFFFF", glowIntensity: 0 },
  { id: "joinedBadge", x: 5, y: 24, w: 90, z: 19, glow: true, glowColor: "#8FE3B8", glowIntensity: 30 },
  { id: "subhead", x: 8, y: 45, w: 84, z: 14, align: "center", glow: false, glowColor: "#8FE3B8", glowIntensity: 18 },
  { id: "headline", x: 6, y: 49, w: 88, z: 15, scale: 118, align: "center", glow: false, glowColor: "#FFFFFF", glowIntensity: 0 },
  { id: "body", x: 10, y: 60, w: 80, z: 13, align: "center", glow: false, glowColor: "#FFFFFF", glowIntensity: 0 },
  { id: "featureRow", x: 4, y: 68, w: 92, z: 16, glow: false, glowColor: "#8FE3B8", glowIntensity: 0 },
  { id: "cta", x: 6, y: 79, w: 88, z: 18, glow: true, glowColor: "#8FE3B8", glowIntensity: 34 },
  { id: "memberProof", x: 6, y: 88, w: 88, z: 17, glow: false, glowColor: "#8FE3B8", glowIntensity: 0 },
];


export function isBuiltinStageId(id: string): id is ExperienceBuiltinStageId {
  return (STAGE_ITEM_IDS as string[]).includes(id);
}

export function stageItemRole(item: ExperienceStageItem): ExperienceBuiltinStageId | "stamp" {
  if (item.role === "stamp" || item.stampId || String(item.id).startsWith("stamp_")) return "stamp";
  if (item.role && isBuiltinStageId(item.role)) return item.role;
  if (isBuiltinStageId(item.id)) return item.id;
  return "stamp";
}

export function createStampId() {
  return `stamp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createStampFromBrand(brand: ExperienceBrand): ExperienceStamp | null {
  if (!brand.logoSrc) return null;
  return {
    id: createStampId(),
    label: brand.wordmark?.trim() || "Logo",
    src: brand.logoSrc,
  };
}

export function placeStampOnPage(
  page: ExperiencePageConfig,
  stamp: ExperienceStamp,
  spot?: { x?: number; y?: number },
): ExperienceStageItem[] {
  const base = (page.stage?.length ? page.stage : DEFAULT_LANDING_STAGE).map((item) => ({ ...item }));
  const count = base.filter((item) => stageItemRole(item) === "stamp").length;
  base.push({
    id: createStampId(),
    role: "stamp",
    stampId: stamp.id,
    x: Math.min(80, spot?.x ?? 8 + (count % 4) * 6),
    y: Math.min(80, spot?.y ?? 14 + Math.floor(count / 4) * 8),
    w: 16,
    z: 28 + count,
    glow: true,
    glowColor: "#8FE3B8",
    glowIntensity: 40,
  });
  return base;
}

export const DEFAULT_MEMBER_PROOF: ExperienceMemberProof = {
  count: "",
  label: "Members",
  avatars: [],
  thumbs: [],
  extraLabel: "",
  bg: "rgba(255,255,255,0.04)",
  borderColor: "rgba(255,255,255,0.14)",
  countColor: "#8FE3B8",
  labelColor: "rgba(255,255,255,0.6)",
  radius: 18,
};

/** Icon keys the feature strip / buttons can use. */
export const EXPERIENCE_FEATURE_ICONS = [
  "star",
  "clock",
  "gift",
  "users",
  "ticket",
  "video",
  "music",
  "shop",
  "bolt",
  "heart",
  "crown",
  "flame",
  "lock",
  "calendar",
  "trophy",
  "camera",
  "sparkle",
  "check",
] as const;

export function createFeatureId() {
  return `feat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function normalizeFeatures(raw: unknown, fallback: ExperienceFeature[] = []): ExperienceFeature[] {
  if (!Array.isArray(raw)) return (fallback || []).map((f) => ({ ...f }));
  return raw
    .filter((row) => row && typeof row === "object")
    .slice(0, 6)
    .map((row) => {
      const f = row as Partial<ExperienceFeature>;
      return {
        id: String(f.id || "") || createFeatureId(),
        icon: String(f.icon || "star").toLowerCase(),
        label: String(f.label || "Feature").slice(0, 40),
      };
    });
}

export function normalizeMemberProof(
  raw: unknown,
  fallback: ExperienceMemberProof = DEFAULT_MEMBER_PROOF,
): ExperienceMemberProof {
  const m = (raw ?? {}) as Partial<ExperienceMemberProof>;
  const list = (value: unknown, fb: string[]) =>
    Array.isArray(value)
      ? value.filter((v) => typeof v === "string" && v.trim()).slice(0, 8).map((v) => String(v))
      : (fb || []).slice();
  return {
    count: typeof m.count === "string" ? m.count.slice(0, 12) : fallback.count,
    label: typeof m.label === "string" ? m.label.slice(0, 24) : fallback.label,
    avatars: list(m.avatars, fallback.avatars),
    thumbs: list(m.thumbs, fallback.thumbs),
    extraLabel: typeof m.extraLabel === "string" ? m.extraLabel.slice(0, 8) : fallback.extraLabel,
    bg: typeof m.bg === "string" ? m.bg : fallback.bg,
    borderColor: typeof m.borderColor === "string" ? m.borderColor : fallback.borderColor,
    countColor: typeof m.countColor === "string" ? m.countColor : fallback.countColor,
    labelColor: typeof m.labelColor === "string" ? m.labelColor : fallback.labelColor,
    radius:
      typeof m.radius === "number" && Number.isFinite(m.radius)
        ? Math.max(0, Math.min(999, m.radius))
        : fallback.radius,
  };
}

export function createCardId() {
  return `card_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/** Four starter cards matching the 2x2 landing grid. */
export const DEFAULT_CARDS: ExperienceCard[] = [
  { id: "card_inner", title: "Inner Circle", subtitle: "Members only", icon: "crown", image: "", linkPageKey: "community" },
  { id: "card_videos", title: "Videos", subtitle: "Behind the scenes", icon: "video", image: "", linkPageKey: "videos" },
  { id: "card_news", title: "News", subtitle: "Latest drops", icon: "news", image: "", linkPageKey: "news" },
  { id: "card_shop", title: "Shop", subtitle: "Gear & merch", icon: "shop", image: "", linkPageKey: "shop" },
];

export function normalizeCards(raw: unknown, fallback: ExperienceCard[] = []): ExperienceCard[] {
  if (!Array.isArray(raw)) return (fallback || []).map((c) => ({ ...c }));
  return raw
    .filter((row) => row && typeof row === "object")
    .slice(0, 8)
    .map((row) => {
      const c = row as Partial<ExperienceCard>;
      return {
        id: String(c.id || "") || createCardId(),
        title: String(c.title ?? "").slice(0, 32),
        subtitle: String(c.subtitle ?? "").slice(0, 48),
        icon: String(c.icon || "star").toLowerCase(),
        image: typeof c.image === "string" ? c.image : "",
        linkPageKey: String(c.linkPageKey || "home"),
      };
    });
}



function pageDefaults(partial: Partial<ExperiencePageConfig> = {}): ExperiencePageConfig {

  return {
    backgroundColor: "#050505",
    backgroundGradientFrom: "#050505",
    backgroundGradientTo: "#0a1a12",
    useGradientBg: true,
    backgroundImage: "",
    headline: "",
    subhead: "",
    body: "",
    ctaLabel: "Continue",
    ctaBg: "#8FE3B8",
    ctaText: "#04140c",
    accentColor: "#8FE3B8",
    heroImage: "",
    titleImage: "",
    heroScale: 100,
    heroFit: "contain",
    heroPosition: "right center",
    heroOffsetX: 50,
    heroOffsetY: 50,
    heroRotate: 0,
    heroBandHeight: 220,
    contentOffsetY: 0,
    layoutMode: "freeform",
    stage: DEFAULT_LANDING_STAGE.map((item) => ({ ...item })),
    effectPreset: "soft",
    unlockHeadline: "",
    unlockBody: "",
    unlockFooter: "100% Private · No Spam · You're in control",
    unlockGlowColor: "#8FE3B8",
    unlockPanelBorderColor: "#2a5c44",
    unlockPanelBgFrom: "rgba(8, 28, 18, 0.97)",
    unlockPanelBgTo: "rgba(4, 12, 8, 0.98)",
    fansProofTitle: DEFAULT_FANS_PROOF_TITLE,
    fansProofBody: DEFAULT_FANS_PROOF_BODY,
    followTitle: DEFAULT_FOLLOW_TITLE,
    footerLine: DEFAULT_FOOTER_LINE,
    landingSocials: DEFAULT_LANDING_SOCIALS.map((s) => ({ ...s })),
    headlineRuns: [],
    subheadRuns: [],
    bodyRuns: [],
    extraButtons: [],
    ctaGradientFrom: "",
    ctaGradientTo: "",
    ctaGradientAngle: 90,
    ctaRadius: 999,
    ctaShowArrow: false,
    headlineGradientFrom: "",
    headlineGradientTo: "",
    showMenuButton: false,
    menuButtonColor: "#8FE3B8",
    features: [],
    featureBg: "rgba(255,255,255,0.04)",
    featureBorderColor: "rgba(255,255,255,0.14)",
    featureIconColor: "#8FE3B8",
    featureTextColor: "#FFFFFF",
    featureRadius: 18,
    featureColumns: 2,
    memberProof: { ...DEFAULT_MEMBER_PROOF },
    heroOverlayFrom: "rgba(0,0,0,0.15)",
    heroOverlayTo: "rgba(0,0,0,0.85)",
    heroOverlayOpacity: 100,
    navLabel: "",
    navTextColor: "#FFFFFF",
    navBadgeLabel: "",
    navBadgeColor: "#8FE3B8",
    navBadgeBorderColor: "rgba(255,255,255,0.25)",
    navBadgeRadius: 999,
    showNavBadge: true,
    showNavBell: true,
    showNavAvatar: true,
    navAvatarSrc: "",
    signatureText: "",
    signatureImage: "",
    signatureColor: "#FFFFFF",
    signatureFont: "default",
    cards: [],
    cardBg: "rgba(255,255,255,0.05)",
    cardBorderColor: "rgba(255,255,255,0.14)",
    cardRadius: 20,
    cardTitleColor: "#FFFFFF",
    cardTextColor: "rgba(255,255,255,0.65)",
    cardIconColor: "#8FE3B8",
    cardColumns: 2,
    studioLabel: "",

    ...partial,
  };
}

export function getStageItem(
  page: ExperiencePageConfig,
  id: string,
): ExperienceStageItem {
  const found = (page.stage || []).find((item) => item.id === id);
  if (found) {
    const fallback = isBuiltinStageId(id)
      ? DEFAULT_CONTENT_STAGE.find((item) => item.id === id) ||
        DEFAULT_LANDING_STAGE.find((item) => item.id === id)
      : undefined;
    return fallback ? { ...fallback, ...found } : { ...found };
  }
  const fallback =
    DEFAULT_CONTENT_STAGE.find((item) => item.id === id) ||
    DEFAULT_LANDING_STAGE.find((item) => item.id === id);
  if (fallback) return { ...fallback };
  return {
    id,
    role: "stamp",
    x: 10,
    y: 10,
    w: 16,
    z: 20,
    glow: false,
    glowColor: "#8FE3B8",
    glowIntensity: 40,
  };
}

export function upsertStageItem(
  page: ExperiencePageConfig,
  patch: Partial<ExperienceStageItem> & { id: string },
): ExperienceStageItem[] {
  const base = (page.stage?.length ? page.stage : DEFAULT_LANDING_STAGE).map((item) => ({ ...item }));
  const idx = base.findIndex((item) => item.id === patch.id);
  if (idx >= 0) base[idx] = { ...base[idx], ...patch };
  else base.push({ ...getStageItem(page, patch.id), ...patch });
  return base;
}

export function removeStageItem(page: ExperiencePageConfig, id: string): ExperienceStageItem[] {
  const base = (page.stage?.length ? page.stage : DEFAULT_LANDING_STAGE).map((item) => ({ ...item }));
  return base.filter((item) => item.id !== id);
}

export function stageGlowStyle(item: ExperienceStageItem, kind: "text" | "image" | "box" = "text") {
  if (!item.glow) return {};
  const color = item.glowColor || "#8FE3B8";
  const intensity = Math.max(0, Math.min(100, item.glowIntensity ?? 40));
  if (kind === "text") {
    return {
      textShadow: `0 0 ${6 + intensity / 8}px ${color}, 0 0 ${14 + intensity / 4}px ${color}99`,
    };
  }
  return {
    filter: `drop-shadow(0 0 ${4 + intensity / 10}px ${color}) drop-shadow(0 0 ${12 + intensity / 5}px ${color}88)`,
  };
}

export function stageItemCss(item: ExperienceStageItem): Record<string, string | number> {
  const scalePct = item.scale != null ? Math.max(40, Math.min(220, item.scale)) : 100;
  const css: Record<string, string | number> = {
    position: "absolute",
    left: `${item.x}%`,
    top: `${item.y}%`,
    width: `${item.w || 80}%`,
    zIndex: item.z,
  };
  if (item.h) css.height = `${item.h}%`;
  if (scalePct !== 100) {
    css.transform = `scale(${scalePct / 100})`;
    css.transformOrigin = "top left";
  }
  return css;
}


export function tokenizeStyledText(text: string): string[] {
  return String(text || "").split(/(\s+)/).filter((t) => t.length > 0);
}

export function plainFromRuns(runs: ExperienceTextRun[]): string {
  return (runs || []).map((r) => r.text).join("");
}

export function syncTextRuns(plain: string, prev?: ExperienceTextRun[] | null): ExperienceTextRun[] {
  const tokens = tokenizeStyledText(plain);
  if (!tokens.length) return [];
  if (!prev?.length) return tokens.map((text) => ({ text }));
  const pool = prev.map((r) => ({ ...r }));
  return tokens.map((text) => {
    const idx = pool.findIndex((r) => r.text === text);
    if (idx >= 0) {
      const match = pool.splice(idx, 1)[0];
      return { ...match, text };
    }
    return { text };
  });
}

export function normalizeTextRuns(raw: unknown, plain: string): ExperienceTextRun[] {
  if (!Array.isArray(raw)) return syncTextRuns(plain);
  const parsed: ExperienceTextRun[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Partial<ExperienceTextRun>;
    const text = typeof r.text === "string" ? r.text : "";
    if (!text) continue;
    const fontFamily = normalizeTitleFontFamily(r.fontFamily);
    const fontSize =
      typeof r.fontSize === "number" && Number.isFinite(r.fontSize)
        ? Math.max(8, Math.min(72, Math.round(r.fontSize)))
        : undefined;
    const color = typeof r.color === "string" && r.color.trim() ? r.color.trim() : undefined;
    parsed.push({
      text,
      ...(color ? { color } : {}),
      ...(fontFamily ? { fontFamily } : {}),
      ...(fontSize ? { fontSize } : {}),
    });
  }
  return syncTextRuns(plain, parsed);
}


export const DEFAULT_EXPERIENCE_PAGES: ExperiencePages = {
  landing: pageDefaults({
    headline: "Join the circle.",
    subhead: "THE OFFICIAL\nFAN\nCOMMUNITY",
    body: "Exclusive drops, early access, giveaways, content, and real connection with your fans.",
    ctaLabel: "Join My Circle →",
    heroImage: "",
    titleImage: "",
    backgroundImage: "",
    effectPreset: "glow",
    unlockHeadline: "JOIN THE CIRCLE",
    unlockBody: "Exclusive drops, early access, giveaways, content, and real connection with your fans.",
    unlockFooter: "100% Private · No Spam · You're in control",
    unlockGlowColor: "#8FE3B8",
    unlockPanelBorderColor: "#2a5c44",
    unlockPanelBgFrom: "rgba(8, 28, 18, 0.97)",
    unlockPanelBgTo: "rgba(4, 12, 8, 0.98)",
    fansProofTitle: DEFAULT_FANS_PROOF_TITLE,
    fansProofBody: DEFAULT_FANS_PROOF_BODY,
    followTitle: DEFAULT_FOLLOW_TITLE,
    footerLine: DEFAULT_FOOTER_LINE,
    headlineRuns: [
      { text: "Join " },
      { text: "the ", color: "#FFFFFF" },
      { text: "circle", color: HOT_PINK, fontSize: 36 },
      { text: "." },
    ],
  }),
  youreIn: pageDefaults({
    headline: "YOU'RE IN",
    subhead: "WELCOME TO THE INSIDE",
    body: "You're officially part of the circle. Drops, early access and behind-the-scenes are unlocked.",
    loaderLabel: "Preparing your experience...",
    accentColor: "#8FE3B8",
    effectPreset: "burst",
    ctaLabel: "ENTER THE APP",
    ctaShowArrow: true,
    useGradientBg: true,
    backgroundImage: "",
    layoutMode: "freeform",
    stage: DEFAULT_YOUREIN_STAGE.map((item) => ({ ...item })),
  }),
    settings: pageDefaults({
      title: "Account Settings",
      headline: "Account Settings",
      body: "Manage your account details, contact info, and sign out.",
      logoutLabel: "Log Out",
      effectPreset: "glass",
    }),
  home: pageDefaults({
    headline: "Home",
    body: "Your fan app hub",
    effectPreset: "soft",
  }),
  videos: pageDefaults({
    headline: "Exclusive Videos",
    subhead: "YOUTUBE · EXCLUSIVE",
    body: "Clips, YouTube uploads, and members-only video.",
    accentColor: "#8FE3B8",
    effectPreset: "glow",
    stage: DEFAULT_CONTENT_STAGE.map((item) => ({ ...item })),
    layoutMode: "freeform",
  }),
  news: pageDefaults({
    headline: "Latest News",
    subhead: "NEWSLETTERS · INSIGHTS",
    body: "Newsletters and insights for the circle.",
    accentColor: "#8FE3B8",
    effectPreset: "soft",
    stage: DEFAULT_CONTENT_STAGE.map((item) => ({ ...item })),
    layoutMode: "freeform",
  }),
  docAndGlo: pageDefaults({
    headline: "Shop the collection",
    subhead: "SHOP",
    body: "Products and drops curated for your fans.",
    accentColor: "#8FE3B8",
    ctaLabel: "Shop now",
    effectPreset: "glass",
    stage: DEFAULT_CONTENT_STAGE.map((item) => ({ ...item })),
    layoutMode: "freeform",
  }),
  social: pageDefaults({
    headline: "Stay connected",
    subhead: "INSTAGRAM · TIKTOK · X",
    body: "Every post, clip and update in one feed.",
    effectPreset: "soft",
    stage: DEFAULT_CONTENT_STAGE.map((item) => ({ ...item })),
    layoutMode: "freeform",
  }),
  profile: pageDefaults({
    headline: "Your profile",
    subhead: "MEMBER",
    body: "Manage your account, track activity, and unlock more.",
    effectPreset: "glass",
    stage: DEFAULT_CONTENT_STAGE.map((item) => ({ ...item })),
    layoutMode: "freeform",
  }),
  foundation: pageDefaults({
    headline: "Join the movement",
    subhead: "FOUNDATION",
    body: "Change lives through access, education and opportunity.",
    ctaLabel: "Get involved",
    effectPreset: "soft",
    stage: DEFAULT_CONTENT_STAGE.map((item) => ({ ...item })),
    layoutMode: "freeform",
  }),
  events: pageDefaults({
    headline: "Events & giveaways",
    subhead: "DROPS · TICKETS",
    body: "Meetups, ticket drops and members-only giveaways.",
    ctaLabel: "Enter now",
    effectPreset: "glow",
    stage: DEFAULT_CONTENT_STAGE.map((item) => ({ ...item })),
    layoutMode: "freeform",
  }),
  live: pageDefaults({
    headline: "Live now",
    subhead: "STREAMS",
    body: "Go behind the scenes in real time.",
    ctaLabel: "Watch live",
    effectPreset: "neon",
    stage: DEFAULT_CONTENT_STAGE.map((item) => ({ ...item })),
    layoutMode: "freeform",
  }),
  bio: pageDefaults({
    headline: "Everything in one link",
    subhead: "BIO LINK",
    body: "All your links, drops and socials in one place.",
    effectPreset: "glass",
    stage: DEFAULT_CONTENT_STAGE.map((item) => ({ ...item })),
    layoutMode: "freeform",
  }),
};

export const DEFAULT_EXPERIENCE_CONFIG: ExperienceConfig = {
  brand: DEFAULT_EXPERIENCE_BRAND,
  theme: DEFAULT_EXPERIENCE_THEME,
  effects: DEFAULT_EXPERIENCE_EFFECTS,
  pages: DEFAULT_EXPERIENCE_PAGES,
  stamps: [],
  nav: DEFAULT_EXPERIENCE_NAV,
};

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asBool(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

const EFFECT_PRESETS: ExperienceEffectPreset[] = [
  "none",
  "glow",
  "shimmer",
  "glass",
  "neon",
  "burst",
  "rays",
  "soft",
];

function normalizeEffectPreset(value: unknown, fallback: ExperienceEffectPreset = "none"): ExperienceEffectPreset {
  const raw = String(value || "").toLowerCase();
  return EFFECT_PRESETS.includes(raw as ExperienceEffectPreset)
    ? (raw as ExperienceEffectPreset)
    : fallback;
}

export function normalizeExperienceBrand(raw: unknown): ExperienceBrand {
  const b = (raw ?? {}) as Partial<ExperienceBrand>;
  return {
    logoSrc: asString(b.logoSrc, DEFAULT_EXPERIENCE_BRAND.logoSrc),
    logoColor: asString(b.logoColor, DEFAULT_EXPERIENCE_BRAND.logoColor),
    logoTint: asBool(b.logoTint, DEFAULT_EXPERIENCE_BRAND.logoTint),
    wordmark: asString(b.wordmark, DEFAULT_EXPERIENCE_BRAND.wordmark),
    wordmarkColor: asString(b.wordmarkColor, DEFAULT_EXPERIENCE_BRAND.wordmarkColor),
    wordmarkFontFamily: normalizeTitleFontFamily(b.wordmarkFontFamily) ?? DEFAULT_EXPERIENCE_BRAND.wordmarkFontFamily,
    tagline: asString(b.tagline, DEFAULT_EXPERIENCE_BRAND.tagline),
    taglineColor: asString(b.taglineColor, DEFAULT_EXPERIENCE_BRAND.taglineColor),
    showLogoImage: asBool(b.showLogoImage, true),
  };
}

export function normalizeExperienceTheme(raw: unknown): ExperienceTheme {
  const t = (raw ?? {}) as Partial<ExperienceTheme>;
  return {
    bg: asString(t.bg, DEFAULT_EXPERIENCE_THEME.bg),
    bgGradientFrom: asString(t.bgGradientFrom, DEFAULT_EXPERIENCE_THEME.bgGradientFrom),
    bgGradientVia: asString(t.bgGradientVia, DEFAULT_EXPERIENCE_THEME.bgGradientVia),
    bgGradientTo: asString(t.bgGradientTo, DEFAULT_EXPERIENCE_THEME.bgGradientTo),
    bgGradientAngle: asNumber(t.bgGradientAngle, DEFAULT_EXPERIENCE_THEME.bgGradientAngle),
    useGradientBg: asBool(t.useGradientBg, true),
    backgroundImage: asString(t.backgroundImage, DEFAULT_EXPERIENCE_THEME.backgroundImage),
    surface: asString(t.surface, DEFAULT_EXPERIENCE_THEME.surface),
    card: asString(t.card, DEFAULT_EXPERIENCE_THEME.card),
    border: asString(t.border, DEFAULT_EXPERIENCE_THEME.border),
    text: asString(t.text, DEFAULT_EXPERIENCE_THEME.text),
    muted: asString(t.muted, DEFAULT_EXPERIENCE_THEME.muted),
    accent: asString(t.accent, DEFAULT_EXPERIENCE_THEME.accent),
    accentHover: asString(t.accentHover, DEFAULT_EXPERIENCE_THEME.accentHover),
    buttonBg: asString(t.buttonBg, DEFAULT_EXPERIENCE_THEME.buttonBg),
    buttonText: asString(t.buttonText, DEFAULT_EXPERIENCE_THEME.buttonText),
    buttonBorder: asString(t.buttonBorder, DEFAULT_EXPERIENCE_THEME.buttonBorder),
    buttonRadius: asNumber(t.buttonRadius, DEFAULT_EXPERIENCE_THEME.buttonRadius),
    fontDisplay: normalizeTitleFontFamily(t.fontDisplay) ?? DEFAULT_EXPERIENCE_THEME.fontDisplay,
    fontBody: normalizeTitleFontFamily(t.fontBody) ?? DEFAULT_EXPERIENCE_THEME.fontBody,
  };
}

export function normalizeExperienceEffects(raw: unknown): ExperienceEffects {
  const e = (raw ?? {}) as Partial<ExperienceEffects>;
  return {
    glow: asBool(e.glow, DEFAULT_EXPERIENCE_EFFECTS.glow),
    glowColor: asString(e.glowColor, DEFAULT_EXPERIENCE_EFFECTS.glowColor),
    glowIntensity: Math.max(0, Math.min(100, asNumber(e.glowIntensity, DEFAULT_EXPERIENCE_EFFECTS.glowIntensity))),
    particles: asBool(e.particles, DEFAULT_EXPERIENCE_EFFECTS.particles),
    particleColor: asString(e.particleColor, DEFAULT_EXPERIENCE_EFFECTS.particleColor),
    noise: asBool(e.noise, DEFAULT_EXPERIENCE_EFFECTS.noise),
    noiseOpacity: Math.max(0, Math.min(40, asNumber(e.noiseOpacity, DEFAULT_EXPERIENCE_EFFECTS.noiseOpacity))),
    shimmer: asBool(e.shimmer, DEFAULT_EXPERIENCE_EFFECTS.shimmer),
    blurBackdrop: asBool(e.blurBackdrop, DEFAULT_EXPERIENCE_EFFECTS.blurBackdrop),
    vignette: asBool(e.vignette, DEFAULT_EXPERIENCE_EFFECTS.vignette),
    animatedGradient: asBool(e.animatedGradient, DEFAULT_EXPERIENCE_EFFECTS.animatedGradient),
    glassmorphism: asBool(e.glassmorphism, DEFAULT_EXPERIENCE_EFFECTS.glassmorphism),
  };
}

export function createButtonId() {
  return `btn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function normalizeButtons(raw: unknown, fallback: ExperienceButton[] = []): ExperienceButton[] {
  if (!Array.isArray(raw)) return (fallback || []).map((b) => ({ ...b }));
  return raw
    .filter((row) => row && typeof row === "object")
    .slice(0, 8)
    .map((row) => {
      const b = row as Partial<ExperienceButton>;
      const style = b.style === "outline" || b.style === "ghost" ? b.style : "solid";
      return {
        id: asString(b.id, "") || createButtonId(),
        label: asString(b.label, "Tap in").slice(0, 60),
        href: asString(b.href, ""),
        style,
        bg: asString(b.bg, "#FFFFFF"),
        text: asString(b.text, "#0a0a0a"),
        borderColor: asString(b.borderColor, "rgba(255,255,255,0.35)"),
        radius: Math.max(0, Math.min(999, asNumber(b.radius, 999))),
        glow: asBool(b.glow, false),
        glowColor: asString(b.glowColor, "#FFFFFF"),
        fullWidth: asBool(b.fullWidth, true),
        icon: asString(b.icon, "") || undefined,
      };
    });
}

export function normalizeExperiencePage(
  raw: unknown,
  fallback: ExperiencePageConfig,
): ExperiencePageConfig {
  const p = (raw ?? {}) as Partial<ExperiencePageConfig>;
  return {
    backgroundColor: asString(p.backgroundColor, fallback.backgroundColor),
    backgroundGradientFrom: asString(p.backgroundGradientFrom, fallback.backgroundGradientFrom),
    backgroundGradientTo: asString(p.backgroundGradientTo, fallback.backgroundGradientTo),
    useGradientBg: asBool(p.useGradientBg, fallback.useGradientBg),
    backgroundImage: asString(p.backgroundImage, fallback.backgroundImage),
    headline: asString(p.headline, fallback.headline),
    subhead: asString(p.subhead, fallback.subhead),
    body: asString(p.body, fallback.body),
    ctaLabel: asString(p.ctaLabel, fallback.ctaLabel),
    ctaBg: asString(p.ctaBg, fallback.ctaBg),
    ctaText: asString(p.ctaText, fallback.ctaText),
    accentColor: asString(p.accentColor, fallback.accentColor),
    heroImage: asString(p.heroImage, fallback.heroImage),
    titleImage: asString(p.titleImage, fallback.titleImage),
    heroScale: Math.max(40, Math.min(180, asNumber(p.heroScale, fallback.heroScale ?? 100))),
    heroFit: p.heroFit === "cover" ? "cover" : "contain",
    heroPosition: asString(p.heroPosition, fallback.heroPosition || "right center"),
    heroOffsetX: Math.max(0, Math.min(100, asNumber(p.heroOffsetX, fallback.heroOffsetX ?? 50))),
    heroOffsetY: Math.max(0, Math.min(100, asNumber(p.heroOffsetY, fallback.heroOffsetY ?? 50))),
    heroRotate: Math.max(-180, Math.min(180, asNumber(p.heroRotate, fallback.heroRotate ?? 0))),
    heroBandHeight: Math.max(120, Math.min(420, asNumber(p.heroBandHeight, fallback.heroBandHeight ?? 220))),
    contentOffsetY: Math.max(-160, Math.min(240, asNumber(p.contentOffsetY, fallback.contentOffsetY ?? 0))),
    layoutMode: p.layoutMode === "stack" ? "stack" : "freeform",
    stage: normalizeStage(p.stage, fallback.stage),
    effectPreset: normalizeEffectPreset(p.effectPreset, fallback.effectPreset),
    loaderLabel: asString(p.loaderLabel, fallback.loaderLabel || ""),
    title: asString(p.title, fallback.title || ""),
    logoutLabel: asString(p.logoutLabel, fallback.logoutLabel || ""),
    unlockHeadline: asString(p.unlockHeadline, fallback.unlockHeadline || ""),
    unlockBody: asString(p.unlockBody, fallback.unlockBody || ""),
    unlockFooter: asString(p.unlockFooter, fallback.unlockFooter || "100% Private · No Spam · You're in control"),
    unlockGlowColor: asString(p.unlockGlowColor, fallback.unlockGlowColor || "#8FE3B8"),
    unlockPanelBorderColor: asString(p.unlockPanelBorderColor, fallback.unlockPanelBorderColor || "#2a5c44"),
    unlockPanelBgFrom: asString(p.unlockPanelBgFrom, fallback.unlockPanelBgFrom || "rgba(8, 28, 18, 0.97)"),
    unlockPanelBgTo: asString(p.unlockPanelBgTo, fallback.unlockPanelBgTo || "rgba(4, 12, 8, 0.98)"),
    fansProofTitle: asString(p.fansProofTitle, fallback.fansProofTitle || DEFAULT_FANS_PROOF_TITLE),
    fansProofBody: asString(p.fansProofBody, fallback.fansProofBody || DEFAULT_FANS_PROOF_BODY),
    followTitle: asString(p.followTitle, fallback.followTitle || DEFAULT_FOLLOW_TITLE),
    footerLine: asString(p.footerLine, fallback.footerLine || DEFAULT_FOOTER_LINE),
    landingSocials: normalizeLandingSocials(p.landingSocials ?? fallback.landingSocials),
    headlineRuns: normalizeTextRuns(p.headlineRuns, asString(p.headline, fallback.headline)),
    subheadRuns: normalizeTextRuns(p.subheadRuns, asString(p.subhead, fallback.subhead)),
    bodyRuns: normalizeTextRuns(p.bodyRuns, asString(p.body, fallback.body)),
    extraButtons: normalizeButtons(p.extraButtons, fallback.extraButtons),
    ctaGradientFrom: asString(p.ctaGradientFrom, fallback.ctaGradientFrom ?? ""),
    ctaGradientTo: asString(p.ctaGradientTo, fallback.ctaGradientTo ?? ""),
    ctaGradientAngle: Math.max(0, Math.min(360, asNumber(p.ctaGradientAngle, fallback.ctaGradientAngle ?? 90))),
    ctaRadius: Math.max(0, Math.min(999, asNumber(p.ctaRadius, fallback.ctaRadius ?? 999))),
    ctaShowArrow: asBool(p.ctaShowArrow, fallback.ctaShowArrow ?? false),
    headlineGradientFrom: asString(p.headlineGradientFrom, fallback.headlineGradientFrom ?? ""),
    headlineGradientTo: asString(p.headlineGradientTo, fallback.headlineGradientTo ?? ""),
    showMenuButton: asBool(p.showMenuButton, fallback.showMenuButton ?? false),
    menuButtonColor: asString(p.menuButtonColor, fallback.menuButtonColor ?? "#8FE3B8"),
    features: normalizeFeatures(p.features, fallback.features ?? []),
    featureBg: asString(p.featureBg, fallback.featureBg ?? "rgba(255,255,255,0.04)"),
    featureBorderColor: asString(p.featureBorderColor, fallback.featureBorderColor ?? "rgba(255,255,255,0.14)"),
    featureIconColor: asString(p.featureIconColor, fallback.featureIconColor ?? "#8FE3B8"),
    featureTextColor: asString(p.featureTextColor, fallback.featureTextColor ?? "#FFFFFF"),
    featureRadius: Math.max(0, Math.min(999, asNumber(p.featureRadius, fallback.featureRadius ?? 18))),
    featureColumns: Math.max(1, Math.min(4, asNumber(p.featureColumns, fallback.featureColumns ?? 2))),
    memberProof: normalizeMemberProof(p.memberProof, fallback.memberProof ?? DEFAULT_MEMBER_PROOF),
    heroOverlayFrom: asString(p.heroOverlayFrom, fallback.heroOverlayFrom ?? "rgba(0,0,0,0.15)"),
    heroOverlayTo: asString(p.heroOverlayTo, fallback.heroOverlayTo ?? "rgba(0,0,0,0.85)"),
    heroOverlayOpacity: Math.max(0, Math.min(100, asNumber(p.heroOverlayOpacity, fallback.heroOverlayOpacity ?? 100))),
    navLabel: asString(p.navLabel, fallback.navLabel ?? ""),
    studioLabel: asString(p.studioLabel, fallback.studioLabel ?? "").slice(0, 24),
    navTextColor: asString(p.navTextColor, fallback.navTextColor ?? "#FFFFFF"),
    navBadgeLabel: asString(p.navBadgeLabel, fallback.navBadgeLabel ?? ""),
    navBadgeColor: asString(p.navBadgeColor, fallback.navBadgeColor ?? "#8FE3B8"),
    navBadgeBorderColor: asString(p.navBadgeBorderColor, fallback.navBadgeBorderColor ?? "rgba(255,255,255,0.25)"),
    navBadgeRadius: Math.max(0, Math.min(999, asNumber(p.navBadgeRadius, fallback.navBadgeRadius ?? 999))),
    showNavBadge: asBool(p.showNavBadge, fallback.showNavBadge ?? true),
    showNavBell: asBool(p.showNavBell, fallback.showNavBell ?? true),
    showNavAvatar: asBool(p.showNavAvatar, fallback.showNavAvatar ?? true),
    navAvatarSrc: asString(p.navAvatarSrc, fallback.navAvatarSrc ?? ""),
    signatureText: asString(p.signatureText, fallback.signatureText ?? ""),
    signatureImage: asString(p.signatureImage, fallback.signatureImage ?? ""),
    signatureColor: asString(p.signatureColor, fallback.signatureColor ?? "#FFFFFF"),
    signatureFont: normalizeTitleFontFamily(p.signatureFont) ?? fallback.signatureFont ?? "default",
    cards: normalizeCards(p.cards, fallback.cards ?? []),
    cardBg: asString(p.cardBg, fallback.cardBg ?? "rgba(255,255,255,0.05)"),
    cardBorderColor: asString(p.cardBorderColor, fallback.cardBorderColor ?? "rgba(255,255,255,0.14)"),
    cardRadius: Math.max(0, Math.min(999, asNumber(p.cardRadius, fallback.cardRadius ?? 20))),
    cardTitleColor: asString(p.cardTitleColor, fallback.cardTitleColor ?? "#FFFFFF"),
    cardTextColor: asString(p.cardTextColor, fallback.cardTextColor ?? "rgba(255,255,255,0.65)"),
    cardIconColor: asString(p.cardIconColor, fallback.cardIconColor ?? "#8FE3B8"),
    cardColumns: Math.max(1, Math.min(3, asNumber(p.cardColumns, fallback.cardColumns ?? 2))),
  };
}


function normalizeStageItem(
  row: Partial<ExperienceStageItem>,
  prevRaw?: ExperienceStageItem | null,
): ExperienceStageItem {
  const prev: ExperienceStageItem =
    prevRaw ?? ({ id: String(row.id || ""), x: 10, y: 10, w: 60, z: 20 } as ExperienceStageItem);
  const role = stageItemRole({ ...prev, ...row, id: String(row.id || prev.id) });
  return {
    id: String(row.id || prev.id),
    role,
    stampId: role === "stamp" ? asString(row.stampId, prev.stampId || "") || undefined : undefined,
    x: Math.max(0, Math.min(95, asNumber(row.x, prev.x))),
    y: Math.max(0, Math.min(95, asNumber(row.y, prev.y))),
    w: Math.max(8, Math.min(100, asNumber(row.w, prev.w))),
    h: Math.max(0, Math.min(100, asNumber(row.h, prev.h ?? 0))),
    z: Math.max(0, Math.min(100, asNumber(row.z, prev.z))),
    glow: asBool(row.glow, prev.glow),
    glowColor: asString(row.glowColor, prev.glowColor),
    glowIntensity: Math.max(0, Math.min(100, asNumber(row.glowIntensity, prev.glowIntensity))),
    scale: Math.max(40, Math.min(220, asNumber(row.scale, prev.scale ?? 100))),
    hidden: asBool(row.hidden, prev.hidden ?? false),
    align:
      row.align === "left" || row.align === "right" || row.align === "center"
        ? row.align
        : prev.align,

    fillFrom: asString(row.fillFrom, prev.fillFrom ?? ""),
    fillTo: asString(row.fillTo, prev.fillTo ?? ""),
    borderColor: asString(row.borderColor, prev.borderColor ?? ""),
  };
}

function migrateLegacyBrandStage(list: unknown[]): ExperienceStageItem[] {
  const rows = list.filter((item) => item && typeof item === "object") as Partial<ExperienceStageItem>[];
  const brand = rows.find((item) => String(item.id) === "brand");
  if (!brand) return [];
  const hasLogo = rows.some((item) => String(item.id) === "logo");
  if (hasLogo) return [];
  const x = asNumber(brand.x, 4);
  const y = asNumber(brand.y, 4);
  const glow = asBool(brand.glow, true);
  const glowColor = asString(brand.glowColor, "#8FE3B8");
  const glowIntensity = asNumber(brand.glowIntensity, 40);
  const z = asNumber(brand.z, 20);
  return [
    { id: "logo", x, y, w: 14, z: z + 2, glow, glowColor, glowIntensity },
    { id: "wordmark", x: Math.min(80, x + 16), y: y + 1, w: 55, z: z + 1, glow: false, glowColor: "#FFFFFF", glowIntensity: 30 },
    { id: "tagline", x: Math.min(80, x + 16), y: y + 5.5, w: 55, z, glow: false, glowColor, glowIntensity: 30 },
  ];
}

function normalizeStage(raw: unknown, fallback: ExperienceStageItem[]): ExperienceStageItem[] {
  const list = Array.isArray(raw) ? raw : fallback;
  const byId = new Map<string, ExperienceStageItem>();
  for (const item of DEFAULT_LANDING_STAGE) byId.set(item.id, { ...item });
  for (const item of fallback || []) {
    if (item?.id && isBuiltinStageId(item.id)) {
      byId.set(item.id, { ...byId.get(item.id)!, ...item });
    }
  }
  for (const migrated of migrateLegacyBrandStage(list)) {
    byId.set(migrated.id, migrated);
  }
  const stamps: ExperienceStageItem[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ExperienceStageItem>;
    const id = String(row.id || "");
    if (!id || id === "brand") continue;
    if (isBuiltinStageId(id)) {
      const prev =
        byId.get(id) ||
        DEFAULT_LANDING_STAGE.find((d) => d.id === id) ||
        DEFAULT_CONTENT_STAGE.find((d) => d.id === id) ||
        null;
      byId.set(id, normalizeStageItem(row, prev));
      continue;
    }
    if (stageItemRole({ ...(row as ExperienceStageItem), id }) === "stamp") {
      stamps.push(
        normalizeStageItem(row, {
          id,
          role: "stamp",
          stampId: asString(row.stampId, ""),
          x: 10,
          y: 10,
          w: 16,
          z: 28,
          glow: true,
          glowColor: "#8FE3B8",
          glowIntensity: 40,
        }),
      );
    }
  }
  return [...STAGE_ITEM_IDS.map((id) => byId.get(id)!).filter(Boolean), ...stamps];
}

export function normalizeExperienceStamps(raw: unknown): ExperienceStamp[] {
  if (!Array.isArray(raw)) return [];
  const out: ExperienceStamp[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ExperienceStamp>;
    const src = asString(row.src, "");
    if (!src) continue;
    out.push({
      id: asString(row.id, createStampId()),
      label: asString(row.label, "Logo"),
      src,
    });
  }
  return out;
}

export function normalizeExperiencePages(raw: unknown): ExperiencePages {
  const p = (raw ?? {}) as Partial<ExperiencePages>;
  const out = {} as ExperiencePages;
  for (const key of EXPERIENCE_PAGE_KEYS) {
    out[key] = normalizeExperiencePage(p[key], DEFAULT_EXPERIENCE_PAGES[key]);
  }
  for (const key of Object.keys(p)) {
    if (out[key]) continue;
    if (!p[key] || typeof p[key] !== "object") continue;
    out[key] = normalizeExperiencePage(p[key], DEFAULT_EXPERIENCE_PAGES.home);
  }
  return out;
}

export function normalizeExperienceNav(raw: unknown): ExperienceNav {
  const n = (raw ?? {}) as Partial<ExperienceNav>;
  const tabsRaw = Array.isArray(n.tabs) ? n.tabs : DEFAULT_EXPERIENCE_NAV.tabs;
  const tabs: ExperienceNavTab[] = [];
  for (const row of tabsRaw) {
    if (!row || typeof row !== "object") continue;
    const t = row as Partial<ExperienceNavTab>;
    const rawPageKey = typeof t.pageKey === "string" ? t.pageKey.trim() : "";
    const pageKey: ExperiencePageKeyName = rawPageKey || "home";
    tabs.push({
      id: asString(t.id, `tab_${tabs.length}`),
      label: asString(t.label, EXPERIENCE_PAGE_LABELS[pageKey]),
      icon: asString(t.icon, "star"),
      pageKey,
      hidden: Boolean(t.hidden),
    });
  }
  return {
    tabs: tabs.length ? tabs.slice(0, 6) : DEFAULT_EXPERIENCE_NAV.tabs.map((t) => ({ ...t })),
    bg: asString(n.bg, DEFAULT_EXPERIENCE_NAV.bg),
    borderColor: asString(n.borderColor, DEFAULT_EXPERIENCE_NAV.borderColor),
    activeColor: asString(n.activeColor, DEFAULT_EXPERIENCE_NAV.activeColor),
    inactiveColor: asString(n.inactiveColor, DEFAULT_EXPERIENCE_NAV.inactiveColor),
    radius: Math.max(0, Math.min(999, asNumber(n.radius, DEFAULT_EXPERIENCE_NAV.radius))),
    showLabels: asBool(n.showLabels, true),
    hidden: asBool(n.hidden, false),
  };
}

export function normalizeExperienceConfig(raw: unknown): ExperienceConfig {
  const c = (raw ?? {}) as Partial<ExperienceConfig>;
  return {
    brand: normalizeExperienceBrand(c.brand),
    theme: normalizeExperienceTheme(c.theme),
    effects: normalizeExperienceEffects(c.effects),
    pages: normalizeExperiencePages(c.pages),
    pageOrder: Array.isArray(c.pageOrder)
      ? c.pageOrder.filter((k): k is string => typeof k === "string")
      : undefined,
    stamps: normalizeExperienceStamps(c.stamps),
    nav: normalizeExperienceNav(c.nav),
  };
}

export function normalizeWidgetVisualStyle(raw: unknown): WidgetVisualStyle | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const s = raw as WidgetVisualStyle;
  return {
    backgroundColor: s.backgroundColor ? String(s.backgroundColor) : undefined,
    gradientFrom: s.gradientFrom ? String(s.gradientFrom) : undefined,
    gradientTo: s.gradientTo ? String(s.gradientTo) : undefined,
    textColor: s.textColor ? String(s.textColor) : undefined,
    accentColor: s.accentColor ? String(s.accentColor) : undefined,
    borderColor: s.borderColor ? String(s.borderColor) : undefined,
    effect: s.effect ? normalizeEffectPreset(s.effect) : undefined,
    overlayOpacity:
      typeof s.overlayOpacity === "number" ? Math.max(0, Math.min(1, s.overlayOpacity)) : undefined,
  };
}

export function themeBackgroundCss(theme: ExperienceTheme) {
  if (theme.backgroundImage) {
    const wash = theme.useGradientBg
      ? `linear-gradient(${theme.bgGradientAngle}deg, ${theme.bgGradientFrom}cc, ${theme.bgGradientTo}ee)`
      : `linear-gradient(180deg, ${theme.bg}99, ${theme.bg})`;
    return `${wash}, center / cover no-repeat url(${theme.backgroundImage})`;
  }
  if (!theme.useGradientBg) return theme.bg;
  return `linear-gradient(${theme.bgGradientAngle}deg, ${theme.bgGradientFrom}, ${theme.bgGradientVia}, ${theme.bgGradientTo})`;
}

export function pageBackgroundCss(page: ExperiencePageConfig) {
  if (page.backgroundImage) {
    return `center / cover no-repeat url(${page.backgroundImage})`;
  }
  if (page.useGradientBg) {
    return `linear-gradient(160deg, ${page.backgroundGradientFrom}, ${page.backgroundGradientTo})`;
  }
  return page.backgroundColor;
}

export function applyExperienceCssVars(
  root: HTMLElement,
  config: ExperienceConfig,
) {
  const { brand, theme, effects } = config;
  root.style.setProperty("--xp-bg", theme.bg);
  root.style.setProperty("--xp-bg-image", themeBackgroundCss(theme));
  root.style.setProperty("--xp-surface", theme.surface);
  root.style.setProperty("--xp-card", theme.card);
  root.style.setProperty("--xp-border", theme.border);
  root.style.setProperty("--xp-text", theme.text);
  root.style.setProperty("--xp-muted", theme.muted);
  root.style.setProperty("--xp-accent", theme.accent);
  root.style.setProperty("--xp-accent-hover", theme.accentHover);
  root.style.setProperty("--xp-button-bg", theme.buttonBg);
  root.style.setProperty("--xp-button-text", theme.buttonText);
  root.style.setProperty("--xp-button-border", theme.buttonBorder);
  root.style.setProperty("--xp-button-radius", `${theme.buttonRadius}px`);
  root.style.setProperty("--xp-logo-color", brand.logoColor);
  root.style.setProperty("--xp-wordmark-color", brand.wordmarkColor);
  root.style.setProperty("--xp-tagline-color", brand.taglineColor);
  root.style.setProperty("--xp-glow-color", effects.glowColor);
  root.style.setProperty("--xp-glow-intensity", String(effects.glowIntensity / 100));
  root.style.setProperty("--xp-noise-opacity", String(effects.noiseOpacity / 100));
  root.style.setProperty("--xp-particle-color", effects.particleColor);
  root.dataset.xpGlow = effects.glow ? "1" : "0";
  root.dataset.xpParticles = effects.particles ? "1" : "0";
  root.dataset.xpNoise = effects.noise ? "1" : "0";
  root.dataset.xpShimmer = effects.shimmer ? "1" : "0";
  root.dataset.xpBlur = effects.blurBackdrop ? "1" : "0";
  root.dataset.xpVignette = effects.vignette ? "1" : "0";
  root.dataset.xpAnimatedGradient = effects.animatedGradient ? "1" : "0";
  root.dataset.xpGlass = effects.glassmorphism ? "1" : "0";
}

export function widgetStyleCss(style?: WidgetVisualStyle): Record<string, string> {
  if (!style) return {};
  const css: Record<string, string> = {};
  if (style.gradientFrom && style.gradientTo) {
    css.backgroundImage = `linear-gradient(135deg, ${style.gradientFrom}, ${style.gradientTo})`;
  } else if (style.backgroundColor) {
    css.backgroundColor = style.backgroundColor;
  }
  if (style.textColor) css.color = style.textColor;
  if (style.borderColor) css.borderColor = style.borderColor;
  if (style.effect === "glow" && style.accentColor) {
    css.boxShadow = `0 0 24px ${style.accentColor}66, inset 0 0 20px ${style.accentColor}22`;
  }
  if (style.effect === "neon" && style.accentColor) {
    css.boxShadow = `0 0 8px ${style.accentColor}, 0 0 24px ${style.accentColor}`;
  }
  if (style.effect === "glass") {
    css.backdropFilter = "blur(12px)";
    css.backgroundColor = style.backgroundColor || "rgba(255,255,255,0.06)";
  }
  return css;
}
