-- ============ athletes ============
CREATE TABLE public.athletes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  profile_key text UNIQUE,
  full_name text NOT NULL,
  display_name text,
  full_name_normalized text GENERATED ALWAYS AS (lower(regexp_replace(full_name, '[^a-zA-Z0-9]', '', 'g'))) STORED,
  sport text,
  sport_icon text,
  gender text,
  team_or_league text,
  bio_short text,
  profile_photo_url text,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.athletes TO anon, authenticated;
GRANT ALL ON public.athletes TO service_role;
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Athletes are readable" ON public.athletes FOR SELECT USING (true);
CREATE TRIGGER athletes_set_updated_at BEFORE UPDATE ON public.athletes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX athletes_name_norm_idx ON public.athletes (full_name_normalized);

-- ============ athlete_theme ============
CREATE TABLE public.athlete_theme (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE UNIQUE,
  template_id text NOT NULL DEFAULT 'mint-night',
  bg_solid text NOT NULL DEFAULT '#050505',
  gradient_from text NOT NULL DEFAULT '#050505',
  gradient_via text NOT NULL DEFAULT '#0A1A12',
  gradient_to text NOT NULL DEFAULT '#05140E',
  accent_color text NOT NULL DEFAULT '#7CE7B0',
  accent_hover text NOT NULL DEFAULT '#A8F0CC',
  button_bg text NOT NULL DEFAULT '#7CE7B0',
  button_text text NOT NULL DEFAULT '#04231A',
  button_border_radius integer NOT NULL DEFAULT 999,
  background_image text,
  logo_url text,
  tagline text,
  headline text,
  subheadline text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.athlete_theme TO anon, authenticated;
GRANT ALL ON public.athlete_theme TO service_role;
ALTER TABLE public.athlete_theme ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Athlete themes are readable" ON public.athlete_theme FOR SELECT USING (true);
CREATE TRIGGER athlete_theme_set_updated_at BEFORE UPDATE ON public.athlete_theme
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ athlete_bio_links ============
CREATE TABLE public.athlete_bio_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  destination_app_url text,
  is_published boolean NOT NULL DEFAULT false,
  click_count bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.athlete_bio_links TO anon, authenticated;
GRANT ALL ON public.athlete_bio_links TO service_role;
ALTER TABLE public.athlete_bio_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bio links are readable" ON public.athlete_bio_links FOR SELECT USING (true);
CREATE TRIGGER athlete_bio_links_set_updated_at BEFORE UPDATE ON public.athlete_bio_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ athlete_ai_insights ============
CREATE TABLE public.athlete_ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  insight_type text NOT NULL DEFAULT 'trend',
  summary text NOT NULL,
  recommendation text,
  data_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.athlete_ai_insights TO anon, authenticated;
GRANT ALL ON public.athlete_ai_insights TO service_role;
ALTER TABLE public.athlete_ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "AI insights are readable" ON public.athlete_ai_insights FOR SELECT USING (true);
CREATE INDEX athlete_ai_insights_athlete_idx ON public.athlete_ai_insights (athlete_id, created_at DESC);

-- ============ scope existing tables to an athlete ============
ALTER TABLE public.platform_connections
  ADD COLUMN athlete_id uuid REFERENCES public.athletes(id) ON DELETE CASCADE;
ALTER TABLE public.platform_follower_snapshots
  ADD COLUMN athlete_id uuid REFERENCES public.athletes(id) ON DELETE CASCADE;
ALTER TABLE public.onboarding_state
  ADD COLUMN athlete_id uuid REFERENCES public.athletes(id) ON DELETE CASCADE;
ALTER TABLE public.instagram_auth
  ADD COLUMN athlete_id uuid REFERENCES public.athletes(id) ON DELETE CASCADE;

CREATE INDEX platform_connections_athlete_idx ON public.platform_connections (athlete_id);
CREATE INDEX platform_snapshots_athlete_idx ON public.platform_follower_snapshots (athlete_id);
