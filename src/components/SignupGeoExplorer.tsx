import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Globe, MapPin } from "lucide-react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import {
  countryOverview as fallbackOverview,
  countryCodesForView,
  countryGradientId,
  countryGradientStops,
  getRegionIntensity,
  heatmapMapBackground,
  heatmapPaletteList,
  heatmapPalettes,
  heatmapRegionStroke,
  intensityToColor,
  mapViewConfig,
  paletteGradientCss,
  viewIdFromCountryCode,
  viewIdFromCountryName,
  worldCountryFromName,
  type CountryViewId,
  type HeatmapPaletteId,
} from "../data/signupGeoData";
import type { DametimeAnalyticsGeo } from "../lib/dametimeAnalyticsApi";
import { formatMetric } from "../lib/dametimeAnalyticsApi";

type GeoFeature = {
  rsmKey: string;
  id?: string;
  properties?: { name?: string };
};

type GeoPoint = DametimeAnalyticsGeo["points"][number];

type CountryRow = {
  id: CountryViewId;
  label: string;
  flag: string;
  pct: number;
  count: number;
};

type SignupGeoExplorerProps = {
  className?: string;
  geo?: DametimeAnalyticsGeo | null;
};

const FEATURED: { id: Exclude<CountryViewId, "world" | "Other">; label: string; flag: string }[] = [
  { id: "USA", label: "USA", flag: "🇺🇸" },
  { id: "Canada", label: "Canada", flag: "🇨🇦" },
  { id: "UK", label: "UK", flag: "🇬🇧" },
  { id: "Australia", label: "Australia", flag: "🇦🇺" },
];

function MapGradientBackground() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black via-[#030303] to-black" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(var(--theme-accent-rgb),0.05),transparent_55%)]" />
    </>
  );
}

