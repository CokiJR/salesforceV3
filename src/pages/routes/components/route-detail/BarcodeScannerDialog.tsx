
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { BarcodeScanner } from "../BarcodeScanner";

interface BarcodeScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stopId: string | null;
}

export function BarcodeScannerDialog({ open, onOpenChange, stopId }: BarcodeScannerDialogProps) {
  const handleBarcodeScanComplete = async (barcode: string) => {
    onOpenChange(false);
    
    if (!stopId) return;
    
    try {
      const now = new Date();
      const { error } = await supabase
        .from("route_stops")
        .update({ 
          barcode_scanned: true,
          visited: true,
          visit_date: format(now, "yyyy-MM-dd"),
          visit_time: format(now, "HH:mm:ss")
        })
        .eq("id", stopId);
      
      if (error) throw error;
      
      toast({
        title: "Barcode scanned successfully",
        description: "Customer location has been marked as visited",
      });
      
      window.location.reload();
    } catch (error: any) {
      console.error("Error updating stop:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update stop: ${error.message}`,
      });
    }
  };

  const handleSkipScanning = async () => {
    onOpenChange(false);
    
    if (!stopId) return;
    
    try {
      const now = new Date();
      const { error } = await supabase
        .from("route_stops")
        .update({ 
          visited: true,
          visit_date: format(now, "yyyy-MM-dd"),
          visit_time: format(now, "HH:mm:ss")
        })
        .eq("id", stopId);
      
      if (error) throw error;
      
      toast({
        title: "Visit recorded",
        description: "Customer location has been marked as visited without barcode scanning",
      });
      
      window.location.reload();
    } catch (error: any) {
      console.error("Error updating stop:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update stop: ${error.message}`,
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Scan Outlet Barcode</AlertDialogTitle>
          <AlertDialogDescription>
            Scan the outlet barcode to validate your visit. This will mark the location as visited.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <BarcodeScanner onScan={handleBarcodeScanComplete} />
        </div>
        <AlertDialogFooter className="sm:justify-between">
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            Cancel
          </AlertDialogCancel>
          <Button onClick={handleSkipScanning}>
            Skip Scanning
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
