-- Create table to track client sessions and their current step
CREATE TABLE public.client_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_code VARCHAR(10) NOT NULL UNIQUE,
  client_name VARCHAR(255),
  phone_number VARCHAR(50),
  current_step INTEGER NOT NULL DEFAULT 1,
  parcel_tracking VARCHAR(100),
  amount DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_sessions ENABLE ROW LEVEL SECURITY;

-- Public read/write for now (admin panel will control)
CREATE POLICY "Allow public read access" 
ON public.client_sessions 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert" 
ON public.client_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update" 
ON public.client_sessions 
FOR UPDATE 
USING (true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_sessions;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_client_sessions_updated_at
BEFORE UPDATE ON public.client_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();