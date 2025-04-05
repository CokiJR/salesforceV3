
import { RouteStop } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { format } from "date-fns";

interface EditRouteStopsProps {
  stops: RouteStop[];
  onStatusChange: (stopId: string, status: "pending" | "completed" | "skipped" | "not_ordered") => void;
  onNotesChange: (stopId: string, notes: string) => void;
}

export const EditRouteStops = ({ 
  stops, 
  onStatusChange, 
  onNotesChange 
}: EditRouteStopsProps) => {
  if (stops.length === 0) {
    return (
      <p className="text-muted-foreground">No stops scheduled for this route</p>
    );
  }

  return (
    <div className="space-y-4">
      {stops.map((stop) => (
        <Card key={stop.id}>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-semibold">{stop.customer.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {stop.customer.address}, {stop.customer.city}
                </p>
                {stop.visit_date && stop.visit_time ? (
                  <p className="text-sm text-muted-foreground mt-1">
                    Visited: {format(new Date(stop.visit_date), "MMM d, yyyy")} at {stop.visit_time}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    Not visited yet
                  </p>
                )}
              </div>
              
              <div className="flex flex-col gap-2 w-full md:w-48">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select 
                    value={stop.status} 
                    onValueChange={(value) => onStatusChange(stop.id, value as "pending" | "completed" | "skipped")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="skipped">Skipped</SelectItem>
                      <SelectItem value="not_ordered">Backorder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="mt-3">
              <label className="text-sm font-medium">Notes</label>
              <Textarea 
                value={stop.notes || ""} 
                onChange={(e) => onNotesChange(stop.id, e.target.value)}
                placeholder="Add notes about this stop"
                className="mt-1"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
