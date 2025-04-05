
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { DailyRoute, RouteStop, Customer } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { RouteDetailView } from "./components/RouteDetailView";

const RouteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [route, setRoute] = useState<DailyRoute | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch route data
        const { data: routeData, error: routeError } = await supabase
          .from("daily_routes")
          .select("*")
          .eq("id", id)
          .single();
        
        if (routeError) throw routeError;
        
        // Fetch route stops with customer details
        const { data: stopsData, error: stopsError } = await supabase
          .from("route_stops")
          .select(`
            *,
            customer:customers(*)
          `)
          .eq("route_id", id)
          .order("visit_time");
        
        if (stopsError) throw stopsError;
        
        // Map and prepare the stops data
        const stops = stopsData.map((stop: any) => {
          const customer = stop.customer as Customer;
          return {
            ...stop,
            coverage_status: stop.coverage_status || "Cover Location",
            barcode_scanned: stop.barcode_scanned || false,
            visited: stop.visited || false,
            customer: {
              ...customer,
              cycle: customer.cycle || "YYYY",
              status: customer.status as "active" | "inactive",
              location: customer.location ? {
                lat: Number((customer.location as any).lat || 0),
                lng: Number((customer.location as any).lng || 0)
              } : undefined
            }
          };
        }) as RouteStop[];
        
        // Create the complete route object
        const completeRoute: DailyRoute = {
          ...routeData,
          stops
        };
        
        setRoute(completeRoute);
      } catch (error: any) {
        console.error("Error fetching route:", error.message);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to load route: ${error.message}`,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [id]);

  return (
    <div className="animate-fade-in">
      <RouteDetailView
        route={route}
        isLoading={loading}
      />
    </div>
  );
};

export default RouteDetail;
