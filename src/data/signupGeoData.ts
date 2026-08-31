export type CountryViewId = "world" | "USA" | "Canada" | "UK" | "Australia" | "Other";

export type HeatmapPaletteId = "ocean" | "inferno" | "emerald" | "sunset" | "slate";

export type HeatmapPalette = {
  id: HeatmapPaletteId;
  label: string;
  steps: { label: string; color: string }[];
  colors: [string, string, string, string, string];
};

export const heatmapMapBackground = "transparent";
export const heatmapRegionStroke = "#1a1a1a";

export const heatmapLegendLabels = [
  "Fewest signups",
  "Below average",
  "Average",
  "Above average",
  "Most signups",
] as const;

export type CountryOverview = {
  id: CountryViewId;
  label: string;
  flag: string;
  pct: number;
};

export type MapViewConfig = {
  url: string;
  projection: string;
  scale: number;
  center?: [number, number];
  width: number;
  height: number;
};

export const countryOverview: CountryOverview[] = [
  { id: "USA", label: "USA", flag: "🇺🇸", pct: 52.4 },
  { id: "Canada", label: "Canada", flag: "🇨🇦", pct: 12.8 },
  { id: "UK", label: "UK", flag: "🇬🇧", pct: 9.6 },
  { id: "Australia", label: "Australia", flag: "🇦🇺", pct: 6.2 },
  { id: "Other", label: "Other", flag: "🌍", pct: 19.0 },
];

const legendLabels = heatmapLegendLabels;

export const heatmapPalettes: Record<HeatmapPaletteId, HeatmapPalette> = {
  ocean: {
    id: "ocean",
    label: "Ocean",
    colors: ["#3288bd", "#66c2a5", "#fee08b", "#fc8d59", "#d73027"],
    steps: [
      { label: legendLabels[0], color: "#3288bd" },
      { label: legendLabels[1], color: "#66c2a5" },
      { label: legendLabels[2], color: "#fee08b" },
      { label: legendLabels[3], color: "#fc8d59" },
      { label: legendLabels[4], color: "#d73027" },
    ],
  },
  inferno: {
    id: "inferno",
    label: "Inferno",
    colors: ["#2c115f", "#b73779", "#fb8861", "#fec287", "#fcffa4"],
    steps: [
      { label: legendLabels[0], color: "#2c115f" },
      { label: legendLabels[1], color: "#b73779" },
      { label: legendLabels[2], color: "#fb8861" },
      { label: legendLabels[3], color: "#fec287" },
      { label: legendLabels[4], color: "#fcffa4" },
    ],
  },
  emerald: {
    id: "emerald",
    label: "Emerald",
    colors: ["#084081", "#2b8cbe", "#4eb3d3", "#7bccc4", "#a8ddb5"],
    steps: [
      { label: legendLabels[0], color: "#084081" },
      { label: legendLabels[1], color: "#2b8cbe" },
      { label: legendLabels[2], color: "#4eb3d3" },
      { label: legendLabels[3], color: "#7bccc4" },
      { label: legendLabels[4], color: "#a8ddb5" },
    ],
  },
  sunset: {
    id: "sunset",
    label: "Sunset",
    colors: ["#4a1486", "#9c27b0", "#e91e63", "#ff7043", "#ffca28"],
    steps: [
      { label: legendLabels[0], color: "#4a1486" },
      { label: legendLabels[1], color: "#9c27b0" },
      { label: legendLabels[2], color: "#e91e63" },
      { label: legendLabels[3], color: "#ff7043" },
      { label: legendLabels[4], color: "#ffca28" },
    ],
  },
  slate: {
    id: "slate",
    label: "Slate",
    colors: ["#1e293b", "#334155", "#64748b", "#94a3b8", "#e2e8f0"],
    steps: [
      { label: legendLabels[0], color: "#1e293b" },
      { label: legendLabels[1], color: "#334155" },
      { label: legendLabels[2], color: "#64748b" },
      { label: legendLabels[3], color: "#94a3b8" },
      { label: legendLabels[4], color: "#e2e8f0" },
    ],
  },
};

export const heatmapPaletteList = Object.values(heatmapPalettes);

export function paletteGradientCss(paletteId: HeatmapPaletteId, direction: "horizontal" | "vertical" = "horizontal") {
  const colors = heatmapPalettes[paletteId].colors.join(", ");
  const angle = direction === "vertical" ? "180deg" : "90deg";
  return `linear-gradient(${angle}, ${colors})`;
}

/** @deprecated Use heatmapPalettes[paletteId].steps */
export const legendSteps = heatmapPalettes.ocean.steps;

const GEO_URLS = {
  world: "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json",
  usa: "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json",
  canada: "https://code.highcharts.com/mapdata/countries/ca/ca-all.topo.json",
  uk: "https://code.highcharts.com/mapdata/countries/gb/gb-all.topo.json",
  australia: "https://code.highcharts.com/mapdata/countries/au/au-all.topo.json",
} as const;

