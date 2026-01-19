import Header from "@/components/Header";
import StepIndicator from "@/components/StepIndicator";
import ParcelDetails from "@/components/ParcelDetails";
import PaymentForm from "@/components/PaymentForm";
import SmsConfirmation from "@/components/SmsConfirmation";
import AdminAlert from "@/components/AdminAlert";
import { useClientSession } from "@/hooks/useClientSession";
import { RefreshCw } from "lucide-react";

const steps = ["Parcel", "Payment", "Confirmation"];

const Index = () => {
  const { 
    session, 
    currentStep, 
    adminMessage, 
    messageType, 
    loading, 
    updateStep, 
    clearAdminMessage 
  } = useClientSession();

  const handleProceedToPayment = () => {
    updateStep(2);
  };

  const handleProceedToConfirmation = () => {
    updateStep(3);
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
        {/* Admin Alert */}
        {adminMessage && (
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

        {currentStep === 2 && (
          <PaymentForm onProceed={handleProceedToConfirmation} onBack={handleBack} />
        )}

        {currentStep === 3 && (
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
