-- Add parcel detail columns to client_sessions
ALTER TABLE public.client_sessions 
ADD COLUMN IF NOT EXISTS origin VARCHAR DEFAULT 'Los Angeles, CA',
ADD COLUMN IF NOT EXISTS destination VARCHAR DEFAULT NULL,
ADD COLUMN IF NOT EXISTS estimated_delivery VARCHAR DEFAULT '2-3 Business Days';