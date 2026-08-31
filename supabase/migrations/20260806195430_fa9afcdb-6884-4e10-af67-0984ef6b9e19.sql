REVOKE ALL ON FUNCTION public.seed_athlete_platform_connections(uuid) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.seed_platform_connections_for_new_athlete() FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.seed_athlete_platform_connections(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.seed_platform_connections_for_new_athlete() TO service_role;