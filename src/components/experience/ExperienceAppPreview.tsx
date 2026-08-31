import { useState, type CSSProperties, type ReactNode } from "react";
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
  RotateCcw,
  ShoppingBag,
  Sparkle,
  Star,
  Ticket,
  Trophy,
  User,
  Users,
  Video,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type {
  ExperienceConfig,
  ExperiencePageConfig,
  ExperiencePageKeyName,
  ExperienceStageItem,
} from "../../lib/experienceConfig";
import {
  DEFAULT_LANDING_STAGE,
  experiencePageLabel,
  getStageItem,
  pageBackgroundCss,
  stageGlowStyle,
  stageItemCss,
  stageAlignClass,
  heroObjectPosition,
  heroTransform,
  stageItemRole,
  themeBackgroundCss,
} from "../../lib/experienceConfig";
import { resolveExperiencePreviewUrl } from "../../lib/resolveExperiencePreviewUrl";
import { TintedBrandLogo } from "./TintedBrandLogo";
import { JoinAuthSheet, JoinedBadge } from "./JoinFlow";

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
  home: Home,
  news: Newspaper,
  user: User,
  live: Radio,
};

function Glyph({ name, color, size = 16 }: { name: string; color: string; size?: number }) {
  const Icon = ICONS[String(name || "").toLowerCase()] ?? Star;
  return <Icon size={size} strokeWidth={1.7} style={{ color }} />;
}

/**
 * Read-only, tap-through render of one fan-app page — exactly the composition
 * the athlete arranged in the studio, but with working buttons and tabs.
 */
