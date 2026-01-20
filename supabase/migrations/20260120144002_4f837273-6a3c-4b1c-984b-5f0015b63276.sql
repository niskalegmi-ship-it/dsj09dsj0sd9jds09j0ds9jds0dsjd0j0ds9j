-- Add TOTP fields to admin_users
ALTER TABLE public.admin_users
ADD COLUMN IF NOT EXISTS totp_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS totp_secret text;

-- Store admin session tokens securely (hashed)
CREATE TABLE IF NOT EXISTS public.admin_auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  CONSTRAINT admin_auth_sessions_token_hash_format CHECK (token_hash ~ '^[a-f0-9]{64}$')
);

ALTER TABLE public.admin_auth_sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_admin_auth_sessions_admin_user_id ON public.admin_auth_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_auth_sessions_expires_at ON public.admin_auth_sessions(expires_at);