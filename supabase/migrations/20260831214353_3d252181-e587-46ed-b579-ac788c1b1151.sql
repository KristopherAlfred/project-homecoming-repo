CREATE TABLE public.platform_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid,
  platform text NOT NULL,
  display_name text NOT NULL,
  handle text,
  connected boolean NOT NULL DEFAULT false,
  follower_count bigint,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX platform_connections_athlete_platform_key
  ON public.platform_connections (COALESCE(athlete_id, '00000000-0000-0000-0000-000000000000'::uuid), platform);

GRANT SELECT ON public.platform_connections TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.platform_connections TO authenticated;
GRANT ALL ON public.platform_connections TO service_role;
ALTER TABLE public.platform_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Platform connections are readable" ON public.platform_connections FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Signed-in users manage platform connections" ON public.platform_connections FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.platform_follower_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid,
  platform text NOT NULL,
  captured_on date NOT NULL DEFAULT current_date,
  follower_count bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.platform_follower_snapshots TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.platform_follower_snapshots TO authenticated;
GRANT ALL ON public.platform_follower_snapshots TO service_role;
ALTER TABLE public.platform_follower_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Follower snapshots are readable" ON public.platform_follower_snapshots FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Signed-in users manage snapshots" ON public.platform_follower_snapshots FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.platform_connections (platform, display_name) VALUES
  ('instagram','Instagram'),
  ('youtube','YouTube'),
  ('tiktok','TikTok'),
  ('x','X (Twitter)'),
  ('facebook','Facebook'),
  ('twitch','Twitch'),
  ('spotify','Spotify'),
  ('mailchimp','Mailchimp');