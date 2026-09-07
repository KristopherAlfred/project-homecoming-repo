import { ArrowRight, Check, Clock, Crown, Flame, Gift, Heart, Lock, Music, ShoppingBag, Sparkles, Star, Ticket, Users, Video, Zap, type LucideIcon } from "lucide-react";
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
  sparkle: Sparkles,
  sparkles: Sparkles,
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
  const photo = template.creator?.videoPoster || template.photo || l.heroImage;
  const video = template.creator?.videoSrc;
  const features = (template.creator?.features ?? l.features ?? []).slice(0, 3);
  const proof = l.memberProof;
  const ctaFrom = l.ctaGradientFrom ?? theme.buttonBg ?? accent;
  const ctaTo = l.ctaGradientTo ?? ctaFrom;

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden bg-neutral-950"
      style={{
        background: `linear-gradient(165deg, ${
          l.backgroundGradientFrom ?? theme.bgGradientFrom ?? theme.bg
        }, ${l.backgroundGradientTo ?? theme.bg})`,
        color: text,
      }}
    >
      {/* hero photo — fills the top of the card, fades into the page bg */}
      <div className="absolute inset-0 overflow-hidden">
        {video ? (
          <video src={video} autoPlay loop muted playsInline className="h-full w-full object-cover" />
        ) : photo ? (
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
            background: `linear-gradient(to bottom, rgba(0,0,0,.52) 0%, rgba(0,0,0,.12) 38%, rgba(0,0,0,.58) 100%)`,
          }}
        />
        <div className="absolute inset-x-0 top-0 h-1/3" style={{ background: `radial-gradient(ellipse at top, ${accent}55, transparent 68%)` }} />
      </div>

      {/* copy */}

      <div className="relative z-10 flex flex-1 flex-col items-center justify-end gap-1.5 px-2.5 pb-3 text-center">
        <div className="h-8 w-8 rounded-full border border-white/35 bg-white/15 backdrop-blur-md" />
        <p
          className="whitespace-pre-line font-display text-[12px] font-black leading-[1.05]"
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
          {template.creator?.name || template.athlete || l.headline || template.label}
        </p>
        <p className="line-clamp-3 text-[6px] leading-[1.5]" style={{ color: muted }}>
          {template.creator?.bio || l.body || template.vibe}
        </p>

        {/* feature strip */}
        {features.length ? (
          <div
            className="grid w-full grid-cols-3 gap-1"
            style={{
              borderRadius: 8,
            }}
          >
            {features.map((f) => {
              const Icon = ICONS[String(f.icon || "").toLowerCase()] ?? Star;
              return (
                <div key={f.id} className="flex min-w-0 flex-col items-center gap-0.5 rounded-lg border border-white/20 bg-white/10 px-0.5 py-1.5 backdrop-blur-md text-center">
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
           className="flex w-full items-center justify-center gap-1 py-2"
          style={{
            background: `linear-gradient(${l.ctaGradientAngle ?? 90}deg, ${ctaFrom}, ${ctaTo})`,
            color: l.ctaText ?? theme.buttonText ?? "#000",
            borderRadius: Math.min(l.ctaRadius ?? theme.buttonRadius ?? 10, 999) / 2 || 6,
              boxShadow: `0 0 18px ${accent}66`,
          }}
        >
          <span className="text-[6.5px] font-extrabold uppercase tracking-[0.14em]">
             {template.creator?.ctaLabel || l.ctaLabel || "Join My Circle"}
          </span>
          {l.ctaShowArrow ? <ArrowRight size={7} strokeWidth={2.4} /> : null}
        </div>

        {/* members row */}
        {proof || template.creator ? (
          <div
            className="flex items-center gap-1.5 px-1.5 py-1"
            style={{
              background: "rgba(255,255,255,.1)",
              border: "1px solid rgba(255,255,255,.2)",
              borderRadius: 999,
              backdropFilter: "blur(12px)",
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
              <p className="text-[7px] font-extrabold" style={{ color: accent }}>
                {template.creator?.proofHeadline || `${proof?.count ?? "100K+"} ${proof?.label ?? "Fans Already Joined"}`}
              </p>
              <p className="truncate text-[5px]" style={{ color: proof?.labelColor ?? muted }}>
                {template.creator?.proofSupporting || "Be part of the inner circle"}
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
                 {proof?.extraLabel || "+"}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
