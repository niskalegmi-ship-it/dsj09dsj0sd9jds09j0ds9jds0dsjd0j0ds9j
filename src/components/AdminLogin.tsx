import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, Shield } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import swiftDeliveryLogo from "@/assets/swift-delivery-logo.png";

interface AdminLoginProps {
  onLogin: (token: string) => void;
}

const AdminLogin = ({ onLogin }: AdminLoginProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [totpCode, setTotpCode] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call secure edge function for authentication
      const { data, error } = await supabase.functions.invoke("admin-login", {
        body: { 
          username, 
          password,
          totpCode: requires2FA ? totpCode : undefined
        }
      });

      if (error) {
        toast({
          title: "Login Failed",
          description: error.message || "An error occurred during login",
          variant: "destructive"
        });
        return;
      }

      if (data?.error) {
        toast({
          title: "Login Failed",
          description: data.error,
          variant: "destructive"
        });
        // Keep 2FA screen if it was a 2FA error
        if (!data.requires2FA) {
          setRequires2FA(false);
          setTotpCode("");
        }
        return;
      }

      // Check if 2FA is required
      if (data?.requires2FA) {
        setRequires2FA(true);
        toast({
          title: "2FA Required",
          description: "Please enter your authenticator code",
        });
        return;
      }

      if (data?.success && data?.token) {
        // Store secure session token (not just a boolean flag)
        sessionStorage.setItem("admin_token", data.token);
        sessionStorage.setItem("admin_token_expires", data.expiresAt);
        sessionStorage.setItem("admin_username", data.username);
        
        toast({
          title: "Welcome!",
          description: "Successfully logged in to admin panel",
        });
        onLogin(data.token);
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid response from server",
          variant: "destructive"
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setRequires2FA(false);
    setTotpCode("");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={swiftDeliveryLogo} 
              alt="Swift Delivery" 
              className="h-12 object-contain"
            />
          </div>
          {requires2FA ? (
            <>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Enter the 6-digit code from your authenticator app
              </CardDescription>
            </>
          ) : (
            <CardTitle className="flex items-center justify-center gap-2">
              <Lock className="w-5 h-5" />
              Admin Login
            </CardTitle>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {!requires2FA ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    required
                    maxLength={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    maxLength={100}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={totpCode}
                    onChange={(value) => setTotpCode(value)}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  Open your authenticator app to view the code
                </p>
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || (requires2FA && totpCode.length !== 6)}
            >
              {loading ? "Verifying..." : requires2FA ? "Verify Code" : "Login"}
            </Button>
            {requires2FA && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleBack}
              >
                Back to Login
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