function PageView({
  experience,
  pageKey,
  onNavigate,
  onCta,
}: {
  experience: ExperienceConfig;
  pageKey: ExperiencePageKeyName;
  onNavigate: (key: ExperiencePageKeyName) => void;
  onCta: () => void;
}) {
  const page: ExperiencePageConfig | undefined =
    experience.pages[pageKey] ?? experience.pages.landing ?? Object.values(experience.pages)[0];
  if (!page) return null;
  const brand = experience.brand;
  const scale = (page.heroScale || 100) / 100;
  const ids = (page.stage?.length ? page.stage : DEFAULT_LANDING_STAGE).map((s) => s.id);

  const render = (id: string): ReactNode => {
    const item: ExperienceStageItem = getStageItem(page, id);
    if (item.hidden) return null;
    const role = stageItemRole(item);
    let body: ReactNode = null;

    if (role === "logo") {
      if (!brand.showLogoImage || !brand.logoSrc) return null;
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
    } else if (role === "wordmark") {
      body = (
        <p
          className="text-[13px] font-bold leading-tight tracking-[0.16em]"
          style={{ color: brand.wordmarkColor, ...stageGlowStyle(item, "text") }}
        >
          {brand.wordmark || "YOUR BRAND"}
        </p>
      );
    } else if (role === "tagline") {
      body = (
        <p className="text-[10px] leading-tight" style={{ color: brand.taglineColor, ...stageGlowStyle(item, "text") }}>
          {brand.tagline}
        </p>
      );
    } else if (role === "hero") {
      if (!page.heroImage) return null;
      const full = (item.h ?? 0) > 0;
      const img = (
        <img
          src={resolveExperiencePreviewUrl(page.heroImage)}
          alt=""
          className={full ? "absolute inset-0 h-full w-full" : "w-full rounded-xl"}
          draggable={false}
          style={{
            objectFit: full ? "cover" : page.heroFit || "cover",
            objectPosition: heroObjectPosition(page),
            transform: heroTransform(page, scale),
            transformOrigin: "top center",
            ...stageGlowStyle(item, "image"),
          }}
        />
      );

      body = full ? (
        <div className="relative h-full w-full overflow-hidden">
          {img}
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
        img
      );
    } else if (role === "titleArt") {
      if (!page.titleImage) return null;
      body = <img src={resolveExperiencePreviewUrl(page.titleImage)} alt="" className="w-full object-contain" />;
    } else if (role === "subhead") {
      if (!page.subhead) return null;
      body = (
        <p
          className={`whitespace-pre-line ${stageAlignClass(item)} text-[11px] font-semibold uppercase leading-relaxed tracking-[0.14em]`}
          style={{ color: page.accentColor, ...stageGlowStyle(item, "text") }}
        >
          {page.subhead}
        </p>
      );
    } else if (role === "headline") {
      const gradient =
        page.headlineGradientFrom && page.headlineGradientTo
          ? `linear-gradient(90deg, ${page.headlineGradientFrom}, ${page.headlineGradientTo})`
          : "";
      body = (
        <p
          className={`whitespace-pre-line ${stageAlignClass(item)} font-display text-2xl font-extrabold leading-[1.05] tracking-[-0.01em]`}
          style={
            gradient
              ? {
                  backgroundImage: gradient,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  color: "transparent",
                }
              : { color: experience.theme.text, ...stageGlowStyle(item, "text") }
          }
        >
          {page.headline}
        </p>
      );
    } else if (role === "body") {
      if (!page.body) return null;
      body = (
        <p
          className={`whitespace-pre-line ${stageAlignClass(item)} text-[11px] leading-relaxed`}
          style={{ color: experience.theme.muted, ...stageGlowStyle(item, "text") }}
        >
          {page.body}
        </p>
      );
    } else if (role === "featureRow") {
      if (!(page.features || []).length) return null;
      const cols = page.featureColumns ?? 2;
      body = cols >= 4 ? (
        <div
          className="grid w-full grid-cols-4"
          style={{
            background: page.featureBg,
            border: `1px solid ${page.featureBorderColor}`,
            borderRadius: page.featureRadius,
          }}
        >
          {page.features.map((feat, i) => (
            <button
              key={feat.id}
              type="button"
              className="flex flex-col items-center gap-1.5 px-1.5 py-2.5 text-center transition active:scale-[0.97]"
              style={i ? { borderLeft: `1px solid ${page.featureBorderColor}` } : undefined}
            >
              <Glyph name={feat.icon} color={page.featureIconColor} />
              <span
                className="text-[8px] font-semibold uppercase leading-[1.25] tracking-[0.04em]"
                style={{ color: page.featureTextColor }}
              >
                {feat.label}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid w-full gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {page.features.map((feat) => (
            <button
              key={feat.id}
              type="button"
              className="flex flex-col gap-1.5 px-2.5 py-2 text-left transition active:scale-[0.97]"
              style={{
                background: page.featureBg,
                border: `1px solid ${page.featureBorderColor}`,
                borderRadius: page.featureRadius,
              }}
            >
              <Glyph name={feat.icon} color={page.featureIconColor} />
              <span className="text-[9px] font-semibold leading-tight" style={{ color: page.featureTextColor }}>
                {feat.label}
              </span>
            </button>
          ))}
        </div>
      );
    } else if (role === "memberProof") {
      const proof = page.memberProof;
      if (!proof?.count) return null;
      body = (
        <div
          className="flex w-full items-center gap-2 px-3 py-2"
          style={{
            background: proof.bg,
            border: `1px solid ${proof.borderColor}`,
            borderRadius: proof.radius,
          }}
        >
          <div className="flex -space-x-2">
            {(proof.avatars || []).slice(0, 4).map((src, i) => (
              <img
                key={`${src}-${i}`}
                src={resolveExperiencePreviewUrl(src)}
                alt=""
                className="h-5 w-5 rounded-full border border-white/25 object-cover"
              />
            ))}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] font-bold" style={{ color: proof.countColor }}>
              {proof.count}
            </span>
            <span className="text-[8px]" style={{ color: proof.labelColor }}>
              {proof.label}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            {(proof.thumbs || []).slice(0, 3).map((src, i) => (
              <img
                key={`${src}-${i}`}
                src={resolveExperiencePreviewUrl(src)}
                alt=""
                className="h-6 w-5 rounded-[4px] object-cover"
              />
            ))}
            {proof.extraLabel ? (
              <span className="flex h-5 items-center justify-center rounded-full border border-white/25 bg-black/60 px-1.5 text-[8px] font-bold text-white">
                {proof.extraLabel}
              </span>
            ) : null}
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
        <div className="flex w-full items-center gap-2">
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
        <img src={resolveExperiencePreviewUrl(page.signatureImage)} alt="" className="w-full object-contain" />
      ) : (
        <p
          className="whitespace-nowrap text-[22px] italic leading-none"
          style={{ color: page.signatureColor || "#FFFFFF" }}
        >
          {page.signatureText}
        </p>
      );
    } else if (role === "cardGrid") {
      const cards = page.cards || [];
      if (!cards.length) return null;
      body = (
        <div className="grid w-full gap-2" style={{ gridTemplateColumns: `repeat(${page.cardColumns || 2}, minmax(0, 1fr))` }}>
          {cards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => onNavigate(card.linkPageKey as ExperiencePageKeyName)}
              className="relative flex min-h-[72px] flex-col justify-end overflow-hidden p-2 text-left transition active:scale-[0.97]"
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
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <span
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.82))" }}
                  />
                </>
              ) : null}
              <span className="relative flex items-center justify-between">
                <Glyph name={card.icon} color={page.cardIconColor} />
                <span
                  className="flex h-4 w-4 items-center justify-center rounded-full"
                  style={{ background: "rgba(255,255,255,0.14)" }}
                >
                  <ArrowRight size={9} strokeWidth={2.4} style={{ color: page.cardTitleColor }} />
                </span>
              </span>
              <span className="relative mt-1.5 text-[10px] font-bold leading-tight" style={{ color: page.cardTitleColor }}>
                {card.title}
              </span>
              {card.subtitle ? (
                <span className="relative text-[8px] leading-tight" style={{ color: page.cardTextColor }}>
                  {card.subtitle}
                </span>
              ) : null}
            </button>
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
      const grad =
        page.ctaGradientFrom && page.ctaGradientTo
          ? `linear-gradient(${page.ctaGradientAngle ?? 90}deg, ${page.ctaGradientFrom}, ${page.ctaGradientTo})`
          : "";
      body = (
        <div className="flex w-full flex-col gap-2">
          <button
            type="button"
            onClick={onCta}
            className="relative flex w-full items-center justify-center gap-2 overflow-hidden py-3 text-[13px] font-extrabold uppercase tracking-[0.14em] transition active:scale-[0.985]"
            style={{
              background: grad || page.ctaBg,
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
            <a
              key={btn.id}
              href={btn.href || "#"}
              target="_blank"
              rel="noreferrer"
              className={`py-2 text-center text-xs font-semibold ${btn.fullWidth === false ? "self-center px-5" : "w-full"}`}
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
            </a>
          ))}
        </div>
      );
    } else if (role === "stamp") {
      const stamp = (experience.stamps || []).find((s) => s.id === item.stampId);
      if (!stamp?.src) return null;
      body = (
        <TintedBrandLogo
          src={resolveExperiencePreviewUrl(stamp.src)}
          color={brand.logoColor}
          tint={brand.logoTint !== false}
          size={44}
        />
      );
    }

    if (!body) return null;
    return (
      <div key={id} style={stageItemCss(item) as CSSProperties}>
        {body}
      </div>
    );
  };

  const tabs = (experience.nav?.tabs ?? []).filter((t) => !t.hidden);
  const showTabs = !experience.nav?.hidden && pageKey !== "landing" && pageKey !== "youreIn" && tabs.length > 0;

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ background: pageBackgroundCss(page) || themeBackgroundCss(experience.theme) }}
    >
      {ids.map(render)}
      {page.showMenuButton ? (
        <div
          className="absolute right-3 top-3 z-[130] flex h-8 w-8 items-center justify-center rounded-full border"
          style={{
            borderColor: `${page.menuButtonColor}55`,
            color: page.menuButtonColor,
            background: "rgba(0,0,0,0.35)",
          }}
        >
          <Menu size={14} strokeWidth={2} />
        </div>
      ) : null}
      {showTabs ? (
        <div
          className="absolute inset-x-0 bottom-0 z-[140] flex items-stretch justify-around border-t px-1 py-2"
          style={{
            background: experience.nav.bg,
            borderColor: experience.nav.borderColor,
            borderTopLeftRadius: experience.nav.radius,
            borderTopRightRadius: experience.nav.radius,
          }}
        >
          {tabs.map((tab) => {
            const active = tab.pageKey === pageKey;
            const color = active ? experience.nav.activeColor : experience.nav.inactiveColor;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onNavigate(tab.pageKey)}
                className="flex flex-1 flex-col items-center gap-0.5 transition active:scale-95"
              >
                <Glyph name={tab.icon} color={color} size={17} />
                {experience.nav.showLabels ? (
                  <span className="text-[7px] font-semibold uppercase tracking-[0.12em]" style={{ color }}>
                    {tab.label}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Full-screen "play the app" preview: real navigation, working buttons and the
 * join flow (landing → unlock sheet → you're in → home), rendered from the
 * exact config being edited.
 */
export function ExperienceAppPreview({
  experience,
  onClose,
  startPage = "landing",
}: {
  experience: ExperienceConfig;
  onClose: () => void;
  startPage?: ExperiencePageKeyName;
}) {
  const [pageKey, setPageKey] = useState<ExperiencePageKeyName>(startPage);
  const [unlock, setUnlock] = useState(false);
  const page = experience.pages[pageKey] ?? experience.pages.landing;



  const cta = () => {
    if (pageKey === "landing") {
      setUnlock(true);
      return;
    }
    if (pageKey === "youreIn") {
      setPageKey("home");
      return;
    }
    const first = (experience.nav?.tabs ?? []).find((t) => !t.hidden && t.pageKey !== pageKey);
    if (first) setPageKey(first.pageKey);
  };

  const reset = () => {
    setUnlock(false);
    setPageKey("landing");
  };

  return (
    <div className="fixed inset-0 z-[300] flex flex-col items-center gap-4 overflow-y-auto bg-black/85 p-4 backdrop-blur-sm sm:p-8">
      <div className="flex w-full max-w-3xl flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-dt-red">Preview mode</p>
          <h3 className="font-display text-lg text-white">
            {experiencePageLabel(experience?.pages, pageKey)} · tap the app like a fan would
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white/70 hover:text-white"
          >
            <RotateCcw size={13} /> Restart flow
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-xl bg-dt-red px-3 py-2 text-xs font-semibold text-white"
          >
            <X size={13} /> Close preview
          </button>
        </div>
      </div>

      <div className="relative w-full max-w-[360px] overflow-hidden rounded-[2.6rem] border border-white/15 bg-black shadow-[0_0_70px_rgba(var(--theme-accent-rgb),0.18)]">
        <div className="pointer-events-none absolute left-1/2 top-2 z-[200] h-5 w-28 -translate-x-1/2 rounded-full bg-black/90" />
        <div className="relative h-[680px] w-full">
          <PageView experience={experience} pageKey={pageKey} onNavigate={setPageKey} onCta={cta} />

          {unlock && pageKey === "landing" ? (
            <JoinAuthSheet
              page={page}
              onSelect={() => {
                setUnlock(false);
                setPageKey("youreIn");
              }}
              onClose={() => setUnlock(false)}
            />
          ) : null}
        </div>
      </div>

      <p className="pb-4 text-center text-[11px] text-white/40">
        Tap the CTA and the bottom tabs to move through the app — this is exactly what fans will see.
      </p>
    </div>
  );
}

/** The bare fan-app screen renderer — reused by the public /app/:slug viewer. */
export { PageView as FanAppPageView };
