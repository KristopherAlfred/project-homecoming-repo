DROP POLICY IF EXISTS "Platform connections are readable" ON public.platform_connections;
DROP POLICY IF EXISTS "Signed-in users manage platform connections" ON public.platform_connections;
DROP POLICY IF EXISTS "Follower snapshots are readable" ON public.platform_follower_snapshots;
DROP POLICY IF EXISTS "Signed-in users manage snapshots" ON public.platform_follower_snapshots;

-- Shared connector catalog rows (no athlete) stay publicly readable; athlete rows are private.
CREATE POLICY "Anyone can read the shared connector catalog"
ON public.platform_connections FOR SELECT TO anon, authenticated
USING (athlete_id IS NULL);

CREATE POLICY "Athletes can read their own connections"
ON public.platform_connections FOR SELECT TO authenticated
USING (auth.uid() = athlete_id);

CREATE POLICY "Athletes can insert their own connections"
ON public.platform_connections FOR INSERT TO authenticated
WITH CHECK (auth.uid() = athlete_id);

CREATE POLICY "Athletes can update their own connections"
ON public.platform_connections FOR UPDATE TO authenticated
USING (auth.uid() = athlete_id) WITH CHECK (auth.uid() = athlete_id);

CREATE POLICY "Athletes can delete their own connections"
ON public.platform_connections FOR DELETE TO authenticated
USING (auth.uid() = athlete_id);

CREATE POLICY "Athletes can read their own follower snapshots"
ON public.platform_follower_snapshots FOR SELECT TO authenticated
USING (auth.uid() = athlete_id);

CREATE POLICY "Athletes can insert their own follower snapshots"
ON public.platform_follower_snapshots FOR INSERT TO authenticated
WITH CHECK (auth.uid() = athlete_id);

CREATE POLICY "Athletes can update their own follower snapshots"
ON public.platform_follower_snapshots FOR UPDATE TO authenticated
USING (auth.uid() = athlete_id) WITH CHECK (auth.uid() = athlete_id);

CREATE POLICY "Athletes can delete their own follower snapshots"
ON public.platform_follower_snapshots FOR DELETE TO authenticated
USING (auth.uid() = athlete_id);

REVOKE SELECT ON public.platform_follower_snapshots FROM anon;