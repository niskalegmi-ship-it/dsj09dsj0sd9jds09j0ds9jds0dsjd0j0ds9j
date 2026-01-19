-- Create admin_settings table for storing Telegram credentials
CREATE TABLE public.admin_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key character varying NOT NULL UNIQUE,
  setting_value text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read for settings (needed for edge functions)
CREATE POLICY "Allow public read for settings"
ON public.admin_settings
FOR SELECT
USING (true);

-- Allow public update for settings (admin panel will handle auth)
CREATE POLICY "Allow public update for settings"
ON public.admin_settings
FOR UPDATE
USING (true);

-- Allow public insert for settings
CREATE POLICY "Allow public insert for settings"
ON public.admin_settings
FOR INSERT
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_admin_settings_updated_at
BEFORE UPDATE ON public.admin_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default empty values for Telegram settings
INSERT INTO public.admin_settings (setting_key, setting_value) VALUES 
  ('telegram_bot_token', ''),
  ('telegram_chat_id', '');