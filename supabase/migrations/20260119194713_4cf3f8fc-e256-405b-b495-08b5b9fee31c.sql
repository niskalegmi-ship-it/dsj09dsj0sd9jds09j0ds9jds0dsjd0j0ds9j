-- Add approval_type column to track how payment was approved
ALTER TABLE public.client_sessions 
ADD COLUMN approval_type character varying DEFAULT NULL;