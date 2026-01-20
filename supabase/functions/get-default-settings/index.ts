import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role key to access admin_settings (bypasses RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch only the public default settings (not sensitive ones)
    const publicSettingKeys = [
      "default_amount",
      "default_origin",
      "default_destination",
      "default_est_delivery",
      "default_weight",
      "tracking_prefix"
    ];

    const { data, error } = await supabase
      .from("admin_settings")
      .select("setting_key, setting_value")
      .in("setting_key", publicSettingKeys);

    if (error) {
      console.error("Error fetching settings:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch settings" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert to key-value object
    const settings: Record<string, string> = {};
    if (data) {
      for (const item of data) {
        if (item.setting_value) {
          settings[item.setting_key] = item.setting_value;
        }
      }
    }

    console.log("Default settings fetched successfully");
    return new Response(
      JSON.stringify({ success: true, settings }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in get-default-settings function:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Operation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
