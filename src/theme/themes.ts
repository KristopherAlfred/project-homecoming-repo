export type ThemeTemplate = "default" | "team" | "athlete" | "ocean" | "hotpink";

export interface ThemePalette {
  bg: string;
  panel: string;
  card: string;
  border: string;
  muted: string;
  text: string;
  accent: string;
  accentHover: string;
  chartSecondary: string;
  chartTertiary: string;
  trafficShades: string[];
}

function shades(base: string): string[] {
  return [base, lighten(base, 0.12), lighten(base, 0.24), lighten(base, 0.36), lighten(base, 0.48), lighten(base, 0.6)];
}

function lighten(hex: string, amount: number): string {
  const n = hex.replace("#", "");
  const r = Math.min(255, parseInt(n.slice(0, 2), 16) + Math.round(255 * amount));
  const g = Math.min(255, parseInt(n.slice(2, 4), 16) + Math.round(255 * amount));
  const b = Math.min(255, parseInt(n.slice(4, 6), 16) + Math.round(255 * amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const n = hex.replace("#", "").trim();
  if (n.length !== 6) return null;
  const r = Number.parseInt(n.slice(0, 2), 16);
  const g = Number.parseInt(n.slice(2, 4), 16);
  const b = Number.parseInt(n.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return null;
  return { r, g, b };
}

const defaultPalette: ThemePalette = {
  bg: "#05100c",
  panel: "#0b1a15",
  card: "#102820",
  border: "#1d3b31",
  muted: "#8fb3a5",
  text: "#eafff5",
  accent: "#5FE3B0",
  accentHover: "#86F0C6",
  chartSecondary: "#86F0C6",
  chartTertiary: "#2E9C79",
  trafficShades: shades("#5FE3B0"),
};


const teamPalette: ThemePalette = {
  bg: "#0a0a0a",
  panel: "#111111",
  card: "#141414",
  border: "#1f1f1f",
  muted: "#8a8a8a",
  text: "#f0f0f0",
  accent: "#7DCEA0",
  accentHover: "#A3E4C5",
  chartSecondary: "#52B788",
  chartTertiary: "#1B4332",
  trafficShades: shades("#7DCEA0"),
};

const athletePalette: ThemePalette = {
  bg: "#0a0b14",
  panel: "#12131f",
  card: "#161827",
  border: "#252838",
  muted: "#9498b0",
  text: "#eef0f8",
  accent: "#a855f7",
  accentHover: "#c084fc",
  chartSecondary: "#7c3aed",
  chartTertiary: "#4c1d95",
  trafficShades: shades("#a855f7"),
};

/** Gradient blue, white, and black */
const oceanPalette: ThemePalette = {
  bg: "#000000",
  panel: "#05080f",
  card: "#0a1220",
  border: "#1a2a44",
  muted: "#9eb0c8",
  text: "#ffffff",
  accent: "#2f7cf6",
  accentHover: "#6aa4ff",
  chartSecondary: "#1d4ed8",
  chartTertiary: "#0b2a66",
  trafficShades: shades("#2f7cf6"),
};

/** Hot pink, black, and white */
const hotpinkPalette: ThemePalette = {
  bg: "#000000",
  panel: "#0c060a",
  card: "#140910",
  border: "#3a1528",
  muted: "#c9a0b4",
  text: "#ffffff",
  accent: "#ff1493",
  accentHover: "#ff5eb3",
  chartSecondary: "#db2777",
  chartTertiary: "#831843",
  trafficShades: shades("#ff1493"),
};

export const themeTemplates: {
  id: ThemeTemplate;
  name: string;
  description: string;
  swatches: string[];
  preview: string;
}[] = [
  {
    id: "default",
    name: "Players OS",
    description: "Mint glass & deep green",
    swatches: ["#5FE3B0", "#eafff5", "#05100c"],
    preview: "linear-gradient(135deg, #05100c 0%, #0e2b22 45%, #5FE3B0 100%)",
  },

  {
    id: "team",
    name: "Court Glow",
    description: "Soft court green & black",
    swatches: ["#7DCEA0", "#f0f0f0", "#000000"],
    preview: "linear-gradient(135deg, #000000 0%, #051a12 45%, #7DCEA0 100%)",
  },
  {
    id: "athlete",
    name: "Athlete Vibe",
    description: "Electric purple & midnight premium",
    swatches: ["#a855f7", "#eef0f8", "#0a0b14"],
    preview: "linear-gradient(135deg, #0a0b14 0%, #1a1030 45%, #a855f7 100%)",
  },
  {
    id: "ocean",
    name: "Blue Gradient",
    description: "Gradient blue, white, and black",
    swatches: ["#2f7cf6", "#ffffff", "#000000"],
    preview: "linear-gradient(135deg, #000000 0%, #0a2048 42%, #2f7cf6 78%, #ffffff 100%)",
  },
  {
    id: "hotpink",
    name: "Hot Pink",
    description: "Hot pink, black, and white",
    swatches: ["#ff1493", "#ffffff", "#000000"],
    preview: "linear-gradient(135deg, #000000 0%, #2a0618 42%, #ff1493 78%, #ffffff 100%)",
  },
];

const ALL_TEMPLATES: ThemeTemplate[] = ["default", "team", "athlete", "ocean", "hotpink"];

export function isThemeTemplate(value: string | null | undefined): value is ThemeTemplate {
  return Boolean(value && ALL_TEMPLATES.includes(value as ThemeTemplate));
}

export function getPalette(template: ThemeTemplate): ThemePalette {
  switch (template) {
    case "team":
      return teamPalette;
    case "athlete":
      return athletePalette;
    case "ocean":
      return oceanPalette;
    case "hotpink":
      return hotpinkPalette;
    default:
      return defaultPalette;
  }
}

/**
 * Accent chosen by the athlete (league brand colour / onboarding brand colour).
 * It overrides the template accent so everything the athlete picks in onboarding
 * shows up across the dashboard front end.
 */
let accentOverride: { accent: string; accentHover: string } | null = null;
let accentOverrideEnabled = true;
let lastPalette: ThemePalette | null = null;

export function setAccentOverride(accent: string | null, accentHover?: string | null) {
  accentOverride = accent
    ? { accent, accentHover: accentHover || lighten(accent, 0.12) }
    : null;
  if (lastPalette) applyPalette(lastPalette);
}

/**
 * When the athlete hand-picks a colour template in Settings, that template's
 * accent must win over their league/onboarding accent so every button, chart
 * and glow re-colours to the template.
 */
export function setAccentOverrideEnabled(enabled: boolean) {
  accentOverrideEnabled = enabled;
  if (lastPalette) applyPalette(lastPalette);
}

function withOverride(palette: ThemePalette): ThemePalette {
  if (!accentOverride || !accentOverrideEnabled) return palette;
  const { accent, accentHover } = accentOverride;
  return {
    ...palette,
    accent,
    accentHover,
    chartSecondary: lighten(accent, 0.12),
    trafficShades: shades(accent),
  };
}


export function applyPalette(basePalette: ThemePalette) {
  lastPalette = basePalette;
  const palette = withOverride(basePalette);
  const root = document.documentElement;
  root.style.setProperty("--theme-bg", palette.bg);
  root.style.setProperty("--theme-panel", palette.panel);
  root.style.setProperty("--theme-card", palette.card);
  root.style.setProperty("--theme-border", palette.border);
  root.style.setProperty("--theme-muted", palette.muted);
  root.style.setProperty("--theme-text", palette.text);
  root.style.setProperty("--theme-accent", palette.accent);
  root.style.setProperty("--theme-accent-hover", palette.accentHover);
  root.style.setProperty("--theme-chart-secondary", palette.chartSecondary);
  root.style.setProperty("--theme-chart-tertiary", palette.chartTertiary);
  palette.trafficShades.forEach((color, i) => {
    root.style.setProperty(`--theme-traffic-${i}`, color);
  });

  const rgb = hexToRgb(palette.accent);
  if (rgb) {
    const { r, g, b } = rgb;
    // Drives every accent glow / shadow across the dashboard.
    root.style.setProperty("--theme-accent-rgb", `${r}, ${g}, ${b}`);

    const tint = (a: number) => `rgba(${r}, ${g}, ${b}, ${a})`;
    const glass = (hex: string, a: number) => {
      const c = hexToRgb(hex);
      return c ? `rgba(${c.r}, ${c.g}, ${c.b}, ${a})` : hex;
    };

    root.style.setProperty(
      "--gradient-bg",
      `radial-gradient(ellipse 90% 55% at 50% -12%, ${tint(0.16)} 0%, transparent 58%), radial-gradient(ellipse 70% 45% at 100% 100%, ${tint(0.07)} 0%, transparent 55%), linear-gradient(180deg, ${palette.bg} 0%, ${palette.panel} 45%, ${palette.bg} 100%)`,
    );
    root.style.setProperty(
      "--gradient-panel",
      `radial-gradient(ellipse 80% 50% at 0% 0%, ${tint(0.12)} 0%, transparent 55%), linear-gradient(180deg, ${glass(palette.panel, 0.8)} 0%, ${glass(palette.bg, 0.7)} 100%)`,
    );
    root.style.setProperty(
      "--gradient-card",
      `radial-gradient(ellipse 100% 70% at 8% -18%, ${tint(0.16)} 0%, transparent 52%), linear-gradient(152deg, ${glass(palette.card, 0.72)} 0%, ${glass(palette.panel, 0.6)} 50%, ${glass(palette.bg, 0.72)} 100%)`,
    );
    root.style.setProperty(
      "--gradient-inset",
      `linear-gradient(140deg, ${glass(palette.bg, 0.8)} 0%, ${glass(palette.panel, 0.66)} 45%, ${glass(palette.bg, 0.8)} 100%)`,
    );
    root.style.setProperty(
      "--gradient-header",
      `linear-gradient(90deg, ${tint(0.22)} 0%, ${glass(palette.bg, 0.6)} 45%, transparent 100%)`,
    );
    root.style.setProperty(
      "--gradient-input",
      `linear-gradient(168deg, ${glass(palette.panel, 0.75)} 0%, ${glass(palette.bg, 0.65)} 100%)`,
    );
    root.style.setProperty(
      "--gradient-main",
      `radial-gradient(ellipse 85% 50% at 50% 0%, ${tint(0.14)} 0%, transparent 50%), linear-gradient(180deg, ${palette.bg} 0%, ${palette.panel} 50%, ${palette.bg} 100%)`,
    );
    root.style.setProperty("--surface-border", `${tint(0.2)}`);
    root.style.setProperty("--surface-highlight", `inset 0 1px 0 rgba(255, 255, 255, 0.1)`);
    root.style.setProperty(
      "--surface-shadow",
      `0 18px 44px rgba(0, 0, 0, 0.45), 0 0 0 1px ${tint(0.08)}`,
    );
  }

}

export const STORAGE_KEY = "playersos-theme-template";
