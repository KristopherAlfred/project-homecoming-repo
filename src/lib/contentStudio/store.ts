import { useCallback, useEffect, useMemo, useState } from "react";
import { useAthlete } from "../../contexts/AthleteContext";
import { loadDashboardSession } from "../dashboardAuth";
import {
  PLATFORMS,
  type ContentType,
  type StudioPlatformKey,
} from "./platforms";

/**
 * Content Studio data layer.
 *
 * Multi-tenant by construction: every record is stored under the currently
 * selected workspace key (athlete / team profile id), so nothing can leak
 * between organizations. Persistence is local until the publishing APIs are
 * wired up — the shapes below mirror the eventual backend tables
 * (media_assets, content, platform_content_variants, scheduled_posts).
 */

export type MediaKind = "image" | "video" | "graphic" | "gif" | "audio";

export type MediaAsset = {
  id: string;
  name: string;
  kind: MediaKind;
  url: string;
  width?: number;
  height?: number;
  createdAt: string;
};

export type PlatformVariant = {
  caption?: string;
  hashtags?: string;
  title?: string;
  description?: string;
  link?: string;
  cta?: string;
  thumbnailId?: string;
  mediaIds?: string[];
};

export type PublishState =
  | "draft"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed";

export type ContentStatus = "draft" | "scheduled" | "publishing" | "published" | "failed";

export type ContentRecord = {
  id: string;
  workspaceId: string;
  title: string;
  caption: string;
  hashtags: string;
  link: string;
  contentType: ContentType;
  mediaIds: string[];
  platforms: StudioPlatformKey[];
  variants: Partial<Record<StudioPlatformKey, PlatformVariant>>;
  scheduledAt: string | null;
  timezone: string;
  status: ContentStatus;
  publishStatus: Partial<Record<StudioPlatformKey, { state: PublishState; error?: string }>>;
  createdAt: string;
  updatedAt: string;
};

export type StudioState = {
  media: MediaAsset[];
  content: ContentRecord[];
};

const VERSION = "v1";

function storageKey(workspaceId: string) {
  return `playersos.contentstudio.${VERSION}.${workspaceId}`;
}

function emptyState(): StudioState {
  return { media: [], content: [] };
}

const cache = new Map<string, StudioState>();
const listeners = new Map<string, Set<() => void>>();

function read(workspaceId: string): StudioState {
  const cached = cache.get(workspaceId);
  if (cached) return cached;
  let next = emptyState();
  try {
    const raw = localStorage.getItem(storageKey(workspaceId));
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StudioState>;
      next = {
        media: Array.isArray(parsed.media) ? parsed.media : [],
        content: Array.isArray(parsed.content) ? parsed.content : [],
      };
    }
  } catch {
    next = emptyState();
  }
  cache.set(workspaceId, next);
  return next;
}

function write(workspaceId: string, state: StudioState) {
  cache.set(workspaceId, state);
  try {
    localStorage.setItem(storageKey(workspaceId), JSON.stringify(state));
  } catch {
    /* quota — keep in-memory copy */
  }
  listeners.get(workspaceId)?.forEach((fn) => fn());
}

function subscribe(workspaceId: string, fn: () => void) {
  const set = listeners.get(workspaceId) ?? new Set();
  set.add(fn);
  listeners.set(workspaceId, set);
  return () => {
    set.delete(fn);
  };
}

export function newId(prefix = "c") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function blankContent(workspaceId: string, scheduledAt: string | null = null): ContentRecord {
  const now = new Date().toISOString();
  return {
    id: newId("post"),
    workspaceId,
    title: "",
    caption: "",
    hashtags: "",
    link: "",
    contentType: "post",
    mediaIds: [],
    platforms: ["fanapp"],
    variants: {},
    scheduledAt,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    status: "draft",
    publishStatus: {},
    createdAt: now,
    updatedAt: now,
  };
}

/** Master content merged with a platform override. */
export function resolveVariant(record: ContentRecord, platform: StudioPlatformKey) {
  const variant = record.variants[platform] ?? {};
  return {
    caption: variant.caption ?? record.caption,
    hashtags: variant.hashtags ?? record.hashtags,
    title: variant.title ?? record.title,
    description: variant.description ?? record.caption,
    link: variant.link ?? record.link,
    cta: variant.cta ?? "",
    mediaIds: variant.mediaIds ?? record.mediaIds,
    thumbnailId: variant.thumbnailId ?? (variant.mediaIds ?? record.mediaIds)[0],
    customized: isCustomized(record, platform),
  };
}

export function isCustomized(record: ContentRecord, platform: StudioPlatformKey) {
  const variant = record.variants[platform];
  if (!variant) return false;
  return Object.entries(variant).some(([key, value]) => {
    if (value === undefined || value === null) return false;
    if (Array.isArray(value)) return value.join(",") !== record.mediaIds.join(",");
    if (typeof value === "string" && value.trim() === "") return false;
    if (key === "caption") return value !== record.caption;
    if (key === "hashtags") return value !== record.hashtags;
    if (key === "title") return value !== record.title;
    if (key === "link") return value !== record.link;
    return true;
  });
}

export function useWorkspaceId() {
  const { athlete } = useAthlete();
  return athlete?.id ?? loadDashboardSession()?.email ?? "local-workspace";
}

