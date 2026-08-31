import { useCallback, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Camera,
  Check,
  Clock,
  Crown,
  Flame,
  Gift,
  Heart,
  Home,
  Lock,
  Menu,
  Music,
  Newspaper,
  Radio,
  User,
  ShoppingBag,
  Sparkle,
  Star,
  Ticket,
  Trophy,
  Users,
  Video,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type {
  ExperienceBrand,
  ExperienceBuiltinStageId,
  ExperienceConfig,
  ExperienceNav,
  ExperiencePageConfig,
  ExperienceStageItem,
  ExperienceStamp,
} from "../../lib/experienceConfig";
import {
  DEFAULT_LANDING_STAGE,
  createStampFromBrand,
  getStageItem,
  pageBackgroundCss,
  placeStampOnPage,
  removeStageItem,
  stageGlowStyle,
  stageItemCss,
  stageAlignClass,
  heroObjectPosition,
  heroTransform,
  stageItemRole,
  themeBackgroundCss,
  upsertStageItem,
} from "../../lib/experienceConfig";
import { resolveExperiencePreviewUrl } from "../../lib/resolveExperiencePreviewUrl";
import { resolveTitleFontFamily } from "../../lib/typography";
import { TintedBrandLogo } from "./TintedBrandLogo";
import { StyledTextRuns, WordStyleEditor, runsForPageField } from "./StyledText";
import { JoinAuthSheet, JoinedBadge } from "./JoinFlow";

export type PhonePreviewMode =
  | "brand"
  | "theme"
  | "effects"
  | "landing"
  | "youreIn"
  | "settings"
  | "homePage"
  | "boxes"
  | "page";

export type ExperiencePageKey = keyof ExperienceConfig["pages"];

const STAGE_LABELS: Record<ExperienceBuiltinStageId, string> = {
  logo: "Logo",
  wordmark: "Wordmark",
  tagline: "Tagline",
  hero: "Hero image",
  titleArt: "Title art",
  subhead: "Subhead",
  headline: "Headline",
  body: "Body",
  cta: "CTA button",
  featureRow: "Feature strip",
  memberProof: "Members row",
  navBar: "Top nav",
  signature: "Signature",
  cardGrid: "Feature cards",
  joinedBadge: "You're in badge",
};

const FEATURE_ICONS: Record<string, LucideIcon> = {
  star: Star,
  clock: Clock,
  gift: Gift,
  users: Users,
  ticket: Ticket,
  video: Video,
  music: Music,
  shop: ShoppingBag,
  bolt: Zap,
  heart: Heart,
  crown: Crown,
  flame: Flame,
  lock: Lock,
  calendar: CalendarDays,
  trophy: Trophy,
  camera: Camera,
  sparkle: Sparkle,
  check: Check,
  home: Home,
  news: Newspaper,
  user: User,
  live: Radio,
};

function FeatureIcon({ name, color }: { name: string; color: string }) {
  const Icon = FEATURE_ICONS[String(name || "").toLowerCase()] ?? Star;
  return <Icon size={16} strokeWidth={1.6} style={{ color }} />;
}


/**
 * Studio device shell: a realistic phone (bezel, island, status bar, home
 * indicator) with the editing panels docked in a clean card underneath.
 */
function PhoneFrame({
  screen,
  children,
  label,
  hint,
}: {
  screen: ReactNode;
  children?: ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <div className="sticky top-4 self-start space-y-3">
      <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/50 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[rgb(var(--theme-accent-rgb))] shadow-[0_0_8px_rgba(var(--theme-accent-rgb),0.9)]" />
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">{label}</p>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">
          Live
        </span>
      </div>

      <div className="mx-auto w-full max-w-[318px]">
        <div className="exp-phone-shell rounded-[2.75rem] border border-white/12 bg-gradient-to-b from-white/[0.16] via-white/[0.04] to-white/[0.02] p-[9px]">
          <div className="relative overflow-hidden rounded-[2.2rem] bg-black">
            {/* status bar */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-[180] flex h-9 items-center justify-between px-5 pt-1.5 text-[9px] font-semibold text-white/85">
              <span>9:41</span>
              <span className="flex items-center gap-1">
                <span className="flex items-end gap-[2px]">
                  <span className="h-1 w-[2px] rounded-sm bg-white/70" />
                  <span className="h-1.5 w-[2px] rounded-sm bg-white/70" />
                  <span className="h-2 w-[2px] rounded-sm bg-white/70" />
                  <span className="h-2.5 w-[2px] rounded-sm bg-white/40" />
                </span>
                <span className="ml-0.5 h-2.5 w-5 rounded-[3px] border border-white/50 p-[1.5px]">
                  <span className="block h-full w-3/4 rounded-[1px] bg-white/75" />
                </span>
              </span>
            </div>
            <span className="pointer-events-none absolute left-1/2 top-2 z-[190] h-5 w-[86px] -translate-x-1/2 rounded-full bg-black ring-1 ring-white/10" />
            <div className="relative">{screen}</div>
            <span className="pointer-events-none absolute bottom-1.5 left-1/2 z-[190] h-1 w-24 -translate-x-1/2 rounded-full bg-white/30" />
            <span className="pointer-events-none absolute inset-0 z-[195] rounded-[2.2rem] ring-1 ring-inset ring-white/10" />
          </div>
        </div>
      </div>

      {hint ? (
        <p className="text-center text-[10px] leading-relaxed text-white/35">{hint}</p>
      ) : null}

      {children ? (
        <div className="divide-y divide-white/[0.07] overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0b]">
          {children}
        </div>
      ) : null}
    </div>
  );
}


function BrandMark({ experience }: { experience: ExperienceConfig }) {
  const { brand } = experience;
  return (
    <div className="flex items-center gap-2">
      {brand.showLogoImage && brand.logoSrc ? (
        <TintedBrandLogo
          src={resolveExperiencePreviewUrl(brand.logoSrc)}
          color={brand.logoColor}
          tint={brand.logoTint !== false}
          size={32}
        />
      ) : null}
      <div className="min-w-0">
        <p className="truncate text-[11px] font-bold tracking-[0.16em]" style={{ color: brand.wordmarkColor }}>
          {brand.wordmark || "YOUR BRAND"}
        </p>
        {brand.tagline ? (
          <p className="truncate text-[9px]" style={{ color: brand.taglineColor }}>
            {brand.tagline}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function DraggableStageItem({
  item,
  selected,
  onSelect,
  onMove,
  onResize,
  onDelete,
  children,
}: {
  item: ExperienceStageItem;
  selected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onResize?: (w: number, scale: number) => void;
  onDelete?: () => void;
  children: ReactNode;
}) {
  const drag = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [centerGuide, setCenterGuide] = useState(false);
  const resize = useRef<{ startX: number; startY: number; origW: number; origScale: number } | null>(null);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();
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
    let x = Math.max(0, Math.min(90, drag.current.origX + dx));
    let y = Math.max(0, Math.min(92, drag.current.origY + dy));
    // snap-to-grid (2%) plus horizontal-center alignment snap
    const snap = (value: number) => Math.round(value / 2) * 2;
    x = snap(x);
    y = snap(y);
    const width = item.w || 80;
    const centered = Math.abs(x + width / 2 - 50) <= 2.5;
    if (centered) x = 50 - width / 2;
    setCenterGuide(centered);
    onMove(x, y);
  };


  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    drag.current = null;
    setCenterGuide(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onHandleDown = (e: ReactPointerEvent<HTMLSpanElement>) => {
    e.preventDefault();
    e.stopPropagation();
    resize.current = {
      startX: e.clientX,
      startY: e.clientY,
      origW: item.w || 80,
      origScale: item.scale ?? 100,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onHandleMove = (e: ReactPointerEvent<HTMLSpanElement>) => {
    if (!resize.current || !onResize) return;
    const stage = e.currentTarget.parentElement?.parentElement;
    const rect = stage?.getBoundingClientRect();
    if (!rect) return;
    const dx = ((e.clientX - resize.current.startX) / rect.width) * 100;
    const dy = ((e.clientY - resize.current.startY) / rect.height) * 100;
    const w = Math.max(8, Math.min(100, resize.current.origW + dx));
    const scale = Math.max(40, Math.min(220, resize.current.origScale + dy * 1.6));
    onResize(Math.round(w), Math.round(scale));
  };

  const onHandleUp = (e: ReactPointerEvent<HTMLSpanElement>) => {
    resize.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if ((e.key === "Delete" || e.key === "Backspace") && onDelete) {
          e.preventDefault();
          onDelete();
        }
      }}
      className={`cursor-grab touch-none active:cursor-grabbing ${
        selected
          ? "outline outline-1 outline-dashed outline-white/55 outline-offset-2"
          : "hover:outline hover:outline-1 hover:outline-dashed hover:outline-white/25"
      }`}
      style={stageItemCss(item) as CSSProperties}
    >
      {children}
      {centerGuide ? (
        <span className="pointer-events-none absolute left-1/2 top-[-1000px] z-[190] h-[2000px] w-px bg-cyan-300/70" />
      ) : null}
      {selected ? (
        <>
          {onDelete ? (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Delete this item"
              title="Delete"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
              }}
              className="absolute -right-2 -top-2 z-[200] flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border border-white/40 bg-black text-[9px] leading-none text-red-300"
            >
              ×
            </span>
          ) : null}
          {onResize ? (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Resize this item"
              title="Drag to resize"
              onPointerDown={onHandleDown}
              onPointerMove={onHandleMove}
              onPointerUp={onHandleUp}
              onPointerCancel={onHandleUp}
              className="absolute -bottom-2 -right-2 z-[200] h-4 w-4 cursor-nwse-resize touch-none rounded-sm border border-white/50 bg-white/80"
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}


function StampTray({
  experience,
  onSaveLogo,
  onPlaceStamp,
  onRemoveStamp,
}: {
  experience: ExperienceConfig;
  onSaveLogo?: () => void;
  onPlaceStamp?: (stampId: string) => void;
  onRemoveStamp?: (stampId: string) => void;
}) {
  const stamps = experience.stamps || [];
  return (
    <div className="space-y-2 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-dt-red">Logo stamps</p>
        {onSaveLogo ? (
          <button
            type="button"
            onClick={onSaveLogo}
            disabled={!experience.brand.logoSrc}
            className="rounded-lg border border-dt-red/50 bg-dt-red/15 px-2 py-1 text-[10px] font-semibold text-dt-red disabled:opacity-40"
          >
            Save current logo
          </button>
        ) : null}
      </div>
      <p className="text-[9px] text-white/40">Click a stamp to drop it on this page — works from any section.</p>
      {stamps.length === 0 ? (
        <p className="text-[10px] text-white/35">No saved logos yet. Save the brand logo to reuse it anywhere.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {stamps.map((stamp) => (
            <div key={stamp.id} className="relative">
              <button
                type="button"
                title={`Place ${stamp.label}`}
                onClick={() => onPlaceStamp?.(stamp.id)}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/50 hover:border-dt-red/60"
              >
                <TintedBrandLogo
                  src={resolveExperiencePreviewUrl(stamp.src)}
                  color={experience.brand.logoColor}
                  tint={experience.brand.logoTint !== false}
                  size={36}
                />
              </button>
              {onRemoveStamp ? (
                <button
                  type="button"
                  aria-label={`Remove ${stamp.label}`}
                  onClick={() => onRemoveStamp(stamp.id)}
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[9px] text-white/70 ring-1 ring-white/20"
                >
                  ×
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Fan-app bottom tab bar, as configured in the studio. */
export function NavTabBarPreview({
  nav,
  activePageKey,
}: {
  nav: ExperienceNav;
  activePageKey?: string;
}) {
  const tabs = (nav?.tabs ?? []).filter((tab) => !tab.hidden);
  if (!tabs.length) return null;
  return (
    <div
      className="absolute inset-x-0 bottom-0 z-[140] flex items-stretch justify-around border-t px-1 py-1.5"
      style={{
        background: nav.bg,
        borderColor: nav.borderColor,
        borderTopLeftRadius: nav.radius,
        borderTopRightRadius: nav.radius,
      }}
    >
      {tabs.map((tab) => {
        const active = tab.pageKey === activePageKey;
        const color = active ? nav.activeColor : nav.inactiveColor;
        return (
          <div key={tab.id} className="flex flex-1 flex-col items-center gap-0.5">
            <FeatureIcon name={tab.icon} color={color} />
            {nav.showLabels ? (
              <span
                className="text-[7px] font-semibold uppercase tracking-[0.12em]"
                style={{ color }}
              >
                {tab.label}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function PageFreeformPreview({
  experience,
  page,
  pageKey,
  label,
  onPatchPage,
  onPatchBrand,
  onSaveLogo,
  onPlaceStamp,
  onRemoveStamp,
}: {
  experience: ExperienceConfig;
  page: ExperiencePageConfig;
  pageKey: ExperiencePageKey;
  label: string;
  onPatchPage?: (patch: Partial<ExperiencePageConfig>) => void;
  onPatchBrand?: (patch: Partial<ExperienceBrand>) => void;
  onSaveLogo?: () => void;
  onPlaceStamp?: (stampId: string) => void;
  onRemoveStamp?: (stampId: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [wordChip, setWordChip] = useState(0);
  const [showUnlock, setShowUnlock] = useState(false);
  const [joined, setJoined] = useState(false);
  const selected = selectedId ? getStageItem(page, selectedId) : null;
  const scale = (page.heroScale || 100) / 100;
  const brand = experience.brand;
  const stageIds = (page.stage?.length ? page.stage : DEFAULT_LANDING_STAGE).map((item) => item.id);
  const showLandingChrome = pageKey === "landing";

  const selectStageItem = useCallback((id: string) => {
    setSelectedId((prev) => {
      if (prev !== id) setWordChip(0);
      return id;
    });
  }, []);

  const patchItem = useCallback(
    (id: string, patch: Partial<ExperienceStageItem>) => {
      if (!onPatchPage) return;
      onPatchPage({
        layoutMode: "freeform",
        stage: upsertStageItem(page, { id, ...patch }),
      });
    },
    [onPatchPage, page],
  );

  const selectedLabel = (() => {
    if (!selected) return "Tap something on the phone to edit";
    const role = stageItemRole(selected);
    if (role === "stamp") {
      const stamp = (experience.stamps || []).find((s) => s.id === selected.stampId);
      return stamp?.label ? `Stamp · ${stamp.label}` : "Stamp";
    }
    return STAGE_LABELS[role];
  })();

  const hiddenItems = (page.stage || []).filter((item) => item.hidden);

  const deleteItem = useCallback(
    (id: string) => {
      if (!onPatchPage) return;
      const item = getStageItem(page, id);
      onPatchPage({
        layoutMode: "freeform",
        stage:
          stageItemRole(item) === "stamp"
            ? removeStageItem(page, id)
            : upsertStageItem(page, { id, hidden: true }),
      });
      setSelectedId(null);
    },
    [onPatchPage, page],
  );

  const renderItem = (id: string) => {
    const item = getStageItem(page, id);
    if (item.hidden) return null;
    const role = stageItemRole(item);
    let body: ReactNode = null;


    if (role === "logo") {
      if (!brand.showLogoImage || !brand.logoSrc) {
        body = (
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-white/30 text-[8px] text-white/35">
            Logo
          </div>
        );
      } else {
        body = (
          <div style={stageGlowStyle(item, "box")}>
            <TintedBrandLogo
              src={resolveExperiencePreviewUrl(brand.logoSrc)}
              color={brand.logoColor}
              tint={brand.logoTint !== false}
              size={40}
            />
          </div>
        );
      }
    } else if (role === "wordmark") {
      body = (
        <p
          className="font-bold leading-tight tracking-[0.16em] text-[12px]"
          style={{ color: brand.wordmarkColor, ...stageGlowStyle(item, "text") }}
        >
          {brand.wordmark || "YOUR BRAND"}
        </p>
      );
    } else if (role === "tagline") {
      body = (
        <p className="leading-tight text-[9px]" style={{ color: brand.taglineColor, ...stageGlowStyle(item, "text") }}>
          {brand.tagline || "Tagline"}
        </p>
      );
    } else if (role === "hero") {
      const heroFull = (item.h ?? 0) > 0;
      const heroImg = page.heroImage ? (
        <img
          src={resolveExperiencePreviewUrl(page.heroImage)}
          alt=""
          className={heroFull ? "absolute inset-0 h-full w-full" : "w-full rounded-xl"}
          draggable={false}
          style={{
            objectFit: heroFull ? "cover" : page.heroFit || "contain",
            objectPosition: heroObjectPosition(page),
            transform: heroTransform(page, scale),
            transformOrigin: "top center",
            ...stageGlowStyle(item, "image"),
          }}
        />
      ) : null;
      body = page.heroImage ? (
        heroFull ? (
          <div className="relative h-full w-full overflow-hidden">
            {heroImg}

            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `linear-gradient(180deg, transparent 0%, transparent 52%, ${
                  page.heroOverlayTo || page.backgroundColor || "rgba(0,0,0,0.92)"
                } 82%, ${page.backgroundColor || page.heroOverlayTo || "#000"} 100%)`,
                opacity: (page.heroOverlayOpacity ?? 100) / 100,
              }}
            />
          </div>
        ) : (
          heroImg
        )
      ) : (
        <div className="flex h-28 items-end justify-end rounded-xl border border-dashed border-white/25 bg-black/30 p-2">
          <span className="text-[9px] text-white/35">Hero placement</span>
        </div>
      );
    } else if (role === "titleArt") {
      if (!page.titleImage) return null;
      body = (
        <img
          src={resolveExperiencePreviewUrl(page.titleImage)}
          alt=""
          className="w-full object-contain"
          draggable={false}
          style={stageGlowStyle(item, "image")}
        />
      );
    } else if (role === "subhead") {
      body = (
        <StyledTextRuns
          runs={runsForPageField(page, "subhead")}
          fallbackColor={page.accentColor}
          className={`${stageAlignClass(item)} text-[10px] font-semibold uppercase leading-relaxed tracking-[0.12em]`}
          style={stageGlowStyle(item, "text")}
          interactive
          activeIndex={selectedId === id ? wordChip : undefined}
          onWordClick={(chip) => {
            selectStageItem(id);
            setWordChip(chip);
          }}
        />
      );
    } else if (role === "headline") {
      const gradient =
        page.headlineGradientFrom && page.headlineGradientTo
          ? `linear-gradient(90deg, ${page.headlineGradientFrom}, ${page.headlineGradientTo})`
          : "";
      body = gradient ? (
        <p
          className={`${stageAlignClass(item)} font-display text-xl font-extrabold leading-[1.05] tracking-[-0.01em]`}
          style={{
            backgroundImage: gradient,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
          }}
        >
          {page.headline}
        </p>
      ) : (
        <StyledTextRuns
          as="p"
          runs={runsForPageField(page, "headline")}
          fallbackColor="#FFFFFF"
          className={`${stageAlignClass(item)} font-display text-xl leading-[1.05] tracking-[-0.01em] text-white`}
          style={stageGlowStyle(item, "text")}
          interactive
          activeIndex={selectedId === id ? wordChip : undefined}
          onWordClick={(chip) => {
            selectStageItem(id);
            setWordChip(chip);
          }}
        />
      );

    } else if (role === "body") {
      body = (
        <StyledTextRuns
          runs={runsForPageField(page, "body")}
          fallbackColor="rgba(255,255,255,0.65)"
          className={`${stageAlignClass(item)} text-[11px] leading-relaxed text-white/65`}
          style={stageGlowStyle(item, "text")}
          interactive
          activeIndex={selectedId === id ? wordChip : undefined}
          onWordClick={(chip) => {
            selectStageItem(id);
            setWordChip(chip);
          }}
        />
      );
    } else if (role === "featureRow") {
      if (!(page.features || []).length) return null;
      const cols = page.featureColumns ?? 2;
      const oneRow = cols >= 4;
      body = oneRow ? (
        <div
          className="grid w-full grid-cols-4"
          style={{
            background: page.featureBg,
            border: `1px solid ${page.featureBorderColor}`,
            borderRadius: page.featureRadius,
            ...stageGlowStyle(item, "box"),
          }}
        >
          {(page.features || []).map((feat, i) => (
            <div
              key={feat.id}
              className="flex flex-col items-center gap-1.5 px-1.5 py-2.5 text-center"
              style={i ? { borderLeft: `1px solid ${page.featureBorderColor}` } : undefined}
            >
              <FeatureIcon name={feat.icon} color={page.featureIconColor} />
              <span
                className="text-[8px] font-semibold uppercase leading-[1.25] tracking-[0.04em]"
                style={{ color: page.featureTextColor }}
              >
                {feat.label}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid w-full gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, ...stageGlowStyle(item, "box") }}>
          {(page.features || []).map((feat) => (
            <div
              key={feat.id}
              className="flex flex-col gap-1.5 px-2.5 py-2"
              style={{
                background: page.featureBg,
                border: `1px solid ${page.featureBorderColor}`,
                borderRadius: page.featureRadius,
              }}
            >
              <FeatureIcon name={feat.icon} color={page.featureIconColor} />
              <span className="text-[9px] font-semibold leading-tight" style={{ color: page.featureTextColor }}>
                {feat.label}
              </span>
            </div>
          ))}
        </div>
      );
    } else if (role === "memberProof") {
      const proof = page.memberProof;
      if (!proof?.count && !(proof?.avatars || []).length) return null;
      body = (
        <div
          className="flex w-full items-center gap-2 px-3 py-2"
          style={{
            background: proof.bg,
            border: `1px solid ${proof.borderColor}`,
            borderRadius: proof.radius,
            ...stageGlowStyle(item, "box"),
          }}
        >
          <div className="flex -space-x-2">
            {(proof.avatars || []).slice(0, 4).map((src, i) => (
              <img
                key={`${src}-${i}`}
                src={src}
                alt=""
                className="h-5 w-5 rounded-full border border-white/25 object-cover"
              />
            ))}
            {proof.extraLabel ? (
              <span className="flex h-5 items-center justify-center rounded-full border border-white/25 bg-black/60 px-1.5 text-[8px] font-bold text-white">
                {proof.extraLabel}
              </span>
            ) : null}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] font-bold" style={{ color: proof.countColor }}>
              {proof.count}
            </span>
            <span className="text-[8px]" style={{ color: proof.labelColor }}>
              {proof.label}
            </span>
          </div>
          <div className="ml-auto flex gap-1">
            {(proof.thumbs || []).slice(0, 3).map((src, i) => (
              <img key={`${src}-${i}`} src={src} alt="" className="h-6 w-5 rounded-[4px] object-cover" />
            ))}
          </div>
        </div>
      );
    } else if (role === "navBar") {
      const hasNav =
        Boolean(page.navLabel) ||
        (page.showNavBadge !== false && Boolean(page.navBadgeLabel)) ||
        page.showNavBell !== false ||
        page.showNavAvatar !== false;
      if (!hasNav) return null;
      body = (
        <div className="flex w-full items-center gap-2" style={stageGlowStyle(item, "box")}>
          {page.navLabel ? (
            <span
              className="text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{ color: page.navTextColor || "#FFFFFF" }}
            >
              {page.navLabel}
            </span>
          ) : null}
          {page.showNavBadge !== false && page.navBadgeLabel ? (
            <span
              className="px-2 py-[3px] text-[8px] font-bold uppercase tracking-[0.12em]"
              style={{
                color: page.navBadgeColor,
                border: `1px solid ${page.navBadgeBorderColor || "rgba(255,255,255,0.25)"}`,
                borderRadius: page.navBadgeRadius ?? 999,
                background: "rgba(0,0,0,0.35)",
              }}
            >
              {page.navBadgeLabel}
            </span>
          ) : null}
          <div className="ml-auto flex items-center gap-2">
            {page.showNavBell !== false ? (
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full border"
                style={{ borderColor: "rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.35)" }}
              >
                <Bell size={11} strokeWidth={2} style={{ color: page.navTextColor || "#FFFFFF" }} />
              </span>
            ) : null}
            {page.showNavAvatar !== false ? (
              page.navAvatarSrc ? (
                <img
                  src={resolveExperiencePreviewUrl(page.navAvatarSrc)}
                  alt=""
                  draggable={false}
                  className="h-6 w-6 rounded-full border border-white/25 object-cover"
                />
              ) : (
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full border"
                  style={{ borderColor: "rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.45)" }}
                >
                  <User size={11} strokeWidth={2} style={{ color: page.navTextColor || "#FFFFFF" }} />
                </span>
              )
            ) : null}
          </div>
        </div>
      );
    } else if (role === "signature") {
      if (!page.signatureImage && !page.signatureText) return null;
      body = page.signatureImage ? (
        <img
          src={resolveExperiencePreviewUrl(page.signatureImage)}
          alt=""
          draggable={false}
          className="w-full object-contain"
          style={stageGlowStyle(item, "image")}
        />
      ) : (
        <p
          className="whitespace-nowrap text-[20px] italic leading-none"
          style={{
            color: page.signatureColor || "#FFFFFF",
            fontFamily: resolveTitleFontFamily(page.signatureFont),
            ...stageGlowStyle(item, "text"),
          }}
        >
          {page.signatureText}
        </p>
      );
    } else if (role === "cardGrid") {
      const cards = page.cards || [];
      if (!cards.length) return null;
      body = (
        <div
          className="grid w-full gap-2"
          style={{ gridTemplateColumns: `repeat(${page.cardColumns || 2}, minmax(0, 1fr))`, ...stageGlowStyle(item, "box") }}
        >
          {cards.map((card) => (
            <div
              key={card.id}
              className="relative flex min-h-[62px] flex-col justify-end overflow-hidden p-2"
              style={{
                background: page.cardBg,
                border: `1px solid ${page.cardBorderColor}`,
                borderRadius: page.cardRadius,
              }}
            >
              {card.image ? (
                <>
                  <img
                    src={resolveExperiencePreviewUrl(card.image)}
                    alt=""
                    draggable={false}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <span
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.82))" }}
                  />
                </>
              ) : null}
              <span className="relative flex items-center justify-between">
                <FeatureIcon name={card.icon} color={page.cardIconColor} />
                <span
                  className="flex h-4 w-4 items-center justify-center rounded-full"
                  style={{ background: "rgba(255,255,255,0.14)" }}
                >
                  <ArrowRight size={9} strokeWidth={2.4} style={{ color: page.cardTitleColor }} />
                </span>
              </span>
              <span
                className="relative mt-1.5 text-[10px] font-bold leading-tight"
                style={{ color: page.cardTitleColor }}
              >
                {card.title}
              </span>
              {card.subtitle ? (
                <span className="relative text-[8px] leading-tight" style={{ color: page.cardTextColor }}>
                  {card.subtitle}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      );
    } else if (role === "joinedBadge") {
      body = (
        <div className="flex w-full justify-center" style={stageGlowStyle(item, "box")}>
          <JoinedBadge accent={page.accentColor || "#8FE3B8"} />
        </div>
      );
    } else if (role === "cta") {
      const ctaGradient =
        page.ctaGradientFrom && page.ctaGradientTo
          ? `linear-gradient(${page.ctaGradientAngle ?? 90}deg, ${page.ctaGradientFrom}, ${page.ctaGradientTo})`
          : "";
      body = (
        <div className="flex w-full flex-col gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowUnlock(true);
              setJoined(false);
            }}
            className="relative flex w-full items-center justify-center gap-2 overflow-hidden py-3 text-[13px] font-extrabold uppercase tracking-[0.14em]"
            style={{
              background: ctaGradient || page.ctaBg,
              color: page.ctaText,
              borderRadius: page.ctaRadius ?? experience.theme.buttonRadius,
              boxShadow: `0 12px 30px -12px ${page.ctaGradientTo || page.ctaBg}, inset 0 1px 0 rgba(255,255,255,0.28)`,
              ...stageGlowStyle(item, "box"),
            }}
          >
            <span
              className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
              style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.18), transparent)" }}
            />
            <span className="relative">{page.ctaLabel || "Join My Circle"}</span>
            {page.ctaShowArrow ? <ArrowRight className="relative" size={14} strokeWidth={3} /> : null}
          </button>


          {(page.extraButtons || []).map((btn) => (
            <button
              key={btn.id}
              type="button"
              className={`py-2 text-xs font-semibold ${btn.fullWidth === false ? "self-center px-5" : "w-full"}`}
              style={{
                background:
                  btn.style === "solid" ? btn.bg : btn.style === "ghost" ? "transparent" : "rgba(255,255,255,0.04)",
                color: btn.style === "solid" ? btn.text : btn.bg,
                border: btn.style === "solid" ? "none" : `1px solid ${btn.borderColor || btn.bg}`,
                borderRadius: btn.radius ?? experience.theme.buttonRadius,
                boxShadow: btn.glow ? `0 0 18px ${btn.glowColor || btn.bg}66` : "none",
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      );
    } else if (role === "stamp") {
      const stamp = (experience.stamps || []).find((s) => s.id === item.stampId);
      if (!stamp?.src) return null;
      body = (
        <div style={stageGlowStyle(item, "box")}>
          <TintedBrandLogo
            src={resolveExperiencePreviewUrl(stamp.src)}
            color={brand.logoColor}
            tint={brand.logoTint !== false}
            size={44}
          />
        </div>
      );
    }

    return (
      <DraggableStageItem
        key={id}
        item={item}
        selected={selectedId === id}
        onSelect={() => selectStageItem(id)}
        onMove={(x, y) => patchItem(id, { x, y })}
        onResize={onPatchPage ? (w, scale) => patchItem(id, { w, scale }) : undefined}
        onDelete={onPatchPage ? () => deleteItem(id) : undefined}
      >
        {body}
      </DraggableStageItem>
    );
  };


  return (
    <PhoneFrame
      label={label}
      hint="Drag to move · corner handle to resize · × to delete"
      screen={
      <div
        className="relative h-[560px] w-full"
        style={{ background: pageBackgroundCss(page) || themeBackgroundCss(experience.theme) }}
        onClick={() => setSelectedId(null)}
      >
        {(page.heroOverlayOpacity ?? 0) > 0 && page.backgroundImage ? (
          <div
            className="pointer-events-none absolute inset-0 z-[1]"
            style={{
              background: `linear-gradient(180deg, ${page.heroOverlayFrom || "rgba(0,0,0,0.15)"}, ${
                page.heroOverlayTo || "rgba(0,0,0,0.85)"
              })`,
              opacity: (page.heroOverlayOpacity ?? 100) / 100,
            }}
          />
        ) : null}
        {stageIds.map(renderItem)}
        {page.showMenuButton ? (
          <div
            className="absolute right-3 top-3 z-[130] flex h-7 w-7 items-center justify-center rounded-full border"
            style={{ borderColor: `${page.menuButtonColor}55`, color: page.menuButtonColor, background: "rgba(0,0,0,0.35)" }}
          >
            <Menu size={13} strokeWidth={2} />
          </div>
        ) : null}

        {showUnlock && !joined ? (
          <JoinAuthSheet
            page={page}
            compact
            onSelect={() => setJoined(true)}
            onClose={() => setShowUnlock(false)}
          />
        ) : null}
        {joined ? (
          <div className="absolute inset-0 z-[180] flex flex-col items-center justify-center gap-3 bg-black/80 px-6 text-center backdrop-blur-[3px]">
            <JoinedBadge accent={page.accentColor || "#8FE3B8"} />
            <p className="font-display text-lg font-extrabold uppercase tracking-[0.16em] text-white">
              You&apos;re in
            </p>
            <p className="max-w-[14rem] text-[10px] leading-relaxed text-white/65">
              This is the flow fans see — sign in, then the You&apos;re In page opens.
            </p>
            <button
              type="button"
              onClick={() => {
                setJoined(false);
                setShowUnlock(false);
              }}
              className="rounded-full border px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em]"
              style={{ borderColor: `${page.accentColor || "#8FE3B8"}66`, color: page.accentColor || "#8FE3B8" }}
            >
              Restart flow
            </button>
          </div>
        ) : null}
        {!experience.nav?.hidden && pageKey !== "landing" && pageKey !== "youreIn" ? (
          <NavTabBarPreview nav={experience.nav} activePageKey={pageKey} />
        ) : null}
      </div>
      }
    >
      {showLandingChrome ? (
        <div className="px-3 py-2.5">
          <button
            type="button"
            onClick={() => setShowUnlock((v) => !v)}
            className={`w-full rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold ${
              showUnlock
                ? "border-dt-red/60 bg-dt-red/15 text-dt-red"
                : "border-white/15 text-white/60"
            }`}
          >
            {showUnlock ? "Hide join flow" : "Test join flow"}
          </button>
        </div>
      ) : null}
      {onPatchPage ? (
        <div className="space-y-2.5 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-dt-red">
            {selected ? `Editing · ${selectedLabel}` : selectedLabel}
          </p>
          {selected && selectedId && onPatchBrand && (stageItemRole(selected) === "wordmark" || stageItemRole(selected) === "tagline") ? (
            <div className="space-y-2 rounded-lg border border-white/15 bg-white/[0.04] p-2">
              {stageItemRole(selected) === "wordmark" ? (
                <>
                  <label className="block space-y-1">
                    <span className="text-[9px] text-white/50">Wordmark text</span>
                    <input
                      value={brand.wordmark}
                      onChange={(e) => onPatchBrand({ wordmark: e.target.value })}
                      className="w-full rounded border border-white/15 bg-black px-2 py-1.5 text-[11px] text-white outline-none"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[9px] text-white/50">Wordmark color</span>
                    <input
                      type="color"
                      value={brand.wordmarkColor?.slice(0, 7) || "#FFFFFF"}
                      onChange={(e) => onPatchBrand({ wordmarkColor: e.target.value })}
                      className="h-8 w-full cursor-pointer rounded border border-white/15 bg-transparent"
                    />
                  </label>
                </>
              ) : (
                <>
                  <label className="block space-y-1">
                    <span className="text-[9px] text-white/50">Tagline text</span>
                    <input
                      value={brand.tagline}
                      onChange={(e) => onPatchBrand({ tagline: e.target.value })}
                      className="w-full rounded border border-white/15 bg-black px-2 py-1.5 text-[11px] text-white outline-none"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[9px] text-white/50">Tagline color</span>
                    <input
                      type="color"
                      value={brand.taglineColor?.slice(0, 7) || "#8FE3B8"}
                      onChange={(e) => onPatchBrand({ taglineColor: e.target.value })}
                      className="h-8 w-full cursor-pointer rounded border border-white/15 bg-transparent"
                    />
                  </label>
                </>
              )}
              <label className="block space-y-1">
                <span className="text-[9px] font-semibold text-dt-red">
                  Size on phone · {selected.scale ?? 100}%
                </span>
                <input
                  type="range"
                  min={60}
                  max={220}
                  value={selected.scale ?? 100}
                  onChange={(e) => patchItem(selectedId, { scale: Number(e.target.value) })}
                  className="w-full"
                />
              </label>
            </div>
          ) : null}
          {selected && selectedId && (stageItemRole(selected) === "headline" || stageItemRole(selected) === "subhead" || stageItemRole(selected) === "body") ? (
            <WordStyleEditor
              label={`Style ${stageItemRole(selected)} words`}
              hint="Type new words above, or rename one word below — then style color/font/size"
              selectedChip={wordChip}
              onSelectedChipChange={setWordChip}
              plain={
                stageItemRole(selected) === "headline"
                  ? page.headline
                  : stageItemRole(selected) === "subhead"
                    ? page.subhead
                    : page.body
              }
              runs={runsForPageField(
                page,
                stageItemRole(selected) === "headline"
                  ? "headline"
                  : stageItemRole(selected) === "subhead"
                    ? "subhead"
                    : "body",
              )}
              onChangeText={(value, nextRuns) => {
                const role = stageItemRole(selected);
                if (role === "headline") onPatchPage({ headline: value, headlineRuns: nextRuns });
                else if (role === "subhead") onPatchPage({ subhead: value, subheadRuns: nextRuns });
                else onPatchPage({ body: value, bodyRuns: nextRuns });
              }}
            />
          ) : null}
          {selected && selectedId ? (
            <>
          <label className="block space-y-1 rounded-lg border border-dt-red/40 bg-dt-red/10 px-2.5 py-2">
            <span className="text-[10px] font-semibold text-dt-red">
              Size on phone · {selected.scale ?? 100}%
            </span>
            <input
              type="range"
              min={60}
              max={220}
              value={selected.scale ?? 100}
              onChange={(e) => patchItem(selectedId, { scale: Number(e.target.value) })}
              className="w-full"
            />
            <span className="text-[9px] text-white/45">Drag to make this bigger or smaller on the phone</span>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => patchItem(selectedId, { glow: !selected.glow })}
              className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold ${
                selected.glow
                  ? "border-white/40 bg-white/10 text-white"
                  : "border-white/15 text-white/60"
              }`}
            >
              {selected.glow ? "Glow on" : "Glow off"}
            </button>
            <button
              type="button"
              onClick={() => patchItem(selectedId, { z: Math.min(100, selected.z + 1) })}
              className="rounded-lg border border-white/15 px-2.5 py-1.5 text-[10px] text-white/70"
            >
              Bring forward
            </button>
            <button
              type="button"
              onClick={() => patchItem(selectedId, { z: Math.max(0, selected.z - 1) })}
              className="rounded-lg border border-white/15 px-2.5 py-1.5 text-[10px] text-white/70"
            >
              Send back
            </button>
            <label className="flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-[10px] text-white/70">
              Width {selected.w || 80}%
              <input
                type="range"
                min={8}
                max={100}
                value={selected.w || 80}
                onChange={(e) => patchItem(selectedId, { w: Number(e.target.value) })}
                className="w-24"
              />
            </label>
            <button
              type="button"
              onClick={() => deleteItem(selectedId)}
              className="rounded-lg border border-red-400/40 bg-red-500/10 px-2.5 py-1.5 text-[10px] font-semibold text-red-300"
            >
              {stageItemRole(selected) === "stamp" ? "Delete stamp" : "Delete from phone"}
            </button>

            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="rounded-lg border border-white/15 px-2.5 py-1.5 text-[10px] text-white/50"
            >
              Done
            </button>
          </div>
          {selected.glow ? (
            <div className="grid grid-cols-2 gap-2">
              <label className="block space-y-1">
                <span className="text-[9px] text-white/40">Glow color</span>
                <input
                  type="color"
                  value={selected.glowColor?.slice(0, 7) || "#8FE3B8"}
                  onChange={(e) => patchItem(selectedId, { glowColor: e.target.value })}
                  className="h-8 w-full cursor-pointer rounded border border-white/15 bg-transparent"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[9px] text-white/40">Intensity {selected.glowIntensity}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={selected.glowIntensity}
                  onChange={(e) => patchItem(selectedId, { glowIntensity: Number(e.target.value) })}
                  className="w-full"
                />
              </label>
            </div>
          ) : null}
            </>
          ) : null}
          {hiddenItems.length ? (
            <div className="space-y-1 rounded-lg border border-white/10 bg-white/[0.03] p-2">
              <p className="text-[9px] uppercase tracking-wide text-white/40">Deleted — tap to bring back</p>
              <div className="flex flex-wrap gap-1.5">
                {hiddenItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => patchItem(item.id, { hidden: false })}
                    className="rounded-md border border-white/15 px-2 py-1 text-[10px] text-white/60 hover:text-white"
                  >
                    + {(STAGE_LABELS as Record<string, string>)[stageItemRole(item)] ?? item.id}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <button

            type="button"
            onClick={() =>
              onPatchPage({
                layoutMode: "freeform",
                stage: [
                  ...DEFAULT_LANDING_STAGE.map((item) => ({ ...item })),
                  ...(page.stage || []).filter((item) => stageItemRole(item) === "stamp"),
                ],
              })
            }
            className="text-[10px] text-white/40 underline hover:text-white/70"
          >
            Reset layout
          </button>
        </div>
      ) : null}
      <StampTray
        experience={experience}
        onSaveLogo={onSaveLogo}
        onPlaceStamp={onPlaceStamp}
        onRemoveStamp={onRemoveStamp}
      />
    </PhoneFrame>
  );
}

function SettingsPreview({ experience }: { experience: ExperienceConfig }) {
  const page = experience.pages.settings;
  const logout = page.logoutLabel || "Log Out";
  const title = page.title || page.headline || "Account Settings";
  const rows = [
    { label: "Personal Information", description: "Update your name and profile photo" },
    { label: "Email Address", description: "Change the email on your account" },
    { label: "Phone Number", description: "Update your mobile number" },
    { label: logout, description: "Sign out of your account" },
  ];
  return (
    <PhoneFrame
      label="Account Settings"
      hint="Default settings layout — edit title & colors in the panel"
      screen={
      <div
        className="flex h-[560px] flex-col"
        style={{ background: pageBackgroundCss(page) || themeBackgroundCss(experience.theme) }}
      >
        <div className="border-b border-white/10 px-4 pb-3 pt-8">
          <BrandMark experience={experience} />
        </div>
        <div className="flex-1 overflow-hidden px-3 pb-4 pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">← Back</p>
          <div className="mt-5 text-center">
            <div
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border"
              style={{ borderColor: `${page.accentColor || experience.theme.accent}99` }}
            >
              <span className="text-lg" style={{ color: page.accentColor || experience.theme.accent }}>
                ⌘
              </span>
            </div>
            <p className="mt-3 font-display text-sm font-extrabold tracking-[0.12em] text-white">{title}</p>
            {page.body ? <p className="mt-1 text-[10px] text-white/50">{page.body}</p> : null}
          </div>
          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black/35">
            {rows.map((row, index) => (
              <div
                key={row.label}
                className={`flex items-center gap-2 px-3 py-3 ${index > 0 ? "border-t border-white/10" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold tracking-wide text-white">{row.label}</p>
                  <p className="text-[9px] text-white/45">{row.description}</p>
                </div>
                <span className="text-white/30">›</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      }
    >
      <StampTray experience={experience} />
    </PhoneFrame>
  );
}

function HomeHeaderPreview({
  experience,
  onSaveLogo,
  onPlaceStamp,
  onRemoveStamp,
}: {
  experience: ExperienceConfig;
  onSaveLogo?: () => void;
  onPlaceStamp?: (stampId: string) => void;
  onRemoveStamp?: (stampId: string) => void;
}) {
  const page = experience.pages.home;
  return (
    <PhoneFrame
      label="Home header"
      hint="LIVE hero + home background — box grid is under Home boxes"
      screen={
      <div
        className="flex h-[560px] flex-col"
        style={{ background: pageBackgroundCss(page) || themeBackgroundCss(experience.theme) }}
      >
        <div className="border-b border-white/10 px-4 pb-3 pt-8">
          <BrandMark experience={experience} />
        </div>
        <div className="space-y-2 p-3">
          <div className="relative flex h-[118px] overflow-hidden rounded-2xl border border-dashed border-white/20 bg-black/35">
            {page.heroImage ? (
              <img
                src={resolveExperiencePreviewUrl(page.heroImage)}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-80"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/55 to-transparent" />
            <div className="relative z-10 flex h-full flex-col justify-end p-3.5">
              <p className="font-display text-lg font-extrabold tracking-[0.12em] text-white">
                {(experience.brand.wordmark || "FAN APP").split(" ")[0]}{" "}
                <span style={{ color: experience.theme.accent }}>LIVE</span>
              </p>
              <p className="mt-0.5 text-[11px] text-white/55">
                {page.heroImage ? page.body || "Your hub" : "Upload hero art in this tab"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {["EXCLUSIVE\nVIDEOS", "LATEST NEWS\n& UPDATES", "EVENTS &\nGIVEAWAYS", "DOC &\nGLO"].map((title) => (
              <div
                key={title}
                className="flex min-h-[88px] rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-black/80 p-2.5"
              >
                <p className="font-display text-[10px] font-extrabold uppercase leading-tight tracking-wide text-white/80">
                  {title.split("\n").map((line, i, arr) => (
                    <span key={`${title}-${i}`}>
                      {line}
                      {i < arr.length - 1 ? <br /> : null}
                    </span>
                  ))}
                </p>
              </div>
            ))}
          </div>
          <p className="text-center text-[9px] uppercase tracking-wide text-white/35">
            Blank starter boxes · edit images in Home boxes
          </p>
        </div>
      </div>
      }
    >
      <StampTray
        experience={experience}
        onSaveLogo={onSaveLogo}
        onPlaceStamp={onPlaceStamp}
        onRemoveStamp={onRemoveStamp}
      />
    </PhoneFrame>
  );
}

const MODE_LABEL: Record<PhonePreviewMode, string> = {
  brand: "Brand",
  theme: "Colors",
  effects: "Effects",
  landing: "Landing",
  youreIn: "You're In",
  settings: "Settings",
  homePage: "Home header",
  boxes: "Home boxes",
  page: "Page",
};

export function ExperiencePhonePreview({
  experience,
  mode,
  label,
  pageKey,
  onPatchPage,
  onPatchBrand,
  onSaveLogo,
  onPlaceStamp,
  onRemoveStamp,
}: {
  experience: ExperienceConfig;
  mode: PhonePreviewMode;
  label?: string;
  pageKey: ExperiencePageKey;
  onPatchPage?: (patch: Partial<ExperiencePageConfig>) => void;
  onPatchBrand?: (patch: Partial<ExperienceBrand>) => void;
  onSaveLogo?: () => void;
  onPlaceStamp?: (stampId: string) => void;
  onRemoveStamp?: (stampId: string) => void;
}) {
  if (mode === "settings") {
    return <SettingsPreview experience={experience} />;
  }
  if (mode === "homePage") {
    return (
      <HomeHeaderPreview
        experience={experience}
        onSaveLogo={onSaveLogo}
        onPlaceStamp={onPlaceStamp}
        onRemoveStamp={onRemoveStamp}
      />
    );
  }

  return (
    <PageFreeformPreview
      experience={experience}
      page={experience.pages[pageKey]}
      pageKey={pageKey}
      label={label ?? MODE_LABEL[mode]}
      onPatchPage={onPatchPage}
      onPatchBrand={onPatchBrand}
      onSaveLogo={onSaveLogo}
      onPlaceStamp={onPlaceStamp}
      onRemoveStamp={onRemoveStamp}
    />
  );
}

export { MODE_LABEL, createStampFromBrand, placeStampOnPage };
export type { ExperienceStamp };
