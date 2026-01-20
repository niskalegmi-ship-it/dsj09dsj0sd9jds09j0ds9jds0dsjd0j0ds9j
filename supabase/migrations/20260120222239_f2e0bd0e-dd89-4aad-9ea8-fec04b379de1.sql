-- Add session_path column to store unique URL paths
ALTER TABLE public.client_sessions 
ADD COLUMN IF NOT EXISTS session_path character varying UNIQUE;