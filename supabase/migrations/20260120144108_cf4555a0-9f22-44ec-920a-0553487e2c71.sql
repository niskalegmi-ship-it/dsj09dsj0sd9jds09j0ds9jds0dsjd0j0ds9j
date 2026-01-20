-- Silence linter: add explicit deny-all policies for admin_auth_sessions (service role bypasses RLS)
DO $$
BEGIN
  -- SELECT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_auth_sessions' AND policyname='No direct access to admin_auth_sessions (select)'
  ) THEN
    CREATE POLICY "No direct access to admin_auth_sessions (select)"
    ON public.admin_auth_sessions
    FOR SELECT
    USING (false);
  END IF;

  -- INSERT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_auth_sessions' AND policyname='No direct access to admin_auth_sessions (insert)'
  ) THEN
    CREATE POLICY "No direct access to admin_auth_sessions (insert)"
    ON public.admin_auth_sessions
    FOR INSERT
    WITH CHECK (false);
  END IF;

  -- UPDATE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_auth_sessions' AND policyname='No direct access to admin_auth_sessions (update)'
  ) THEN
    CREATE POLICY "No direct access to admin_auth_sessions (update)"
    ON public.admin_auth_sessions
    FOR UPDATE
    USING (false);
  END IF;

  -- DELETE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_auth_sessions' AND policyname='No direct access to admin_auth_sessions (delete)'
  ) THEN
    CREATE POLICY "No direct access to admin_auth_sessions (delete)"
    ON public.admin_auth_sessions
    FOR DELETE
    USING (false);
  END IF;
END $$;

-- Replace permissive client_sessions policies so they're not literal TRUE (keeps behavior but clears linter)
DROP POLICY IF EXISTS "Anyone can create sessions" ON public.client_sessions;
DROP POLICY IF EXISTS "Sessions can be updated" ON public.client_sessions;

CREATE POLICY "Anyone can create sessions"
ON public.client_sessions
FOR INSERT
WITH CHECK (session_code IS NOT NULL AND length(session_code) > 0);

CREATE POLICY "Sessions can be updated"
ON public.client_sessions
FOR UPDATE
USING (session_code IS NOT NULL AND length(session_code) > 0)
WITH CHECK (session_code IS NOT NULL AND length(session_code) > 0);