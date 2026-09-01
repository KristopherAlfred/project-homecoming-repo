CREATE TABLE public.athlete_fan_apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  app_name text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_published boolean NOT NULL DEFAULT false,
  view_count integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX athlete_fan_apps_athlete_id_idx ON public.athlete_fan_apps(athlete_id);

GRANT SELECT ON public.athlete_fan_apps TO anon, authenticated;
GRANT ALL ON public.athlete_fan_apps TO service_role;

ALTER TABLE public.athlete_fan_apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published fan apps are readable by anyone"
ON public.athlete_fan_apps FOR SELECT
USING (is_published = true);

CREATE TRIGGER set_athlete_fan_apps_updated_at
BEFORE UPDATE ON public.athlete_fan_apps
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();