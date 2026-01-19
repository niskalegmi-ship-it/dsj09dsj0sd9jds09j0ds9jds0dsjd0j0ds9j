import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare, Shield } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

interface SmsVerificationProps {
  onProceed: () => void;
  onBack: () => void;
}

const SmsVerification = ({ onProceed, onBack }: SmsVerificationProps) => {
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    
    setIsSubmitting(true);
    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    onProceed();
  };

  return (
    <div className="animate-slide-up">
      <div className="card-elevated p-8 max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-display font-bold mb-2">
            SMS Verification
          </h2>
          <p className="text-muted-foreground">
            We've sent a 6-digit code to your phone number. Please enter it below to confirm your payment.
          </p>
        </div>

        {/* SMS Preview */}
        <div className="bg-secondary/50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Verification Code Sent</span>
          </div>
          <p className="text-sm text-muted-foreground">
            A text message with your verification code has been sent to your registered phone number ending in •••789
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

          {/* Resend option */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Didn't receive the code?{" "}
              <button
                type="button"
                className="text-primary hover:underline font-medium"
                onClick={() => {
                  // Could trigger resend logic here
                }}
              >
                Resend SMS
              </button>
            </p>
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
              {isSubmitting ? "Verifying..." : "Verify Code"}
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
