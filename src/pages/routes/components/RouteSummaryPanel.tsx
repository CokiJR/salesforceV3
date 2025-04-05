
import { format } from "date-fns";
import { MapPin } from "lucide-react";
import { RouteStop } from "@/types";

interface RouteSummaryPanelProps {
  stopsCount: number;
  routeDate: Date;
  stops?: RouteStop[];
}

export function RouteSummaryPanel({ stopsCount, routeDate, stops = [] }: RouteSummaryPanelProps) {
  // Calculate coverage statistics
  const coverLocations = stops.filter(stop => stop.coverage_status === "Cover Location").length;
  const uncoverLocations = stops.filter(stop => stop.coverage_status === "Uncover Location").length;
  
  return (
    <div className="rounded-xl border border-dashed p-8 flex flex-col items-center justify-center text-center sticky top-6">
      <div className="rounded-full bg-primary/10 p-4 mb-4">
        <MapPin className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Route Summary</h3>
      <div className="w-full space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Route Date:</span>
          <span className="font-medium">{format(routeDate, "MMM d, yyyy")}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Stops:</span>
          <span className="font-medium">{stopsCount}</span>
        </div>
        {stops.length > 0 && (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cover Locations:</span>
              <span className="font-medium">{coverLocations}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Uncover Locations:</span>
              <span className="font-medium">{uncoverLocations}</span>
            </div>
          </>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Configure your sales route stops using the form.
      </p>
    </div>
  );
}
