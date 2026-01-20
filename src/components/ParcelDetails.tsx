import { Package, MapPin, Calendar, Weight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ParcelDetailsProps {
  onProceed: () => void;
  trackingNumber?: string | null;
  origin?: string | null;
  destination?: string | null;
  estimatedDelivery?: string | null;
  amount?: number | null;
  weight?: string | null;
}

const ParcelDetails = ({ 
  onProceed,
  trackingNumber,
  origin,
  destination,
  estimatedDelivery,
  amount,
  weight
}: ParcelDetailsProps) => {
  const parcelData = {
    trackingNumber: trackingNumber || "SWD-2026-78542",
    sender: "Swift Delivery Ltd",
    recipient: "John Smith",
    origin: origin || "London, UK",
    destination: destination || "Manchester, UK",
    weight: weight || "2.5 kg",
    dimensions: "30 × 20 × 15 cm",
    shippingDate: "Jan 18, 2026",
    estimatedDelivery: estimatedDelivery || "Jan 21, 2026",
    amount: amount ?? 45.99,
  };

  return (
    <div className="animate-slide-up">
      <div className="card-elevated p-8 max-w-lg mx-auto">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Package className="w-8 h-8 text-primary" />
          </div>
        </div>

        <h2 className="text-2xl font-display font-bold text-center mb-2">
          Parcel Details
        </h2>
        <p className="text-muted-foreground text-center mb-6">
          Review your shipment information
        </p>

        <div className="bg-secondary/50 rounded-lg p-4 mb-6">
          <p className="text-sm text-muted-foreground mb-1">Tracking Number</p>
          <p className="font-mono text-lg font-semibold text-foreground">
            {parcelData.trackingNumber}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">From</span>
                <span className="font-medium">{parcelData.origin}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">To</span>
                <span className="font-medium">{parcelData.destination}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Weight className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 flex justify-between text-sm">
              <span className="text-muted-foreground">Package Weight</span>
              <span className="font-medium">{parcelData.weight}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 flex justify-between text-sm">
              <span className="text-muted-foreground">Est. Delivery</span>
              <span className="font-medium">{parcelData.estimatedDelivery}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Amount</span>
            <span className="text-3xl font-display font-bold text-foreground">
              £{parcelData.amount.toFixed(2)}
            </span>
          </div>
        </div>

        <Button
          onClick={onProceed}
          className="w-full h-14 text-lg font-semibold bg-primary hover:bg-dpd-dark text-primary-foreground rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Pay Now
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default ParcelDetails;
