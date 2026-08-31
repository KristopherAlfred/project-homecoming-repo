import { hasFanAppApi, requireFanAppApiBase } from "./fanAppApiBase";
import type {
  ExperienceBrand,
  ExperienceConfig,
  ExperienceEffects,
  ExperiencePages,
  ExperienceTheme,
  WidgetVisualStyle,
} from "./experienceConfig";
import {
  DEFAULT_EXPERIENCE_CONFIG,
  normalizeExperienceConfig,
  normalizeWidgetVisualStyle,
} from "./experienceConfig";

export type HomeWidgetType =
  | "videos"
  | "news"
  | "events"
  | "music"
  | "tickets"
  | "custom";

export type HomeWidgetSize = "standard" | "wide" | "tall" | "large";

export type HomeWidget = {
  id: string;
  type: HomeWidgetType;
  title: string;
  subtitle?: string;
  imageSrc: string;
  linkTo: string;
  enabled: boolean;
  order: number;
  /** Grid footprint: standard 1×1, wide 2×1, tall 1×2, large 2×2 */
  size?: HomeWidgetSize;
  imageFit?: "half" | "full";
  /** Scale percent for box art (50–160). */
  imageScale?: number;
  imageObjectFit?: "contain" | "cover";
  imagePosition?: string;
  cardClassName?: string;
  showLock?: boolean;
  showPlay?: boolean;
  showMusicBars?: boolean;
  titleFontFamily?: import("./typography").TitleFontFamily;
  titleFontSize?: import("./typography").TitleFontSize;
  style?: WidgetVisualStyle;
};

export type HomeLayout = {
  version: number;
  updatedAt: string;
  heroEnabled: boolean;
  widgets: HomeWidget[];
  brand?: ExperienceBrand;
  theme?: ExperienceTheme;
  effects?: ExperienceEffects;
  pages?: ExperiencePages;
  experience?: ExperienceConfig;
};

export function getExperienceFromLayout(layout: HomeLayout | null | undefined): ExperienceConfig {
  if (!layout) return DEFAULT_EXPERIENCE_CONFIG;
  if (layout.experience) return normalizeExperienceConfig(layout.experience);
  return normalizeExperienceConfig({
    brand: layout.brand,
    theme: layout.theme,
    effects: layout.effects,
    pages: layout.pages,
  });
}

export function withExperience(layout: HomeLayout, experience: ExperienceConfig): HomeLayout {
  const next = normalizeExperienceConfig(experience);
  return {
    ...layout,
    brand: next.brand,
    theme: next.theme,
    effects: next.effects,
    pages: next.pages,
    experience: next,
  };
}

export { normalizeWidgetVisualStyle, DEFAULT_EXPERIENCE_CONFIG };
export type { ExperienceConfig, WidgetVisualStyle };

function getApiBase() {
  return (requireFanAppApiBase()).replace(/\/$/, "");
}

function getAdminSecret() {
  return import.meta.env.VITE_ADMIN_EXPORT_SECRET?.trim() ?? "";
}

async function layoutRequest(init?: RequestInit) {
  const response = await fetch(`${getApiBase()}/api/admin/analytics?view=layout`, init);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `Layout request failed (${response.status})`);
  }
  return data;
}

const LOCAL_LAYOUT_KEY = "playersos_home_layout_v1";

function defaultLocalLayout(): HomeLayout {
  const types: HomeWidgetType[] = ["videos", "news", "events", "music"];
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    heroEnabled: true,
    widgets: types.map((type, index) => createWidget(type, index)),
    experience: DEFAULT_EXPERIENCE_CONFIG,
  };
}

