/**
 * Shared "blend into the background" treatment for full-bleed hero art.
 *
 * The image is masked with a vertical alpha ramp so it dissolves into the page
 * instead of ending on a hard edge, and a matching colour wash is layered on
 * top so the transition lands exactly on the page background colour.
 */

type HeroBlendPage = {
  backgroundColor?: string;
  heroOverlayTo?: string;
  heroOverlayOpacity?: number;
};

const MASK =
  "linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 46%, rgba(0,0,0,0.86) 64%, rgba(0,0,0,0.45) 82%, rgba(0,0,0,0) 100%)";

/** Alpha mask that softens the bottom edge of a full-bleed hero image. */
export function heroBlendMaskStyle(): React.CSSProperties {
  return { maskImage: MASK, WebkitMaskImage: MASK } as React.CSSProperties;
}

/** Colour wash that carries the hero into the page background. */
export function heroBlendOverlayStyle(page: HeroBlendPage): React.CSSProperties {
  const base = page.backgroundColor || page.heroOverlayTo || "#000000";
  const tint = page.heroOverlayTo || base;
  return {
    background: [
      `linear-gradient(180deg, ${withAlpha(base, 0.45)} 0%, transparent 22%)`,
      `linear-gradient(180deg, transparent 40%, ${withAlpha(tint, 0.55)} 72%, ${base} 96%, ${base} 100%)`,
    ].join(", "),
    opacity: (page.heroOverlayOpacity ?? 100) / 100,
  };
}

function withAlpha(color: string, alpha: number): string {
  const hex = color.trim();
  if (/^#([0-9a-f]{6})$/i.test(hex)) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `color-mix(in srgb, ${hex} ${Math.round(alpha * 100)}%, transparent)`;
}
