import { useState } from "react";
import { ArrowRight, ChevronDown, ChevronRight, Clock, Gift, Play, Sparkles, Star, type LucideIcon } from "lucide-react";


import type { CreatorProfile } from "../../lib/creatorProfile";
import { resolveExperiencePreviewUrl } from "../../lib/resolveExperiencePreviewUrl";

/**
 * Cinematic link-in-bio creator page.
 *
 * Fully reusable: pass a CreatorProfile (video, photo, name, handle, socials,
 * follower count, bio, featured cards) and the layout never needs to change.
 */

function VerifiedBadge({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-label="Verified" className="shrink-0">
      <path
        fill="#1D9BF0"
        d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81C14.67 2.63 13.43 1.75 12 1.75s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81S3.48 7.27 3.94 8.66C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34Z"
      />
      <path
        fill="#fff"
        d="m10.68 15.63-3.1-3.1 1.42-1.42 1.68 1.69 4.32-4.33 1.42 1.42-5.74 5.74Z"
      />
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

/** Linktree-style embedded preview row: site screenshot, favicon, title, host. */
function LinkPreviewRow({
  card,
  compact,
}: {
  card: { id: string; image?: string; caption?: string; overlayTitle?: string; url?: string };
  compact: boolean;
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
      className="creator-link-row group relative block w-full overflow-hidden text-left"
    >
      <div className={`creator-link-preview relative w-full overflow-hidden ${compact ? "h-28" : "h-52"}`}>
        {screenshot && !failed ? (
          <img
            src={screenshot}
            alt=""
            loading="lazy"
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
              compact ? "px-2 py-0.5 text-[7px]" : "px-3 py-1 text-[10px]"
            }`}
          >
            {favicon ? <img src={favicon} alt="" className={compact ? "h-2.5 w-2.5" : "h-3.5 w-3.5"} /> : null}
            {host}
          </span>
        ) : null}

        <div
          className={`absolute inset-x-0 bottom-0 grid grid-cols-[minmax(0,1fr)_auto] items-end ${
            compact ? "gap-2 p-3" : "gap-4 p-5"
          }`}
        >
          <span className="min-w-0">
            <span
              className={`creator-link-title block truncate ${compact ? "text-[12px]" : "text-[20px]"}`}
            >
              {title}
            </span>
            {card.overlayTitle && card.caption ? (
              <span
                className={`creator-link-sub mt-0.5 block truncate ${compact ? "text-[7px]" : "text-[11px]"}`}
              >
                {card.overlayTitle}
              </span>
            ) : null}
          </span>
          <span
            className={`creator-link-go inline-grid place-items-center rounded-full ${
              compact ? "h-6 w-6" : "h-10 w-10"
            }`}
          >
            <ChevronRight size={compact ? 12 : 18} strokeWidth={2.4} />
          </span>
        </div>
      </div>
    </a>
  );
}

/** Horizontal glass rail with edge fade + pagination dots. */
function GlassRail({
  children,
  pages,
  variant = "dots",
  className = "",
}: {
  children: React.ReactNode;
  pages: number;
  variant?: "dots" | "bars";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const ratio = max > 0 ? el.scrollLeft / max : 0;
    setActive(Math.round(ratio * (pages - 1)));
  };

  return (
    <div className="w-full">
      <div ref={ref} onScroll={onScroll} className={`circle-rail ${className}`}>
        {children}
      </div>
      {pages > 1 ? (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {Array.from({ length: pages }).map((_, index) => (
            <span
              key={index}
              className={`${variant === "bars" ? "circle-page-bar" : "circle-page-dot"} ${
                index === active ? "is-active" : ""
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Smoky charcoal glass "circle." panel: live members carousel + membership perks rail. */
function CircleGlassSection({
  compact,
  members,
  perks,
}: {
  compact: boolean;
  members: Array<{ name: string; note: string; time: string; face: string }>;
  perks: Array<{ id: string; icon: string; label: string; description: string }>;
}) {
  const roster = [...members, ...members];
  return (
    <section className={`circle-panel ${compact ? "px-4 py-5" : "px-7 py-9"}`}>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className={`circle-title ${compact ? "text-[26px]" : "text-[44px]"}`}>circle.</h2>
          <p className={`circle-status mt-1 flex items-center gap-2 ${compact ? "text-[9px]" : "text-[13px]"}`}>
            <span className="circle-dot" />
            1,284 online now
          </p>
        </div>
        <span className={`circle-live flex items-center gap-2 ${compact ? "text-[7px]" : "text-[10px]"}`}>
          <span className="circle-dot" /> LIVE
        </span>
      </header>

      <div className={compact ? "mt-4" : "mt-7"}>
        <div className="circle-strip">
          <GlassRail pages={4}>
            {roster.map((fan, index) => (
              <div
                key={`${fan.name}-${index}`}
                className={`circle-member ${compact ? "gap-2 px-3 py-2" : "gap-3 px-5 py-3"}`}
              >
                {fan.face ? (
                  <img src={fan.face} alt="" className={`circle-avatar ${compact ? "h-8 w-8" : "h-11 w-11"}`} />
                ) : (
                  <span className={`circle-avatar ${compact ? "h-8 w-8" : "h-11 w-11"}`} />
                )}
                <span className="min-w-0 leading-tight">
                  <strong className={`circle-member-name block truncate ${compact ? "text-[10px]" : "text-[14px]"}`}>
                    {fan.name}
                  </strong>
                  <span className={`circle-member-note block truncate ${compact ? "text-[7px]" : "text-[11px]"}`}>
                    {fan.note}
                  </span>
                </span>
              </div>
            ))}
          </GlassRail>
        </div>
      </div>

      <div className={`text-center ${compact ? "mt-5" : "mt-9"}`}>
        <p className={`circle-lead ${compact ? "text-[12px]" : "text-[19px]"}`}>
          A more private space for what&apos;s next.
        </p>
        <p className={`circle-sub mt-1 ${compact ? "text-[9px]" : "text-[14px]"}`}>
          Real people. Real moments. A closer connection.
        </p>
        <span className={`circle-hairline ${compact ? "mt-4" : "mt-7"}`} />
      </div>

      {perks.length ? (
        <div className={compact ? "mt-5" : "mt-8"}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className={`circle-eyebrow ${compact ? "text-[7px]" : "text-[11px]"}`}>MEMBERSHIP PERKS</span>
            <span className={`circle-swipe inline-flex items-center gap-1 ${compact ? "text-[7px]" : "text-[11px]"}`}>
              Swipe to explore <ChevronRight size={compact ? 10 : 14} />
            </span>
          </div>
          <GlassRail pages={3} variant="bars">
            {perks.map((perk) => {
              const Icon = FEATURE_ICONS[perk.icon.toLowerCase()] ?? Star;
              return (
                <div
                  key={perk.id}
                  className={`circle-perk ${compact ? "min-w-[112px] px-3" : "min-w-[188px] px-7"}`}
                >
                  <span className={`circle-perk-icon ${compact ? "h-10 w-10" : "h-16 w-16"}`}>
                    <Icon size={compact ? 16 : 24} strokeWidth={1.4} />
                  </span>
                  <strong className={`circle-perk-title mt-3 block ${compact ? "text-[10px]" : "text-[16px]"}`}>
                    {perk.label}
                  </strong>
                  <span className={`circle-perk-desc mt-1 block ${compact ? "text-[7px]" : "text-[12px]"}`}>
                    {perk.description}
                  </span>
                </div>
              );
            })}
          </GlassRail>
        </div>
      ) : null}
    </section>
  );
}


export function CreatorLinkPage({
  profile,
  compact = false,
  className = "",
  onJoin,
  joinLabel,
  accentColor = "#9EF7C5",
}: {
  profile: CreatorProfile;
  /** Phone-sized rendering (studio preview). */
  compact?: boolean;
  className?: string;
  /** Triggers the join / subscribe flow. */
  onJoin?: () => void;
  joinLabel?: string;
  accentColor?: string;
}) {
  const video = resolveExperiencePreviewUrl(profile.videoSrc);
  const poster = resolveExperiencePreviewUrl(profile.videoPoster);
  const photo = resolveExperiencePreviewUrl(profile.photo);
  const cta = joinLabel || profile.ctaLabel || "Join My Circle";
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
  const exploreItems = profile.featured.length
    ? profile.featured
    : featureItems.map((feature) => ({
        id: `link-${feature.id}`,
        image: poster || photo,
        caption: feature.label,
        overlayTitle: feature.description,
        url: "",
      }));
  return (
    <div
      className={`creator-glass-page relative h-full w-full overflow-y-auto ${className}`}
      style={{
        scrollbarWidth: "none",
        "--creator-accent": accentColor,
      } as React.CSSProperties}
    >
      {/* ── Top zone: media only ─────────────────────────────── */}
      <section
        className={`relative w-full text-white ${compact ? "h-[52%] min-h-[290px]" : "h-[64vh] min-h-[560px]"}`}
      >
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
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
              className="creator-hero-media h-full w-full object-cover"
            />
          ) : poster ? (
            <img key={poster} src={poster} alt="" className="creator-hero-media h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-neutral-950" />
          )}
          <div className="creator-media-overlay pointer-events-none absolute inset-0" />
          <div className="creator-accent-glow pointer-events-none absolute inset-x-0 top-0 h-[60%]" />
        </div>

        <div
          className={`relative z-10 mx-auto flex h-full w-full max-w-[520px] flex-col items-start justify-end text-left ${
            compact ? "pt-10" : "pt-16"
          } ${compact ? "px-6 pb-12" : "px-8 pb-24"}`}
        >
          <div className="flex min-w-0 max-w-full items-center gap-2 whitespace-nowrap">
            <h1
              className={`creator-name min-w-0 leading-none whitespace-nowrap ${
                compact ? "text-[30px]" : "text-[56px] sm:text-[64px]"
              }`}
            >
              {profile.name}
            </h1>
            {profile.verified ? <VerifiedBadge size={compact ? 15 : 22} /> : null}
          </div>

          <div className={`flex flex-wrap items-center ${compact ? "mt-2 gap-2" : "mt-3 gap-3"}`}>
            {profile.handle ? (
              <p className={`font-medium text-white/65 ${compact ? "text-[9px]" : "text-sm"}`}>
                {profile.handle.startsWith("@") ? profile.handle : `@${profile.handle}`}
              </p>
            ) : null}
            {profile.followerCount ? (
              <button
                type="button"
                className={`creator-follower-pill inline-flex w-fit items-center gap-1.5 rounded-full backdrop-blur-md ${
                  compact ? "px-2.5 py-1 text-[8px]" : "px-3.5 py-2 text-xs"
                }`}
              >
                <span className="font-bold">{profile.followerCount}</span>
                <span className="text-white/55">{profile.followerLabel}</span>
                <ChevronDown size={compact ? 10 : 14} className="text-white/45" />
              </button>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onJoin}
            className={`creator-primary-cta group mt-4 flex w-full max-w-[420px] items-center justify-center gap-2 transition duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] ${
              compact ? "h-11 text-[11px]" : "h-14 text-[15px]"
            }`}
          >
            {cta}
            <ArrowRight size={compact ? 14 : 18} strokeWidth={2.2} />
          </button>
          <p className={`creator-consent mt-2 ${compact ? "text-[6px]" : "text-[9px]"}`}>{profile.joinMicrocopy}</p>
        </div>
      </section>

      {/* ── Bottom zone: editorial membership experience ── */}
      <section
        className={`creator-sheet relative z-20 -mt-12 w-full ${
          compact ? "min-h-[58%] px-5 pb-10 pt-12" : "px-8 pb-14 pt-20"
        }`}
      >
        <div className="mx-auto flex w-full max-w-[520px] flex-col text-left">
          {profile.bio ? (
            <p
              className={`creator-intro max-w-[440px] leading-snug ${
                compact ? "text-[15px]" : "text-[30px]"
              }`}
            >
              {profile.bio}
            </p>
          ) : null}

          {profile.secondaryHandle ? (
            <p className={`creator-sheet-muted mt-2 ${compact ? "text-[9px]" : "text-sm"}`}>
              {profile.secondaryHandle}
            </p>
          ) : null}

          <div className={compact ? "mt-4 w-full" : "mt-9 w-full"}>
            <CircleGlassSection
              compact={compact}
              members={fanActivity.map((fan, index) => ({
                ...fan,
                face: proofFaces[index % Math.max(proofFaces.length, 1)] || "",
              }))}
              perks={featureItems}
            />
          </div>


          {exploreItems.length ? (
            <div className={compact ? "mt-4 w-full" : "mt-10 w-full"}>
              <div className={`grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 ${compact ? "mb-2" : "mb-5"}`}>
                <span className={`creator-display ${compact ? "text-[15px]" : "text-[28px]"}`}>Live links</span>
                <span className={`creator-section-label font-bold uppercase ${compact ? "text-[7px]" : "text-[10px]"}`}>Explore all</span>
              </div>
              <div className={`flex w-full flex-col ${compact ? "gap-2.5" : "gap-4"}`}>
                {exploreItems.map((card) => (
                  <LinkPreviewRow key={card.id} card={card} compact={compact} />
                ))}
              </div>

            </div>
          ) : null}
        </div>
      </section>
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
    features: landing?.features?.length
      ? landing.features.slice(0, 3).map((feature) => ({ ...feature, description: "Members-only access" }))
      : c.features,
    proofHeadline: landing?.memberProof?.count
      ? `${landing.memberProof.count} ${landing.memberProof.label || "Fans Already Joined"}`
      : c.proofHeadline,
  };
}

export default CreatorLinkPage;
