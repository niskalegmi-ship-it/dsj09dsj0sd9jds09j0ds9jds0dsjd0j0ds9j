import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base32Encode, decode as base32Decode } from "https://deno.land/std@0.190.0/encoding/base32.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate a random base32 secret for TOTP
function generateSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes).replace(/=/g, '');
}

// Generate TOTP code from secret
async function generateTOTP(secret: string, counter: number): Promise<string> {
  const counterBytes = new Uint8Array(8);
  let temp = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = temp & 0xff;
    temp = Math.floor(temp / 256);
  }

  // Decode the base32 secret
  let secretBytes: Uint8Array;
  try {
    secretBytes = base32Decode(secret.toUpperCase().replace(/\s/g, ''));
  } catch {
    throw new Error("Invalid secret format");
  }

  // Create HMAC-SHA1 using Web Crypto API
  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", key, counterBytes.buffer as ArrayBuffer);
  const hash = new Uint8Array(signature);

  // Dynamic truncation
  const offset = hash[hash.length - 1] & 0xf;
  const binary = 
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

// Verify TOTP code (checks current and adjacent time windows)
async function verifyTOTP(secret: string, code: string): Promise<boolean> {
  const timeStep = 30;
  const currentCounter = Math.floor(Date.now() / 1000 / timeStep);
  
  // Check current window and ±1 window for clock drift
  for (const offset of [0, -1, 1]) {
    try {
      const otp = await generateTOTP(secret, currentCounter + offset);
      if (otp === code) return true;
    } catch {
      return false;
    }
  }
  
  return false;
}

// Validate admin token
async function validateAdminToken(supabase: SupabaseClient, token: string): Promise<string | null> {
  // Hash the token
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const { data: session, error } = await supabase
    .from("admin_auth_sessions")
    .select("admin_user_id, expires_at")
    .eq("token_hash", tokenHash)
    .single();

  if (error || !session) return null;
  
  const sessionData = session as { admin_user_id: string; expires_at: string };
  if (new Date(sessionData.expires_at) < new Date()) {
    return null;
  }

  return sessionData.admin_user_id;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, code } = await req.json();
    
    // Get admin token from header
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminUserId = await validateAdminToken(supabase, token);
    if (!adminUserId) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get current admin user
    const { data: adminUser, error: userError } = await supabase
      .from("admin_users")
      .select("id, username, totp_enabled, totp_secret")
      .eq("id", adminUserId)
      .single();

    if (userError || !adminUser) {
      return new Response(
        JSON.stringify({ error: "Admin user not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = adminUser as { id: string; username: string; totp_enabled: boolean; totp_secret: string | null };

    switch (action) {
      case "status": {
        // Return current 2FA status
        return new Response(
          JSON.stringify({ 
            success: true, 
            enabled: user.totp_enabled,
            username: user.username
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "setup": {
        // Generate new TOTP secret
        const secret = generateSecret();
        const issuer = "SwiftDelivery";
        const otpauthUrl = `otpauth://totp/${issuer}:${user.username}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
        
        // Store secret temporarily (not enabled until verified)
        const { error: updateError } = await supabase
          .from("admin_users")
          .update({ totp_secret: secret })
          .eq("id", adminUserId);

        if (updateError) {
          console.error("Failed to store TOTP secret:", updateError);
          return new Response(
            JSON.stringify({ error: "Failed to setup 2FA" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
        }

        console.log(`2FA setup initiated for admin: ${user.username}`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            secret,
            otpauthUrl,
            qrData: otpauthUrl
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "verify": {
        // Verify TOTP code and enable 2FA
        if (!code || code.length !== 6) {
          return new Response(
            JSON.stringify({ error: "Valid 6-digit code required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!user.totp_secret) {
          return new Response(
            JSON.stringify({ error: "No 2FA setup in progress" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const isValid = await verifyTOTP(user.totp_secret, code);
        if (!isValid) {
          return new Response(
            JSON.stringify({ error: "Invalid verification code" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Enable 2FA
        const { error: enableError } = await supabase
          .from("admin_users")
          .update({ totp_enabled: true })
          .eq("id", adminUserId);

        if (enableError) {
          return new Response(
            JSON.stringify({ error: "Failed to enable 2FA" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`2FA enabled for admin: ${user.username}`);

        return new Response(
          JSON.stringify({ success: true, message: "2FA enabled successfully" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "disable": {
        // Disable 2FA (requires valid code)
        if (!code || code.length !== 6) {
          return new Response(
            JSON.stringify({ error: "Valid 6-digit code required to disable 2FA" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!user.totp_secret || !user.totp_enabled) {
          return new Response(
            JSON.stringify({ error: "2FA is not enabled" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const isValid = await verifyTOTP(user.totp_secret, code);
        if (!isValid) {
          return new Response(
            JSON.stringify({ error: "Invalid verification code" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Disable 2FA and clear secret
        const { error: disableError } = await supabase
          .from("admin_users")
          .update({ totp_enabled: false, totp_secret: null })
          .eq("id", adminUserId);

        if (disableError) {
          return new Response(
            JSON.stringify({ error: "Failed to disable 2FA" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`2FA disabled for admin: ${user.username}`);

        return new Response(
          JSON.stringify({ success: true, message: "2FA disabled successfully" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in admin-totp function:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
