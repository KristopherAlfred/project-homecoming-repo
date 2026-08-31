import type { CSSProperties } from "react";

type TintedBrandLogoProps = {
  src: string;
  color: string;
  size?: number | string;
  className?: string;
  /** When false, show the original image colors (for photo uploads). */
  tint?: boolean;
  style?: CSSProperties;
};

/**
 * Recolors illustrated / AI logos via CSS mask (alpha).
 * Best with marks on transparent backgrounds — use drop-shadow so glow follows the shape.
 */
export function TintedBrandLogo({
  src,
  color,
  size = 40,
  className = "",
  tint = true,
  style,
}: TintedBrandLogoProps) {
  const dim = typeof size === "number" ? `${size}px` : size;

  if (!tint) {
    return (
      <img
        src={src}
        alt=""
        className={className}
        draggable={false}
        style={{
          width: dim,
          height: dim,
          objectFit: "contain",
          filter: `drop-shadow(0 0 10px ${color}66)`,
          background: "transparent",
          ...style,
        }}
      />
    );
  }

  return (
    <span
      className={className}
      aria-hidden
      style={
        {
          display: "inline-block",
          width: dim,
          height: dim,
          flexShrink: 0,
          backgroundColor: color,
          WebkitMaskImage: `url(${src})`,
          WebkitMaskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskImage: `url(${src})`,
          maskSize: "contain",
          maskRepeat: "no-repeat",
          maskPosition: "center",
          maskMode: "alpha",
          filter: `drop-shadow(0 0 10px ${color}88)`,
          ...style,
        } as CSSProperties
      }
    />
  );
}
