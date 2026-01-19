-- Add admin_message column to client_sessions for custom alerts
ALTER TABLE public.client_sessions 
ADD COLUMN admin_message TEXT DEFAULT NULL,
ADD COLUMN message_type VARCHAR(20) DEFAULT NULL;

-- Create admin_users table for simple password protection
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only allow select for authentication check (no public insert/update/delete)
CREATE POLICY "Allow public read for auth check" 
ON public.admin_users 
FOR SELECT 
USING (true);

-- Insert default admin user (password: admin123 - user should change this)
-- Using simple hash for demo - in production use proper bcrypt
INSERT INTO public.admin_users (username, password_hash) 
VALUES ('admin', 'admin123');