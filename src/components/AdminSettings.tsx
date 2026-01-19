import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Save, Send, Eye, EyeOff, MessageCircle, Lock, ShieldCheck } from "lucide-react";

const SETTINGS_PASSWORD = "Settings@2024";

const AdminSettings = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);

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
      .in("setting_key", ["telegram_bot_token", "telegram_chat_id"]);

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
      setBotToken(token);
      setChatId(chat);
    }
    setLoading(false);
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

      toast({
        title: "Settings Saved",
        description: "Telegram settings have been updated successfully",
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
            <Button onClick={saveSettings} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Settings"}
            </Button>
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
    </div>
  );
};

export default AdminSettings;