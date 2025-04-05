
import { useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { QrCode, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { RouteStop } from "@/types";

interface StopsListProps {
  stops: RouteStop[];
  onScanBarcode: (stopId: string) => void;
}

export function StopsList({ stops, onScanBarcode }: StopsListProps) {
  const navigate = useNavigate();

  const handleCreateOrder = (customerId: string, stopId: string) => {
    navigate(`/dashboard/orders/add?customer=${customerId}&stop=${stopId}`);
  };

  const handleMarkSkipped = async (stopId: string) => {
    try {
      const now = new Date();
      const { error } = await supabase
        .from("route_stops")
        .update({ 
          status: "skipped",
          visit_date: format(now, "yyyy-MM-dd"),
          visit_time: format(now, "HH:mm:ss")
        })
        .eq("id", stopId);
      
      if (error) throw error;
      
      toast({
        title: "Stop skipped",
        description: "Customer location has been marked as skipped",
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

  const handleBackorder = async (stopId: string) => {
    try {
      const { error } = await supabase
        .from("route_stops")
        .update({ status: "skipped" })
        .eq("id", stopId);
      
      if (error) throw error;
      
      toast({
        title: "Backorder created",
        description: "Customer has been set for backorder",
      });
      
      window.location.reload();
    } catch (error: any) {
      console.error("Error creating backorder:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create backorder: ${error.message}`,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "skipped":
        return "bg-yellow-100 text-yellow-800";
      case "not_ordered":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getCoverageStatusColor = (status: string) => {
    return status === "Cover Location" 
      ? "bg-green-100 text-green-800" 
      : "bg-orange-100 text-orange-800";
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Scheduled Stops</h3>
      {stops.length > 0 ? (
        <div className="space-y-4">
          {stops.map((stop: RouteStop) => (
            <Card key={stop.id} className="overflow-hidden">
              <div className="flex items-start p-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{stop.customer.name}</h4>
                    <div className="flex gap-2">
                      <Badge className={getCoverageStatusColor(stop.coverage_status || "Cover Location")}>
                        {stop.coverage_status || "Cover Location"}
                      </Badge>
                      <Badge className={getStatusColor(stop.status)}>
                        {stop.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {stop.customer.address}, {stop.customer.city}
                  </p>
                  <div className="flex items-center mt-2 text-sm">
                    <span className="font-medium">Visit time:</span>
                    <span className="ml-2">{stop.visit_time}</span>
                  </div>
                  {stop.visited && (
                    <div className="flex items-center mt-1 text-sm">
                      <span className="font-medium">Visited:</span>
                      <span className="ml-2 text-green-600">Yes</span>
                    </div>
                  )}
                  {stop.barcode_scanned && (
                    <div className="flex items-center mt-1 text-sm">
                      <span className="font-medium">Barcode scanned:</span>
                      <span className="ml-2 text-green-600">Yes</span>
                    </div>
                  )}
                  {stop.notes && (
                    <p className="mt-2 text-sm border-t pt-2">
                      <span className="font-medium">Notes:</span> {stop.notes}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  {!stop.visited && stop.status === "pending" && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onScanBarcode(stop.id)}
                    >
                      <QrCode className="mr-2 h-4 w-4" />
                      Scan Barcode
                    </Button>
                  )}
                  
                  {/* Only show Order button if status is not completed */}
                  {stop.status !== "completed" && (
                    <Button 
                      size="sm" 
                      onClick={() => handleCreateOrder(stop.customer_id, stop.id)}
                    >
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Order
                    </Button>
                  )}
                  
                  {stop.status === "pending" && (
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleMarkSkipped(stop.id)}
                    >
                      X
                      Skip
                    </Button>
                  )}
                  
                  {/* Add Backorder button for completed stops */}
                  {stop.status === "completed" && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleBackorder(stop.id)}
                    >
                      Backorder
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No stops scheduled for this route</p>
      )}
    </div>
  );
}
