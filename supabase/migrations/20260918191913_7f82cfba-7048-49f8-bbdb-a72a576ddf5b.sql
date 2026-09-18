CREATE TABLE public.live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid REFERENCES public.athletes(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Live',
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','ended')),
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.live_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  username text NOT NULL DEFAULT 'Fan',
  body text NOT NULL,
  kind text NOT NULL DEFAULT 'chat' CHECK (kind IN ('chat','reaction')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT live_chat_body_len CHECK (char_length(body) BETWEEN 1 AND 300)
);

CREATE INDEX live_sessions_athlete_idx ON public.live_sessions (athlete_id, created_at DESC);
CREATE INDEX live_chat_session_idx ON public.live_chat_messages (session_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.live_sessions TO anon, authenticated;
GRANT ALL ON public.live_sessions TO service_role;
GRANT SELECT, INSERT ON public.live_chat_messages TO anon, authenticated;
GRANT ALL ON public.live_chat_messages TO service_role;

ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "live_sessions_public_read" ON public.live_sessions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "live_sessions_create" ON public.live_sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "live_sessions_update" ON public.live_sessions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "live_chat_public_read" ON public.live_chat_messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "live_chat_public_write" ON public.live_chat_messages FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.live_sessions s WHERE s.id = session_id AND s.status IN ('scheduled','live')));

CREATE TRIGGER live_sessions_updated_at BEFORE UPDATE ON public.live_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.live_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_messages;