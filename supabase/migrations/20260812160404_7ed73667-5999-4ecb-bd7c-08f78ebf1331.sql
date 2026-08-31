
CREATE OR REPLACE FUNCTION public.is_athlete_owner(_athlete_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.athletes a
    WHERE a.id = _athlete_id
      AND a.user_id IS NOT NULL
      AND a.user_id = auth.uid()
  )
$$;

-- athlete_ai_insights
DROP POLICY IF EXISTS "AI insights are readable" ON public.athlete_ai_insights;
REVOKE ALL ON public.athlete_ai_insights FROM anon;
GRANT SELECT ON public.athlete_ai_insights TO authenticated;
GRANT ALL ON public.athlete_ai_insights TO service_role;
CREATE POLICY "Athletes read their own AI insights"
  ON public.athlete_ai_insights FOR SELECT TO authenticated
  USING (public.is_athlete_owner(athlete_id));

-- athlete_bio_links
DROP POLICY IF EXISTS "Bio links are readable" ON public.athlete_bio_links;
GRANT SELECT ON public.athlete_bio_links TO anon;
GRANT SELECT ON public.athlete_bio_links TO authenticated;
GRANT ALL ON public.athlete_bio_links TO service_role;
CREATE POLICY "Published bio links are public"
  ON public.athlete_bio_links FOR SELECT TO anon, authenticated
  USING (is_published = true);
CREATE POLICY "Athletes read their own bio links"
  ON public.athlete_bio_links FOR SELECT TO authenticated
  USING (public.is_athlete_owner(athlete_id));

-- athlete_theme
DROP POLICY IF EXISTS "Athlete themes are readable" ON public.athlete_theme;
GRANT SELECT ON public.athlete_theme TO anon;
GRANT SELECT ON public.athlete_theme TO authenticated;
GRANT ALL ON public.athlete_theme TO service_role;
CREATE POLICY "Published themes are public"
  ON public.athlete_theme FOR SELECT TO anon, authenticated
  USING (is_published = true);
CREATE POLICY "Athletes read their own theme drafts"
  ON public.athlete_theme FOR SELECT TO authenticated
  USING (public.is_athlete_owner(athlete_id));

-- instagram_auth: fail closed, tokens never readable from the API
REVOKE ALL ON public.instagram_auth FROM anon;
REVOKE ALL ON public.instagram_auth FROM authenticated;
GRANT ALL ON public.instagram_auth TO service_role;

-- instagram_account_stats
DROP POLICY IF EXISTS "Instagram account stats are readable" ON public.instagram_account_stats;
REVOKE ALL ON public.instagram_account_stats FROM anon;
GRANT SELECT ON public.instagram_account_stats TO authenticated;
GRANT ALL ON public.instagram_account_stats TO service_role;
CREATE POLICY "Athletes read their own Instagram stats"
  ON public.instagram_account_stats FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.instagram_auth ia
    WHERE ia.ig_user_id = instagram_account_stats.ig_user_id
      AND public.is_athlete_owner(ia.athlete_id)
  ));

-- instagram_media
DROP POLICY IF EXISTS "Instagram media is readable" ON public.instagram_media;
REVOKE ALL ON public.instagram_media FROM anon;
GRANT SELECT ON public.instagram_media TO authenticated;
GRANT ALL ON public.instagram_media TO service_role;
CREATE POLICY "Athletes read their own Instagram media"
  ON public.instagram_media FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.instagram_auth ia
    WHERE ia.ig_user_id = instagram_media.ig_user_id
      AND public.is_athlete_owner(ia.athlete_id)
  ));

-- onboarding_state
DROP POLICY IF EXISTS "Onboarding state is readable" ON public.onboarding_state;
REVOKE ALL ON public.onboarding_state FROM anon;
GRANT SELECT ON public.onboarding_state TO authenticated;
GRANT ALL ON public.onboarding_state TO service_role;
CREATE POLICY "Athletes read their own onboarding state"
  ON public.onboarding_state FOR SELECT TO authenticated
  USING (public.is_athlete_owner(athlete_id));

-- platform_connections
DROP POLICY IF EXISTS "Platform connections are readable" ON public.platform_connections;
REVOKE ALL ON public.platform_connections FROM anon;
GRANT SELECT ON public.platform_connections TO authenticated;
GRANT ALL ON public.platform_connections TO service_role;
CREATE POLICY "Athletes read their own platform connections"
  ON public.platform_connections FOR SELECT TO authenticated
  USING (public.is_athlete_owner(athlete_id));

-- platform_follower_snapshots
DROP POLICY IF EXISTS "Snapshots are readable" ON public.platform_follower_snapshots;
REVOKE ALL ON public.platform_follower_snapshots FROM anon;
GRANT SELECT ON public.platform_follower_snapshots TO authenticated;
GRANT ALL ON public.platform_follower_snapshots TO service_role;
CREATE POLICY "Athletes read their own follower snapshots"
  ON public.platform_follower_snapshots FOR SELECT TO authenticated
  USING (public.is_athlete_owner(athlete_id));
