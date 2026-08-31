import type { CSSProperties } from "react";
import { Check, Lock, ShieldCheck, Sparkles } from "lucide-react";

import type { ExperiencePageConfig } from "../../lib/experienceConfig";

export type JoinProvider = "google" | "x" | "apple" | "facebook";

export const JOIN_PROVIDERS: { id: JoinProvider; label: string }[] = [
  { id: "google", label: "Continue with Google" },
  { id: "x", label: "Continue with X" },
  { id: "apple", label: "Continue with Apple" },
  { id: "facebook", label: "Continue with Facebook" },
];

/** Brand glyphs drawn inline so the sheet never depends on remote logo files. */
function ProviderGlyph({ id, size = 15 }: { id: JoinProvider; size?: number }) {
  if (id === "google") {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
        <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.6 30.2.5 24 .5 14.6.5 6.5 5.9 2.6 13.8l7.9 6.1C12.4 14 17.7 9.5 24 9.5Z" />
        <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-2.8-.4-4.1H24v8.5h12.7c-.3 2.1-1.6 5.2-4.7 7.3l7.7 6c4.5-4.2 6.8-10.3 6.8-17.7Z" />
        <path fill="#FBBC05" d="M10.5 28.1c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.1C1 16.1 0 19.9 0 23.5s1 7.4 2.6 10.7l7.9-6.1Z" />
        <path fill="#34A853" d="M24 47.5c6.2 0 11.5-2 15.3-5.6l-7.7-6c-2.1 1.4-4.8 2.4-7.6 2.4-6.3 0-11.6-4.5-13.5-10.2l-7.9 6.1C6.5 42.1 14.6 47.5 24 47.5Z" />
      </svg>
    );
  }
  if (id === "x") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M17.53 3H20.5l-6.5 7.43L21 21h-5.9l-4.06-5.3L6.3 21H3.32l6.83-7.8L3 3h6.02l3.8 5.02L17.53 3Zm-1.05 16.2h1.64L7.6 4.71H5.84l10.64 14.49Z" />
      </svg>
    );
  }
  if (id === "apple") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M16.36 12.78c.02 2.62 2.3 3.49 2.33 3.5-.02.06-.36 1.24-1.2 2.45-.72 1.05-1.47 2.09-2.66 2.11-1.16.02-1.54-.69-2.87-.69-1.33 0-1.75.67-2.85.71-1.14.04-2-1.11-2.73-2.15-1.58-2.28-2.79-6.44-1.17-9.26.81-1.4 2.25-2.28 3.81-2.31 1.12-.02 2.18.75 2.87.75.68 0 1.97-.93 3.32-.79.57.02 2.16.21 3.18 1.72-.08.05-1.9 1.11-1.88 3.31M14.2 4.3c.61-.74 1.02-1.77.91-2.8-.9.04-2 .6-2.63 1.34-.57.65-1.06 1.7-.93 2.71 1.01.08 2.03-.51 2.65-1.25" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#1877F2"
        d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12Z"
      />
    </svg>
  );
}

/**
 * The join / sign-in bottom sheet used everywhere the fan app runs: studio
 * preview, full "play the app" preview and the public /app/:slug viewer.
 * All colors come from the page config so every template gets its own look.
 */
export function JoinAuthSheet({
  page,
  onSelect,
  onClose,
  compact = false,
}: {
  page: ExperiencePageConfig;
  onSelect: (provider: JoinProvider) => void;
  onClose?: () => void;
  compact?: boolean;
}) {
  const accent = page.accentColor || "#8FE3B8";
  const panel = `linear-gradient(168deg, ${page.unlockPanelBgFrom || "rgba(16,16,18,0.97)"} 0%, ${
    page.unlockPanelBgTo || "rgba(6,6,7,0.985)"
  } 100%)`;

  return (
    <div className="absolute inset-0 z-[170] flex flex-col justify-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-[3px]"
      />
      <div
        className={`relative mx-2 mb-2 overflow-hidden rounded-[26px] border ${compact ? "px-3.5 pb-4 pt-7" : "px-4 pb-5 pt-8"}`}
        style={{
          borderColor: page.unlockPanelBorderColor || "rgba(255,255,255,0.14)",
          background: panel,
          boxShadow: `0 -18px 60px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04), 0 0 34px ${
            page.unlockGlowColor || accent
          }33`,
        }}
      >
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-24"
          style={{ background: `radial-gradient(120% 100% at 50% 0%, ${accent}22, transparent 70%)` }}
        />
        <span className="absolute left-1/2 top-2.5 h-1 w-10 -translate-x-1/2 rounded-full bg-white/25" />
        <span
          className="absolute left-1/2 top-0 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border"
          style={{
            borderColor: accent,
            color: accent,
            background: "#050505",
            boxShadow: `0 0 22px ${accent}55`,
          }}
        >
          <Lock size={15} strokeWidth={2.2} />
        </span>

        <p
          className="relative mt-1 text-center font-display text-[15px] font-extrabold uppercase tracking-[0.14em]"
          style={{ color: "#fff" }}
        >
          {page.unlockHeadline || page.headline || "Join the circle"}
        </p>
        <p className="relative mx-auto mt-1.5 max-w-[16rem] text-center text-[10.5px] leading-relaxed text-white/70">
          {page.unlockBody || page.body || "Exclusive drops, early access and real connection."}
        </p>

        <div className="relative mt-4 space-y-2">
          {JOIN_PROVIDERS.map((p) => {
            const light = p.id === "google";
            const style: CSSProperties = light
              ? { background: "#fff", color: "#111", borderColor: "rgba(255,255,255,0.9)" }
              : {
                  background: "rgba(255,255,255,0.06)",
                  color: "#fff",
                  borderColor: "rgba(255,255,255,0.16)",
                };
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelect(p.id)}
                className="flex h-10 w-full items-center gap-2.5 rounded-xl border px-3 text-[11px] font-semibold tracking-wide transition hover:brightness-110 active:scale-[0.985]"
                style={style}
              >
                <ProviderGlyph id={p.id} />
                <span className="flex-1 text-center pr-4">{p.label}</span>
              </button>
            );
          })}
        </div>

        <p className="relative mt-3 flex items-center justify-center gap-1 text-[8.5px] uppercase tracking-[0.14em] text-white/45">
          <ShieldCheck size={10} />
          {page.unlockFooter || "100% private · no spam · you're in control"}
        </p>
      </div>
    </div>
  );
}

/**
 * "You're in" confirmation badge — a glowing check ring with a member chip.
 * Rendered as its own draggable stage layer on the You're In page.
 */
export function JoinedBadge({
  accent,
  label = "MEMBER · VERIFIED",
  size = 74,
}: {
  accent: string;
  label?: string;
  size?: number;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 50% 35%, ${accent}33, rgba(0,0,0,0.35))`,
          border: `1.5px solid ${accent}`,
          boxShadow: `0 0 34px ${accent}66, inset 0 0 22px ${accent}22`,
        }}
      >
        <span
          className="absolute inset-[-9px] rounded-full"
          style={{ border: `1px solid ${accent}33` }}
        />
        <Check size={Math.round(size * 0.42)} strokeWidth={3} style={{ color: accent }} />
        <Sparkles
          size={13}
          className="absolute -right-1 -top-1"
          style={{ color: accent }}
        />
      </span>
      {label ? (
        <span
          className="rounded-full border px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.2em]"
          style={{ borderColor: `${accent}55`, color: accent, background: "rgba(0,0,0,0.35)" }}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}
