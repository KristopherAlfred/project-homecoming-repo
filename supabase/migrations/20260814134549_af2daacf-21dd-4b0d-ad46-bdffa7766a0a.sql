CREATE TABLE IF NOT EXISTS public.youtube_auth (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references public.athletes(id) on delete cascade,
  channel_id text not null unique,
  channel_title text,
  handle text,
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  connected_at timestamptz not null default now()
);
GRANT ALL ON public.youtube_auth TO service_role;
ALTER TABLE public.youtube_auth ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.youtube_channel_stats (
  channel_id text primary key,
  athlete_id uuid references public.athletes(id) on delete cascade,
  title text,
  handle text,
  subscribers bigint not null default 0,
  total_views bigint not null default 0,
  total_videos bigint not null default 0,
  thumbnail_url text,
  last_synced_at timestamptz not null default now()
);
GRANT SELECT ON public.youtube_channel_stats TO authenticated;
GRANT ALL ON public.youtube_channel_stats TO service_role;
ALTER TABLE public.youtube_channel_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read youtube channel stats"
  ON public.youtube_channel_stats FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.youtube_videos (
  video_id text primary key,
  channel_id text not null,
  athlete_id uuid references public.athletes(id) on delete cascade,
  title text,
  description text,
  thumbnail_url text,
  published_at timestamptz,
  duration_seconds integer not null default 0,
  view_count bigint not null default 0,
  like_count bigint not null default 0,
  comment_count bigint not null default 0,
  last_synced_at timestamptz not null default now()
);
GRANT SELECT ON public.youtube_videos TO authenticated;
GRANT ALL ON public.youtube_videos TO service_role;
ALTER TABLE public.youtube_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read youtube videos"
  ON public.youtube_videos FOR SELECT TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS youtube_videos_channel_idx ON public.youtube_videos (channel_id, published_at DESC);