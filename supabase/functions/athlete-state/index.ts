import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

const str = (v: unknown, max = 500): string | null =>
  typeof v === "string" && v.trim().length > 0 ? v.trim().slice(0, max) : null;

/** Fields an athlete may write on their own athlete row. */
const ATHLETE_FIELDS = [
  "full_name",
  "display_name",
  "sport",
  "sport_icon",
  "gender",
  "team_or_league",
  "competition_level",
  "league",
  "position",
  "bio_short",
  "profile_photo_url",
] as const;

/** Fields an athlete may write on their theme row. */
const THEME_FIELDS = [
  "template_id",
  "bg_solid",
  "gradient_from",
  "gradient_via",
  "gradient_to",
  "accent_color",
  "accent_hover",
  "button_bg",
  "button_text",
  "background_image",
  "logo_url",
  "tagline",
  "headline",
  "subheadline",
  "fan_app_name",
] as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ error: "Invalid request" }, 400);
    const { action } = body as { action?: string };

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // ---- Create or update an athlete profile (onboarding + settings edits) ----
    if (action === "upsert_athlete") {
      const profileKey = str((body as Record<string, unknown>).profile_key, 64);
      const fullName = str((body as Record<string, unknown>).full_name, 120);
      if (!profileKey) return json({ error: "Invalid profile_key" }, 400);
      if (!fullName) return json({ error: "Invalid full_name" }, 400);

      const patch: Record<string, unknown> = { profile_key: profileKey };
      for (const key of ATHLETE_FIELDS) {
        const value = (body as Record<string, unknown>)[key];
        if (value !== undefined) patch[key] = str(value, 600);
      }
      patch.full_name = fullName;
      if (typeof (body as Record<string, unknown>).onboarding_completed === "boolean") {
        patch.onboarding_completed = (body as Record<string, unknown>).onboarding_completed;
      }

      const { data, error } = await supabase
        .from("athletes")
        .upsert(patch, { onConflict: "profile_key" })
        .select("id")
        .single();
      if (error) throw error;
      return json({ ok: true, athlete_id: data.id });
    }

    // ---- Save the athlete's Experience theme ----
    if (action === "save_theme") {
      const athleteId = str((body as Record<string, unknown>).athlete_id, 36);
      if (!athleteId || !UUID.test(athleteId)) return json({ error: "Invalid athlete_id" }, 400);

      const patch: Record<string, unknown> = { athlete_id: athleteId };
      for (const key of THEME_FIELDS) {
        const value = (body as Record<string, unknown>)[key];
        if (value !== undefined) patch[key] = str(value, 2000);
      }
      const radius = (body as Record<string, unknown>).button_border_radius;
      if (typeof radius === "number" && Number.isFinite(radius)) {
        patch.button_border_radius = Math.max(0, Math.min(999, Math.round(radius)));
      }
      if (typeof (body as Record<string, unknown>).is_published === "boolean") {
        patch.is_published = (body as Record<string, unknown>).is_published;
      }

      const { error } = await supabase
        .from("athlete_theme")
        .upsert(patch, { onConflict: "athlete_id" });
      if (error) throw error;
      return json({ ok: true });
    }

    // ---- Claim / update the athlete's [slug].bio link ----
    if (action === "claim_slug") {
      const athleteId = str((body as Record<string, unknown>).athlete_id, 36);
      const slug = str((body as Record<string, unknown>).slug, 40)?.toLowerCase() ?? "";
      if (!athleteId || !UUID.test(athleteId)) return json({ error: "Invalid athlete_id" }, 400);
      if (!SLUG.test(slug)) return json({ error: "Invalid slug" }, 400);

      const { data: taken } = await supabase
        .from("athlete_bio_links")
        .select("athlete_id")
        .eq("slug", slug)
        .maybeSingle();
      if (taken && taken.athlete_id !== athleteId) return json({ error: "Slug taken" }, 409);

      const destination =
        str((body as Record<string, unknown>).destination_app_url, 500) ?? "/experience";
      const isPublished = (body as Record<string, unknown>).is_published;

      const { data: existing } = await supabase
        .from("athlete_bio_links")
        .select("id")
        .eq("athlete_id", athleteId)
        .maybeSingle();

      const patch: Record<string, unknown> = {
        athlete_id: athleteId,
        slug,
        destination_app_url: destination,
      };
      if (typeof isPublished === "boolean") patch.is_published = isPublished;

      const { error } = existing
        ? await supabase.from("athlete_bio_links").update(patch).eq("id", existing.id)
        : await supabase.from("athlete_bio_links").insert(patch);
      if (error) throw error;
      return json({ ok: true, slug });
    }

    // ---- Count a bio-link visit ----
    if (action === "register_click") {
      const slug = str((body as Record<string, unknown>).slug, 40)?.toLowerCase() ?? "";
      if (!SLUG.test(slug)) return json({ error: "Invalid slug" }, 400);

      const { data: link } = await supabase
        .from("athlete_bio_links")
        .select("id, click_count, destination_app_url, athlete_id, is_published")
        .eq("slug", slug)
        .maybeSingle();
      if (!link) return json({ error: "Not found" }, 404);

      await supabase
        .from("athlete_bio_links")
        .update({ click_count: Number(link.click_count ?? 0) + 1 })
        .eq("id", link.id);

      return json({
        ok: true,
        destination_app_url: link.destination_app_url,
        athlete_id: link.athlete_id,
        is_published: link.is_published,
      });
    }

    // ---- Publish the designed fan app to a public /app/:slug link ----
    if (action === "publish_fan_app") {
      const athleteId = str((body as Record<string, unknown>).athlete_id, 36);
      const slug = str((body as Record<string, unknown>).slug, 40)?.toLowerCase() ?? "";
      const config = (body as Record<string, unknown>).config;
      if (!athleteId || !UUID.test(athleteId)) return json({ error: "Invalid athlete_id" }, 400);
      if (!SLUG.test(slug)) return json({ error: "Invalid slug" }, 400);
      if (!config || typeof config !== "object") return json({ error: "Invalid config" }, 400);

      const { data: taken } = await supabase
        .from("athlete_fan_apps")
        .select("athlete_id")
        .eq("slug", slug)
        .maybeSingle();
      if (taken && taken.athlete_id !== athleteId) return json({ error: "Link name already taken" }, 409);

      const isPublished = (body as Record<string, unknown>).is_published;
      const patch: Record<string, unknown> = {
        athlete_id: athleteId,
        slug,
        app_name: str((body as Record<string, unknown>).app_name, 120),
        config,
        is_published: typeof isPublished === "boolean" ? isPublished : true,
        published_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("athlete_fan_apps")
        .upsert(patch, { onConflict: "athlete_id" })
        .select("id, athlete_id, slug, app_name, config, is_published, view_count, published_at")
        .single();
      if (error) {
        if (error.code === "23505" || /duplicate key/i.test(error.message ?? "")) {
          return json({ error: "Link name already taken" }, 409);
        }
        if (error.code === "23503") {
          return json({ error: "Athlete profile not found — finish onboarding first" }, 400);
        }
        return json({ error: error.message || "Could not publish" }, 400);
      }
      return json({ ok: true, app: data });
    }

    if (action === "get_fan_app") {
      const id = str((body as Record<string, unknown>).athlete_id, 36);
      if (!id || !UUID.test(id)) return json({ error: "Invalid athlete_id" }, 400);
      const { data, error } = await supabase
        .from("athlete_fan_apps")
        .select("id, athlete_id, slug, app_name, config, is_published, view_count, published_at")
        .eq("athlete_id", id)
        .maybeSingle();
      if (error) throw error;
      return json({ app: data ?? null });
    }

    if (action === "register_fan_app_view") {
      const slug = str((body as Record<string, unknown>).slug, 40)?.toLowerCase() ?? "";
      if (!SLUG.test(slug)) return json({ error: "Invalid slug" }, 400);
      const { data: app } = await supabase
        .from("athlete_fan_apps")
        .select("id, view_count")
        .eq("slug", slug)
        .maybeSingle();
      if (!app) return json({ error: "Not found" }, 404);
      await supabase
        .from("athlete_fan_apps")
        .update({ view_count: Number(app.view_count ?? 0) + 1 })
        .eq("id", app.id);
      return json({ ok: true });
    }


    // ---------------------------------------------------------------
    // Reads. The underlying tables are private (RLS is fail-closed for
    // anon), so the dashboard fetches athlete-scoped rows through here.
    // ---------------------------------------------------------------
    const athleteIdParam = () => {
      const id = str((body as Record<string, unknown>).athlete_id, 36);
      return id && UUID.test(id) ? id : null;
    };

    if (action === "get_theme") {
      const athleteId = athleteIdParam();
      if (!athleteId) return json({ error: "Invalid athlete_id" }, 400);
      const { data, error } = await supabase
        .from("athlete_theme")
        .select("*")
        .eq("athlete_id", athleteId)
        .maybeSingle();
      if (error) throw error;
      return json({ theme: data ?? null });
    }

    if (action === "get_bio_link") {
      const athleteId = athleteIdParam();
      const slug = str((body as Record<string, unknown>).slug, 40)?.toLowerCase() ?? null;
      if (!athleteId && !slug) return json({ error: "Invalid request" }, 400);
      let query = supabase
        .from("athlete_bio_links")
        .select("id, athlete_id, slug, destination_app_url, is_published, click_count");
      query = athleteId ? query.eq("athlete_id", athleteId) : query.eq("slug", slug!);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return json({ link: data ?? null });
    }

    if (action === "get_insights") {
      const athleteId = athleteIdParam();
      if (!athleteId) return json({ error: "Invalid athlete_id" }, 400);
      const rawLimit = (body as Record<string, unknown>).limit;
      const limit = typeof rawLimit === "number" ? Math.max(1, Math.min(50, rawLimit)) : 6;
      const { data, error } = await supabase
        .from("athlete_ai_insights")
        .select("id, athlete_id, insight_type, summary, recommendation, created_at")
        .eq("athlete_id", athleteId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return json({ insights: data ?? [] });
    }

    if (action === "get_onboarding_state") {
      const profileKey = str((body as Record<string, unknown>).profile_key, 64);
      if (!profileKey) return json({ error: "Invalid profile_key" }, 400);
      const { data, error } = await supabase
        .from("onboarding_state")
        .select("has_completed_onboarding")
        .eq("profile_key", profileKey)
        .maybeSingle();
      if (error) throw error;
      return json({ has_completed_onboarding: Boolean(data?.has_completed_onboarding) });
    }

    if (action === "get_platform_connections") {
      const athleteId = athleteIdParam();
      let query = supabase
        .from("platform_connections")
        .select("id, platform, display_name, handle, connected, last_synced_at, follower_count")
        .order("connected", { ascending: false })
        .order("display_name", { ascending: true });
      if (athleteId) query = query.eq("athlete_id", athleteId);
      const { data, error } = await query;
      if (error) throw error;
      return json({ connections: data ?? [] });
    }

    if (action === "get_follower_snapshots") {
      const athleteId = athleteIdParam();
      const since = str((body as Record<string, unknown>).since, 10);
      let query = supabase
        .from("platform_follower_snapshots")
        .select("platform, captured_on, follower_count")
        .order("captured_on", { ascending: true });
      if (since) query = query.gte("captured_on", since);
      if (athleteId) query = query.eq("athlete_id", athleteId);
      const { data, error } = await query;
      if (error) throw error;
      return json({ snapshots: data ?? [] });
    }

    if (action === "get_instagram") {
      const athleteId = athleteIdParam();
      const rawLimit = (body as Record<string, unknown>).limit;
      const limit = typeof rawLimit === "number" ? Math.max(1, Math.min(50, rawLimit)) : 12;

      let authQuery = supabase
        .from("instagram_auth")
        .select("ig_user_id, athlete_id")
        .order("connected_at", { ascending: false })
        .limit(1);
      if (athleteId) authQuery = authQuery.eq("athlete_id", athleteId);
      const { data: auth } = await authQuery.maybeSingle();
      const igUserId = auth?.ig_user_id ?? null;
      if (!igUserId) return json({ stats: null, media: [] });

      const [{ data: stats }, { data: media }] = await Promise.all([
        supabase
          .from("instagram_account_stats")
          .select("*")
          .eq("ig_user_id", igUserId)
          .order("last_synced_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("instagram_media")
          .select(
            "media_id, caption, media_type, media_product_type, media_url, thumbnail_url, permalink, like_count, comments_count, saved, reach, impressions, timestamp",
          )
          .eq("ig_user_id", igUserId)
          .order("timestamp", { ascending: false })
          .limit(limit),
      ]);
      return json({ stats: stats ?? null, media: media ?? [] });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    const detail =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null
          ? JSON.stringify(err)
          : String(err);
    console.error("athlete-state failed:", detail);
    return json({ error: detail || "Request failed" }, 500);
  }
});
