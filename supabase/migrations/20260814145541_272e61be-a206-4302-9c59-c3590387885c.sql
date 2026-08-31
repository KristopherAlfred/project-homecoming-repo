ALTER TABLE public.platform_follower_snapshots
  DROP CONSTRAINT IF EXISTS platform_follower_snapshots_platform_captured_on_key;

CREATE UNIQUE INDEX IF NOT EXISTS platform_follower_snapshots_athlete_platform_day_key
  ON public.platform_follower_snapshots (athlete_id, platform, captured_on);