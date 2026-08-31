import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  Film,
  Loader2,
  Newspaper,
  Plus,
  RefreshCw,
  ShoppingBag,
  Trash2,
  Upload,
} from "lucide-react";
import {
  getStageItem,
  pageBackgroundCss,
  stageGlowStyle,
  stageItemCss,
  upsertStageItem,
  type ExperiencePageConfig,
  type ExperienceStageItem,
} from "../../lib/experienceConfig";
import { GRADIENT_BACKGROUND_PRESETS, type GradientBackgroundPreset } from "../../lib/experienceAssets";
import { resolveExperiencePreviewUrl } from "../../lib/resolveExperiencePreviewUrl";
import {
  createEmptyDocAndGloProduct,
  fetchDocAndGloFeed,
  formatDocAndGloPrice,
  publishDocAndGloFeed,
  resolveDocAndGloAssetUrl,
  syncDocAndGloCatalog,
  upsertDocAndGloProduct,
  type DocAndGloFeed,
  type DocAndGloProduct,
  type DocAndGloStatus,
} from "../../lib/docAndGloApi";
import {
  createEmptyNewsItem,
  deleteNewsItem,
  fetchNewsFeed,
  resolveNewsAssetUrl,
  upsertNewsItem,
  type NewsFeed,
  type NewsItem,
  type NewsStatus,
} from "../../lib/newsApi";
import {
  fetchYouTubeAnalytics,
  fetchYouTubeVideosFeed,
} from "../../lib/youtubeAnalyticsApi";
import {
  createEmptyVideoItem,
  deleteVideoItem,
  fetchVideoFeed,
  resolveVideoAssetUrl,
  upsertVideoItem,
  type ExclusiveVideoFeed,
  type ExclusiveVideoItem,
  type VideoStatus,
} from "../../lib/videosApi";
import { DtSelect } from "../DtSelect";

export type ExperienceContentKind = "videos" | "news" | "docAndGlo";

const PHONE_TABS = ["HOME", "SOCIAL", "VIDEOS", "NEWS", "PROFILE"] as const;
type PhoneTab = (typeof PHONE_TABS)[number];

function formatViews(count?: number) {
  if (count == null || !Number.isFinite(count)) return "— views";
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M views`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K views`;
  return `${count.toLocaleString()} views`;
}

const CONTENT_STAGE_IDS = ["titleArt", "headline", "subhead", "body"] as const;

const CONTENT_STAGE_LABELS: Record<(typeof CONTENT_STAGE_IDS)[number], string> = {
  titleArt: "Hero art",
  headline: "Headline box",
  subhead: "Subhead box",
  body: "Body box",
};

