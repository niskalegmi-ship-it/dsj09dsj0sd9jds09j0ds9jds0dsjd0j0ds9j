import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS_PER_MINUTE = 30;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);
  
  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + 60000 });
    return false;
  }
  
  if (record.count >= MAX_REQUESTS_PER_MINUTE) {
    return true;
  }
  
  record.count++;
  return false;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP from headers (Supabase/Cloudflare provides this)
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('cf-connecting-ip') 
      || req.headers.get('x-real-ip')
      || '';

    // Check rate limiting
    if (isRateLimited(clientIP)) {
      console.log(`Rate limited detect-country request from IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ countryCode: '', countryName: '', error: 'Too many requests' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Detecting country for IP:', clientIP);

    // Use ip-api.com (free, no API key required, 45 requests/minute limit)
    const response = await fetch(`http://ip-api.com/json/${clientIP}?fields=status,countryCode,country`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch geolocation data');
    }

    const data = await response.json();
    console.log('Geolocation response:', data);

    if (data.status === 'success') {
      return new Response(
        JSON.stringify({
          countryCode: data.countryCode,
          countryName: data.country,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Fallback if geolocation fails
    return new Response(
      JSON.stringify({
        countryCode: '',
        countryName: '',
        error: 'Could not determine location',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error detecting country:', error);
    return new Response(
      JSON.stringify({
        countryCode: '',
        countryName: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }
});
