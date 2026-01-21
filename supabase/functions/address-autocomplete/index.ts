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
    const suggestions = data.map((item: any) => ({
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
