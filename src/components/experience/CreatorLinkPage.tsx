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
      className={`creator-glass-page relative h-full w-full ${compact ? "overflow-hidden" : "overflow-y-auto"} ${className}`}
      style={{
        scrollbarWidth: "none",
        "--creator-accent": accentColor,
      } as React.CSSProperties}
    >
      {/* ── Top zone: media only ─────────────────────────────── */}
      <section
        className={`relative w-full text-white ${compact ? "h-[47%] min-h-0" : "h-[64vh] min-h-[560px]"}`}
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
          } ${compact ? "px-6 pb-11" : "px-8 pb-24"}`}
        >
          <p className={`creator-eyebrow font-semibold uppercase ${compact ? "mb-2 text-[6px]" : "mb-3 text-[10px]"}`}>Official inner circle</p>
          <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
            <h1
              className={`creator-display min-w-0 leading-[0.92] ${
                compact ? "text-[34px]" : "text-[62px] sm:text-[72px]"
              }`}
            >
              {profile.name}
            </h1>
            {profile.verified ? <VerifiedBadge size={compact ? 15 : 22} /> : null}
          </div>

          {profile.handle ? (
            <p className={`mt-2 font-medium text-white/65 ${compact ? "text-[9px]" : "text-sm"}`}>
              {profile.handle.startsWith("@") ? profile.handle : `@${profile.handle}`}
            </p>
          ) : null}

          {profile.followerCount ? (
            <button
              type="button"
              className={`creator-follower-pill inline-flex items-center gap-2 rounded-full px-3.5 backdrop-blur-md ${
                compact ? "mt-3 py-1.5 text-[8px]" : "mt-5 py-2 text-xs"
              }`}
            >
              <span className="font-bold text-white">{profile.followerCount}</span>
              <span className="text-white/65">{profile.followerLabel}</span>
              <ChevronDown size={compact ? 12 : 16} className="text-white/65" />
            </button>
          ) : null}
        </div>
      </section>

      {/* ── Bottom zone: editorial membership experience ── */}
      <section
        className={`creator-sheet relative z-20 -mt-10 w-full ${
          compact ? "h-[53%] px-5 pb-[92px] pt-9" : "px-8 pb-14 pt-20"
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

          <div className={`creator-proof-line grid w-full grid-cols-[auto_minmax(0,1fr)] items-center ${compact ? "mt-3 gap-2 py-2" : "mt-7 gap-4 py-5"}`}>
            <div className="flex -space-x-2">
              {(proofFaces.length ? proofFaces : ["", "", ""]).slice(0, 3).map((face, index) =>
                face ? (
                  <img key={`${face}-${index}`} src={face} alt="" className={`${compact ? "h-7 w-7" : "h-9 w-9"} creator-avatar-border rounded-full border-2 object-cover`} />
                ) : (
                  <span key={index} className={`${compact ? "h-7 w-7" : "h-9 w-9"} creator-proof-avatar creator-avatar-border rounded-full border-2`} />
                ),
              )}
            </div>
            <div className="min-w-0 leading-tight">
              <p className={`truncate font-bold ${compact ? "text-[9px]" : "text-sm"}`}>{profile.proofHeadline}</p>
              <p className={`creator-sheet-muted mt-0.5 truncate uppercase ${compact ? "text-[6px]" : "text-[9px]"}`}>{profile.proofSupporting}</p>
            </div>
          </div>

          {featureItems.length ? (
            <div className={compact ? "mt-3 w-full" : "mt-9 w-full"}>
              <p className={`creator-section-label font-semibold uppercase ${compact ? "mb-2 text-[6px]" : "mb-4 text-[10px]"}`}>Membership perks</p>
              <div className={`grid ${compact ? "grid-cols-3 gap-2" : "grid-cols-2 gap-3"}`}>
              {featureItems.map((feature) => {
                const Icon = FEATURE_ICONS[feature.icon.toLowerCase()] ?? Star;
                return (
                  <div
                    key={feature.id}
                    className={`creator-sheet-card flex min-w-0 flex-col items-start text-left ${compact ? "min-h-[76px] gap-1.5 p-2" : "min-h-[154px] gap-4 p-5"}`}
                  >
                    <span className={`creator-feature-icon flex shrink-0 items-center justify-center ${compact ? "h-6 w-6" : "h-11 w-11"}`}>
                      <Icon size={compact ? 11 : 19} strokeWidth={1.6} />
                    </span>
                    <span className="min-w-0">
                      <strong className={`block leading-tight ${compact ? "text-[10px]" : "text-sm"}`}>{feature.label}</strong>
                      <span className={`creator-sheet-muted mt-1 block leading-snug ${compact ? "line-clamp-1 text-[6px]" : "text-[11px]"}`}>{feature.description}</span>
                    </span>
                  </div>
                );
              })}
              </div>
            </div>
          ) : null}

          {exploreItems.length ? (
            <div className={compact ? "mt-3 w-full" : "mt-10 w-full"}>
              <div className={`grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 ${compact ? "mb-2" : "mb-5"}`}>
                <span className={`creator-display ${compact ? "text-[15px]" : "text-[28px]"}`}>Live links</span>
                <span className={`creator-section-label font-bold uppercase ${compact ? "text-[7px]" : "text-[10px]"}`}>Explore all</span>
              </div>
              <div className="creator-explore-rail flex snap-x gap-3 overflow-x-auto pb-2">
                {exploreItems.map((card) => {
                  const art = resolveExperiencePreviewUrl(card.image);
                  return (
                    <a
                      key={card.id}
                      href={card.url || undefined}
                      target={card.url ? "_blank" : undefined}
                      rel="noreferrer"
                        className={`creator-sheet-card creator-explore-tile shrink-0 snap-start overflow-hidden transition-transform hover:-translate-y-0.5 ${compact ? "grid w-[62%] grid-cols-[52px_minmax(0,1fr)]" : "grid w-[62%] grid-rows-[auto_1fr]"}`}
                    >
                        <div className={`${compact ? "h-[52px]" : "h-36"} creator-thumbnail-bg w-full overflow-hidden`}>
                        {art ? <img src={art} alt="" className="h-full w-full object-cover" /> : null}
                      </div>
                       <div className={`grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center text-left ${compact ? "gap-1 p-2" : "gap-2 p-3"}`}>
                        <div className="min-w-0">
                        <p className={`truncate font-bold ${compact ? "text-[10px]" : "text-sm"}`}>
                          {card.caption || card.overlayTitle || "Explore"}
                        </p>
                        {card.caption && card.overlayTitle ? (
                           <p className={`creator-sheet-muted mt-0.5 truncate ${compact ? "text-[7px]" : "text-[10px]"}`}>{card.overlayTitle}</p>
                        ) : null}
                        </div>
                        <ChevronRight className="creator-accent-text shrink-0" size={compact ? 14 : 18} />
                       </div>
                    </a>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <div className={`creator-sticky-join absolute inset-x-0 bottom-0 z-40 ${compact ? "px-5 pb-4 pt-4" : "sticky px-8 pb-7 pt-6"}`}>
        <button
          type="button"
          onClick={onJoin}
          className={`creator-primary-cta group flex w-full items-center justify-center gap-2 transition duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] ${compact ? "h-12 text-[11px]" : "h-16 text-[15px]"}`}
        >
          {cta}
          <ArrowRight size={compact ? 15 : 19} strokeWidth={2.2} />
        </button>
        <p className={`creator-consent mt-2 text-center ${compact ? "text-[6px]" : "text-[9px]"}`}>{profile.joinMicrocopy}</p>
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
    features: landing?.features?.length
      ? landing.features.slice(0, 3).map((feature) => ({ ...feature, description: "Members-only access" }))
      : c.features,
    proofHeadline: landing?.memberProof?.count
      ? `${landing.memberProof.count} ${landing.memberProof.label || "Fans Already Joined"}`
      : c.proofHeadline,
  };
}

export default CreatorLinkPage;
