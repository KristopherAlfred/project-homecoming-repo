ALTER TABLE public.platform_connections DROP CONSTRAINT IF EXISTS platform_connections_platform_key;
CREATE UNIQUE INDEX IF NOT EXISTS platform_connections_athlete_platform_key
  ON public.platform_connections (athlete_id, platform);

CREATE OR REPLACE FUNCTION public.seed_athlete_platform_connections(_athlete_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.platform_connections (athlete_id, platform, display_name, connected)
  SELECT _athlete_id, d.platform, d.display_name, false
  FROM (VALUES
    ('instagram','Instagram'),
    ('youtube','YouTube'),
    ('tiktok','TikTok'),
    ('x','X (Twitter)'),
    ('facebook','Facebook'),
    ('twitch','Twitch'),
    ('spotify','Spotify'),
    ('mailchimp','Mailchimp')
  ) AS d(platform, display_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.platform_connections pc
    WHERE pc.athlete_id = _athlete_id AND pc.platform = d.platform
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.seed_platform_connections_for_new_athlete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.seed_athlete_platform_connections(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS athletes_seed_platform_connections ON public.athletes;
CREATE TRIGGER athletes_seed_platform_connections
AFTER INSERT ON public.athletes
FOR EACH ROW EXECUTE FUNCTION public.seed_platform_connections_for_new_athlete();

DO $$
DECLARE a record;
BEGIN
  FOR a IN SELECT id FROM public.athletes LOOP
    PERFORM public.seed_athlete_platform_connections(a.id);
  END LOOP;
END $$;