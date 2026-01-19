import { CheckCircle, MessageSquare, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SmsConfirmationProps {
  onReset: () => void;
}

const SmsConfirmation = ({ onReset }: SmsConfirmationProps) => {
  return (
    <div className="animate-slide-up">
      <div className="card-elevated p-8 max-w-lg mx-auto text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
        </div>

        <h2 className="text-2xl font-display font-bold mb-2">
          Payment Successful!
        </h2>
        <p className="text-muted-foreground mb-8">
          Your payment has been processed successfully
        </p>

        {/* SMS Notification Card */}
        <div className="bg-secondary/50 rounded-xl p-6 mb-6 text-left">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">SMS Confirmation Sent</h3>
              <p className="text-sm text-muted-foreground">
                To: +44 ••••• ••• 789
              </p>
            </div>
          </div>

          <div className="bg-card rounded-lg p-4 border border-border">
            <p className="text-sm leading-relaxed">
              <span className="font-semibold">Express Logistics:</span> Payment of
              £45.99 received for shipment SHP-2024-78542. Your parcel is now
              confirmed for delivery. Track at expresslogistics.com/track
            </p>
          </div>
        </div>

        {/* Delivery Timeline */}
        <div className="space-y-4 mb-8">
          <h3 className="font-semibold text-left">What's Next?</h3>
          
          <div className="flex items-start gap-4 text-left">
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="font-medium">Parcel Confirmed</p>
              <p className="text-sm text-muted-foreground">
                Your shipment is now scheduled for pickup
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 text-left">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Estimated Delivery</p>
              <p className="text-sm text-muted-foreground">
                Jan 21, 2026 - Manchester, UK
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={onReset}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
          >
            Track Another Parcel
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl"
          >
            Download Receipt
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SmsConfirmation;