export function useContentStudio() {
  const workspaceId = useWorkspaceId();
  const [state, setState] = useState<StudioState>(() => read(workspaceId));

  useEffect(() => {
    setState(read(workspaceId));
    return subscribe(workspaceId, () => setState({ ...read(workspaceId) }));
  }, [workspaceId]);

  const mutate = useCallback(
    (fn: (prev: StudioState) => StudioState) => {
      write(workspaceId, fn(read(workspaceId)));
    },
    [workspaceId],
  );

  const addMedia = useCallback(
    (assets: Omit<MediaAsset, "id" | "createdAt">[]) => {
      const created = assets.map((asset) => ({
        ...asset,
        id: newId("media"),
        createdAt: new Date().toISOString(),
      }));
      mutate((prev) => ({ ...prev, media: [...created, ...prev.media] }));
      return created;
    },
    [mutate],
  );

  const removeMedia = useCallback(
    (ids: string[]) => {
      mutate((prev) => ({ ...prev, media: prev.media.filter((m) => !ids.includes(m.id)) }));
    },
    [mutate],
  );

  const renameMedia = useCallback(
    (id: string, name: string) => {
      mutate((prev) => ({
        ...prev,
        media: prev.media.map((m) => (m.id === id ? { ...m, name } : m)),
      }));
    },
    [mutate],
  );

  const saveContent = useCallback(
    (record: ContentRecord) => {
      const next = { ...record, updatedAt: new Date().toISOString() };
      mutate((prev) => {
        const exists = prev.content.some((c) => c.id === next.id);
        return {
          ...prev,
          content: exists
            ? prev.content.map((c) => (c.id === next.id ? next : c))
            : [next, ...prev.content],
        };
      });
      return next;
    },
    [mutate],
  );

  const deleteContent = useCallback(
    (id: string) => {
      mutate((prev) => ({ ...prev, content: prev.content.filter((c) => c.id !== id) }));
    },
    [mutate],
  );

  const updateContent = useCallback(
    (id: string, patch: Partial<ContentRecord>) => {
      mutate((prev) => ({
        ...prev,
        content: prev.content.map((c) =>
          c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c,
        ),
      }));
    },
    [mutate],
  );

  const duplicateContent = useCallback(
    (id: string) => {
      const source = read(workspaceId).content.find((c) => c.id === id);
      if (!source) return null;
      const copy: ContentRecord = {
        ...source,
        id: newId("post"),
        title: source.title ? `${source.title} (copy)` : "",
        status: "draft",
        publishStatus: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mutate((prev) => ({ ...prev, content: [copy, ...prev.content] }));
      return copy;
    },
    [mutate, workspaceId],
  );

  /**
   * Simulated per-destination publishing. Each platform is tracked
   * independently so one failure never marks the whole post failed. Nothing
   * leaves the browser until the real platform APIs are connected.
   */
  const publishNow = useCallback(
    (id: string) => {
      const record = read(workspaceId).content.find((c) => c.id === id);
      if (!record) return;
      const publishStatus: ContentRecord["publishStatus"] = {};
      for (const platform of record.platforms) {
        publishStatus[platform] = { state: "publishing" };
      }
      updateContent(id, { status: "publishing", publishStatus });

      window.setTimeout(() => {
        const current = read(workspaceId).content.find((c) => c.id === id);
        if (!current) return;
        const next: ContentRecord["publishStatus"] = {};
        for (const platform of current.platforms) {
          const connectorMissing = PLATFORMS[platform].connectorKey === null ? false : false;
          next[platform] = connectorMissing
            ? { state: "failed", error: "Platform API not connected yet" }
            : { state: "published" };
        }
        const anyFailed = Object.values(next).some((s) => s.state === "failed");
        updateContent(id, {
          status: anyFailed ? "failed" : "published",
          publishStatus: next,
        });
      }, 1400);
    },
    [updateContent, workspaceId],
  );

  const retryPlatform = useCallback(
    (id: string, platform: StudioPlatformKey) => {
      const record = read(workspaceId).content.find((c) => c.id === id);
      if (!record) return;
      const publishStatus = { ...record.publishStatus, [platform]: { state: "publishing" as PublishState } };
      updateContent(id, { publishStatus });
      window.setTimeout(() => {
        const current = read(workspaceId).content.find((c) => c.id === id);
        if (!current) return;
        const next = { ...current.publishStatus, [platform]: { state: "published" as PublishState } };
        const anyFailed = Object.values(next).some((s) => s?.state === "failed");
        updateContent(id, { publishStatus: next, status: anyFailed ? "failed" : "published" });
      }, 1200);
    },
    [updateContent, workspaceId],
  );

  const mediaById = useMemo(() => {
    const map = new Map<string, MediaAsset>();
    for (const asset of state.media) map.set(asset.id, asset);
    return map;
  }, [state.media]);

  return {
    workspaceId,
    media: state.media,
    mediaById,
    content: state.content,
    drafts: state.content.filter((c) => c.status === "draft"),
    scheduled: state.content.filter((c) => c.status !== "draft"),
    addMedia,
    removeMedia,
    renameMedia,
    saveContent,
    updateContent,
    deleteContent,
    duplicateContent,
    publishNow,
    retryPlatform,
  };
}

export type ContentStudioApi = ReturnType<typeof useContentStudio>;
