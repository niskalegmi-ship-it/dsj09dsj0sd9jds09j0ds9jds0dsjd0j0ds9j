import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