export const mapViewConfig: Record<CountryViewId, MapViewConfig> = {
  world: {
    url: GEO_URLS.world,
    projection: "geoEqualEarth",
    scale: 172,
    center: [0, 0],
    width: 900,
    height: 540,
  },
  USA: {
    url: GEO_URLS.usa,
    projection: "geoAlbersUsa",
    scale: 680,
    width: 800,
    height: 420,
  },
  Canada: {
    url: GEO_URLS.canada,
    projection: "geoMercator",
    scale: 310,
    center: [-96, 60],
    width: 800,
    height: 420,
  },
  UK: {
    url: GEO_URLS.uk,
    projection: "geoMercator",
    scale: 780,
    center: [-2, 54.5],
    width: 800,
    height: 420,
  },
  Australia: {
    url: GEO_URLS.australia,
    projection: "geoMercator",
    scale: 520,
    center: [134, -27],
    width: 800,
    height: 420,
  },
  Other: {
    url: GEO_URLS.world,
    projection: "geoEqualEarth",
    scale: 172,
    center: [0, 0],
    width: 900,
    height: 540,
  },
};

export function geoUrlFor(view: CountryViewId) {
  return mapViewConfig[view].url;
}

function parseHex(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
}

function lerpHex(a: string, b: string, t: number): string {
  const [r1, g1, b1] = parseHex(a);
  const [r2, g2, b2] = parseHex(b);
  const channel = (start: number, end: number) => Math.round(start + (end - start) * t);
  const r = channel(r1, r2);
  const g = channel(g1, g2);
  const bl = channel(b1, b2);
  return `#${[r, g, bl].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

export function intensityToColor(value: number, paletteId: HeatmapPaletteId = "ocean") {
  const colors = heatmapPalettes[paletteId].colors;
  const v = Math.max(0, Math.min(1, value));
  const position = v * (colors.length - 1);
  const index = Math.floor(position);
  const blend = position - index;
  if (index >= colors.length - 1) return colors[colors.length - 1];
  return lerpHex(colors[index], colors[index + 1], blend);
}

export type CountryGradientStop = { offset: string; color: string };

/** Multi-stop fill gradient inside each region, spanning the palette around its intensity. */
export function countryGradientStops(
  intensity: number,
  paletteId: HeatmapPaletteId = "ocean",
): CountryGradientStop[] {
  const v = Math.max(0, Math.min(1, intensity));
  const spread = Math.max(0.24, 0.18);
  const low = Math.max(0, v - spread);
  const high = Math.min(1, v + spread);

  return [0, 0.2, 0.45, 0.7, 1].map((t) => ({
    offset: `${Math.round(t * 100)}%`,
    color: intensityToColor(low + (high - low) * t, paletteId),
  }));
}

export function countryGradientId(key: string) {
  return `country-grad-${key.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

const worldCountryMap: Record<string, CountryViewId> = {
  "United States of America": "USA",
  "United States": "USA",
  USA: "USA",
  Canada: "Canada",
  "United Kingdom": "UK",
  UK: "UK",
  "Great Britain": "UK",
  Australia: "Australia",
};

const codeToView: Record<string, CountryViewId> = {
  US: "USA",
  CA: "Canada",
  GB: "UK",
  UK: "UK",
  AU: "Australia",
};

const viewToCodes: Record<Exclude<CountryViewId, "world" | "Other">, string[]> = {
  USA: ["US"],
  Canada: ["CA"],
  UK: ["GB", "UK"],
  Australia: ["AU"],
};

const mainCountries = new Set([
  "United States of America",
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
]);

export function viewIdFromCountryCode(code?: string | null): CountryViewId | null {
  if (!code) return null;
  return codeToView[code.toUpperCase()] ?? null;
}

export function viewIdFromCountryName(name?: string | null): CountryViewId | null {
  if (!name) return null;
  return worldCountryMap[name] ?? null;
}

export function countryCodesForView(view: CountryViewId): string[] | null {
  if (view === "world" || view === "Other") return null;
  return viewToCodes[view];
}

/**
 * Live intensity 0–1 from country share. Countries with no live signups stay at a
 * quiet base shade — we never invent heat for regions without real fans.
 */
export function getRegionIntensity(
  view: CountryViewId,
  _geoId: string,
  geoName?: string,
  liveByCountry?: Record<string, number>,
): number {
  const name = geoName ?? "";

  if (view === "USA" || view === "Canada" || view === "Australia" || view === "UK") {
    // Country drill-down is pin-led — keep regions quiet.
    return 0.18;
  }

  if (view === "world") {
    const mapped = worldCountryMap[name];
    if (liveByCountry && mapped && liveByCountry[mapped] != null) {
      return liveByCountry[mapped];
    }
    return 0.1;
  }

  if (view === "Other") {
    return mainCountries.has(name) ? 0.1 : 0.18;
  }

  return 0.3;
}

export function worldCountryFromName(name: string): CountryViewId | null {
  return worldCountryMap[name] ?? null;
}
