-- Allow public delete for client_sessions (for admin cleanup)
CREATE POLICY "Allow public delete" 
ON public.client_sessions 
FOR DELETE 
USING (true);