function PhoneChrome({ activeTab, children }: { activeTab: PhoneTab; children: ReactNode }) {
  return (
    <div className="sticky top-4 self-start xl:order-2">
      <div className="relative mx-auto w-full max-w-[300px] overflow-hidden rounded-[2.35rem] border border-white/15 bg-black shadow-[0_0_48px_rgba(var(--theme-accent-rgb),0.12)]">
        <div className="pointer-events-none absolute left-1/2 top-2 z-20 h-5 w-28 -translate-x-1/2 rounded-full bg-black/90" />
        <div className="h-[420px] overflow-y-auto bg-[#050505] pt-8">{children}</div>
        <div className="border-t border-white/10 bg-[#0a0a0a] px-1 pb-3 pt-2">
          <div className="grid grid-cols-5">
            {PHONE_TABS.map((tab) => (
              <div key={tab} className="flex flex-col items-center gap-0.5 py-1">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${tab === activeTab ? "bg-[#8FE3B8]" : "bg-white/25"}`}
                />
                <span
                  className={`font-display text-[7px] tracking-[0.1em] ${
                    tab === activeTab ? "text-[#8FE3B8]" : "text-white/45"
                  }`}
                >
                  {tab}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DraggableStageItem({
  item,
  onMove,
  children,
}: {
  item: ExperienceStageItem;
  onMove: (x: number, y: number) => void;
  children: ReactNode;
}) {
  const drag = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const parent = e.currentTarget.parentElement;
    if (!parent) return;
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: item.x,
      origY: item.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const parent = e.currentTarget.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const dx = ((e.clientX - drag.current.startX) / rect.width) * 100;
    const dy = ((e.clientY - drag.current.startY) / rect.height) * 100;
    onMove(
      Math.max(0, Math.min(90, drag.current.origX + dx)),
      Math.max(0, Math.min(92, drag.current.origY + dy)),
    );
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    drag.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      role="presentation"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="cursor-grab touch-none active:cursor-grabbing hover:outline hover:outline-1 hover:outline-white/25"
      style={stageItemCss(item) as CSSProperties}
    >
      {children}
    </div>
  );
}

function textBoxStyle(item: ExperienceStageItem): CSSProperties {
  const background =
    item.fillFrom && item.fillTo
      ? `linear-gradient(135deg, ${item.fillFrom}, ${item.fillTo})`
      : "rgba(0,0,0,0.45)";
  return {
    background,
    border: `1px solid ${item.borderColor || "rgba(255,255,255,0.12)"}`,
    borderRadius: 10,
    padding: "4px 6px",
  };
}

function FreeformContentStage({
  page,
  onPatchPage,
  height,
}: {
  page: ExperiencePageConfig;
  onPatchPage: (patch: Partial<ExperiencePageConfig>) => void;
  height: number;
}) {
  const patchItem = useCallback(
    (id: string, patch: Partial<ExperienceStageItem>) => {
      onPatchPage({ stage: upsertStageItem(page, { id, ...patch }) });
    },
    [onPatchPage, page],
  );

  const subLines = (page.subhead || "").split("\n");

  return (
    <div
      className="relative mx-1 shrink-0 overflow-hidden rounded-xl"
      style={{
        height,
        background: pageBackgroundCss(page) || "#050505",
      }}
    >
      {CONTENT_STAGE_IDS.map((id) => {
        const item = getStageItem(page, id);
        if (item.hidden) return null;

        if (id === "titleArt") {
          if (!page.heroImage) return null;
          const scale = (item.scale ?? page.heroScale ?? 100) / 100;
          return (
            <DraggableStageItem key={id} item={item} onMove={(x, y) => patchItem(id, { x, y })}>
              <img
                src={resolveExperiencePreviewUrl(page.heroImage)}
                alt=""
                draggable={false}
                className="w-full bg-transparent object-contain"
                style={{
                  transform: scale !== 1 ? `scale(${scale})` : undefined,
                  transformOrigin: "center center",
                  ...stageGlowStyle(item, "image"),
                }}
              />
            </DraggableStageItem>
          );
        }

        if (id === "headline") {
          if (!page.headline.trim()) return null;
          return (
            <DraggableStageItem key={id} item={item} onMove={(x, y) => patchItem(id, { x, y })}>
              <p
                className="font-display text-[11px] font-extrabold leading-tight text-white"
                style={{ ...textBoxStyle(item), ...stageGlowStyle(item, "text") }}
              >
                {page.headline}
              </p>
            </DraggableStageItem>
          );
        }

        if (id === "subhead") {
          if (!page.subhead.trim()) return null;
          return (
            <DraggableStageItem key={id} item={item} onMove={(x, y) => patchItem(id, { x, y })}>
              <p
                className="text-[8px] font-semibold uppercase leading-snug tracking-[0.1em]"
                style={{ ...textBoxStyle(item), color: page.accentColor, ...stageGlowStyle(item, "text") }}
              >
                {subLines.map((line, i) => (
                  <span key={`${line}-${i}`}>
                    {line}
                    {i < subLines.length - 1 ? <br /> : null}
                  </span>
                ))}
              </p>
            </DraggableStageItem>
          );
        }

        if (id === "body") {
          if (!page.body.trim()) return null;
          return (
            <DraggableStageItem key={id} item={item} onMove={(x, y) => patchItem(id, { x, y })}>
              <p
                className="text-[8px] leading-snug text-white/70"
                style={{ ...textBoxStyle(item), ...stageGlowStyle(item, "text") }}
              >
                {page.body}
              </p>
            </DraggableStageItem>
          );
        }

        return null;
      })}
    </div>
  );
}

function ContentPhonePreview({
  page,
  onPatchPage,
  activeTab,
  children,
}: {
  page: ExperiencePageConfig;
  onPatchPage: (patch: Partial<ExperiencePageConfig>) => void;
  activeTab: PhoneTab;
  children: ReactNode;
}) {
  const heroH = page.heroBandHeight || 220;
  const contentOffset = page.contentOffsetY ?? 0;
  const resizeDrag = useRef<{ startY: number; startH: number } | null>(null);
  const offsetDrag = useRef<{ startY: number; startOffset: number } | null>(null);

  return (
    <PhoneChrome activeTab={activeTab}>
      <div className="relative">
        <FreeformContentStage page={page} onPatchPage={onPatchPage} height={heroH} />
        <div
          role="separator"
          aria-label="Drag to resize hero band"
          title="Drag to resize green hero band"
          className="absolute left-1 right-1 z-30 flex h-4 -translate-y-1/2 cursor-ns-resize items-center justify-center"
          style={{ top: heroH }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            resizeDrag.current = { startY: e.clientY, startH: heroH };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!resizeDrag.current) return;
            const next = Math.max(
              120,
              Math.min(420, resizeDrag.current.startH + (e.clientY - resizeDrag.current.startY)),
            );
            onPatchPage({ heroBandHeight: Math.round(next) });
          }}
          onPointerUp={(e) => {
            resizeDrag.current = null;
            try {
              e.currentTarget.releasePointerCapture(e.pointerId);
            } catch {
              /* ignore */
            }
          }}
        >
          <span className="h-1 w-12 rounded-full bg-[#8FE3B8]/80 shadow-[0_0_8px_rgba(var(--theme-accent-rgb),0.6)]" />
        </div>

        <div
          className="relative z-10 space-y-1.5 px-2 pb-2"
          style={{ marginTop: contentOffset }}
        >
          <div
            role="presentation"
            title="Drag to move tabs & list"
            className="mb-1 flex cursor-grab items-center justify-center gap-1 rounded-md border border-dashed border-white/20 bg-black/40 py-1 active:cursor-grabbing"
            onPointerDown={(e) => {
              e.preventDefault();
              offsetDrag.current = { startY: e.clientY, startOffset: contentOffset };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!offsetDrag.current) return;
              const next = Math.max(
                -160,
                Math.min(240, offsetDrag.current.startOffset + (e.clientY - offsetDrag.current.startY)),
              );
              onPatchPage({ contentOffsetY: Math.round(next) });
            }}
            onPointerUp={(e) => {
              offsetDrag.current = null;
              try {
                e.currentTarget.releasePointerCapture(e.pointerId);
              } catch {
                /* ignore */
              }
            }}
          >
            <span className="text-[8px] font-semibold uppercase tracking-wide text-white/45">
              Drag tabs · offset {contentOffset}px
            </span>
          </div>
          {children}
        </div>
      </div>
      <p className="px-2 pb-1 text-center text-[8px] text-white/30">
        Green handle = hero height · dashed bar = tabs position
      </p>
    </PhoneChrome>
  );
}

function matchGradientPresetId(page: ExperiencePageConfig): string | undefined {
  return GRADIENT_BACKGROUND_PRESETS.find(
    (preset) =>
      preset.useGradientBg === page.useGradientBg &&
      !page.backgroundImage &&
      preset.backgroundColor === page.backgroundColor &&
      preset.backgroundGradientFrom === page.backgroundGradientFrom &&
      preset.backgroundGradientTo === page.backgroundGradientTo,
  )?.id;
}

function StageItemControls({
  page,
  stageId,
  onPatchPage,
  onClearText,
}: {
  page: ExperiencePageConfig;
  stageId: (typeof CONTENT_STAGE_IDS)[number];
  onPatchPage: (patch: Partial<ExperiencePageConfig>) => void;
  onClearText?: () => void;
}) {
  const item = getStageItem(page, stageId);
  const patchItem = (patch: Partial<ExperienceStageItem>) => {
    onPatchPage({ stage: upsertStageItem(page, { id: stageId, ...patch }) });
  };

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8FE3B8]">
        {CONTENT_STAGE_LABELS[stageId]}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => patchItem({ glow: !item.glow })}
          className={`rounded-lg border px-2 py-1 text-[10px] ${
            item.glow ? "border-[#8FE3B8]/50 bg-[#8FE3B8]/15 text-[#8FE3B8]" : "border-white/15 text-white/60"
          }`}
        >
          Glow
        </button>
        <button type="button" onClick={() => patchItem({ z: Math.min(100, item.z + 1) })} className="rounded-lg border border-white/15 px-2 py-1 text-[10px] text-white/70">
          Forward
        </button>
        <button type="button" onClick={() => patchItem({ z: Math.max(0, item.z - 1) })} className="rounded-lg border border-white/15 px-2 py-1 text-[10px] text-white/70">
          Back
        </button>
        <button type="button" onClick={() => patchItem({ hidden: !item.hidden })} className="rounded-lg border border-white/15 px-2 py-1 text-[10px] text-white/70">
          {item.hidden ? "Show" : "Hide"}
        </button>
        {onClearText ? (
          <button type="button" onClick={onClearText} className="rounded-lg border border-red-500/30 px-2 py-1 text-[10px] text-red-200/90">
            Clear text
          </button>
        ) : null}
      </div>
      <label className="mt-2 block space-y-1">
        <span className="text-[10px] text-white/40">Width {item.w}%</span>
        <input
          type="range"
          min={12}
          max={92}
          value={item.w}
          onChange={(e) => patchItem({ w: Number(e.target.value) })}
          className="w-full"
        />
      </label>
      {stageId !== "titleArt" ? (
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <label className="block space-y-1">
            <span className="text-[10px] text-white/40">Fill from</span>
            <input value={item.fillFrom || ""} onChange={(e) => patchItem({ fillFrom: e.target.value })} className={`${fieldClass()} text-[10px]`} />
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] text-white/40">Fill to</span>
            <input value={item.fillTo || ""} onChange={(e) => patchItem({ fillTo: e.target.value })} className={`${fieldClass()} text-[10px]`} />
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] text-white/40">Border</span>
            <input value={item.borderColor || ""} onChange={(e) => patchItem({ borderColor: e.target.value })} className={`${fieldClass()} text-[10px]`} />
          </label>
        </div>
      ) : null}
      {item.glow ? (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="block space-y-1">
            <span className="text-[10px] text-white/40">Glow color</span>
            <input
              type="color"
              value={item.glowColor?.slice(0, 7) || "#8FE3B8"}
              onChange={(e) => patchItem({ glowColor: e.target.value })}
              className="h-9 w-full cursor-pointer rounded border border-white/15 bg-transparent"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] text-white/40">Intensity {item.glowIntensity}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={item.glowIntensity}
              onChange={(e) => patchItem({ glowIntensity: Number(e.target.value) })}
              className="w-full"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}

function PageChromeEditor({
  page,
  onPatchPage,
}: {
  page: ExperiencePageConfig;
  onPatchPage: (patch: Partial<ExperiencePageConfig>) => void;
}) {
  const presetId = matchGradientPresetId(page);

  function applyPreset(preset: GradientBackgroundPreset) {
    onPatchPage({
      useGradientBg: true,
      backgroundImage: "",
      backgroundColor: preset.backgroundColor,
      backgroundGradientFrom: preset.backgroundGradientFrom,
      backgroundGradientTo: preset.backgroundGradientTo,
    });
  }

  async function onHeroUpload(file: File | null) {
    if (!file) return;
    try {
      const heroImage = await compressImageFile(file);
      onPatchPage({ heroImage });
    } catch {
      /* ignore */
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
      <div className="border-b border-dt-border px-4 py-3">
        <h3 className="font-display text-sm font-semibold text-white">Page chrome</h3>
        <p className="mt-0.5 text-[11px] text-white/40">Gradient background, copy, and draggable hero art on the phone</p>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        <label className="block space-y-1 sm:col-span-2">
          <span className="text-[11px] text-white/45">Headline</span>
          <input value={page.headline} onChange={(e) => onPatchPage({ headline: e.target.value })} className={fieldClass()} placeholder="Empty hides on phone" />
        </label>
        <label className="block space-y-1 sm:col-span-2">
          <span className="text-[11px] text-white/45">Subhead</span>
          <input value={page.subhead} onChange={(e) => onPatchPage({ subhead: e.target.value })} className={fieldClass()} placeholder="Empty hides on phone" />
        </label>
        <label className="block space-y-1 sm:col-span-2">
          <span className="text-[11px] text-white/45">Body</span>
          <textarea
            value={page.body}
            onChange={(e) => onPatchPage({ body: e.target.value })}
            rows={3}
            className={fieldClass()}
            placeholder="Empty hides on phone"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] text-white/45">Accent</span>
          <PageColorInput value={page.accentColor} onChange={(accentColor) => onPatchPage({ accentColor })} />
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] text-white/45">Solid fallback</span>
          <PageColorInput value={page.backgroundColor} onChange={(backgroundColor) => onPatchPage({ backgroundColor })} />
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] text-white/45">Gradient from</span>
          <PageColorInput
            value={page.backgroundGradientFrom}
            onChange={(backgroundGradientFrom) => onPatchPage({ backgroundGradientFrom, useGradientBg: true, backgroundImage: "" })}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] text-white/45">Gradient to</span>
          <PageColorInput
            value={page.backgroundGradientTo}
            onChange={(backgroundGradientTo) => onPatchPage({ backgroundGradientTo, useGradientBg: true, backgroundImage: "" })}
          />
        </label>
        <div className="space-y-2 sm:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/55">Background preset</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {GRADIENT_BACKGROUND_PRESETS.map((preset) => {
              const active = presetId === preset.id;
              const swatch = preset.useGradientBg
                ? `linear-gradient(${preset.angle}deg, ${preset.backgroundGradientFrom}, ${preset.backgroundGradientVia}, ${preset.backgroundGradientTo})`
                : preset.backgroundColor;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`overflow-hidden rounded-xl border text-left transition ${
                    active ? "border-[#8FE3B8] ring-2 ring-[#8FE3B8]/40" : "border-dt-border hover:border-white/30"
                  }`}
                >
                  <div className="aspect-[4/3] w-full" style={{ background: swatch }} />
                  <p className="truncate px-2 py-1 text-[10px] text-white/75">{preset.label}</p>
                </button>
              );
            })}
          </div>
        </div>
        <div className="sm:col-span-2 rounded-xl border border-white/10 p-3">
          <p className="text-[11px] text-white/45">
            Hero art (PNG cutouts keep transparency — green band shows through)
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <div
              className="h-20 w-20 overflow-hidden rounded-lg"
              style={{
                backgroundImage:
                  "linear-gradient(45deg,#2a2a2a 25%,transparent 25%),linear-gradient(-45deg,#2a2a2a 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#2a2a2a 75%),linear-gradient(-45deg,transparent 75%,#2a2a2a 75%)",
                backgroundSize: "12px 12px",
                backgroundPosition: "0 0,0 6px,6px -6px,-6px 0",
                backgroundColor: "#1a1a1a",
              }}
            >
              {page.heroImage ? (
                <img src={resolveExperiencePreviewUrl(page.heroImage)} alt="" className="h-full w-full object-contain" />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] text-white/30">None</div>
              )}
            </div>
            <div className="min-w-[140px] flex-1 space-y-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs text-white/80">
                <Upload size={13} /> Upload hero art
                <input type="file" accept="image/png,image/webp,image/*" className="hidden" onChange={(e) => void onHeroUpload(e.target.files?.[0] ?? null)} />
              </label>
              {page.heroImage ? (
                <button type="button" onClick={() => onPatchPage({ heroImage: "" })} className="text-[10px] text-red-200/80 underline-offset-2 hover:underline">
                  Remove hero art
                </button>
              ) : null}
              <label className="block space-y-1">
                <span className="text-[10px] text-white/40">Hero scale {page.heroScale}%</span>
                <input
                  type="range"
                  min={40}
                  max={180}
                  value={page.heroScale}
                  onChange={(e) => {
                    const heroScale = Number(e.target.value);
                    onPatchPage({
                      heroScale,
                      stage: upsertStageItem(page, { id: "titleArt", scale: heroScale }),
                    });
                  }}
                  className="w-full"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[10px] text-white/40">Hero band height {page.heroBandHeight || 220}px</span>
                <input
                  type="range"
                  min={120}
                  max={420}
                  value={page.heroBandHeight || 220}
                  onChange={(e) => onPatchPage({ heroBandHeight: Number(e.target.value) })}
                  className="w-full"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[10px] text-white/40">Tabs / list offset {page.contentOffsetY ?? 0}px</span>
                <input
                  type="range"
                  min={-160}
                  max={240}
                  value={page.contentOffsetY ?? 0}
                  onChange={(e) => onPatchPage({ contentOffsetY: Number(e.target.value) })}
                  className="w-full"
                />
              </label>
            </div>
          </div>
          <StageItemControls page={page} stageId="titleArt" onPatchPage={onPatchPage} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <StageItemControls page={page} stageId="headline" onPatchPage={onPatchPage} onClearText={() => onPatchPage({ headline: "" })} />
          <StageItemControls page={page} stageId="subhead" onPatchPage={onPatchPage} onClearText={() => onPatchPage({ subhead: "" })} />
          <StageItemControls page={page} stageId="body" onPatchPage={onPatchPage} onClearText={() => onPatchPage({ body: "" })} />
        </div>
      </div>
    </section>
  );
}

function fieldClass() {
  return "w-full rounded-xl border border-dt-border bg-black/50 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-dt-red/55";
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read file"));
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

/** Shrink image uploads so Vercel/API body limits don't kill saves. Keeps PNG/WebP alpha. */
async function compressImageFile(file: File, maxEdge = 1280, quality = 0.72): Promise<string> {
  if (!file.type.startsWith("image/")) return readFileAsDataUrl(file);
  const dataUrl = await readFileAsDataUrl(file);
  const keepAlpha = file.type === "image/png" || file.type === "image/webp" || file.type === "image/gif";
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      try {
        if (keepAlpha) {
          resolve(canvas.toDataURL("image/png"));
        } else {
          resolve(canvas.toDataURL("image/jpeg", quality));
        }
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => reject(new Error("Could not process image"));
    img.src = dataUrl;
  });
}

function PageColorInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const picker = value?.startsWith("#") && value.length >= 7 ? value.slice(0, 7) : "#8FE3B8";
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={picker}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-12 cursor-pointer rounded border border-dt-border bg-transparent"
      />
      <input value={value} onChange={(e) => onChange(e.target.value)} className={`${fieldClass()} font-mono text-xs`} />
    </div>
  );
}

type StudioBaseProps = {
  onBack: () => void;
  page: ExperiencePageConfig;
  onPatchPage: (patch: Partial<ExperiencePageConfig>) => void;
};

function NewsPhonePreview({
  page,
  onPatchPage,
  items,
  selectedId,
}: {
  page: ExperiencePageConfig;
  onPatchPage: (patch: Partial<ExperiencePageConfig>) => void;
  items: NewsItem[];
  selectedId: string | null;
}) {
  const published = items.filter((i) => i.status === "published");
  const list = published.length ? published : items.slice(0, 6);
  return (
    <ContentPhonePreview page={page} onPatchPage={onPatchPage} activeTab="NEWS">
      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 px-3 py-8 text-center text-[11px] text-white/35">
          No newsletters yet
        </div>
      ) : (
        list.map((item) => (
          <div
            key={item.id}
            className={`flex gap-2 rounded-xl border p-2 ${
              item.id === selectedId ? "border-white/25 bg-white/[0.06]" : "border-white/10 bg-white/[0.03]"
            }`}
          >
              <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-black/50">
                {item.thumbnail ? (
                  <img src={resolveNewsAssetUrl(item.thumbnail)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[8px] text-white/25">Art</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold text-white">{item.title || "Untitled"}</p>
                <p className="mt-0.5 line-clamp-2 text-[9px] text-white/45">
                  {item.description || item.body || "No preview yet"}
                </p>
              </div>
            </div>
          ))
      )}
    </ContentPhonePreview>
  );
}

function NewsStudio({ onBack, page, onPatchPage }: StudioBaseProps) {
  const [feed, setFeed] = useState<NewsFeed | null>(null);
  const [draft, setDraft] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    void fetchNewsFeed()
      .then((next) => {
        setFeed(next);
        if (next.items[0]) setDraft({ ...next.items[0] });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load news"))
      .finally(() => setLoading(false));
  }, []);

  const items = feed?.items ?? [];

  const previewItems = useMemo(() => {
    const list = [...(feed?.items ?? [])];
    if (!draft) return list;
    const idx = list.findIndex((i) => i.id === draft.id);
    if (idx >= 0) list[idx] = draft;
    else list.unshift(draft);
    return list;
  }, [feed, draft]);

  function patchDraft(patch: Partial<NewsItem>) {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function startNew() {
    setDraft(createEmptyNewsItem("newsletters"));
    setStatus("New newsletter draft — write it, then Publish");
    setError(null);
  }

  async function saveDraft(nextStatus?: NewsStatus) {
    if (!draft) return;
    const title = draft.title.trim() || "Untitled newsletter";
    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      const payload: NewsItem = {
        ...draft,
        title,
        description: draft.description.trim(),
        body: draft.body.trim(),
        href: draft.href.trim(),
        thumbnail: draft.thumbnail || "",
        status: nextStatus ?? draft.status,
        publishedAt: nextStatus === "published" ? new Date().toISOString() : draft.publishedAt,
        date:
          nextStatus === "published"
            ? new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : draft.date,
      };
      const nextFeed = await upsertNewsItem(payload);
      setFeed(nextFeed);
      setDraft(payload);
      setStatus(payload.status === "published" ? "Published — live in the app News tab" : "Draft saved");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      setError(
        /413|too large|payload|entity too large/i.test(message)
          ? "Image is too large for upload. Try a smaller JPG/PNG (under ~2MB)."
          : message,
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeItem() {
    if (!draft) return;
    if (!window.confirm(`Delete “${draft.title || "this newsletter"}”?`)) return;
    setSaving(true);
    try {
      const nextFeed = await deleteNewsItem(draft.id);
      setFeed(nextFeed);
      setDraft(nextFeed.items[0] ? { ...nextFeed.items[0] } : null);
      setStatus("Deleted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  }

  async function onUpload(file: File | null) {
    if (!file || !draft) return;
    try {
      if (file.size > 8 * 1024 * 1024) {
        setError("Image is too large. Use a file under 8MB.");
        return;
      }
      patchDraft({ thumbnail: await compressImageFile(file) });
      setStatus("Thumbnail attached — hit Save draft or Publish");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-white/60">
        <Loader2 className="mr-2 animate-spin" size={18} /> Loading news…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StudioHeader onBack={onBack} label="News" />
      <Alerts error={error} status={status} />
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4 xl:order-1">
          <PageChromeEditor page={page} onPatchPage={onPatchPage} />
          <EditorPanel
          icon={<Newspaper size={15} className="text-dt-red" />}
          title="Newsletter editor"
          onNew={startNew}
          newLabel="New newsletter"
          items={items}
          selectedId={draft?.id ?? null}
          onSelect={(item) => {
            setDraft({ ...item });
            setStatus(null);
            setError(null);
          }}
          itemLabel={(item) => item.title || "Untitled"}
          itemMeta={(item) => item.status}
          emptyEditor={!draft ? <p className="text-sm text-white/45">Create a newsletter to get started.</p> : null}
        >
          {draft ? (
            <>
              <SaveRow saving={saving} onDraft={() => void saveDraft("draft")} onPublish={() => void saveDraft("published")} onDelete={() => void removeItem()} />
              <label className="block space-y-1">
                <span className="text-[11px] text-white/45">Title</span>
                <input value={draft.title} onChange={(e) => patchDraft({ title: e.target.value })} className={fieldClass()} />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] text-white/45">Status</span>
                <DtSelect
                  value={draft.status}
                  aria-label="Status"
                  onChange={(value) => patchDraft({ status: value as NewsStatus })}
                  options={[
                    { value: "draft", label: "Draft" },
                    { value: "published", label: "Published" },
                  ]}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] text-white/45">List preview</span>
                <textarea value={draft.description} onChange={(e) => patchDraft({ description: e.target.value })} rows={2} className={fieldClass()} />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] text-white/45">Newsletter body</span>
                <textarea value={draft.body} onChange={(e) => patchDraft({ body: e.target.value })} rows={10} className={`${fieldClass()} font-mono text-[13px] leading-relaxed`} />
              </label>
              <ThumbUpload
                src={draft.thumbnail ? resolveNewsAssetUrl(draft.thumbnail) : ""}
                onUpload={(f) => void onUpload(f)}
              />
            </>
          ) : null}
        </EditorPanel>
        </div>
        <NewsPhonePreview page={page} onPatchPage={onPatchPage} items={previewItems} selectedId={draft?.id ?? null} />
      </div>
    </div>
  );
}

type YouTubePreviewVideo = { id: string; title: string; viewCount?: number };

function VideosPhonePreview({
  page,
  onPatchPage,
  videoTab,
  youtubeVideos,
  exclusiveItems,
  selectedId,
}: {
  page: ExperiencePageConfig;
  onPatchPage: (patch: Partial<ExperiencePageConfig>) => void;
  videoTab: "youtube" | "exclusive";
  youtubeVideos: YouTubePreviewVideo[];
  exclusiveItems: ExclusiveVideoItem[];
  selectedId: string | null;
}) {
  const published = exclusiveItems.filter((i) => i.status === "published");
  const exclusiveList = published.length ? published : exclusiveItems.slice(0, 6);

  return (
    <ContentPhonePreview page={page} onPatchPage={onPatchPage} activeTab="VIDEOS">
      <div className="mb-2 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-black/40 p-1">
        <div
          className={`rounded-lg px-2 py-1.5 text-center text-[9px] font-bold tracking-wide ${
            videoTab === "youtube" ? "bg-dt-red text-white" : "text-white/40"
          }`}
        >
          YOUTUBE
        </div>
        <div
          className={`rounded-lg px-2 py-1.5 text-center text-[9px] font-bold tracking-wide ${
            videoTab === "exclusive" ? "bg-dt-red text-white" : "text-white/40"
          }`}
        >
          EXCLUSIVE
        </div>
      </div>
      {videoTab === "youtube" ? (
        youtubeVideos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 px-3 py-8 text-center text-[11px] text-white/35">
            No YouTube videos loaded — tap Sync
          </div>
        ) : (
          <div className="space-y-1.5">
            {youtubeVideos.slice(0, 8).map((video) => (
              <div key={video.id} className="flex gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2">
                <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-black/50">
                  <img src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[11px] font-semibold text-white">{video.title}</p>
                  <p className="mt-0.5 text-[9px] text-white/45">{formatViews(video.viewCount)}</p>
                </div>
              </div>
            ))}
          </div>
        )
      ) : exclusiveList.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 px-3 py-8 text-center text-[11px] text-white/35">
          No exclusive videos yet
        </div>
      ) : (
        <div className="space-y-1.5">
          {exclusiveList.map((item) => (
            <div
              key={item.id}
              className={`flex gap-2 rounded-xl border p-2 ${
                item.id === selectedId ? "border-white/25 bg-white/[0.06]" : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-black/50">
                {item.thumbnail ? (
                  <img src={resolveVideoAssetUrl(item.thumbnail)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[8px] text-white/25">Thumb</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold text-white">{item.title || "Untitled"}</p>
                <p className="mt-0.5 text-[9px] text-white/45">Exclusive · {item.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </ContentPhonePreview>
  );
}

function VideosStudio({ onBack, page, onPatchPage }: StudioBaseProps) {
  const [feed, setFeed] = useState<ExclusiveVideoFeed | null>(null);
  const [draft, setDraft] = useState<ExclusiveVideoItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [videoTab, setVideoTab] = useState<"youtube" | "exclusive">("exclusive");
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubePreviewVideo[]>([]);
  const [youtubeHandle, setYoutubeHandle] = useState("");
  const [youtubeSyncing, setYoutubeSyncing] = useState(false);

  useEffect(() => {
    void fetchVideoFeed()
      .then((next) => {
        setFeed(next);
        if (next.items[0]) setDraft({ ...next.items[0] });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load videos"))
      .finally(() => setLoading(false));
  }, []);

  const refreshYouTube = useCallback(async () => {
    setYoutubeSyncing(true);
    setError(null);
    try {
      const [feedResult, analytics] = await Promise.all([
        fetchYouTubeVideosFeed(48),
        fetchYouTubeAnalytics(),
      ]);
      if (feedResult?.videos?.length) {
        setYoutubeVideos(feedResult.videos);
        setYoutubeHandle(feedResult.channel.handle || "");
        setStatus(`YouTube synced · ${feedResult.videos.length} videos`);
      } else if (analytics?.recentVideos?.length) {
        setYoutubeVideos(analytics.recentVideos);
        setYoutubeHandle(analytics.channel.handle || "");
        setStatus(`YouTube synced · ${analytics.recentVideos.length} videos`);
      } else {
        setError("Could not load the YouTube feed for this channel");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "YouTube sync failed");
    } finally {
      setYoutubeSyncing(false);
    }
  }, []);

  useEffect(() => {
    void refreshYouTube();
  }, [refreshYouTube]);

  const items = useMemo(() => feed?.items ?? [], [feed]);

  const previewExclusive = useMemo(() => {
    const list = [...items];
    if (!draft) return list;
    const idx = list.findIndex((i) => i.id === draft.id);
    if (idx >= 0) list[idx] = draft;
    else list.unshift(draft);
    return list;
  }, [items, draft]);

  function patchDraft(patch: Partial<ExclusiveVideoItem>) {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function startNew() {
    setDraft(createEmptyVideoItem());
    setVideoTab("exclusive");
    setStatus("New exclusive video — add a URL or upload, then Publish");
    setError(null);
  }

  async function saveDraft(nextStatus?: VideoStatus) {
    if (!draft) return;
    if (!draft.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!draft.videoUrl.trim()) {
      setError("Add a video URL (YouTube/mp4) or upload a small clip");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: ExclusiveVideoItem = {
        ...draft,
        title: draft.title.trim(),
        description: draft.description.trim(),
        videoUrl: draft.videoUrl.trim(),
        thumbnail: draft.thumbnail.trim(),
        status: nextStatus ?? draft.status,
        publishedAt: nextStatus === "published" ? new Date().toISOString() : draft.publishedAt,
        date:
          nextStatus === "published"
            ? new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : draft.date,
      };
      const nextFeed = await upsertVideoItem(payload);
      setFeed(nextFeed);
      setDraft(payload);
      setStatus(payload.status === "published" ? "Published — live in the app Videos tab" : "Draft saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function removeItem() {
    if (!draft) return;
    if (!window.confirm(`Delete “${draft.title || "this video"}”?`)) return;
    setSaving(true);
    try {
      const nextFeed = await deleteVideoItem(draft.id);
      setFeed(nextFeed);
      setDraft(nextFeed.items[0] ? { ...nextFeed.items[0] } : null);
      setStatus("Deleted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  }

  async function onThumbUpload(file: File | null) {
    if (!file || !draft) return;
    try {
      patchDraft({ thumbnail: await compressImageFile(file) });
      setStatus("Thumbnail attached");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-white/60">
        <Loader2 className="mr-2 animate-spin" size={18} /> Loading videos…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StudioHeader onBack={onBack} label="Videos" />
      <Alerts error={error} status={status} />

      <div className="flex gap-2">
        {(["youtube", "exclusive"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setVideoTab(tab)}
            className={`rounded-lg px-4 py-2 text-xs font-bold tracking-wide ${
              videoTab === tab ? "bg-dt-red text-white" : "border border-white/15 text-white/60"
            }`}
          >
            {tab === "youtube" ? "YOUTUBE" : "EXCLUSIVE"}
          </button>
        ))}
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4 xl:order-1">
          <PageChromeEditor page={page} onPatchPage={onPatchPage} />
          {videoTab === "youtube" ? (
            <section className="rounded-2xl border border-dt-border bg-dt-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-white">YouTube channel</p>
                  <p className="text-xs text-white/45">{youtubeHandle}</p>
                </div>
                <button
                  type="button"
                  disabled={youtubeSyncing}
                  onClick={() => void refreshYouTube()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs text-white/80 disabled:opacity-50"
                >
                  {youtubeSyncing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                  Sync / Refresh
                </button>
              </div>
              <p className="mt-3 text-[11px] text-white/40">
                Fan app Videos tab shows this list on YouTube — exclusive uploads are edited under EXCLUSIVE.
              </p>
            </section>
          ) : (
            <EditorPanel
              icon={<Film size={15} className="text-dt-red" />}
              title="Exclusive video editor"
              onNew={startNew}
              newLabel="New video"
              items={items}
              selectedId={draft?.id ?? null}
              onSelect={(item) => {
                setDraft({ ...item });
                setStatus(null);
                setError(null);
              }}
              itemLabel={(item) => item.title || "Untitled"}
              itemMeta={(item) => item.status}
              emptyEditor={!draft ? <p className="text-sm text-white/45">Create a video to get started.</p> : null}
            >
              {draft ? (
                <>
                  <SaveRow saving={saving} onDraft={() => void saveDraft("draft")} onPublish={() => void saveDraft("published")} onDelete={() => void removeItem()} />
                  <label className="block space-y-1">
                    <span className="text-[11px] text-white/45">Title</span>
                    <input value={draft.title} onChange={(e) => patchDraft({ title: e.target.value })} className={fieldClass()} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[11px] text-white/45">Video URL</span>
                    <input
                      value={draft.videoUrl.startsWith("data:") ? "(uploaded video file)" : draft.videoUrl}
                      onChange={(e) => {
                        if (!e.target.value.startsWith("(")) patchDraft({ videoUrl: e.target.value });
                      }}
                      className={fieldClass()}
                      placeholder="https://youtube.com/watch?v=… or mp4 URL"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[11px] text-white/45">Description</span>
                    <textarea value={draft.description} onChange={(e) => patchDraft({ description: e.target.value })} rows={3} className={fieldClass()} />
                  </label>
                  <ThumbUpload
                    src={draft.thumbnail ? resolveVideoAssetUrl(draft.thumbnail) : ""}
                    onUpload={(f) => void onThumbUpload(f)}
                  />
                </>
              ) : null}
            </EditorPanel>
          )}
        </div>
        <VideosPhonePreview
          page={page}
          onPatchPage={onPatchPage}
          videoTab={videoTab}
          youtubeVideos={youtubeVideos}
          exclusiveItems={previewExclusive}
          selectedId={draft?.id ?? null}
        />
      </div>
    </div>
  );
}

function DocAndGloPhonePreview({
  page,
  onPatchPage,
  products,
  selectedId,
}: {
  page: ExperiencePageConfig;
  onPatchPage: (patch: Partial<ExperiencePageConfig>) => void;
  products: DocAndGloProduct[];
  selectedId: string | null;
}) {
  const visible = products.filter((p) => p.enabled && p.status === "published").slice(0, 8);
  const list = visible.length ? visible : products.filter((p) => p.enabled).slice(0, 8);

  return (
    <ContentPhonePreview page={page} onPatchPage={onPatchPage} activeTab="HOME">
      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 px-3 py-8 text-center text-[11px] text-white/35">
          No products yet
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          {list.map((item) => (
            <div
              key={item.id}
              className={`overflow-hidden rounded-lg border ${
                item.id === selectedId ? "border-white/25 bg-white/[0.06]" : "border-white/10 bg-white/[0.04]"
              }`}
            >
              <div className="aspect-square bg-black/40">
                {item.thumbnail ? (
                  <img src={resolveDocAndGloAssetUrl(item.thumbnail)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[8px] text-white/25">Product</div>
                )}
              </div>
              <div className="p-1.5">
                <p className="line-clamp-2 text-[9px] font-semibold text-white">{item.title || "Untitled"}</p>
                <p className="text-[8px] text-white/45">{formatDocAndGloPrice(item.price, item.currency)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </ContentPhonePreview>
  );
}

function DocAndGloStudio({ onBack, page, onPatchPage }: StudioBaseProps) {
  const [feed, setFeed] = useState<DocAndGloFeed | null>(null);
  const [draft, setDraft] = useState<DocAndGloProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    void fetchDocAndGloFeed()
      .then((next) => {
        setFeed(next);
        if (next.items[0]) setDraft({ ...next.items[0] });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load shop products"))
      .finally(() => setLoading(false));
  }, []);

  const items = feed?.items ?? [];

  const previewProducts = useMemo(() => {
    const list = [...(feed?.items ?? [])];
    if (!draft) return list;
    const idx = list.findIndex((i) => i.id === draft.id);
    if (idx >= 0) list[idx] = draft;
    else list.unshift(draft);
    return list;
  }, [feed, draft]);

  function patchDraft(patch: Partial<DocAndGloProduct>) {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function startNew() {
    setDraft(createEmptyDocAndGloProduct());
    setStatus("New product draft");
    setError(null);
  }

  async function syncFromShop() {
    setSyncing(true);
    setError(null);
    try {
      const result = await syncDocAndGloCatalog();
      setFeed(result.feed);
      setStatus(`Synced ${result.synced} products from the shop`);
      if (!draft && result.feed.items[0]) setDraft({ ...result.feed.items[0] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  async function saveDraft(nextStatus?: DocAndGloStatus) {
    if (!draft) return;
    if (!draft.title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: DocAndGloProduct = {
        ...draft,
        title: draft.title.trim(),
        subtitle: draft.subtitle.trim(),
        description: draft.description.trim(),
        price: draft.price.trim(),
        shopUrl: draft.shopUrl.trim(),
        status: nextStatus ?? draft.status,
        publishedAt: draft.publishedAt || new Date().toISOString(),
      };
      const nextFeed = await upsertDocAndGloProduct(payload);
      setFeed(nextFeed);
      setDraft(payload);
      setStatus(payload.status === "published" ? "Published to app feed" : "Draft saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function publishFeed() {
    if (!feed) return;
    setSaving(true);
    setError(null);
    try {
      const next = await publishDocAndGloFeed({
        ...feed,
        version: feed.version + 1,
        updatedAt: new Date().toISOString(),
      });
      setFeed(next);
      setStatus("Feed published live");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setSaving(false);
    }
  }

  async function onProductImage(file: File | null) {
    if (!file || !draft) return;
    try {
      patchDraft({ thumbnail: await compressImageFile(file) });
      setStatus("Product image attached");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-white/60">
        <Loader2 className="mr-2 animate-spin" size={18} /> Loading shop…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StudioHeader onBack={onBack} label="Shop" />
      <Alerts error={error} status={status} />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={syncing}
          onClick={() => void syncFromShop()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-dt-red px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          {syncing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          Sync products from the shop
        </button>
        <button
          type="button"
          disabled={saving || !feed}
          onClick={() => void publishFeed()}
          className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/80 disabled:opacity-50"
        >
          Publish feed
        </button>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4 xl:order-1">
          <PageChromeEditor page={page} onPatchPage={onPatchPage} />
          <EditorPanel
          icon={<ShoppingBag size={15} className="text-dt-red" />}
          title="Product editor"
          onNew={startNew}
          newLabel="New product"
          items={items}
          selectedId={draft?.id ?? null}
          onSelect={(item) => {
            setDraft({ ...item });
            setStatus(null);
            setError(null);
          }}
          itemLabel={(item) => item.title || "Untitled"}
          itemMeta={(item) => `${item.status}${item.featured ? " · featured" : ""}`}
          emptyEditor={!draft ? <p className="text-sm text-white/45">Select or create a product.</p> : null}
        >
          {draft ? (
            <>
              <SaveRow saving={saving} onDraft={() => void saveDraft("draft")} onPublish={() => void saveDraft("published")} />
              <label className="block space-y-1">
                <span className="text-[11px] text-white/45">Title</span>
                <input value={draft.title} onChange={(e) => patchDraft({ title: e.target.value })} className={fieldClass()} />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] text-white/45">Subtitle</span>
                <input value={draft.subtitle} onChange={(e) => patchDraft({ subtitle: e.target.value })} className={fieldClass()} />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] text-white/45">Description</span>
                <textarea value={draft.description} onChange={(e) => patchDraft({ description: e.target.value })} rows={3} className={fieldClass()} />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1">
                  <span className="text-[11px] text-white/45">Price</span>
                  <input value={draft.price} onChange={(e) => patchDraft({ price: e.target.value })} className={fieldClass()} placeholder="29.99" />
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] text-white/45">Status</span>
                  <DtSelect
                    value={draft.status}
                    aria-label="Status"
                    onChange={(value) => patchDraft({ status: value as DocAndGloStatus })}
                    options={[
                      { value: "draft", label: "Draft" },
                      { value: "published", label: "Published" },
                    ]}
                  />
                </label>
              </div>
              <label className="block space-y-1">
                <span className="text-[11px] text-white/45">Shop URL</span>
                <input value={draft.shopUrl} onChange={(e) => patchDraft({ shopUrl: e.target.value })} className={fieldClass()} />
              </label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-xs text-white/70">
                  <input type="checkbox" checked={draft.enabled} onChange={(e) => patchDraft({ enabled: e.target.checked })} className="accent-dt-red" />
                  Enabled in app
                </label>
                <label className="flex items-center gap-2 text-xs text-white/70">
                  <input type="checkbox" checked={draft.featured} onChange={(e) => patchDraft({ featured: e.target.checked })} className="accent-dt-red" />
                  Featured
                </label>
              </div>
              <ThumbUpload
                src={draft.thumbnail ? resolveDocAndGloAssetUrl(draft.thumbnail) : ""}
                onUpload={(f) => void onProductImage(f)}
                label="Product image"
              />
            </>
          ) : null}
        </EditorPanel>
        </div>
        <DocAndGloPhonePreview
          page={page}
          onPatchPage={onPatchPage}
          products={previewProducts}
          selectedId={draft?.id ?? null}
        />
      </div>
    </div>
  );
}

function StudioHeader({ onBack, label }: { onBack: () => void; label: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs text-white/80 hover:bg-white/[0.04]"
      >
        <ArrowLeft size={13} /> Back to Home boxes
      </button>
      <p className="text-sm text-white/55">
        Editing <span className="text-dt-red">{label}</span> — phone preview updates as you type
      </p>
    </div>
  );
}

function Alerts({ error, status }: { error: string | null; status: string | null }) {
  return (
    <>
      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
      ) : null}
      {status ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">{status}</div>
      ) : null}
    </>
  );
}

function SaveRow({
  saving,
  onDraft,
  onPublish,
  onDelete,
}: {
  saving: boolean;
  onDraft: () => void;
  onPublish: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={saving} onClick={onDraft} className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/80 disabled:opacity-50">
        Save draft
      </button>
      <button
        type="button"
        disabled={saving}
        onClick={onPublish}
        className="inline-flex items-center gap-1.5 rounded-lg bg-dt-red px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
      >
        {saving ? <Loader2 size={13} className="animate-spin" /> : null}
        Publish to app
      </button>
      {onDelete ? (
        <button
          type="button"
          disabled={saving}
          onClick={onDelete}
          className="ml-auto inline-flex items-center gap-1 rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-200"
        >
          <Trash2 size={13} /> Delete
        </button>
      ) : null}
    </div>
  );
}

function ThumbUpload({
  src,
  onUpload,
  label = "Thumbnail",
}: {
  src: string;
  onUpload: (file: File | null) => void;
  label?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 p-3">
      <p className="mb-2 text-[11px] text-white/45">{label}</p>
      <div className="mb-2 h-28 overflow-hidden rounded-lg bg-black/40">
        {src ? (
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-white/30">No image yet</div>
        )}
      </div>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs text-white/80">
        <Upload size={13} /> Upload image
        <input type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e.target.files?.[0] ?? null)} />
      </label>
    </div>
  );
}

function EditorPanel<T extends { id: string }>({
  icon,
  title,
  onNew,
  newLabel,
  items,
  selectedId,
  onSelect,
  itemLabel,
  itemMeta,
  emptyEditor,
  children,
}: {
  icon: ReactNode;
  title: string;
  onNew: () => void;
  newLabel: string;
  items: T[];
  selectedId: string | null;
  onSelect: (item: T) => void;
  itemLabel: (item: T) => string;
  itemMeta: (item: T) => string;
  emptyEditor: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
      <div className="flex items-center justify-between border-b border-dt-border px-4 py-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-display text-sm font-semibold text-white">{title}</h3>
        </div>
        <button type="button" onClick={onNew} className="inline-flex items-center gap-1 rounded-lg bg-dt-red px-3 py-1.5 text-xs font-semibold text-white">
          <Plus size={13} /> {newLabel}
        </button>
      </div>
      <div className="grid gap-0 lg:grid-cols-[220px_minmax(0,1fr)]">
        <ul className="max-h-[70vh] space-y-1 overflow-y-auto border-b border-dt-border p-3 lg:border-b-0 lg:border-r">
          {items.length === 0 ? (
            <li className="px-2 py-6 text-center text-xs text-white/40">Nothing yet</li>
          ) : (
            items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className={`w-full rounded-lg border px-2.5 py-2 text-left text-xs ${
                    selectedId === item.id
                      ? "border-dt-red/50 bg-dt-red/10 text-white"
                      : "border-transparent text-white/65 hover:bg-white/[0.04]"
                  }`}
                >
                  <p className="truncate font-medium">{itemLabel(item)}</p>
                  <p className="mt-0.5 text-[10px] text-white/35">{itemMeta(item)}</p>
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="space-y-3 p-4">{emptyEditor && !children ? emptyEditor : children}</div>
      </div>
    </section>
  );
}

export function ExperienceContentStudio({
  kind,
  onBack,
  page,
  onPatchPage,
}: {
  kind: ExperienceContentKind;
  onBack: () => void;
  page: ExperiencePageConfig;
  onPatchPage: (patch: Partial<ExperiencePageConfig>) => void;
}) {
  if (kind === "news") {
    return <NewsStudio onBack={onBack} page={page} onPatchPage={onPatchPage} />;
  }
  if (kind === "docAndGlo") {
    return <DocAndGloStudio onBack={onBack} page={page} onPatchPage={onPatchPage} />;
  }
  return <VideosStudio onBack={onBack} page={page} onPatchPage={onPatchPage} />;
}
