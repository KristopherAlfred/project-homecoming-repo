import { useCallback, useEffect, useState } from "react";

import { useAthlete } from "../contexts/AthleteContext";
import {
  fetchInstagramAnalytics,
  instagramPostImage,
  instagramProfileImage,
} from "./instagramAnalyticsApi";
import { fetchVideoFeed } from "./videosApi";

/**
 * The logged-in athlete's OWN photo library for the Experience studio.
 *
 * Sources, all scoped to the current athlete:
 *  - their onboarding headshot / profile photo
 *  - their connected Instagram profile picture + recent post images
 *  - thumbnails from their exclusive video feed
 *  - anything they upload in the studio (kept locally per athlete)
 *
 * No stock or other-athlete imagery is ever mixed in — if nothing is connected
 * the library is simply empty and the studio prompts an upload.
 */

export type PhotoLibraryItem = {
  id: string;
  src: string;
  label: string;
  source: "headshot" | "instagram" | "video" | "upload";
};

const UPLOAD_KEY_PREFIX = "playersos.experience.uploads.";
const MAX_UPLOADS = 24;

function uploadKey(athleteId: string | null | undefined) {
  return `${UPLOAD_KEY_PREFIX}${athleteId || "anon"}`;
}

export function readStudioUploads(athleteId: string | null | undefined): PhotoLibraryItem[] {
  try {
    const raw = localStorage.getItem(uploadKey(athleteId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((row) => row && typeof row.src === "string" && row.src)
      .slice(0, MAX_UPLOADS)
      .map((row, i) => ({
        id: String(row.id || `upload_${i}`),
        src: String(row.src),
        label: String(row.label || "Upload"),
        source: "upload" as const,
      }));
  } catch {
    return [];
  }
}

/** Remember an image the athlete uploaded so it can be reused on any page. */
export function rememberStudioUpload(
  athleteId: string | null | undefined,
  src: string,
  label = "Upload",
) {
  if (!src) return;
  try {
    const existing = readStudioUploads(athleteId).filter((item) => item.src !== src);
    const next: PhotoLibraryItem[] = [
      { id: `upload_${Date.now()}`, src, label, source: "upload" as const },
      ...existing,
    ].slice(0, MAX_UPLOADS);
    localStorage.setItem(uploadKey(athleteId), JSON.stringify(next));
    window.dispatchEvent(new Event("playersos:studio-uploads"));
  } catch {
    /* storage full / unavailable — the image still applies to the page */
  }
}

export function removeStudioUpload(athleteId: string | null | undefined, id: string) {
  try {
    const next = readStudioUploads(athleteId).filter((item) => item.id !== id);
    localStorage.setItem(uploadKey(athleteId), JSON.stringify(next));
    window.dispatchEvent(new Event("playersos:studio-uploads"));
  } catch {
    /* ignore */
  }
}

export function useExperiencePhotoLibrary() {
  const { athlete } = useAthlete();
  const athleteId = athlete?.id ?? null;
  const [uploads, setUploads] = useState<PhotoLibraryItem[]>([]);
  const [remote, setRemote] = useState<PhotoLibraryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshUploads = useCallback(() => {
    setUploads(readStudioUploads(athleteId));
  }, [athleteId]);

  useEffect(() => {
    refreshUploads();
    const onChange = () => refreshUploads();
    window.addEventListener("playersos:studio-uploads", onChange);
    return () => window.removeEventListener("playersos:studio-uploads", onChange);
  }, [refreshUploads]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setRemote([]);
    (async () => {
      const items: PhotoLibraryItem[] = [];
      const [ig, videos] = await Promise.all([
        fetchInstagramAnalytics().catch(() => null),
        fetchVideoFeed().catch(() => null),
      ]);
      if (ig) {
        const avatar = instagramProfileImage(ig.profile);
        if (avatar) {
          items.push({
            id: "ig_profile",
            src: avatar,
            label: `@${ig.profile.username}`,
            source: "instagram",
          });
        }
        for (const post of [...(ig.topPosts ?? []), ...(ig.recentPosts ?? [])].slice(0, 18)) {
          const src = instagramPostImage(post);
          if (!src || items.some((item) => item.src === src)) continue;
          items.push({ id: `ig_${post.id}`, src, label: "Instagram", source: "instagram" });
        }
      }
      for (const video of videos?.items ?? []) {
        const src = video.thumbnail;
        if (!src || items.some((item) => item.src === src)) continue;
        items.push({ id: `video_${video.id}`, src, label: video.title || "Video", source: "video" });
      }
      if (alive) {
        setRemote(items);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [athleteId]);

  const headshot: PhotoLibraryItem[] = athlete?.profile_photo_url
    ? [
        {
          id: "headshot",
          src: athlete.profile_photo_url,
          label: "Your headshot",
          source: "headshot",
        },
      ]
    : [];

  return {
    athleteId,
    loading,
    items: [...headshot, ...uploads, ...remote],
    removeUpload: (id: string) => removeStudioUpload(athleteId, id),
  };
}
