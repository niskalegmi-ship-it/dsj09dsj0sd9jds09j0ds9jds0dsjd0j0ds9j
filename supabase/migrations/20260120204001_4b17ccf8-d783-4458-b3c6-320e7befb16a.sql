-- Ensure public clients can INSERT into client_sessions (needed to create a new session)
-- This does NOT grant read access; SELECT/UPDATE remain protected by existing policies.
DROP POLICY IF EXISTS "Public can create client sessions" ON public.client_sessions;
CREATE POLICY "Public can create client sessions"
ON public.client_sessions
FOR INSERT
TO public
WITH CHECK (
  (session_code IS NOT NULL) AND (length(session_code::text) > 0)
);

-- Make sure RLS is enabled (no-op if already enabled)
ALTER TABLE public.client_sessions ENABLE ROW LEVEL SECURITY;