import {
  ArrowRight,
  CalendarDays,
  Camera,
  Check,
  Clock,
  Crown,
  Flame,
  Gift,
  Heart,
  Lock,
  Menu,
  Music,
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
import type { ExperienceTemplate } from "../../lib/experienceTemplates";

const ICONS: Record<string, LucideIcon> = {
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
};

const AVATARS = [
  "https://i.pravatar.cc/64?img=5",
  "https://i.pravatar.cc/64?img=12",
  "https://i.pravatar.cc/64?img=32",
  "https://i.pravatar.cc/64?img=45",
];

/**
 * Miniature, fully-composed render of a full-layout template — header row,
 * hero photo, headline, body, 4-icon feature strip, arrow CTA and members
 * row, exactly like the real fan-app landing page it applies.
 */
export function TemplateMiniPreview({ template }: { template: ExperienceTemplate }) {
  const l = template.landing ?? {};
  const theme = template.theme;
  const light = /^#(f|e)/i.test(String(l.backgroundColor ?? theme.bg ?? "#000"));
  const text = theme.text ?? (light ? "#111111" : "#FFFFFF");
  const muted = theme.muted ?? (light ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.6)");
  const accent = l.accentColor ?? theme.accent ?? "#8FE3B8";
  const photo = template.photo;
  const features = (l.features ?? []).slice(0, 4);
  const proof = l.memberProof;
  const ctaFrom = l.ctaGradientFrom ?? theme.buttonBg ?? accent;
  const ctaTo = l.ctaGradientTo ?? ctaFrom;

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{
        background: `linear-gradient(165deg, ${
          l.backgroundGradientFrom ?? theme.bgGradientFrom ?? theme.bg
        }, ${l.backgroundGradientTo ?? theme.bg})`,
        color: text,
      }}
    >
      {/* hero photo — fills the top of the card, fades into the page bg */}
      <div className="absolute inset-x-0 top-0 h-[62%] overflow-hidden">
        {photo ? (
          <img
            src={photo}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
            style={{ objectPosition: "center top" }}
          />
        ) : null}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, ${
              l.backgroundColor ?? theme.bg
            }BF 0%, transparent 22%, transparent 58%, ${l.backgroundColor ?? theme.bg} 99%)`,
          }}
        />
      </div>

      {/* header */}
      <div className="relative z-20 flex items-start gap-1.5 px-2.5 pt-2.5">
        <span
          className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px]"
          style={{ background: `${accent}22`, color: accent }}
        >
          <Crown size={10} strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-[8px] font-extrabold uppercase leading-tight tracking-[0.1em]"
            style={{ color: template.brand.wordmarkColor ?? text }}
          >
            {template.label}
          </p>
          <p className="truncate text-[6px] leading-tight" style={{ color: muted }}>
            {template.brand.tagline ?? template.vibe}
          </p>
        </div>
        <span
          className="flex h-4 w-4 items-center justify-center rounded-full border"
          style={{ borderColor: `${accent}55`, color: l.menuButtonColor ?? accent }}
        >
          <Menu size={8} strokeWidth={2} />
        </span>
      </div>

      {/* copy */}

      <div className="relative z-10 -mt-2 flex flex-1 flex-col justify-end gap-1.5 px-2.5 pb-2.5">
        <p
          className="whitespace-pre-line text-[10px] font-extrabold uppercase leading-[1.05] tracking-tight"
          style={
            l.headlineGradientFrom && l.headlineGradientFrom !== l.headlineGradientTo
              ? {
                  backgroundImage: `linear-gradient(90deg, ${l.headlineGradientFrom}, ${l.headlineGradientTo})`,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }
              : { color: text }
          }
        >
          {l.headline ?? "Join the club"}
        </p>
        <p className="line-clamp-3 text-[6px] leading-[1.5]" style={{ color: muted }}>
          {l.body}
        </p>

        {/* feature strip */}
        {features.length ? (
          <div
            className="grid grid-cols-4 gap-0.5 px-0.5 py-1"
            style={{
              background: l.featureBg,
              border: `1px solid ${l.featureBorderColor ?? "transparent"}`,
              borderRadius: (l.featureRadius ?? 12) / 2,
            }}
          >
            {features.map((f) => {
              const Icon = ICONS[String(f.icon || "").toLowerCase()] ?? Star;
              return (
                <div key={f.id} className="flex flex-col items-center gap-0.5 text-center">
                  <Icon size={9} strokeWidth={1.6} style={{ color: l.featureIconColor ?? accent }} />
                  <span
                    className="text-[4.5px] font-bold uppercase leading-[1.15] tracking-[0.04em]"
                    style={{ color: l.featureTextColor ?? text }}
                  >
                    {f.label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}

        {/* cta */}
        <div
          className="flex items-center justify-center gap-1 py-1.5"
          style={{
            background: `linear-gradient(${l.ctaGradientAngle ?? 90}deg, ${ctaFrom}, ${ctaTo})`,
            color: l.ctaText ?? theme.buttonText ?? "#000",
            borderRadius: Math.min(l.ctaRadius ?? theme.buttonRadius ?? 10, 999) / 2 || 6,
          }}
        >
          <span className="text-[6.5px] font-extrabold uppercase tracking-[0.14em]">
            {l.ctaLabel ?? "Join"}
          </span>
          {l.ctaShowArrow ? <ArrowRight size={7} strokeWidth={2.4} /> : null}
        </div>

        {/* members row */}
        {proof ? (
          <div
            className="flex items-center gap-1.5 px-1.5 py-1"
            style={{
              background: proof.bg,
              border: `1px solid ${proof.borderColor ?? "transparent"}`,
              borderRadius: (proof.radius ?? 16) / 2,
            }}
          >
            <div className="flex -space-x-1">
              {AVATARS.slice(0, 3).map((src) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  loading="lazy"
                  className="h-3 w-3 rounded-full border border-white/40 object-cover"
                />
              ))}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-[7px] font-extrabold" style={{ color: proof.countColor ?? accent }}>
                {proof.count}
              </p>
              <p className="truncate text-[5px]" style={{ color: proof.labelColor ?? muted }}>
                {proof.label}
              </p>
            </div>
            <div className="flex items-center gap-0.5">
              {AVATARS.slice(0, 3).map((src) => (
                <img
                  key={`t-${src}`}
                  src={src}
                  alt=""
                  loading="lazy"
                  className="h-3.5 w-3.5 rounded-[3px] object-cover"
                />
              ))}
              <span
                className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-[4.5px] font-bold"
                style={{ background: `${accent}26`, color: accent }}
              >
                {proof.extraLabel}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
