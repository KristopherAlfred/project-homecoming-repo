
REVOKE ALL ON FUNCTION public.is_athlete_owner(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_athlete_owner(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_athlete_owner(uuid) TO authenticated, service_role;
