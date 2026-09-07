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
  const avatar = compact ? 68 : 100;
  const cta = joinLabel || profile.ctaLabel || "Join My Circle";
  const proofFaces = [photo, ...profile.featured.map((item) => resolveExperiencePreviewUrl(item.image))]
    .filter(Boolean)
    .slice(0, 5);
  const featureItems = profile.features.slice(0, 3);
  const exploreItems = profile.featured.length
    ? profile.featured
    : featureItems.map((feature) => ({
        id: `explore-${feature.id}`,
        image: poster || photo,
        caption: feature.label,
        overlayTitle: feature.description,
      }));

  return (
    <div
      className={`creator-glass-page relative h-full w-full overflow-y-auto text-white ${className}`}
      style={{ scrollbarWidth: "none", "--creator-accent": accentColor } as React.CSSProperties}
    >
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          {video ? (
            <video
              src={video}
              poster={poster || undefined}
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full object-cover"
            />
          ) : poster ? (
            <img src={poster} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-neutral-950" />
          )}
          <div className="creator-media-overlay pointer-events-none absolute inset-0" />
          <div className="creator-accent-glow pointer-events-none absolute inset-x-0 top-0 h-[38%]" />
      </div>

      <section className={`relative w-full ${compact ? "min-h-[560px]" : "min-h-screen"}`}>

        {/* Profile block */}
        <div
          className={`relative z-10 mx-auto flex w-full max-w-[520px] flex-col items-center px-5 text-center ${
            compact ? "pt-[132px] pb-7" : "pt-[24vh] pb-12"
          }`}
        >
          {photo ? (
            <img
              src={photo}
              alt={profile.name}
              className="rounded-full border border-white/35 object-cover shadow-2xl"
              style={{ width: avatar, height: avatar }}
            />
          ) : null}

          <div className="mt-3 flex items-center justify-center gap-2">
            <h1
              className={`font-display font-black leading-tight ${
                compact ? "text-[22px]" : "text-[34px] sm:text-[40px]"
              }`}
            >
              {profile.name}
            </h1>
            {profile.verified ? <VerifiedBadge size={compact ? 15 : 22} /> : null}
          </div>

          {profile.handle ? (
            <p className={`mt-0.5 text-white/45 ${compact ? "text-[11px]" : "text-sm"}`}>
              {profile.handle.startsWith("@") ? profile.handle : `@${profile.handle}`}
            </p>
          ) : null}

          {profile.followerCount ? (
            <button
              type="button"
              className={`mt-4 inline-flex items-center gap-1.5 text-white/85 ${
                compact ? "text-[11px]" : "text-sm"
              }`}
            >
              <span className="font-bold text-white">{profile.followerCount}</span>
              <span className="text-white/60">{profile.followerLabel}</span>
              <ChevronDown size={compact ? 12 : 16} className="text-white/60" />
            </button>
          ) : null}

          {profile.bio ? (
            <p
              className={`mt-3 max-w-[420px] font-semibold leading-snug text-white ${
                compact ? "text-[12px]" : "text-base"
              }`}
            >
              {profile.bio}
            </p>
          ) : null}

          {profile.secondaryHandle ? (
            <p className={`mt-1 text-white/45 ${compact ? "text-[11px]" : "text-sm"}`}>
              {profile.secondaryHandle}
            </p>
          ) : null}

          <button
            type="button"
            onClick={onJoin}
            className={`creator-primary-cta group mt-6 inline-flex items-center justify-center gap-2 rounded-full font-black text-neutral-950 transition-all duration-200 ease-out hover:scale-[1.02] hover:brightness-105 active:scale-[0.98] active:brightness-95 ${
              compact
                ? "px-7 py-3.5 text-[12px]"
                : "px-8 py-4 text-[15px]"
            }`}
            style={{ width: compact ? 220 : 260 }}
          >
            {cta}
            <ArrowRight size={compact ? 14 : 18} strokeWidth={2.5} />
          </button>
          <p className={`mt-2 max-w-[310px] text-white/45 ${compact ? "text-[8px]" : "text-[11px]"}`}>
            {profile.joinMicrocopy}
          </p>

          {featureItems.length ? (
            <div className={`mt-5 grid w-full grid-cols-3 ${compact ? "gap-1.5" : "gap-2.5"}`}>
              {featureItems.map((feature) => {
                const Icon = FEATURE_ICONS[feature.icon.toLowerCase()] ?? Star;
                return (
                  <div key={feature.id} className={`creator-glass flex min-w-0 flex-col items-center text-center ${compact ? "px-1.5 py-2.5" : "px-3 py-4"}`}>
                    <Icon className="creator-accent-text" size={compact ? 14 : 18} strokeWidth={1.6} />
                    <strong className={`mt-1.5 leading-tight ${compact ? "text-[8px]" : "text-xs"}`}>{feature.label}</strong>
                    <span className={`mt-1 line-clamp-2 leading-tight text-white/50 ${compact ? "text-[6px]" : "text-[10px]"}`}>{feature.description}</span>
                  </div>
                );
              })}
            </div>
          ) : null}

          <div className={`creator-glass mt-3 flex w-full items-center ${compact ? "gap-2 px-3 py-2.5" : "gap-3 px-4 py-3.5"}`}>
            <div className="flex -space-x-2">
              {(proofFaces.length ? proofFaces : ["", "", "", ""]).map((face, index) =>
                face ? (
                  <img key={`${face}-${index}`} src={face} alt="" className={`${compact ? "h-6 w-6" : "h-8 w-8"} rounded-full border-2 border-white/40 object-cover`} />
                ) : (
                  <span key={index} className={`${compact ? "h-6 w-6" : "h-8 w-8"} creator-proof-avatar rounded-full border-2 border-white/40`} />
                ),
              )}
            </div>
            <div className="min-w-0 text-left leading-tight">
              <p className={`truncate font-extrabold ${compact ? "text-[9px]" : "text-sm"}`}>{profile.proofHeadline}</p>
              <p className={`mt-0.5 truncate text-white/50 ${compact ? "text-[7px]" : "text-[10px]"}`}>{profile.proofSupporting}</p>
            </div>
          </div>
        </div>
      </section>

      {exploreItems.length ? (
        <section
          className={`relative z-10 mx-auto w-full max-w-[520px] px-4 ${compact ? "-mt-3 pb-8" : "-mt-10 pb-16"}`}
        >
          <div className="mb-3 flex items-center gap-3">
            <span className="creator-divider h-px flex-1" />
            <span className={`font-bold uppercase text-white/60 ${compact ? "text-[7px]" : "text-[10px]"}`}>Explore More</span>
            <span className="creator-divider h-px flex-1" />
          </div>
          <div className="creator-glass overflow-hidden">
          {exploreItems.map((card) => {
            const art = resolveExperiencePreviewUrl(card.image);
            return (
              <a
                key={card.id}
                href={card.url || undefined}
                target={card.url ? "_blank" : undefined}
                rel="noreferrer"
                className="flex items-center gap-3 border-b border-white/10 px-3 py-2.5 last:border-b-0 transition-colors hover:bg-white/10"
              >
                <div className={`${compact ? "h-11 w-11" : "h-16 w-16"} shrink-0 overflow-hidden rounded-xl bg-white/10`}>
                  {art ? (
                    <img src={art} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className={`truncate font-bold text-white ${compact ? "text-[10px]" : "text-sm"}`}>
                    {card.caption || card.overlayTitle || "Explore"}
                  </p>
                  {card.caption && card.overlayTitle ? (
                    <p className={`mt-0.5 truncate text-white/45 ${compact ? "text-[7px]" : "text-[10px]"}`}>{card.overlayTitle}</p>
                  ) : null}
                </div>
                <ChevronRight className="creator-accent-text shrink-0" size={compact ? 14 : 18} />
              </a>
            );
          })}
          </div>
        </section>
      ) : null}
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
