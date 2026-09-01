import { supabase as rawSupabase } from "../integrations/supabase/client";
import { loadDashboardSession } from "./dashboardAuth";

const supabase = rawSupabase as any;

/**
 * Multi-athlete data layer. Every athlete gets their own `athletes` row plus a
 * theme and bio link, so nothing in the dashboard is tied to one person.
 */

export type Athlete = {
  id: string;
  profile_key: string | null;
  full_name: string;
  display_name: string | null;
  sport: string | null;
  sport_icon: string | null;
  gender: string | null;
  team_or_league: string | null;
  competition_level: string | null;
  league: string | null;
  position: string | null;
  bio_short: string | null;
  profile_photo_url: string | null;
  onboarding_completed: boolean;
};

export type AthleteTheme = {
  athlete_id: string;
  template_id: string;
  bg_solid: string;
  gradient_from: string;
  gradient_via: string;
  gradient_to: string;
  accent_color: string;
  accent_hover: string;
  button_bg: string;
  button_text: string;
  button_border_radius: number;
  background_image: string | null;
  logo_url: string | null;
  tagline: string | null;
  headline: string | null;
  subheadline: string | null;
  fan_app_name: string | null;
  is_published: boolean;
};

export type AthleteBioLink = {
  id: string;
  athlete_id: string;
  slug: string;
  destination_app_url: string | null;
  is_published: boolean;
  click_count: number;
};

const ATHLETE_COLUMNS =
  "id, profile_key, full_name, display_name, sport, sport_icon, gender, team_or_league, competition_level, league, position, bio_short, profile_photo_url, onboarding_completed";


/** Strips punctuation/spacing so "Sloane  Stephens" matches "sloane stephens". */
export function normalizeAthleteName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Cheap Levenshtein for the fuzzy fallback on minor typos. */
function editDistance(a: string, b: string): number {
  const rows = Array.from({ length: b.length + 1 }, (_, i) => [i, ...Array(a.length).fill(0)]);
  for (let j = 1; j <= a.length; j += 1) rows[0][j] = j;
  for (let i = 1; i <= b.length; i += 1) {
    for (let j = 1; j <= a.length; j += 1) {
      rows[i][j] =
        b[i - 1] === a[j - 1]
          ? rows[i - 1][j - 1]
          : 1 + Math.min(rows[i - 1][j - 1], rows[i][j - 1], rows[i - 1][j]);
    }
  }
  return rows[b.length][a.length];
}

/** The onboarding "we already have your dashboard" match. */
export async function findAthleteByName(name: string): Promise<Athlete | null> {
  const target = normalizeAthleteName(name);
  if (target.length < 3) return null;

  const { data } = await supabase
    .from("athletes")
    .select(ATHLETE_COLUMNS)
    .eq("onboarding_completed", true);

  const rows = (data ?? []) as unknown as Athlete[];
  const exact = rows.find((row) => normalizeAthleteName(row.full_name) === target);
  if (exact) return exact;

  // Fuzzy fallback: tolerate a typo or two on longer names.
  const budget = target.length >= 10 ? 2 : 1;
  let best: { row: Athlete; distance: number } | null = null;
  for (const row of rows) {
    const distance = editDistance(target, normalizeAthleteName(row.full_name));
    if (distance <= budget && (!best || distance < best.distance)) best = { row, distance };
  }
  return best?.row ?? null;
}

export async function fetchAthleteByProfileKey(profileKey: string): Promise<Athlete | null> {
  const { data } = await supabase
    .from("athletes")
    .select(ATHLETE_COLUMNS)
    .eq("profile_key", profileKey)
    .maybeSingle();
  return (data as unknown as Athlete) ?? null;
}

export async function fetchAthleteById(id: string): Promise<Athlete | null> {
  const { data } = await supabase
    .from("athletes")
    .select(ATHLETE_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as Athlete) ?? null;
}