function PalettePicker({
  paletteId,
  onChange,
  variant = "compact",
}: {
  paletteId: HeatmapPaletteId;
  onChange: (id: HeatmapPaletteId) => void;
  variant?: "compact" | "sidebar";
}) {
  if (variant === "sidebar") {
    return (
      <div className="mt-4 flex flex-col gap-2 border-t border-dt-border pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-dt-muted">Color palette</p>
        {heatmapPaletteList.map((palette) => {
          const active = palette.id === paletteId;
          return (
            <button
              key={palette.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(palette.id)}
              className={`flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left transition ${
                active
                  ? "border-dt-red bg-dt-red/10 text-white ring-1 ring-dt-red/50"
                  : "border-dt-border text-dt-muted hover:border-white/20 hover:text-white"
              }`}
            >
              <span
                className="h-3 w-8 shrink-0 rounded-sm border border-white/10"
                style={{ background: paletteGradientCss(palette.id) }}
              />
              <span className="text-[10px] font-medium">{palette.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-dt-muted">Color palette</p>
      <div className="flex flex-wrap gap-1.5">
        {heatmapPaletteList.map((palette) => {
          const active = palette.id === paletteId;
          return (
            <button
              key={palette.id}
              type="button"
              title={palette.label}
              aria-pressed={active}
              onClick={() => onChange(palette.id)}
              className={`flex items-center gap-1.5 rounded-md border px-2 py-1 transition ${
                active ? "border-dt-red bg-dt-red/10 ring-1 ring-dt-red/60" : "border-dt-border hover:border-white/30"
              }`}
            >
              <span
                className="h-3 w-8 shrink-0 rounded-sm border border-white/10"
                style={{ background: paletteGradientCss(palette.id) }}
              />
              <span className="text-[10px] font-medium text-dt-muted">{palette.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MapLegend({
  paletteId,
  onPaletteChange,
}: {
  paletteId: HeatmapPaletteId;
  onPaletteChange: (id: HeatmapPaletteId) => void;
}) {
  return (
    <div className="flex w-[148px] shrink-0 flex-col gap-2 border-r border-dt-border pr-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-dt-muted">Signup density</p>
      <div
        className="mb-1 h-3 w-full rounded-sm border border-white/10"
        style={{ background: paletteGradientCss(paletteId) }}
        aria-hidden
      />
      {heatmapPalettes[paletteId].steps.map((step) => (
        <div key={step.label} className="flex items-center gap-2">
          <span className="h-3 w-5 shrink-0 rounded-sm border border-white/10" style={{ backgroundColor: step.color }} />
          <span className="text-[10px] leading-tight text-dt-muted">{step.label}</span>
        </div>
      ))}
      <PalettePicker paletteId={paletteId} onChange={onPaletteChange} variant="sidebar" />
    </div>
  );
}

function isWorldMapView(view: CountryViewId) {
  return view === "world" || view === "Other";
}

function pointViewId(point: GeoPoint): CountryViewId | null {
  return (
    viewIdFromCountryCode(point.countryCode) ??
    viewIdFromCountryName(point.countryName) ??
    viewIdFromCountryName(point.label.split(",").at(-1)?.trim() ?? null)
  );
}

function pointsForView(view: CountryViewId, points: GeoPoint[]): GeoPoint[] {
  if (view === "world") return [];
  if (view === "Other") return points.filter((point) => pointViewId(point) == null);
  const codes = countryCodesForView(view)?.map((c) => c.toUpperCase()) ?? [];
  return points.filter((point) => {
    if (point.countryCode && codes.includes(point.countryCode.toUpperCase())) return true;
    return pointViewId(point) === view;
  });
}

function buildLiveCountryRows(geo?: DametimeAnalyticsGeo | null): CountryRow[] {
  if (!geo?.countries?.length) {
    // No live geo yet — show real zeros, never mock percentages.
    return fallbackOverview.map((row) => ({ ...row, pct: 0, count: 0 }));
  }

  const rows: CountryRow[] = FEATURED.map((featured) => {
    const hit = geo.countries.find((country) => {
      const fromCode = viewIdFromCountryCode(country.countryCode);
      const fromName = viewIdFromCountryName(country.country);
      return fromCode === featured.id || fromName === featured.id;
    });
    return {
      id: featured.id,
      label: featured.label,
      flag: hit?.flag ?? featured.flag,
      pct: hit?.pct ?? 0,
      count: hit?.count ?? 0,
    };
  });

  const otherCount = geo.countries
    .filter((country) => {
      const view = viewIdFromCountryCode(country.countryCode) ?? viewIdFromCountryName(country.country);
      return !view;
    })
    .reduce((sum, country) => sum + country.count, 0);

  rows.push({
    id: "Other",
    label: "Other",
    flag: "🌍",
    pct: geo.totalFans > 0 ? Math.round((otherCount / geo.totalFans) * 1000) / 10 : 0,
    count: otherCount,
  });

  const withFans = rows.filter((row) => row.count > 0);
  return withFans.length ? withFans : rows;
}

function buildLiveIntensity(geo?: DametimeAnalyticsGeo | null): Record<string, number> | undefined {
  if (!geo?.countries?.length) return undefined;
  const max = Math.max(...geo.countries.map((c) => c.count), 1);
  const live: Record<string, number> = {};
  for (const country of geo.countries) {
    const view = viewIdFromCountryCode(country.countryCode) ?? viewIdFromCountryName(country.country);
    if (!view || view === "world" || view === "Other") continue;
    live[view] = Math.max(0.22, Math.min(1, country.count / max));
  }
  return live;
}

function pinScale(count: number, maxCount: number) {
  return 0.85 + (maxCount > 0 ? count / maxCount : 0) * 0.55;
}

/** Classic map pin with tip at (0,0) so it anchors to the city coordinate. */
function MapPinMarker({ active, scale }: { active: boolean; scale: number }) {
  return (
    <g
      transform={`scale(${scale})`}
      style={{
        filter: active
          ? "drop-shadow(0 2px 6px rgba(var(--theme-accent-rgb),0.9))"
          : "drop-shadow(0 2px 4px rgba(0,0,0,0.45))",
      }}
    >
      <path
        d="M0,0 C-7.5,-11 -14,-20 -14,-28 A14,14 0 1 1 14,-28 C14,-20 7.5,-11 0,0 Z"
        fill="var(--theme-accent)"
        stroke="#fff"
        strokeWidth={1.25}
      />
      <path
        d="M0,0 C-7.5,-11 -14,-20 -14,-28 A14,14 0 1 1 14,-28 C14,-20 7.5,-11 0,0 Z"
        fill="url(#map-pin-shine)"
        opacity={0.35}
      />
      <circle cx="0" cy="-26" r="6.5" fill="#ffffff" />
    </g>
  );
}

function ChoroplethMap({
  view,
  paletteId,
  onSelectCountry,
  pins,
  liveIntensity,
}: {
  view: CountryViewId;
  paletteId: HeatmapPaletteId;
  onSelectCountry?: (id: CountryViewId) => void;
  pins: GeoPoint[];
  liveIntensity?: Record<string, number>;
}) {
  const config = mapViewConfig[view];
  const worldView = isWorldMapView(view);
  const clickable = worldView;
  const projectionConfig =
    config.projection === "geoAlbersUsa"
      ? { scale: config.scale }
      : { scale: config.scale, center: config.center ?? [0, 0] };
  const maxPin = Math.max(...pins.map((p) => p.count), 1);
  const [hoverPin, setHoverPin] = useState<string | null>(null);

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden px-3 py-2">
      <MapGradientBackground />
      <ComposableMap
        projection={config.projection}
        width={config.width}
        height={config.height}
        projectionConfig={projectionConfig}
        background={heatmapMapBackground}
        preserveAspectRatio="xMidYMid meet"
        className="relative z-[1]"
        style={{
          width: "100%",
          height: worldView ? "100%" : "auto",
          maxWidth: "100%",
          maxHeight: "100%",
          display: "block",
          backgroundColor: heatmapMapBackground,
          ...(worldView ? { aspectRatio: `${config.width} / ${config.height}` } : {}),
        }}
      >
        <Geographies geography={config.url}>
          {({ geographies }: { geographies: GeoFeature[] }) => (
            <>
              <defs>
                {geographies.map((geo) => {
                  const name = geo.properties?.name ?? "";
                  const id = String(geo.id ?? "");
                  const intensity = getRegionIntensity(view, id, name, liveIntensity);
                  const gradId = countryGradientId(geo.rsmKey);
                  const stops = countryGradientStops(intensity, paletteId);
                  return (
                    <linearGradient
                      key={gradId}
                      id={gradId}
                      x1="10%"
                      y1="90%"
                      x2="90%"
                      y2="10%"
                      gradientUnits="objectBoundingBox"
                    >
                      {stops.map((stop) => (
                        <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
                      ))}
                    </linearGradient>
                  );
                })}
              </defs>
              {geographies.map((geo) => {
                const name = geo.properties?.name ?? "";
                const id = String(geo.id ?? "");
                const intensity = getRegionIntensity(view, id, name, liveIntensity);
                const target = worldCountryFromName(name);
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={`url(#${countryGradientId(geo.rsmKey)})`}
                    stroke={heatmapRegionStroke}
                    strokeWidth={worldView ? 0.35 : 0.55}
                    style={{
                      default: { outline: "none", opacity: 1 },
                      hover: {
                        fill: clickable && target ? "var(--theme-accent)" : intensityToColor(intensity, paletteId),
                        outline: "none",
                        cursor: clickable && target ? "pointer" : "default",
                        opacity: 1,
                      },
                      pressed: { outline: "none" },
                    }}
                    onClick={() => {
                      if (clickable && target && onSelectCountry) onSelectCountry(target);
                    }}
                  />
                );
              })}
            </>
          )}
        </Geographies>

        <defs>
          <linearGradient id="map-pin-shine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="55%" stopColor="var(--theme-accent)" stopOpacity="0" />
            <stop offset="100%" stopColor="#7a0008" stopOpacity="0.45" />
          </linearGradient>
        </defs>

        {pins.map((pin) => {
          const key = `${pin.lat}-${pin.lng}-${pin.label}`;
          const scale = pinScale(pin.count, maxPin);
          const active = hoverPin === key;
          const labelY = -42 * scale;
          return (
            <Marker key={key} coordinates={[pin.lng, pin.lat]}>
              <g onMouseEnter={() => setHoverPin(key)} onMouseLeave={() => setHoverPin(null)}>
                <MapPinMarker active={active} scale={scale} />
                <text
                  textAnchor="middle"
                  y={labelY}
                  style={{
                    fontFamily: "inherit",
                    fontSize: 10,
                    fontWeight: 700,
                    fill: "#fff",
                    paintOrder: "stroke",
                    stroke: "rgba(0,0,0,0.75)",
                    strokeWidth: 3,
                  }}
                >
                  {pin.label.split(",")[0]?.trim() || "City"}
                </text>
                <text
                  textAnchor="middle"
                  y={12}
                  style={{
                    fontFamily: "inherit",
                    fontSize: 9,
                    fontWeight: 600,
                    fill: "rgba(255,255,255,0.8)",
                  }}
                >
                  {formatMetric(pin.count)}
                </text>
              </g>
            </Marker>
          );
        })}
      </ComposableMap>

      {!worldView && pins.length === 0 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-[2] flex justify-center px-4">
          <p className="rounded-full border border-white/10 bg-black/70 px-3 py-1.5 text-[11px] text-white/65">
            No city-level pins for this country yet
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function SignupGeoExplorer({ className = "", geo = null }: SignupGeoExplorerProps) {
  const [view, setView] = useState<CountryViewId>("world");
  const [paletteId, setPaletteId] = useState<HeatmapPaletteId>("ocean");

  const rows = useMemo(() => buildLiveCountryRows(geo), [geo]);
  const liveIntensity = useMemo(() => buildLiveIntensity(geo), [geo]);
  const pins = useMemo(() => pointsForView(view, geo?.points ?? []), [geo?.points, view]);

  const countryIndex = useMemo(() => rows.findIndex((c) => c.id === view), [rows, view]);

  function goPrev() {
    if (view === "world") setView(rows[rows.length - 1]?.id ?? "USA");
    else if (countryIndex <= 0) setView("world");
    else setView(rows[countryIndex - 1].id);
  }

  function goNext() {
    if (view === "world") setView(rows[0]?.id ?? "USA");
    else if (countryIndex >= rows.length - 1) setView("world");
    else setView(rows[countryIndex + 1].id);
  }

  const activeRow = rows.find((c) => c.id === view);
  const title =
    view === "world"
      ? "World — live fan signups by country"
      : view === "Other"
        ? "Other regions — city pinpoints"
        : `${activeRow?.flag ?? ""} ${view} — city signup pins`;

  return (
    <div className={className}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-dt-muted">{title}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goPrev}
            className="rounded-md border border-dt-border p-1.5 text-dt-muted hover:bg-white/5 hover:text-white"
            aria-label="Previous country"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => setView("world")}
            className={`rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
              view === "world" ? "bg-dt-red text-white" : "border border-dt-border text-dt-muted hover:text-white"
            }`}
          >
            World
          </button>
          <button
            type="button"
            onClick={goNext}
            className="rounded-md border border-dt-border p-1.5 text-dt-muted hover:bg-white/5 hover:text-white"
            aria-label="Next country"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="mb-3 lg:hidden">
        <PalettePicker paletteId={paletteId} onChange={setPaletteId} />
      </div>

      <div className="relative flex flex-col overflow-hidden rounded-lg border border-dt-border bg-dt-card lg:flex-row lg:min-h-[400px]">
        <MapGradientBackground />
        <div className="relative z-[1] hidden border-b border-dt-border p-4 lg:flex lg:border-b-0 lg:border-r">
          <MapLegend paletteId={paletteId} onPaletteChange={setPaletteId} />
        </div>

        <div className="relative z-[1] h-[400px] w-full min-w-0 flex-1 overflow-hidden sm:h-[440px]">
          <ChoroplethMap
            view={view}
            paletteId={paletteId}
            onSelectCountry={setView}
            pins={pins}
            liveIntensity={liveIntensity}
          />
        </div>

        <div className="relative z-[1] flex w-full shrink-0 flex-row gap-1 overflow-x-auto border-t border-dt-border bg-dt-bg/60 p-2 backdrop-blur-sm lg:w-[168px] lg:flex-col lg:overflow-x-visible lg:border-l lg:border-t-0 lg:p-3">
          <p className="mb-0 hidden text-[10px] font-semibold uppercase tracking-wide text-dt-muted lg:mb-2 lg:block">
            Countries
          </p>
          {rows.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setView(c.id)}
              className={`shrink-0 rounded-md px-2 py-2 text-left text-xs transition lg:mb-1 lg:w-full ${
                view === c.id ? "bg-dt-red/20 text-white ring-1 ring-dt-red/50" : "text-dt-muted hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span>
                  {c.flag} {c.label}
                </span>
                <span className="font-semibold tabular-nums">{c.pct}%</span>
              </div>
              <p className="mt-0.5 text-[10px] text-white/40">{formatMetric(c.count)} fans</p>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setView("world")}
            className={`shrink-0 rounded-md px-2 py-2 text-xs lg:mt-2 lg:flex lg:w-full lg:items-center lg:gap-1.5 ${
              view === "world" ? "bg-dt-red/20 text-white" : "text-dt-muted hover:bg-white/5"
            }`}
          >
            <Globe size={14} />
            <span>All continents</span>
          </button>
          {!isWorldMapView(view) ? (
            <p className="mt-2 hidden items-center gap-1 text-[10px] text-white/45 lg:flex">
              <MapPin size={10} className="text-dt-red" />
              {pins.length} city pin{pins.length === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>
      </div>

      <p className="mt-2 text-[10px] text-dt-muted lg:hidden">
        Live IP locations from signup · tap a country for city pins.
      </p>
    </div>
  );
}
