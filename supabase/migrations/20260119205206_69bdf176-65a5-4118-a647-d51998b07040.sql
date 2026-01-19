-- Add IP address column to client_sessions for easier client identification
ALTER TABLE public.client_sessions 
ADD COLUMN client_ip character varying DEFAULT NULL;