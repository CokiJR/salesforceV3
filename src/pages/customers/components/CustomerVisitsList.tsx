
import { RouteStop } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface CustomerVisitsListProps {
  visits: RouteStop[];
  isLoading: boolean;
}

export function CustomerVisitsList({ visits, isLoading }: CustomerVisitsListProps) {
  const navigate = useNavigate();
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (visits.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-4">No visits found for this customer</p>
    );
  }
  
  return (
    <div className="space-y-4">
      {visits.map((visit) => (
        <Card key={visit.id} className="overflow-hidden">
          <div className="flex items-start p-4">
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">
                  Visit on {format(new Date(visit.visit_date), "MMM d, yyyy")}
                </h4>
                <Badge className={
                  visit.status === "completed" ? "bg-green-100 text-green-800" :
                  visit.status === "skipped" ? "bg-red-100 text-red-800" :
                  "bg-blue-100 text-blue-800"
                }>
                  {visit.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Time:</span> 
                  <span className="ml-1">{visit.visit_time}</span>
                </div>
                {visit.notes && (
                  <div className="col-span-2 mt-1">
                    <span className="text-muted-foreground">Notes:</span>
                    <span className="ml-1">{visit.notes}</span>
                  </div>
                )}
              </div>
              {visit.route_id && (
                <Button 
                  variant="link" 
                  className="p-0 h-auto mt-2" 
                  onClick={() => navigate(`/dashboard/routes/${visit.route_id}`)}
                >
                  View Route
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
