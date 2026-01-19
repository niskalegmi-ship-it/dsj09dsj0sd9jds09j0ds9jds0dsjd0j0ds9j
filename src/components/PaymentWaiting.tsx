import { useEffect, useState } from "react";
import { Loader2, Clock, CheckCircle } from "lucide-react";
import AdminAlert from "./AdminAlert";

interface PaymentWaitingProps {
  sessionCode: string;
  clientName: string | null;
  adminMessage: string | null;
  messageType: string | null;
  onDismissMessage: () => void;
}

const PaymentWaiting = ({ 
  sessionCode, 
  clientName,
  adminMessage,
  messageType,
  onDismissMessage
}: PaymentWaitingProps) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Elapsed time timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="animate-slide-up">
      {/* Admin Alert */}
      {adminMessage && (
        <div className="max-w-lg mx-auto mb-4">
          <AdminAlert 
            message={adminMessage} 
            type={messageType} 
            onDismiss={onDismissMessage}
          />
        </div>
      )}

      <div className="card-elevated p-8 max-w-lg mx-auto text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        </div>

        <h2 className="text-2xl font-display font-bold mb-2">
          Processing Your Payment
        </h2>
        
        <p className="text-muted-foreground mb-6">
          Please wait while we verify your payment details. This may take a moment.
        </p>

        {/* Waiting time indicator */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
          <Clock className="w-4 h-4" />
          <span>Waiting time: {formatTime(elapsedSeconds)}</span>
        </div>

        {/* Status indicators */}
        <div className="space-y-3 text-left max-w-xs mx-auto">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm">Payment details received</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <span className="text-sm font-medium">Verifying with your bank...</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          Do not close this page. You will be redirected automatically.
        </p>
      </div>
    </div>
  );
};

export default PaymentWaiting;
