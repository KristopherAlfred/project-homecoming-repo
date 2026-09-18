import {
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Clock,
  Gift,
  GripVertical,
  ImagePlus,
  Link2,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Star,
  Trash2,
  ZoomIn,
  ZoomOut,
  type LucideIcon,
} from "lucide-react";

import type {
  CreatorBlockId,
  CreatorBlockLayout,
  CreatorFeature,
  CreatorFeaturedCard,
  CreatorFrameLayout,
  CreatorProfile,
} from "../../lib/creatorProfile";
import {
  CREATOR_BLOCK_LABELS,
  CREATOR_BLOCK_ORDER,
  DEFAULT_CREATOR_PROFILE,
  DEFAULT_LINK_HEIGHT,
} from "../../lib/creatorProfile";
import { resolveExperiencePreviewUrl } from "../../lib/resolveExperiencePreviewUrl";

/**
 * Cinematic link-in-bio creator page.
 *
 * Renders from a CreatorProfile. When `editable` is on (studio preview) every
 * block becomes a live canvas object: click to select, drag to move, grip to
 * reorder, corner handle to resize, × to remove, click text to rewrite it and
 * click/drag the background to reframe the video.
 */

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** True once the athlete has edited the perks away from the stock three. */
function perksCustomized(features: CreatorFeature[] | undefined): boolean {
  if (!features?.length) return false;
  const stock = DEFAULT_CREATOR_PROFILE.features;
  if (features.length !== stock.length) return true;
  return features.some(
    (f, i) => f.label !== stock[i].label || f.description !== stock[i].description || f.icon !== stock[i].icon,
  );
}

function moveIndex<T>(list: T[], from: number, to: number): T[] {
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(clamp(to, 0, next.length), 0, item);
  return next;
}

// ─── Pointer drag primitive ──────────────────────────────────────────────
type DragHandlers = {
  onStart?: () => void;
  onMove: (dx: number, dy: number, ev: PointerEvent) => void;
  onEnd?: (moved: boolean) => void;
};

function startDrag(e: ReactPointerEvent, handlers: DragHandlers, threshold = 4) {
  if (e.button !== 0) return;
  const startX = e.clientX;
  const startY = e.clientY;
  let moved = false;
  const onMove = (ev: PointerEvent) => {
    const dx = ev.clientX - startX;
    const dy = ev.clientY - startY;
    if (!moved) {
      if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;
      moved = true;
      (document.activeElement as HTMLElement | null)?.blur?.();
      window.getSelection()?.removeAllRanges();
      document.body.classList.add("creator-dragging");
      handlers.onStart?.();
    }
    ev.preventDefault();
    handlers.onMove(dx, dy, ev);
  };
  const onUp = () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    document.body.classList.remove("creator-dragging");
    handlers.onEnd?.(moved);
  };
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
}

const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();

// ─── Inline text editing ────────────────────────────────────────────────
function EditableText({
  value,
  onCommit,
  editable,
  as = "span",
  className = "",
  placeholder = "Type here",
  multiline = false,
  style,
}: {
  value: string;
  onCommit?: (next: string) => void;
  editable: boolean;
  as?: "span" | "p" | "h1" | "strong";
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  style?: CSSProperties;
}) {
  const Tag = as;
  if (!editable) {
    return (
      <Tag className={className} style={style}>
        {value}
      </Tag>
    );
  }
  return (
    <Tag
      className={`creator-editable ${className}`}
      style={style}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      data-placeholder={placeholder}
      onBlur={(e) => {
        const next = (e.currentTarget.textContent ?? "").replace(/\u00a0/g, " ").trim();
        if (next !== value) onCommit?.(next);
      }}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape" || (e.key === "Enter" && !multiline)) {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      onPointerDown={(e) => {
        // Once focused, let the user place the caret / select text without dragging the block.
        if (document.activeElement === e.currentTarget) e.stopPropagation();
      }}
      onDragStart={(e) => e.preventDefault()}
    >
      {value}
    </Tag>
  );
}

// ─── Selectable / movable / resizable frame ──────────────────────────────
type ResizeMode = "none" | "width" | "both";

