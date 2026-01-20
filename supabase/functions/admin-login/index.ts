import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";
import { decode as base32Decode } from "https://deno.land/std@0.190.0/encoding/base32.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LoginRequest {
  username: string;
  password: string;
  totpCode?: string;
}

// Simple in-memory rate limiting
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const attempts = loginAttempts.get(ip);
  
  if (!attempts) return false;
  
  // Reset if lockout period has passed
  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(ip);
    return false;
  }
  
  return attempts.count >= MAX_ATTEMPTS;
}

function recordAttempt(ip: string): void {
  const now = Date.now();
  const attempts = loginAttempts.get(ip);
  
  if (!attempts || now - attempts.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
  } else {
    loginAttempts.set(ip, { count: attempts.count + 1, lastAttempt: now });
  }
}

function clearAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

// Generate a secure session token
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Hash session token for storage
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verify TOTP code
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

async function generateTOTP(secret: string, counter: number): Promise<string> {
  const counterBytes = new Uint8Array(8);
  let temp = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = temp & 0xff;
    temp = Math.floor(temp / 256);
  }

  let secretBytes: Uint8Array;
  try {
    secretBytes = base32Decode(secret.toUpperCase().replace(/\s/g, ''));
  } catch {
    throw new Error("Invalid secret format");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", key, counterBytes.buffer as ArrayBuffer);
  const hash = new Uint8Array(signature);

  const off = hash[hash.length - 1] & 0xf;
  const binary = 
    ((hash[off] & 0x7f) << 24) |
    ((hash[off + 1] & 0xff) << 16) |
    ((hash[off + 2] & 0xff) << 8) |
    (hash[off + 3] & 0xff);

  return (binary % 1000000).toString().padStart(6, '0');
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    
    // Check rate limiting
    if (isRateLimited(clientIP)) {
      console.log(`Rate limited login attempt from IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: "Too many login attempts. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { username, password, totpCode }: LoginRequest = await req.json();

    // Input validation
    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: "Username and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (username.length > 50 || password.length > 100) {
      return new Response(
        JSON.stringify({ error: "Invalid credentials format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to access admin_users table (bypasses RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query admin user - using service role key bypasses RLS
    const { data: adminUser, error } = await supabase
      .from("admin_users")
      .select("id, username, password_hash, totp_enabled, totp_secret")
      .eq("username", username)
      .single();

    if (error || !adminUser) {
      recordAttempt(clientIP);
      console.log(`Failed login attempt for username: ${username} from IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: "Invalid username or password" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Compare password using bcrypt
    const passwordMatch = await bcrypt.compare(password, adminUser.password_hash);
    if (!passwordMatch) {
      recordAttempt(clientIP);
      console.log(`Failed login attempt (wrong password) for username: ${username} from IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: "Invalid username or password" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if 2FA is enabled
    if (adminUser.totp_enabled && adminUser.totp_secret) {
      // If no TOTP code provided, prompt for it
      if (!totpCode) {
        return new Response(
          JSON.stringify({ 
            requires2FA: true, 
            message: "Please enter your 2FA code" 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify TOTP code
      const isValidTOTP = await verifyTOTP(adminUser.totp_secret, totpCode);
      if (!isValidTOTP) {
        recordAttempt(clientIP);
        console.log(`Failed 2FA attempt for username: ${username} from IP: ${clientIP}`);
        return new Response(
          JSON.stringify({ error: "Invalid 2FA code", requires2FA: true }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Generate session token
    const sessionToken = generateSessionToken();
    const tokenHash = await hashToken(sessionToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store session in database
    const userAgent = req.headers.get("user-agent") || null;
    const { error: sessionError } = await supabase
      .from("admin_auth_sessions")
      .insert({
        admin_user_id: adminUser.id,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        ip_address: clientIP,
        user_agent: userAgent
      });

    if (sessionError) {
      console.error("Failed to create session:", sessionError);
      return new Response(
        JSON.stringify({ error: "Failed to create session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clear failed attempts on successful login
    clearAttempts(clientIP);

    console.log(`Successful login for admin: ${username} from IP: ${clientIP}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        token: sessionToken,
        expiresAt: expiresAt.toISOString(),
        username: adminUser.username
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in admin-login function:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Login failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
