import { useState } from "react";
import Header from "@/components/Header";
import StepIndicator from "@/components/StepIndicator";
import ParcelDetails from "@/components/ParcelDetails";
import PaymentForm from "@/components/PaymentForm";
import SmsConfirmation from "@/components/SmsConfirmation";

const steps = ["Parcel", "Payment", "Confirmation"];

const Index = () => {
  const [currentStep, setCurrentStep] = useState(1);

  const handleProceedToPayment = () => {
    setCurrentStep(2);
  };

  const handleProceedToConfirmation = () => {
    setCurrentStep(3);
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleReset = () => {
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
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
        <p>© 2026 Express Logistics. Secure payments powered by your gateway.</p>
      </footer>
    </div>
  );
};

export default Index;
