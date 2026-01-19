-- Add verification_code column to store the current code for each session
ALTER TABLE public.client_sessions 
ADD COLUMN verification_code VARCHAR(6) DEFAULT NULL;