/** Themes, bio links and connector rows are read straight from the database. */
export async function fetchAthleteTheme(athleteId: string): Promise<AthleteTheme | null> {
  const { data } = await supabase
    .from("athlete_themes")
    .select("*")
    .eq("athlete_id", athleteId)
    .maybeSingle();
  return (data as AthleteTheme) ?? null;
}

export async function fetchBioLink(athleteId: string): Promise<AthleteBioLink | null> {
  const { data } = await supabase
    .from("athlete_bio_links")
    .select("id, athlete_id, slug, destination_app_url, is_published, click_count")
    .eq("athlete_id", athleteId)
    .maybeSingle();
  return (data as AthleteBioLink) ?? null;
}

export async function fetchBioLinkBySlug(slug: string): Promise<AthleteBioLink | null> {
  const { data } = await supabase
    .from("athlete_bio_links")
    .select("id, athlete_id, slug, destination_app_url, is_published, click_count")
    .eq("slug", slug.toLowerCase())
    .maybeSingle();
  return (data as AthleteBioLink) ?? null;
}

export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function isSlugAvailable(slug: string, athleteId?: string): Promise<boolean> {
  const clean = slug.toLowerCase();
  if (!SLUG_PATTERN.test(clean)) return false;
  const existing = await fetchBioLinkBySlug(clean);
  return !existing || existing.athlete_id === athleteId;
}

/** The key that ties the local dashboard session to an athlete row. */
export function getSessionProfileKey(): string {
  const session = loadDashboardSession();
  const email = session?.email?.trim().toLowerCase();
  if (email) return email.slice(0, 64);
  const name = session?.name?.trim();
  return name ? normalizeAthleteName(name).slice(0, 64) : "guest";
}

/**
 * Resolves who is logged in: first by session key, then by name match so a
 * migrated athlete lands in their existing dashboard.
 */
export async function resolveCurrentAthlete(): Promise<Athlete | null> {
  const byKey = await fetchAthleteByProfileKey(getSessionProfileKey());
  if (byKey) return byKey;

  const name = loadDashboardSession()?.name;
  if (name) {
    const byName = await findAthleteByName(name);
    if (byName) return byName;
  }
  return null;
}

type UpsertAthleteInput = Partial<Omit<Athlete, "id" | "profile_key">> & {
  full_name: string;
  profile_key?: string;
  onboarding_completed?: boolean;
};

export async function upsertAthlete(input: UpsertAthleteInput): Promise<string> {
  const profile_key = input.profile_key ?? getSessionProfileKey();
  const { profile_key: _ignored, ...fields } = input;

  const { data, error } = await supabase
    .from("athletes")
    .upsert({ ...fields, profile_key }, { onConflict: "profile_key" })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function saveAthleteTheme(
  athleteId: string,
  theme: Partial<Omit<AthleteTheme, "athlete_id">>,
): Promise<void> {
  const { error } = await supabase
    .from("athlete_themes")
    .upsert({ ...theme, athlete_id: athleteId }, { onConflict: "athlete_id" });
  if (error) throw error;
}

export async function claimBioSlug(
  athleteId: string,
  slug: string,
  options: { destination_app_url?: string; is_published?: boolean } = {},
): Promise<void> {
  const clean = slug.toLowerCase();
  const existing = await fetchBioLink(athleteId);

  if (existing) {
    const { error } = await supabase
      .from("athlete_bio_links")
      .update({ slug: clean, ...options })
      .eq("athlete_id", athleteId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from("athlete_bio_links")
    .insert({ athlete_id: athleteId, slug: clean, ...options });
  if (error) throw error;
}

export async function registerBioLinkClick(slug: string) {
  const link = await fetchBioLink_bySlugForClick(slug);
  if (!link) throw new Error("Link not found");
  await supabase
    .from("athlete_bio_links")
    .update({ click_count: (link.click_count ?? 0) + 1 })
    .eq("id", link.id);
  return {
    destination_app_url: link.destination_app_url,
    athlete_id: link.athlete_id,
    is_published: link.is_published,
  };
}

async function fetchBioLink_bySlugForClick(slug: string) {
  return fetchBioLinkBySlug(slug);
}