function readLocalLayout(): HomeLayout {
  try {
    const raw = localStorage.getItem(LOCAL_LAYOUT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as HomeLayout;
      if (parsed && Array.isArray(parsed.widgets)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return defaultLocalLayout();
}

function writeLocalLayout(layout: HomeLayout): HomeLayout {
  const next = { ...layout, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(LOCAL_LAYOUT_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota errors */
  }
  return next;
}

export async function fetchHomeLayout(): Promise<HomeLayout> {
  if (!hasFanAppApi()) return readLocalLayout();
  try {
    const data = (await layoutRequest()) as { layout: HomeLayout };
    return scrubHomeLayoutImages(data.layout);
  } catch {
    return readLocalLayout();
  }
}

export async function publishHomeLayout(layout: HomeLayout): Promise<HomeLayout> {
  if (!hasFanAppApi()) return writeLocalLayout(layout);
  const secret = getAdminSecret();
  if (!secret) throw new Error("Set VITE_ADMIN_EXPORT_SECRET to publish home layouts");
  const data = (await layoutRequest({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-secret": secret,
    },
    body: JSON.stringify({ action: "publish", layout: scrubHomeLayoutImages(layout) }),
  })) as { layout: HomeLayout };
  return scrubHomeLayoutImages(data.layout);
}


export function scrubStarterWidgetImage(src: string | undefined | null): string {
  if (!src) return "";
  const s = src.toLowerCase();
  if (
    s.includes("dame") ||
    s.includes("dametime") ||
    s.includes("lillard") ||
    s.includes("espncdn.com") ||
    s.includes("/images/eventsbackground") ||
    s.includes("join-dametime") ||
    s.includes("damecity") ||
    s.includes("dameexclusive") ||
    s.includes("dametimenews") ||
    s.includes("damedolla")
  ) {
    return "";
  }
  return src;
}

export function scrubHomeLayoutImages(layout: HomeLayout): HomeLayout {
  return {
    ...layout,
    widgets: (layout.widgets || []).map((w) => ({
      ...w,
      imageSrc: scrubStarterWidgetImage(w.imageSrc),
    })),
  };
}

export async function generateHomeImage(
  prompt: string,
): Promise<{ imageSrc: string; source: string; model?: string }> {
  const secret = getAdminSecret();
  if (!secret) throw new Error("Set VITE_ADMIN_EXPORT_SECRET to generate images");
  return layoutRequest({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-secret": secret,
    },
    body: JSON.stringify({ action: "generate_image", prompt }),
  }) as Promise<{ imageSrc: string; source: string; model?: string }>;
}

export const WIDGET_SIZES: { id: HomeWidgetSize; label: string; hint: string; cols: number; rows: number }[] = [
  { id: "standard", label: "Standard", hint: "1×1 — half width", cols: 1, rows: 1 },
  { id: "wide", label: "Wide", hint: "2×1 — full width", cols: 2, rows: 1 },
  { id: "tall", label: "Tall", hint: "1×2 — double height", cols: 1, rows: 2 },
  { id: "large", label: "Large", hint: "2×2 — hero box", cols: 2, rows: 2 },
];

export function widgetSpan(size?: HomeWidgetSize): { cols: number; rows: number } {
  const meta = WIDGET_SIZES.find((s) => s.id === size);
  return meta ? { cols: meta.cols, rows: meta.rows } : { cols: 1, rows: 1 };
}

export function createWidget(type: HomeWidgetType, order: number, size: HomeWidgetSize = "standard"): HomeWidget {
  const id = `${type}-${Date.now().toString(36)}`;
  const base = {
    id,
    enabled: true,
    order,
    size,
    imageFit: "half" as const,
    imageScale: 100,
    imageObjectFit: "contain" as const,
    imagePosition: "center top",
    imageSrc: "",
  };
  if (type === "tickets") {
    return {
      ...base,
      type: "tickets",
      title: "TICKETS",
      linkTo: "https://www.ticketmaster.com",
      imageFit: "half",
      cardClassName: "member-card-events-gradient",
    };
  }
  if (type === "custom") {
    return {
      ...base,
      type: "custom",
      title: "NEW\nDROP",
      linkTo: "/access",
      cardClassName: "member-card-ghost",
    };
  }
  const presets: Record<Exclude<HomeWidgetType, "tickets" | "custom">, HomeWidget> = presetsFor(id, order, size);
  return presets[type];
}

function presetsFor(id: string, order: number, size: HomeWidgetSize): Record<Exclude<HomeWidgetType, "tickets" | "custom">, HomeWidget> {
  const shared = {
    id,
    enabled: true,
    order,
    size,
    imageFit: "half" as const,
    imageScale: 100,
    imageObjectFit: "contain" as const,
    imagePosition: "center top",
    imageSrc: "",
  };
  return {
    videos: {
      ...shared,
      type: "videos",
      title: "EXCLUSIVE\nVIDEOS",
      linkTo: "/access/videos",
      cardClassName: "member-card-videos-gradient",
      showPlay: true,
    },
    news: {
      ...shared,
      type: "news",
      title: "LATEST NEWS\n& UPDATES",
      linkTo: "/access/latest-news",
      cardClassName: "member-card-drops-gradient",
    },
    events: {
      ...shared,
      type: "events",
      title: "EVENTS &\nGIVEAWAYS",
      linkTo: "/access/events",
      imageFit: "full",
      cardClassName: "member-card-events-gradient",
      showLock: true,
    },
    music: {
      ...shared,
      type: "music",
      title: "DOC &\nGLO",
      linkTo: "/access/shop",
      cardClassName: "member-card-music-gradient",
      showMusicBars: false,
    },
  };
}

export function resolveAssetUrl(src: string) {
  if (!src) return "";
  if (src.startsWith("data:") || src.startsWith("http://") || src.startsWith("https://")) return src;
  if (!hasFanAppApi()) return src;
  return `${getApiBase()}${src.startsWith("/") ? "" : "/"}${src}`;
}