function EditFrame({
  editable,
  editKey,
  label,
  selected,
  onSelect,
  layout,
  onLayout,
  unit,
  index,
  count,
  onReorderTo,
  groupRef,
  onDelete,
  resize = "width",
  minH = 72,
  children,
  className = "",
  style,
  extra,
}: {
  editable: boolean;
  editKey: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
  layout: CreatorFrameLayout;
  onLayout: (patch: CreatorFrameLayout) => void;
  unit: number;
  index: number;
  count: number;
  onReorderTo?: (to: number) => void;
  groupRef?: RefObject<HTMLDivElement | null>;
  onDelete?: () => void;
  resize?: ResizeMode;
  minH?: number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Extra editor UI rendered under the content when selected (e.g. URL field). */
  extra?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const indexRef = useRef(index);
  indexRef.current = index;
  const x = layout.x ?? 0;
  const y = layout.y ?? 0;
  const w = layout.w;

  const frameStyle: CSSProperties = {
    ...style,
    transform: x || y ? `translate(${x * unit}px, ${y * unit}px)` : undefined,
    width: w ? `${w}%` : undefined,
  };

  if (!editable) {
    return (
      <div className={className} style={frameStyle}>
        {children}
      </div>
    );
  }

  const startMove = (e: ReactPointerEvent) => {
    if ((e.target as HTMLElement).closest("input, textarea, select, .creator-edit-toolbar")) return;
    e.stopPropagation();
    onSelect();
    const bx = x;
    const by = y;
    startDrag(e, {
      onMove: (dx, dy) => onLayout({ x: Math.round(bx + dx / unit), y: Math.round(by + dy / unit) }),
    });
  };

  const startReorder = (e: ReactPointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    startDrag(
      e,
      {
        onMove: (_dx, _dy, ev) => {
          const group = groupRef?.current;
          if (!group || !onReorderTo) return;
          const others = Array.from(group.children)
            .filter((el) => el.hasAttribute("data-edit-key") && el.getAttribute("data-edit-key") !== editKey)
            .map((el) => {
              const r = el.getBoundingClientRect();
              return r.top + r.height / 2;
            });
          const target = others.filter((mid) => mid < ev.clientY).length;
          if (target !== indexRef.current) onReorderTo(target);
        },
      },
      2,
    );
  };

  const startResize = (e: ReactPointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    const el = ref.current;
    const parentW = el?.parentElement?.clientWidth || 1;
    const startPx = el?.offsetWidth || parentW;
    const startH = layout.h ?? Math.round((el?.offsetHeight || minH * unit) / unit);
    startDrag(
      e,
      {
        onMove: (dx, dy) => {
          const patch: CreatorFrameLayout = {};
          if (resize === "width" || resize === "both") {
            patch.w = clamp(Math.round(((startPx + dx) / parentW) * 100), 30, 100);
          }
          if (resize === "both") {
            patch.h = clamp(Math.round(startH + dy / unit), minH, 640);
          }
          onLayout(patch);
        },
      },
      1,
    );
  };

  const nudged = Boolean(x || y || w || layout.h);

  return (
    <div
      ref={ref}
      data-edit-key={editKey}
      className={`creator-edit-frame ${selected ? "is-selected" : ""} ${className}`}
      style={frameStyle}
      onPointerDown={startMove}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {selected ? (
        <div className="creator-edit-toolbar" onPointerDown={stop} onClick={stop}>
          <span className="creator-edit-label">{label}</span>
          {onReorderTo ? (
            <>
              <button type="button" title="Drag to reorder" className="creator-edit-grip" onPointerDown={startReorder}>
                <GripVertical size={11} />
              </button>
              <button
                type="button"
                title="Move up"
                disabled={index <= 0}
                onClick={() => onReorderTo(index - 1)}
              >
                <ArrowUp size={10} />
              </button>
              <button
                type="button"
                title="Move down"
                disabled={index >= count - 1}
                onClick={() => onReorderTo(index + 1)}
              >
                <ArrowDown size={10} />
              </button>
            </>
          ) : null}
          {nudged ? (
            <button
              type="button"
              title="Reset position & size"
              onClick={() => onLayout({ x: 0, y: 0, w: undefined, h: undefined })}
            >
              <RotateCcw size={10} />
            </button>
          ) : null}
          {onDelete ? (
            <button type="button" title="Remove" className="is-danger" onClick={onDelete}>
              <Trash2 size={10} />
            </button>
          ) : null}
        </div>
      ) : null}
      {children}
      {selected && extra ? (
        <div className="creator-edit-extra" onPointerDown={stop} onClick={stop}>
          {extra}
        </div>
      ) : null}
      {selected && resize !== "none" ? (
        <span
          className={`creator-edit-handle ${resize === "both" ? "is-both" : "is-width"}`}
          title={resize === "both" ? "Drag to resize" : "Drag to change width"}
          onPointerDown={startResize}
        />
      ) : null}
    </div>
  );
}

// ─── Visual atoms ───────────────────────────────────────────────────────
function VerifiedBadge({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-label="Verified" className="shrink-0">
      <path
        fill="#1D9BF0"
        d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81C14.67 2.63 13.43 1.75 12 1.75s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81S3.48 7.27 3.94 8.66C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34Z"
      />
      <path fill="#fff" d="m10.68 15.63-3.1-3.1 1.42-1.42 1.68 1.69 4.32-4.33 1.42 1.42-5.74 5.74Z" />
    </svg>
  );
}

const FEATURE_ICONS: Record<string, LucideIcon> = {
  clock: Clock,
  gift: Gift,
  play: Play,
  sparkles: Sparkles,
  sparkle: Sparkles,
  star: Star,
};

/** Link.me-style embedded preview card: big site screenshot, favicon chip, title, arrow. */
function LinkPreviewCard({
  card,
  compact,
  height,
  editable,
  onPatch,
}: {
  card: CreatorFeaturedCard;
  compact: boolean;
  height: number;
  editable: boolean;
  onPatch?: (patch: Partial<CreatorFeaturedCard>) => void;
}) {
  const art = resolveExperiencePreviewUrl(card.image || "");
  let host = "";
  try {
    host = card.url ? new URL(card.url).hostname.replace(/^www\./, "") : "";
  } catch {
    host = "";
  }
  const title = card.caption || card.overlayTitle || "Explore";
  const screenshot =
    art ||
    (card.url
      ? `https://api.microlink.io/?url=${encodeURIComponent(card.url)}&screenshot=true&meta=false&embed=screenshot.url`
      : "");
  const favicon = host ? `https://www.google.com/s2/favicons?domain=${host}&sz=128` : "";
  const [failed, setFailed] = useState(false);

  return (
    <a
      href={card.url || undefined}
      target={card.url ? "_blank" : undefined}
      rel="noreferrer"
      draggable={false}
      onClick={(e) => {
        if (editable) e.preventDefault();
      }}
      className="creator-link-row group relative block w-full overflow-hidden text-left"
    >
      <div className="creator-link-preview relative w-full overflow-hidden" style={{ height }}>
        {screenshot && !failed ? (
          <img
            src={screenshot}
            alt=""
            loading="lazy"
            draggable={false}
            onError={() => setFailed(true)}
            className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="creator-link-fallback grid h-full w-full place-items-center font-black">
            {title.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="creator-link-preview-veil pointer-events-none absolute inset-0" />
        {host ? (
          <span
            className={`creator-link-host absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full ${
              compact ? "px-2.5 py-1 text-[8px]" : "px-3.5 py-1.5 text-[11px]"
            }`}
          >
            {favicon ? <img src={favicon} alt="" draggable={false} className={compact ? "h-3 w-3" : "h-4 w-4"} /> : null}
            {host}
          </span>
        ) : null}

        <div
          className={`absolute inset-x-0 bottom-0 grid grid-cols-[minmax(0,1fr)_auto] items-end ${
            compact ? "gap-3 p-4" : "gap-4 p-6"
          }`}
        >
          <span className="min-w-0">
            <EditableText
              editable={editable}
              value={title}
              placeholder="Link title"
              onCommit={(v) => onPatch?.({ caption: v })}
              className={`creator-link-title block ${editable ? "" : "truncate"} ${compact ? "text-[15px]" : "text-[24px]"}`}
            />
            {editable || (card.overlayTitle && card.caption) ? (
              <EditableText
                editable={editable}
                value={card.caption ? card.overlayTitle ?? "" : ""}
                placeholder="Short description"
                onCommit={(v) => onPatch?.({ overlayTitle: v })}
                className={`creator-link-sub mt-1 block ${editable ? "" : "truncate"} ${compact ? "text-[8px]" : "text-[12px]"}`}
              />
            ) : null}
          </span>
          <span
            className={`creator-link-go inline-grid place-items-center rounded-full ${
              compact ? "h-8 w-8" : "h-12 w-12"
            }`}
          >
            <ChevronRight size={compact ? 14 : 20} strokeWidth={2.4} />
          </span>
        </div>
      </div>
    </a>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────
type Selection = string | null;

export function CreatorLinkPage({
  profile,
  compact = false,
  className = "",
  onJoin,
  joinLabel,
  accentColor = "#9EF7C5",
  editable = false,
  onChange,
  onUploadMedia,
}: {
  profile: CreatorProfile;
  /** Phone-sized rendering (studio preview). */
  compact?: boolean;
  className?: string;
  /** Triggers the join / subscribe flow. */
  onJoin?: () => void;
  joinLabel?: string;
  accentColor?: string;
  /** Turns the page into a live canvas editor. */
  editable?: boolean;
  onChange?: (patch: Partial<CreatorProfile>) => void;
  /** Lets the background toolbar replace the video/photo. */
  onUploadMedia?: (file: File, apply: (src: string) => void) => void;
}) {
  const video = resolveExperiencePreviewUrl(profile.videoSrc);
  const poster = resolveExperiencePreviewUrl(profile.videoPoster);
  const photo = resolveExperiencePreviewUrl(profile.photo);
  const cta = joinLabel || profile.ctaLabel || "Join My Circle";
  const isSloane = profile.name.trim().toLowerCase() === "sloane stephens";
  const unit = compact ? 1 : 1.6;
  const edit = editable && Boolean(onChange);
  const patch = (p: Partial<CreatorProfile>) => onChange?.(p);

  const [selected, setSelected] = useState<Selection>(null);
  const blocksRef = useRef<HTMLDivElement>(null);
  const perksRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  const proofFaces = [photo, ...profile.featured.map((item) => resolveExperiencePreviewUrl(item.image))]
    .filter(Boolean)
    .slice(0, 5);
  const fanActivity = [
    { name: "Maya", note: "just joined", time: "Now" },
    { name: "Jordan", note: "joined the circle", time: "2m" },
    { name: "Alex", note: "unlocked member access", time: "4m" },
    { name: "Taylor", note: "just joined", time: "7m" },
  ];
  const featureItems = profile.features.slice(0, 3);
  const layout: CreatorBlockLayout[] = profile.layout?.length
    ? profile.layout
    : CREATOR_BLOCK_ORDER.map((id) => ({ id }));
  const visibleBlocks = layout.filter((b) => !b.hidden);
  const hiddenBlocks = layout.filter((b) => b.hidden);
  const linkHeightBase = profile.linkHeight || DEFAULT_LINK_HEIGHT;

  const exploreItems: CreatorFeaturedCard[] = profile.featured.length
    ? profile.featured
    : edit
      ? []
      : featureItems.map((feature) => ({
          id: `link-${feature.id}`,
          image: poster || photo,
          caption: feature.label,
          overlayTitle: feature.description,
          url: "",
        }));

  // ── layout helpers ──
  const patchBlock = (id: CreatorBlockId, p: Partial<CreatorBlockLayout>) =>
    patch({ layout: layout.map((b) => (b.id === id ? { ...b, ...p } : b)) });
  const reorderBlock = (id: CreatorBlockId, to: number) => {
    const from = visibleBlocks.findIndex((b) => b.id === id);
    if (from < 0) return;
    patch({ layout: [...moveIndex(visibleBlocks, from, to), ...hiddenBlocks] });
  };
  const patchCard = (id: string, p: Partial<CreatorFeaturedCard>) =>
    patch({ featured: profile.featured.map((c) => (c.id === id ? { ...c, ...p } : c)) });
  const patchFeature = (id: string, p: Partial<CreatorFeature>) =>
    patch({ features: profile.features.map((f) => (f.id === id ? { ...f, ...p } : f)) });
  const addLink = () => {
    const id = `card_${Date.now().toString(36)}`;
    patch({ featured: [...profile.featured, { id, image: "", caption: "New link", url: "" }] });
    setSelected(`link:${id}`);
  };
  const addPerk = () => {
    const id = `feature_${Date.now().toString(36)}`;
    patch({ features: [...profile.features, { id, icon: "star", label: "New perk", description: "Members only" }] });
    setSelected(`perk:${id}`);
  };

  // ── background (video) editing ──
  const onBackgroundPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!edit) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-edit-key], .creator-edit-toolbar, .creator-bg-toolbar, .creator-edit-tray, .creator-editable")) return;
    setSelected("bg");
    const width = pageRef.current?.clientWidth || 1;
    const height = pageRef.current?.clientHeight || 1;
    const sx = profile.mediaX ?? 50;
    const sy = profile.mediaY ?? 50;
    const scale = (profile.mediaScale ?? 100) / 100;
    startDrag(e, {
      onMove: (dx, dy) =>
        patch({
          mediaX: clamp(Math.round(sx - (dx / width) * 100 * (scale > 1 ? 1 : 2.2)), 0, 100),
          mediaY: clamp(Math.round(sy - (dy / height) * 100 * (scale > 1 ? 1 : 2.2)), 0, 100),
        }),
    });
  };

  const mediaStyle: CSSProperties = {
    objectPosition: `${profile.mediaX ?? 50}% ${profile.mediaY ?? 50}%`,
    transform: (profile.mediaScale ?? 100) !== 100 ? `scale(${(profile.mediaScale ?? 100) / 100})` : undefined,
    transformOrigin: `${profile.mediaX ?? 50}% ${profile.mediaY ?? 50}%`,
  };

  const isSel = (key: string) => edit && selected === key;

  // ── blocks ──
  const blockGap: Record<CreatorBlockId, string> = {
    identity: "",
    cta: compact ? "mt-5" : "mt-8",
    bio: compact ? "mt-7" : "mt-12",
    fans: compact ? "mt-6" : "mt-9",
    perks: compact ? "mt-6" : "mt-10",
    links: compact ? "mt-7" : "mt-12",
  };

  const renderBlock = (id: CreatorBlockId): ReactNode => {
    switch (id) {
      case "identity":
        return (
          <div className="text-white">
            <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
              <EditableText
                as="h1"
                editable={edit}
                value={profile.name}
                placeholder="Your name"
                onCommit={(v) => patch({ name: v })}
                className={`creator-name min-w-0 leading-none ${compact ? "text-[30px]" : "text-[56px] sm:text-[64px]"}`}
              />
              {profile.verified || edit ? (
                <span
                  role={edit ? "button" : undefined}
                  title={edit ? (profile.verified ? "Hide verified badge" : "Show verified badge") : undefined}
                  className={edit ? `cursor-pointer ${profile.verified ? "" : "opacity-25"}` : ""}
                  onPointerDown={edit ? stop : undefined}
                  onClick={
                    edit
                      ? (e) => {
                          e.stopPropagation();
                          patch({ verified: !profile.verified });
                        }
                      : undefined
                  }
                >
                  <VerifiedBadge size={compact ? 15 : 22} />
                </span>
              ) : null}
            </div>

            <div className={`flex flex-wrap items-center ${compact ? "mt-2 gap-2" : "mt-3 gap-3"}`}>
              {profile.handle || edit ? (
                <EditableText
                  as="p"
                  editable={edit}
                  value={profile.handle ? (profile.handle.startsWith("@") ? profile.handle : `@${profile.handle}`) : ""}
                  placeholder="@handle"
                  onCommit={(v) => patch({ handle: v })}
                  className={`font-medium text-white/65 ${compact ? "text-[9px]" : "text-sm"}`}
                />
              ) : null}
              {profile.followerCount || edit ? (
                <span
                  className={`creator-follower-pill inline-flex w-fit items-center gap-1.5 rounded-full backdrop-blur-md ${
                    compact ? "px-2.5 py-1 text-[8px]" : "px-3.5 py-2 text-xs"
                  }`}
                >
                  <EditableText
                    editable={edit}
                    value={profile.followerCount}
                    placeholder="1.2M"
                    onCommit={(v) => patch({ followerCount: v })}
                    className="font-bold"
                  />
                  <EditableText
                    editable={edit}
                    value={profile.followerLabel}
                    placeholder="Followers"
                    onCommit={(v) => patch({ followerLabel: v })}
                    className="text-white/55"
                  />
                  <ChevronDown size={compact ? 10 : 14} className="text-white/45" />
                </span>
              ) : null}
            </div>
          </div>
        );
      case "cta":
        return (
          <div>
            <button
              type="button"
              onClick={edit ? undefined : onJoin}
              className={`creator-primary-cta group flex w-full items-center justify-center gap-2 transition duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] ${
                compact ? "h-11 text-[11px]" : "h-14 text-[15px]"
              }`}
            >
              <EditableText
                editable={edit}
                value={cta}
                placeholder="Join My Circle"
                onCommit={(v) => patch({ ctaLabel: v })}
              />
              <ArrowRight size={compact ? 14 : 18} strokeWidth={2.2} />
            </button>
            <EditableText
              as="p"
              editable={edit}
              value={profile.joinMicrocopy}
              placeholder="Small print under the button"
              onCommit={(v) => patch({ joinMicrocopy: v })}
              className={`creator-consent mt-2 ${compact ? "text-[6px]" : "text-[9px]"}`}
            />
          </div>
        );
      case "bio":
        if (!profile.bio && !profile.secondaryHandle && !edit) return null;
        return (
          <div>
            <EditableText
              as="p"
              editable={edit}
              multiline
              value={profile.bio}
              placeholder="Write a short bio"
              onCommit={(v) => patch({ bio: v })}
              className={`creator-intro max-w-[440px] leading-snug ${compact ? "text-[15px]" : "text-[30px]"}`}
            />
            {profile.secondaryHandle || edit ? (
              <EditableText
                as="p"
                editable={edit}
                value={profile.secondaryHandle}
                placeholder="@secondary"
                onCommit={(v) => patch({ secondaryHandle: v })}
                className={`creator-sheet-muted mt-2 ${compact ? "text-[9px]" : "text-sm"}`}
              />
            ) : null}
          </div>
        );
      case "fans":
        return (
          <div className="w-full">
            <div className={`flex items-center justify-between ${compact ? "mb-2" : "mb-3"}`}>
              <EditableText
                as="p"
                editable={edit}
                value={profile.fansLabel}
                placeholder="Joining now"
                onCommit={(v) => patch({ fansLabel: v })}
                className={`creator-section-label font-semibold uppercase ${compact ? "text-[6px]" : "text-[10px]"}`}
              />
              <span className={`creator-live-status inline-flex items-center gap-1.5 ${compact ? "text-[6px]" : "text-[9px]"}`}>
                <span className="creator-live-dot" /> Live
              </span>
            </div>
            <div className="creator-fan-rail overflow-hidden">
              <div className="creator-fan-track flex w-max gap-2.5">
                {[...fanActivity, ...fanActivity].map((fan, index) => {
                  const face = proofFaces[index % Math.max(proofFaces.length, 1)];
                  return (
                    <div
                      key={`${fan.name}-${index}`}
                      className={`creator-fan-chip flex shrink-0 items-center ${compact ? "w-[152px] gap-2 p-2" : "w-[220px] gap-3 p-3"}`}
                    >
                      {face ? (
                        <img src={face} alt="" draggable={false} className={`${compact ? "h-7 w-7" : "h-10 w-10"} rounded-full object-cover`} />
                      ) : (
                        <span className={`${compact ? "h-7 w-7" : "h-10 w-10"} creator-proof-avatar rounded-full`} />
                      )}
                      <span className="min-w-0 flex-1 leading-tight">
                        <strong className={`block truncate ${compact ? "text-[8px]" : "text-xs"}`}>{fan.name}</strong>
                        <span className={`creator-sheet-muted block truncate ${compact ? "text-[6px]" : "text-[9px]"}`}>{fan.note}</span>
                      </span>
                      <span className={`creator-sheet-muted ${compact ? "text-[6px]" : "text-[8px]"}`}>{fan.time}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      case "perks":
        if (!featureItems.length && !edit) return null;
        return (
          <div className="w-full">
            <div className={`flex items-center justify-between ${compact ? "mb-2" : "mb-4"}`}>
              <EditableText
                as="p"
                editable={edit}
                value={profile.perksLabel}
                placeholder="Membership perks"
                onCommit={(v) => patch({ perksLabel: v })}
                className={`creator-section-label font-semibold uppercase ${compact ? "text-[6px]" : "text-[10px]"}`}
              />
              {edit && featureItems.length < 3 ? (
                <button type="button" className="creator-edit-add" onPointerDown={stop} onClick={(e) => { e.stopPropagation(); addPerk(); }}>
                  <Plus size={10} /> Add perk
                </button>
              ) : null}
            </div>
            <div ref={perksRef} className={`grid ${compact ? "grid-cols-3 gap-2" : "grid-cols-2 gap-3"}`}>
              {featureItems.map((feature, i) => {
                const Icon = FEATURE_ICONS[feature.icon.toLowerCase()] ?? Star;
                const key = `perk:${feature.id}`;
                return (
                  <EditFrame
                    key={feature.id}
                    editable={edit}
                    editKey={key}
                    label="Perk"
                    selected={isSel(key)}
                    onSelect={() => setSelected(key)}
                    layout={feature}
                    onLayout={(p) => patchFeature(feature.id, p)}
                    unit={unit}
                    index={i}
                    count={featureItems.length}
                    groupRef={perksRef}
                    onReorderTo={(to) => patch({ features: moveIndex(profile.features, i, to) })}
                    onDelete={() => patch({ features: profile.features.filter((f) => f.id !== feature.id) })}
                    resize="none"
                    className="min-w-0"
                  >
                    <div
                      className={`creator-perk-card flex h-full min-w-0 flex-col items-start text-left ${compact ? "min-h-[66px] gap-1.5 p-2" : "min-h-[154px] gap-4 p-5"}`}
                    >
                      <span className={`creator-feature-icon flex shrink-0 items-center justify-center ${compact ? "h-6 w-6" : "h-11 w-11"}`}>
                        <Icon size={compact ? 11 : 19} strokeWidth={1.6} />
                      </span>
                      <span className="min-w-0">
                        <EditableText
                          as="strong"
                          editable={edit}
                          value={feature.label}
                          placeholder="Perk name"
                          onCommit={(v) => patchFeature(feature.id, { label: v })}
                          className={`block leading-tight ${compact ? "text-[10px]" : "text-sm"}`}
                        />
                        <EditableText
                          editable={edit}
                          value={feature.description}
                          placeholder="One line"
                          onCommit={(v) => patchFeature(feature.id, { description: v })}
                          className={`creator-sheet-muted mt-1 block leading-snug ${compact ? (edit ? "text-[6px]" : "line-clamp-1 text-[6px]") : "text-[11px]"}`}
                        />
                      </span>
                    </div>
                  </EditFrame>
                );
              })}
            </div>
          </div>
        );
      case "links":
        if (!exploreItems.length && !edit) return null;
        return (
          <div className="w-full">
            <div className={`grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 ${compact ? "mb-3" : "mb-5"}`}>
              <EditableText
                editable={edit}
                value={profile.linksLabel}
                placeholder="Live links"
                onCommit={(v) => patch({ linksLabel: v })}
                className={`creator-display ${compact ? "text-[15px]" : "text-[28px]"}`}
              />
              {edit ? (
                <button type="button" className="creator-edit-add" onPointerDown={stop} onClick={(e) => { e.stopPropagation(); addLink(); }}>
                  <Plus size={10} /> Add link
                </button>
              ) : (
                <span className={`creator-section-label font-bold uppercase ${compact ? "text-[7px]" : "text-[10px]"}`}>Explore all</span>
              )}
            </div>
            <div ref={linksRef} className={`flex w-full flex-col ${compact ? "gap-3" : "gap-5"}`}>
              {exploreItems.map((card, i) => {
                const key = `link:${card.id}`;
                const height = Math.round((card.h ?? linkHeightBase) * unit);
                return (
                  <EditFrame
                    key={card.id}
                    editable={edit}
                    editKey={key}
                    label="Link"
                    selected={isSel(key)}
                    onSelect={() => setSelected(key)}
                    layout={card}
                    onLayout={(p) => patchCard(card.id, p)}
                    unit={unit}
                    index={i}
                    count={exploreItems.length}
                    groupRef={linksRef}
                    onReorderTo={(to) => patch({ featured: moveIndex(profile.featured, i, to) })}
                    onDelete={() => patch({ featured: profile.featured.filter((c) => c.id !== card.id) })}
                    resize="both"
                    minH={72}
                    extra={
                      <div className="creator-edit-urlbar">
                        <Link2 size={10} />
                        <input
                          value={card.url ?? ""}
                          placeholder="https://your-link.com"
                          onChange={(e) => patchCard(card.id, { url: e.target.value })}
                        />
                        {onUploadMedia ? (
                          <label title="Custom cover image">
                            <ImagePlus size={10} />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) onUploadMedia(file, (src) => patchCard(card.id, { image: src }));
                                e.target.value = "";
                              }}
                            />
                          </label>
                        ) : null}
                      </div>
                    }
                  >
                    <LinkPreviewCard
                      card={card}
                      compact={compact}
                      height={height}
                      editable={edit}
                      onPatch={(p) => patchCard(card.id, p)}
                    />
                  </EditFrame>
                );
              })}
              {edit && !exploreItems.length ? (
                <button type="button" className="creator-edit-empty" onPointerDown={stop} onClick={(e) => { e.stopPropagation(); addLink(); }}>
                  <Plus size={12} /> Add your first live link
                </button>
              ) : null}
            </div>
          </div>
        );
    }
  };

  return (
    <div
      ref={pageRef}
      className={`creator-glass-page relative h-full w-full overflow-hidden ${isSloane ? "creator-sloane-page" : ""} ${edit ? "is-editing" : ""} ${className}`}
      style={{ scrollbarWidth: "none", "--creator-accent": accentColor } as CSSProperties}
    >
      {/* ── Fixed full-page media background ─────────────────── */}
      <div className={`creator-media-stage pointer-events-none absolute inset-x-0 top-0 overflow-hidden ${isSloane ? "is-top-video" : "inset-y-0"}`} aria-hidden="true">
        {video ? (
          <video
            key={video}
            src={video}
            poster={poster || undefined}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            style={mediaStyle}
            className="creator-hero-media h-full w-full object-cover"
          />
        ) : poster ? (
          <img key={poster} src={poster} alt="" style={mediaStyle} className="creator-hero-media h-full w-full object-cover" />
        ) : null}
        <div className="creator-media-overlay absolute inset-0" />
        <div className="creator-accent-glow absolute inset-x-0 top-0 h-[40%]" />
      </div>

      {edit && selected === "bg" ? (
        <div className="creator-bg-toolbar" onPointerDown={stop} onClick={stop}>
          <span className="creator-edit-label">Background · drag to reframe</span>
          {onUploadMedia ? (
            <label title="Replace video or photo">
              <ImagePlus size={11} />
              <input
                type="file"
                accept="video/*,image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const isVideo = file.type.startsWith("video/");
                    onUploadMedia(file, (src) =>
                      patch(isVideo ? { videoSrc: src } : { videoSrc: "", videoPoster: src }),
                    );
                  }
                  e.target.value = "";
                }}
              />
            </label>
          ) : null}
          <button type="button" title="Zoom in" onClick={() => patch({ mediaScale: clamp((profile.mediaScale ?? 100) + 10, 100, 220) })}>
            <ZoomIn size={11} />
          </button>
          <button type="button" title="Zoom out" onClick={() => patch({ mediaScale: clamp((profile.mediaScale ?? 100) - 10, 100, 220) })}>
            <ZoomOut size={11} />
          </button>
          <button type="button" title="Reset framing" onClick={() => patch({ mediaX: 50, mediaY: 50, mediaScale: 100 })}>
            <RotateCcw size={11} />
          </button>
          {video || poster ? (
            <button type="button" title="Remove background" className="is-danger" onClick={() => patch({ videoSrc: "", videoPoster: "" })}>
              <Trash2 size={11} />
            </button>
          ) : null}
        </div>
      ) : null}

      {/* ── Scrollable content layer ─────────────────────────── */}
      <div
        className={`creator-scroll-content relative z-10 h-full w-full overflow-y-auto ${edit && selected === "bg" ? "is-bg-selected" : ""}`}
        onPointerDown={onBackgroundPointerDown}
        onClick={edit ? () => setSelected("bg") : undefined}
      >
        {/* hero breathing room over the video */}
        <div
          className="w-full"
          style={
            isSloane
              ? compact
                ? { height: 330 }
                : { height: "52vh", minHeight: 400 }
              : compact
                ? { height: 200 }
                : { height: "calc(76vh - 320px)", minHeight: 280 }
          }
        />

        <div
          ref={blocksRef}
          className={`creator-sheet relative z-20 mx-auto flex w-full max-w-[520px] flex-col text-left ${isSloane ? "is-translucent" : ""} ${
            compact ? "px-6 pb-14" : "px-8 pb-24"
          }`}
        >
          {visibleBlocks.map((block, i) => {
            const key = `block:${block.id}`;
            const body = renderBlock(block.id);
            if (body === null) return null;
            return (
              <EditFrame
                key={block.id}
                editable={edit}
                editKey={key}
                label={CREATOR_BLOCK_LABELS[block.id]}
                selected={isSel(key)}
                onSelect={() => setSelected(key)}
                layout={block}
                onLayout={(p) => patchBlock(block.id, p)}
                unit={unit}
                index={i}
                count={visibleBlocks.length}
                groupRef={blocksRef}
                onReorderTo={(to) => reorderBlock(block.id, to)}
                onDelete={() => {
                  patchBlock(block.id, { hidden: true });
                  setSelected(null);
                }}
                resize="width"
                className={`${blockGap[block.id]} ${block.w ? "" : "w-full"}`}
              >
                {body}
              </EditFrame>
            );
          })}

          {edit && hiddenBlocks.length ? (
            <div className="creator-edit-tray" onPointerDown={stop} onClick={stop}>
              <span className="creator-edit-label">Hidden</span>
              {hiddenBlocks.map((b) => (
                <button key={b.id} type="button" onClick={() => patchBlock(b.id, { hidden: false })}>
                  <Plus size={9} /> {CREATOR_BLOCK_LABELS[b.id]}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Build the creator profile for a config, falling back to brand/landing fields
 * so an athlete who only filled in the basics still gets a complete page.
 */
export function creatorProfileFor(experience: {
  brand: { wordmark: string; tagline: string };
  creator: CreatorProfile;
  pages: Record<string, { heroImage?: string; headline?: string; body?: string; ctaLabel?: string; features?: Array<{ id: string; icon: string; label: string }>; memberProof?: { count?: string; label?: string } } | undefined>;
}): CreatorProfile {
  const landing = experience.pages.landing;
  const c = experience.creator;
  return {
    ...c,
    name: c.name || experience.brand.wordmark || landing?.headline || "",
    videoPoster: c.videoPoster || landing?.heroImage || "",
    bio: c.bio || experience.brand.tagline || landing?.body || "",
    ctaLabel: c.ctaLabel || landing?.ctaLabel || "Join My Circle",
    features: perksCustomized(c.features)
      ? c.features
      : landing?.features?.length
        ? landing.features.slice(0, 3).map((feature) => ({ ...feature, description: "Members-only access" }))
        : c.features,
    proofHeadline: landing?.memberProof?.count
      ? `${landing.memberProof.count} ${landing.memberProof.label || "Fans Already Joined"}`
      : c.proofHeadline,
  };
}

export default CreatorLinkPage;
