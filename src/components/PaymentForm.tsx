import { useState } from "react";
import { CreditCard, Lock, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaymentFormProps {
  onProceed: () => void;
  onBack: () => void;
}

const PaymentForm = ({ onProceed, onBack }: PaymentFormProps) => {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [country, setCountry] = useState("");

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : v;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + (v.length > 2 ? "/" + v.substring(2, 4) : "");
    }
    return v;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onProceed();
  };

  return (
    <div className="animate-slide-up">
      <div className="card-elevated p-8 max-w-lg mx-auto">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-primary" />
          </div>
        </div>

        <h2 className="text-2xl font-display font-bold text-center mb-2">
          Payment Details
        </h2>
        <p className="text-muted-foreground text-center mb-6">
          Enter your card and billing information
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Card Details Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Card Information
            </h3>

            <div>
              <label className="block text-sm font-medium mb-2">
                Cardholder Name
              </label>
              <input
                type="text"
                placeholder="John Smith"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Card Number
              </label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                maxLength={19}
                className="input-field font-mono"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Expiry</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  maxLength={5}
                  className="input-field font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">CVV</label>
                <input
                  type="text"
                  placeholder="123"
                  value={cvv}
                  onChange={(e) =>
                    setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  maxLength={4}
                  className="input-field font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Billing Address Section */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Billing Address
            </h3>

            <div>
              <label className="block text-sm font-medium mb-2">
                Street Address
              </label>
              <input
                type="text"
                placeholder="123 Main Street"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">City</label>
                <input
                  type="text"
                  placeholder="London"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Postcode
                </label>
                <input
                  type="text"
                  placeholder="SW1A 1AA"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select country</option>
                <option value="UK">United Kingdom</option>
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
            <Lock className="w-4 h-4" />
            <span>Your payment information is secure and encrypted</span>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={onBack}
              variant="outline"
              className="flex-1 h-12 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12 text-base font-semibold bg-primary hover:bg-dpd-dark text-primary-foreground rounded-xl"
            >
              Complete Payment
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;
