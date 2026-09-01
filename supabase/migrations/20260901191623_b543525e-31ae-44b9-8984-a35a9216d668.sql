CREATE TABLE public.athletes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_key text UNIQUE,
  full_name text NOT NULL,
  display_name text,
  sport text,
  sport_icon text,
  gender text,
  team_or_league text,
  competition_level text,
  league text,
  position text,
  bio_short text,
  profile_photo_url text,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.athletes TO anon, authenticated;
GRANT ALL ON public.athletes TO service_role;
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "App can read athletes" ON public.athletes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "App can insert athletes" ON public.athletes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "App can update athletes" ON public.athletes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.athlete_themes (
  athlete_id uuid PRIMARY KEY REFERENCES public.athletes(id) ON DELETE CASCADE,
  template_id text NOT NULL DEFAULT 'default',
  bg_solid text NOT NULL DEFAULT '#050505',
  gradient_from text NOT NULL DEFAULT '#050505',
  gradient_via text NOT NULL DEFAULT '#0b0b0d',
  gradient_to text NOT NULL DEFAULT '#000000',
  accent_color text NOT NULL DEFAULT '#e11d2a',
  accent_hover text NOT NULL DEFAULT '#b8121f',
  button_bg text NOT NULL DEFAULT '#e11d2a',
  button_text text NOT NULL DEFAULT '#ffffff',
  button_border_radius integer NOT NULL DEFAULT 12,
  background_image text,
  logo_url text,
  tagline text,
  headline text,
  subheadline text,
  fan_app_name text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.athlete_themes TO anon, authenticated;
GRANT ALL ON public.athlete_themes TO service_role;
ALTER TABLE public.athlete_themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "App can read themes" ON public.athlete_themes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "App can insert themes" ON public.athlete_themes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "App can update themes" ON public.athlete_themes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.athlete_bio_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  destination_app_url text,
  is_published boolean NOT NULL DEFAULT true,
  click_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX athlete_bio_links_athlete_idx ON public.athlete_bio_links (athlete_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.athlete_bio_links TO anon, authenticated;
GRANT ALL ON public.athlete_bio_links TO service_role;
ALTER TABLE public.athlete_bio_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "App can read bio links" ON public.athlete_bio_links FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "App can insert bio links" ON public.athlete_bio_links FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "App can update bio links" ON public.athlete_bio_links FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.onboarding_state (
  profile_key text PRIMARY KEY,
  has_completed_onboarding boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_state TO anon, authenticated;
GRANT ALL ON public.onboarding_state TO service_role;
ALTER TABLE public.onboarding_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "App can read onboarding state" ON public.onboarding_state FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "App can insert onboarding state" ON public.onboarding_state FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "App can update onboarding state" ON public.onboarding_state FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER athletes_updated_at BEFORE UPDATE ON public.athletes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER athlete_themes_updated_at BEFORE UPDATE ON public.athlete_themes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER athlete_bio_links_updated_at BEFORE UPDATE ON public.athlete_bio_links FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER onboarding_state_updated_at BEFORE UPDATE ON public.onboarding_state FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();