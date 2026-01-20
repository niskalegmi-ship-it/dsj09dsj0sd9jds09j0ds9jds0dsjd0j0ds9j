import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SessionsRequest {
  action: "list" | "update" | "delete" | "delete_all";
  sessionId?: string;
  updates?: Record<string, unknown>;
  ids?: string[];
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
      console.log("Unauthorized sessions access attempt");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role key to access client_sessions (bypasses RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, sessionId, updates, ids }: SessionsRequest = await req.json();

    if (action === "list") {
      // Fetch all sessions (admin only)
      const { data, error } = await supabase
        .from("client_sessions")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching sessions:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch sessions" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "update" && sessionId && updates) {
      const { error } = await supabase
        .from("client_sessions")
        .update(updates)
        .eq("id", sessionId);

      if (error) {
        console.error("Error updating session:", error);
        return new Response(
          JSON.stringify({ error: "Failed to update session" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "delete" && ids && ids.length > 0) {
      const { error } = await supabase
        .from("client_sessions")
        .delete()
        .in("id", ids);

      if (error) {
        console.error("Error deleting sessions:", error);
        return new Response(
          JSON.stringify({ error: "Failed to delete sessions" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Deleted ${ids.length} sessions`);
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "delete_all") {
      // Delete all sessions
      const { error } = await supabase
        .from("client_sessions")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) {
        console.error("Error deleting all sessions:", error);
        return new Response(
          JSON.stringify({ error: "Failed to delete all sessions" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("All sessions deleted");
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
    console.error("Error in admin-sessions function:", error);
    return new Response(
      JSON.stringify({ error: "Operation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});