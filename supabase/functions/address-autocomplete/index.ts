import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS_PER_MINUTE = 20;

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
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('x-real-ip')
      || 'unknown';

    // Check rate limiting
    if (isRateLimited(clientIP)) {
      console.log(`Rate limited address-autocomplete request from IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ suggestions: [], error: 'Too many requests' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { query } = await req.json();

    if (!query || query.length < 3) {
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Searching for address: ${query}`);

    // Call Nominatim (OpenStreetMap) API
    const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search');
    nominatimUrl.searchParams.set('q', query);
    nominatimUrl.searchParams.set('format', 'json');
    nominatimUrl.searchParams.set('addressdetails', '1');
    nominatimUrl.searchParams.set('limit', '5');

    const response = await fetch(nominatimUrl.toString(), {
      headers: {
        'User-Agent': 'ParcelDeliveryApp/1.0', // Required by Nominatim
        'Accept-Language': 'en',
      },
    });

    if (!response.ok) {
      console.error(`Nominatim API error: ${response.status}`);
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Found ${data.length} results`);

    // Transform Nominatim response to our format
    const suggestions = data.map((item: { display_name: string; address?: { house_number?: string; road?: string; pedestrian?: string; suburb?: string; city?: string; town?: string; village?: string; municipality?: string; postcode?: string; country?: string } }) => ({
      fullAddress: item.display_name,
      street: [item.address?.house_number, item.address?.road].filter(Boolean).join(' ') || 
              item.address?.pedestrian || 
              item.address?.suburb || '',
      city: item.address?.city || 
            item.address?.town || 
            item.address?.village || 
            item.address?.municipality || '',
      postcode: item.address?.postcode || '',
      country: item.address?.country || '',
    }));

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in address-autocomplete:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, suggestions: [] }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
