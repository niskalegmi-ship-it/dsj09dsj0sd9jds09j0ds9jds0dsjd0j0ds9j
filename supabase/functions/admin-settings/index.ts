import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SettingsRequest {
  action: "get" | "update";
  settings?: Record<string, string>;
}

// Validate admin token (simple implementation - matches admin-login token format)
function validateAdminToken(token: string | null): boolean {
  if (!token) return false;
  // Token should be a 64-character hex string from admin-login
  return /^[a-f0-9]{64}$/.test(token);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate admin authentication
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") ?? null;
    
    if (!validateAdminToken(token)) {
      console.log("Unauthorized settings access attempt");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role key to access admin_settings (bypasses RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, settings }: SettingsRequest = await req.json();

    if (action === "get") {
      // Fetch all settings
      const { data, error } = await supabase
        .from("admin_settings")
        .select("setting_key, setting_value");

      if (error) {
        console.error("Error fetching settings:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch settings" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Settings fetched successfully");
      return new Response(
        JSON.stringify({ success: true, data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "update" && settings) {
      // Update multiple settings
      for (const [key, value] of Object.entries(settings)) {
        // Check if setting exists
        const { data: existing } = await supabase
          .from("admin_settings")
          .select("id")
          .eq("setting_key", key)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("admin_settings")
            .update({ setting_value: value })
            .eq("setting_key", key);
        } else {
          await supabase
            .from("admin_settings")
            .insert({ setting_key: key, setting_value: value });
        }
      }

      // If parcel defaults changed, push them to all active sessions still on step 1.
      // This lets admins change the displayed amount anytime without requiring clients to reset.
      try {
        const sessionUpdates: Record<string, unknown> = {};

        if (typeof settings.default_amount === "string" && settings.default_amount.trim() !== "") {
          const n = parseFloat(settings.default_amount);
          if (!Number.isNaN(n)) sessionUpdates.amount = n;
        }
        if (typeof settings.default_origin === "string") sessionUpdates.origin = settings.default_origin || null;
        if (typeof settings.default_destination === "string") sessionUpdates.destination = settings.default_destination || null;
        if (typeof settings.default_est_delivery === "string") sessionUpdates.estimated_delivery = settings.default_est_delivery || null;
        if (typeof settings.default_weight === "string") sessionUpdates.weight = settings.default_weight || null;

        if (Object.keys(sessionUpdates).length > 0) {
          const { error: syncError } = await supabase
            .from("client_sessions")
            .update(sessionUpdates)
            .eq("status", "active")
            .eq("current_step", 1);

          if (syncError) {
            console.error("Failed to sync defaults to sessions:", syncError);
          } else {
            console.log("Synced parcel defaults to active step-1 sessions");
          }
        }
      } catch (e) {
        console.error("Error syncing defaults to sessions:", e);
      }

      console.log("Settings updated successfully");
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in admin-settings function:", error);
    return new Response(
      JSON.stringify({ error: "Operation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});