import { ChevronDown, Link2 } from "lucide-react";

import { brandIconMap } from "../settings/BrandIcons";
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

export function CreatorLinkPage({
  profile,
  compact = false,
  className = "",
  onJoin,
  joinLabel = "Join the Circle",
}: {
  profile: CreatorProfile;
  /** Phone-sized rendering (studio preview). */
  compact?: boolean;
  className?: string;
  /** Triggers the join / subscribe flow. */
  onJoin?: () => void;
  joinLabel?: string;
}) {
  const video = resolveExperiencePreviewUrl(profile.videoSrc);
  const poster = resolveExperiencePreviewUrl(profile.videoPoster);
  const photo = resolveExperiencePreviewUrl(profile.photo);
  const avatar = compact ? 68 : 100;

  return (
    <div
      className={`relative h-full w-full overflow-y-auto bg-black text-white ${className}`}
      style={{ scrollbarWidth: "none" }}
    >
      {/* Hero: full-bleed looping video */}
      <section className={`relative w-full ${compact ? "min-h-[330px]" : "min-h-[62vh]"}`}>
        <div className="absolute inset-0 overflow-hidden">
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
            <div className="h-full w-full bg-[radial-gradient(120%_90%_at_50%_0%,#1b1d24_0%,#000_72%)]" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.08)_32%,rgba(0,0,0,0.72)_78%,#000_100%)]" />
        </div>

        {/* Profile block */}
        <div
          className={`relative z-10 mx-auto flex w-full max-w-[520px] flex-col items-center px-5 text-center ${
            compact ? "pt-[150px] pb-5" : "pt-[34vh] pb-8"
          }`}
        >
          {photo ? (
            <img
              src={photo}
              alt={profile.name}
              className="rounded-full border border-white/25 object-cover shadow-[0_10px_40px_rgba(0,0,0,0.7)]"
              style={{ width: avatar, height: avatar }}
            />
          ) : null}

          <div className="mt-3 flex items-center justify-center gap-2">
            <h1
              className={`font-display font-black leading-tight tracking-[-0.02em] ${
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
        </div>
      </section>

      {/* Featured cards */}
      {profile.featured.length ? (
        <section
          className={`relative z-10 mx-auto w-full max-w-[520px] px-4 ${compact ? "pb-6" : "pb-14"} space-y-5`}
        >
          {profile.featured.map((card) => {
            const art = resolveExperiencePreviewUrl(card.image);
            const title = card.titleImage ? resolveExperiencePreviewUrl(card.titleImage) : "";
            return (
              <a
                key={card.id}
                href={card.url || undefined}
                target={card.url ? "_blank" : undefined}
                rel="noreferrer"
                className="block"
              >
                <div
                  className={`relative w-full overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.04] ${
                    compact ? "aspect-[16/10]" : "aspect-[16/9]"
                  }`}
                >
                  {art ? (
                    <img src={art} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  ) : null}
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.15),rgba(0,0,0,0.55))]" />
                  {title ? (
                    <img
                      src={title}
                      alt=""
                      className="absolute inset-0 m-auto max-h-[70%] w-[78%] object-contain"
                    />
                  ) : card.overlayTitle ? (
                    <p
                      className={`absolute inset-0 flex items-center justify-center px-6 text-center font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-white drop-shadow-[0_6px_24px_rgba(0,0,0,0.8)] ${
                        compact ? "text-2xl" : "text-5xl"
                      }`}
                    >
                      {card.overlayTitle}
                    </p>
                  ) : null}
                  <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur">
                    <Link2 size={15} />
                  </span>
                </div>
                {card.caption ? (
                  <p className={`mt-2 font-bold text-white ${compact ? "text-[12px]" : "text-base"}`}>
                    {card.caption}
                  </p>
                ) : null}
              </a>
            );
          })}
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
  pages: Record<string, { heroImage?: string; headline?: string; body?: string } | undefined>;
}): CreatorProfile {
  const landing = experience.pages.landing;
  const c = experience.creator;
  return {
    ...c,
    name: c.name || experience.brand.wordmark || landing?.headline || "",
    videoPoster: c.videoPoster || landing?.heroImage || "",
    bio: c.bio || experience.brand.tagline || landing?.body || "",
  };
}

export default CreatorLinkPage;
