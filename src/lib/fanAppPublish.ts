import { supabase } from "../integrations/supabase/client";
import type { ExperienceConfig } from "./experienceConfig";
import { normalizeExperienceConfig } from "./experienceConfig";

/**
 * Publishing layer for the fan app the athlete designs in the Experience tab.
 * A published app lives at /app/:slug and is readable by anyone with the link.
 */

export type FanAppRecord = {
  id: string;
  athlete_id: string;
  slug: string;
  app_name: string | null;
  config: ExperienceConfig;
  is_published: boolean;
  view_count: number;
  published_at: string | null;
};

async function callAthleteState<T>(payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("athlete-state", { body: payload });
  if (error) {
    // Surface the real server message instead of the generic non-2xx wrapper.
    const res = (error as { context?: Response }).context;
    if (res && typeof res.text === "function") {
      const raw = await res.text().catch(() => "");
      let message = "";
      try {
        const parsed = JSON.parse(raw) as { error?: unknown };
        message = parsed?.error ? String(parsed.error) : "";
      } catch {
        message = raw.slice(0, 300);
      }
      if (message) throw new Error(message);

    }
    throw error;
  }
  if (data && typeof data === "object" && "error" in data) {
    throw new Error(String((data as { error: unknown }).error));
  }
  return data as T;
}


function hydrate(row: Record<string, unknown> | null): FanAppRecord | null {
  if (!row) return null;
  return {
    id: String(row.id),
    athlete_id: String(row.athlete_id),
    slug: String(row.slug),
    app_name: (row.app_name as string) ?? null,
    config: normalizeExperienceConfig((row.config ?? {}) as Partial<ExperienceConfig>),
    is_published: Boolean(row.is_published),
    view_count: Number(row.view_count ?? 0),
    published_at: (row.published_at as string) ?? null,
  };
}

/** The athlete's own fan-app record (draft or live). */
export async function fetchFanApp(athleteId: string): Promise<FanAppRecord | null> {
  try {
    const { app } = await callAthleteState<{ app: Record<string, unknown> | null }>({
      action: "get_fan_app",
      athlete_id: athleteId,
    });
    return hydrate(app);
  } catch {
    return null;
  }
}

/** Public read for /app/:slug — only returns rows the athlete marked published. */
export async function fetchPublicFanApp(slug: string): Promise<FanAppRecord | null> {
  const clean = slug.trim().toLowerCase();
  if (!clean) return null;
  const { data, error } = await supabase
    .from("athlete_fan_apps")
    .select("id, athlete_id, slug, app_name, config, is_published, view_count, published_at")
    .eq("slug", clean)
    .maybeSingle();
  if (error) return null;
  return hydrate(data as Record<string, unknown> | null);
}

export async function publishFanApp(input: {
  athleteId: string;
  slug: string;
  appName?: string;
  config: ExperienceConfig;
  isPublished?: boolean;
}): Promise<FanAppRecord | null> {
  const { app } = await callAthleteState<{ app: Record<string, unknown> | null }>({
    action: "publish_fan_app",
    athlete_id: input.athleteId,
    slug: input.slug.trim().toLowerCase(),
    app_name: input.appName ?? null,
    config: input.config,
    is_published: input.isPublished ?? true,
  });
  return hydrate(app);
}

export async function registerFanAppView(slug: string): Promise<void> {
  try {
    await callAthleteState({ action: "register_fan_app_view", slug: slug.trim().toLowerCase() });
  } catch {
    /* view counting is best-effort */
  }
}

/** Absolute, shareable URL for a slug. */
export function fanAppUrl(slug: string): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/app/${slug}`;
}
