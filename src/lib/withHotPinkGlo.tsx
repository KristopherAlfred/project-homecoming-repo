import type { ReactNode } from "react";
import { HOT_PINK } from "./landingSocials";

/** Renders brand copy with every standalone "GLO" / "Glo" in hot pink. */
export function withHotPinkGlo(text: string, pink: string = HOT_PINK): ReactNode {
  const parts = String(text || "").split(/(GLO|Glo)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    part === "GLO" || part === "Glo" ? (
      <span key={`${part}-${i}`} style={{ color: pink }}>
        {part}
      </span>
    ) : (
      <span key={`${part}-${i}`}>{part}</span>
    ),
  );
}
