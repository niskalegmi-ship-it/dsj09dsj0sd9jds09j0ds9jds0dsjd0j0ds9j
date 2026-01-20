-- Add weight column to client_sessions table
ALTER TABLE public.client_sessions ADD COLUMN IF NOT EXISTS weight character varying DEFAULT '2.5 kg';