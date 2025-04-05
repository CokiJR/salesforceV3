import { MapPin, Trash2 } from "lucide-react";
import { Customer } from "@/types";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

type RouteStop = {
  customer_id: string;
  customer: Customer;
  visit_time?: string;
  visit_date?: string;
  notes?: string;
  coverage_status?: string;
  status?: "pending" | "completed" | "skipped" | "not_ordered";
};

interface RouteStopsTableProps {
  stops: RouteStop[];
  onRemoveStop: (index: number) => void;
  onBackorder?: (index: number) => void;
  showCoverageStatus?: boolean;
}

export function RouteStopsTable({ stops, onRemoveStop, onBackorder, showCoverageStatus = false }: RouteStopsTableProps) {
  const getCoverageStatusColor = (status?: string) => {
    return status === "Cover Location" 
      ? "bg-green-100 text-green-800" 
      : "bg-orange-100 text-orange-800";
  };

  if (stops.length === 0) {
    return (
      <div className="border border-dashed rounded-md p-6 flex flex-col items-center justify-center text-center">
        <MapPin className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No outlets added to this route yet</p>
        <p className="text-xs text-muted-foreground mt-1">Use the form above to add customer outlets</p>
      </div>
    );
  }

  // Sort stops by customer name if no visit time is set
  const sortedStops = [...stops].sort((a, b) => {
    // If both have visit times, sort by time
    if (a.visit_time && b.visit_time) {
      return a.visit_time.localeCompare(b.visit_time);
    }
    // If only one has a visit time, prioritize the one with time
    if (a.visit_time) return -1;
    if (b.visit_time) return 1;
    // Otherwise sort by customer name
    return a.customer.name.localeCompare(b.customer.name);
  });

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Outlet</TableHead>
            <TableHead>Address</TableHead>
            {showCoverageStatus && <TableHead>Coverage</TableHead>}
            <TableHead>Visit Info</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedStops.map((stop, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{stop.customer.name}</TableCell>
              <TableCell>
                {stop.customer.address}, {stop.customer.city}
              </TableCell>
              {showCoverageStatus && (
                <TableCell>
                  <Badge className={getCoverageStatusColor(stop.coverage_status)}>
                    {stop.coverage_status || "Covered"}
                  </Badge>
                </TableCell>
              )}
              <TableCell>
                {stop.visit_date && stop.status === "completed" && stop.visit_time ? (
                  <div className="text-sm">
                    <div>Date: {format(new Date(stop.visit_date), "MMM d, yyyy")}</div>
                    <div>Time: {stop.visit_time}</div>
                  </div>
                ) : stop.status === "skipped" ? (
                  <span className="text-muted-foreground text-sm">Skipped</span>
                ) : (
                  <span className="text-muted-foreground text-sm">Not visited yet</span>
                )}
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {stop.notes || "-"}
              </TableCell>
              <TableCell className="text-right flex justify-end gap-2">
                {stop.status === "completed" && onBackorder && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onBackorder(index)}
                    className="h-8"
                  >
                    Backorder
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onRemoveStop(index)}
                  className="h-8 w-8"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
