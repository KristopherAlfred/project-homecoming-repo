DROP POLICY IF EXISTS "Authenticated can read youtube channel stats" ON public.youtube_channel_stats;
CREATE POLICY "Athletes read their own youtube channel stats"
ON public.youtube_channel_stats FOR SELECT TO authenticated
USING (public.is_athlete_owner(athlete_id));

DROP POLICY IF EXISTS "Authenticated can read youtube videos" ON public.youtube_videos;
CREATE POLICY "Athletes read their own youtube videos"
ON public.youtube_videos FOR SELECT TO authenticated
USING (public.is_athlete_owner(athlete_id));

REVOKE EXECUTE ON FUNCTION public.seed_athlete_platform_connections(uuid) FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.seed_platform_connections_for_new_athlete() FROM authenticated, anon, public;
GRANT EXECUTE ON FUNCTION public.seed_athlete_platform_connections(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.seed_platform_connections_for_new_athlete() TO service_role;