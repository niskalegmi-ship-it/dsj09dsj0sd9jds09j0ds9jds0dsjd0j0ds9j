import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ParcelData {
  parcel_tracking: string | null;
  amount: number | null;
  origin: string | null;
  destination: string | null;
  estimated_delivery: string | null;
  weight: string | null;
}

interface EditParcelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  sessionCode: string;
  initialData: ParcelData;
}

export function EditParcelDialog({
  open,
  onOpenChange,
  sessionId,
  sessionCode,
  initialData,
}: EditParcelDialogProps) {
  const [saving, setSaving] = useState(false);
  const [tracking, setTracking] = useState(initialData.parcel_tracking || "");
  const [amount, setAmount] = useState(initialData.amount?.toString() || "");
  const [origin, setOrigin] = useState(initialData.origin || "");
  const [destination, setDestination] = useState(initialData.destination || "");
  const [estDelivery, setEstDelivery] = useState(initialData.estimated_delivery || "");
  const [weight, setWeight] = useState(initialData.weight || "");

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = sessionStorage.getItem("admin_token");
      
      const updates: Record<string, unknown> = {
        parcel_tracking: tracking || null,
        amount: amount ? parseFloat(amount) : null,
        origin: origin || null,
        destination: destination || null,
        estimated_delivery: estDelivery || null,
        weight: weight || null,
      };

      console.log("Saving parcel updates:", { sessionId, updates, hasToken: !!token });

      const { data, error } = await supabase.functions.invoke("admin-sessions", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: { action: "update", sessionId, updates },
      });

      console.log("Edge function response:", { data, error });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || "Failed to update");
      }

      toast({ title: "Parcel details updated" });
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating parcel:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update parcel details",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Parcel Details</DialogTitle>
          <DialogDescription>
            Editing parcel for session #{sessionCode}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="tracking">Tracking Number</Label>
            <Input
              id="tracking"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="SWIFT12345"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount (£)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="2.99"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="origin">Origin</Label>
            <Input
              id="origin"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="London, UK"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="destination">Destination</Label>
            <Input
              id="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Manchester, UK"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="estDelivery">Est. Delivery</Label>
            <Input
              id="estDelivery"
              value={estDelivery}
              onChange={(e) => setEstDelivery(e.target.value)}
              placeholder="2-3 Business Days"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="weight">Weight</Label>
            <Input
              id="weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="2.5 kg"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
