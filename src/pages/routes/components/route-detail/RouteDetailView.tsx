
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DailyRoute } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { RouteHeader } from "./RouteHeader";
import { RouteInfo } from "./RouteInfo";
import { StopsList } from "./StopsList";
import { AddOutletForm } from "./AddOutletForm";
import { BarcodeScannerDialog } from "./BarcodeScannerDialog";

interface RouteDetailViewProps {
  route: DailyRoute | null;
  isLoading: boolean;
}

export function RouteDetailView({ route, isLoading }: RouteDetailViewProps) {
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [currentStopId, setCurrentStopId] = useState<string | null>(null);
  const [addingOutlet, setAddingOutlet] = useState(false);
  const navigate = useNavigate();

  const toggleAddOutlet = () => {
    setAddingOutlet(!addingOutlet);
  };

  const handleScanBarcode = (stopId: string) => {
    setCurrentStopId(stopId);
    setShowBarcodeScanner(true);
  };

  // Handle adding a new outlet to the route
  const handleAddOutlet = (customerId: string) => {
    // Reload the route data to show the new stop
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!route) {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <CardTitle>No Route Selected</CardTitle>
          <CardDescription>
            Select a route from the list to view its details
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <Button variant="outline" onClick={() => navigate("/dashboard/routes")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Routes
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {showBarcodeScanner && (
        <BarcodeScannerDialog
          open={showBarcodeScanner}
          onOpenChange={setShowBarcodeScanner}
          stopId={currentStopId}
        />
      )}

      <RouteHeader 
        onBack={() => navigate("/dashboard/routes")}
        addingOutlet={addingOutlet}
        toggleAddOutlet={toggleAddOutlet}
      />

      {addingOutlet && (
        <AddOutletForm 
          routeId={route.id} 
          routeDate={route.date}
          existingStops={route.stops}
          onAdd={handleAddOutlet}
          onCancel={toggleAddOutlet}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Route Information</CardTitle>
          <CardDescription>
            Details for route on {format(new Date(route.date), "MMMM d, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RouteInfo route={route} />

          <StopsList 
            stops={route.stops} 
            onScanBarcode={handleScanBarcode} 
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate("/dashboard/routes")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Routes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Don't forget to import these
import { Loader2 } from "lucide-react";
import { CardFooter } from "@/components/ui/card";
import { format } from "date-fns";
