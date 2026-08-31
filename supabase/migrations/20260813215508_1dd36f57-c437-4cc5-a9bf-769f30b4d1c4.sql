CREATE TABLE public.athlete_fan_apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE UNIQUE,
  slug text NOT NULL UNIQUE,
  app_name text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_published boolean NOT NULL DEFAULT false,
  view_count bigint NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.athlete_fan_apps TO anon, authenticated;
GRANT ALL ON public.athlete_fan_apps TO service_role;

ALTER TABLE public.athlete_fan_apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published fan apps are publicly viewable"
  ON public.athlete_fan_apps FOR SELECT
  USING (is_published = true);

CREATE TRIGGER athlete_fan_apps_set_updated_at BEFORE UPDATE ON public.athlete_fan_apps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX athlete_fan_apps_slug_idx ON public.athlete_fan_apps (slug);