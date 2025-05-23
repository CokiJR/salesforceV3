
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CameraCapture } from "../CameraCapture";

interface BarcodeScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stopId: string | null;
}

export function BarcodeScannerDialog({ open, onOpenChange, stopId }: BarcodeScannerDialogProps) {
  const handlePhotoCapture = async (imageUrl: string, location: { latitude: number; longitude: number }) => {
    onOpenChange(false);
    
    if (!stopId) return;
    
    try {
      const now = new Date();
      
      // First, save the photo and location to photo_logs table
      const { data: photoLog, error: photoError } = await supabase
        .from("photo_logs")
        .insert({
          image_url: imageUrl,
          latitude: location.latitude,
          longitude: location.longitude,
          created_at: now.toISOString()
        })
        .select()
        .single();
      
      if (photoError) throw photoError;
      
      // Then, update the route stop
      const { error: stopError } = await supabase
        .from("route_stops")
        .update({ 
          barcode_scanned: true, // Keep this for backward compatibility
          visited: true,
          visit_date: format(now, "yyyy-MM-dd"),
          visit_time: format(now, "HH:mm:ss"),
          photo_log_id: photoLog.id // Reference to the photo log
        })
        .eq("id", stopId);
      
      if (stopError) throw stopError;
      
      // Show appropriate message based on whether location data was available
      const hasLocationData = !(location.latitude === 0 && location.longitude === 0);
      toast({
        title: "Photo captured successfully",
        description: `Customer location has been marked as visited${hasLocationData ? " with location data" : " (without location data)"}`
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

  const handleSkipCapture = async () => {
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
        description: "Customer location has been marked as visited without photo",
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
          <AlertDialogTitle>Take Photo of Outlet</AlertDialogTitle>
          <AlertDialogDescription>
            Take a photo of the outlet to validate your visit. This will mark the location as visited.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <CameraCapture onCapture={handlePhotoCapture} />
        </div>
        <AlertDialogFooter className="sm:justify-between">
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            Cancel
          </AlertDialogCancel>
          <Button onClick={handleSkipCapture}>
            Skip Photo
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

}
