
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DailyRoute, RouteStop } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";

export const useRouteEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [route, setRoute] = useState<DailyRoute | null>(null);
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch route data
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
          .eq("route_id", id);
        
        if (stopsError) throw stopsError;
        
        // Process the stops data
        const processedStops = stopsData.map((stop: any) => ({
          ...stop,
          customer: {
            ...stop.customer,
            cycle: stop.customer.cycle || "YYYY",
            status: stop.customer.status as "active" | "inactive",
            location: stop.customer.location ? {
              lat: Number((stop.customer.location as any).lat || 0),
              lng: Number((stop.customer.location as any).lng || 0)
            } : undefined
          },
          coverage_status: stop.coverage_status || "Cover Location",
          barcode_scanned: stop.barcode_scanned || false,
          visited: stop.visited || false
        })) as RouteStop[];
        
        // Set the route and stops data
        setRoute({
          ...routeData,
          stops: processedStops
        });
        
        setStops(processedStops);
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

  // Handle status change for a stop
  const handleStatusChange = (stopId: string, status: "pending" | "completed" | "skipped" | "not_ordered") => {
    setStops(prevStops => 
      prevStops.map(stop => {
        if (stop.id === stopId) {
          // If changing to completed or skipped and there's no visit date/time,
          // automatically set it to now
          if ((status === "completed" || status === "skipped") && 
              (!stop.visit_date || !stop.visit_time)) {
            const now = new Date();
            return { 
              ...stop, 
              status, 
              visit_date: format(now, "yyyy-MM-dd"),
              visit_time: format(now, "HH:mm:ss")
            };
          }
          return { ...stop, status };
        }
        return stop;
      })
    );
  };

  // Handle notes change for a stop
  const handleNotesChange = (stopId: string, notes: string) => {
    setStops(prevStops => 
      prevStops.map(stop => 
        stop.id === stopId ? { ...stop, notes } : stop
      )
    );
  };

  // Mark all stops as completed
  const handleMarkAllCompleted = () => {
    const now = new Date();
    setStops(prevStops => 
      prevStops.map(stop => {
        // For stops that don't have a visit date/time yet, set it to now
        if (!stop.visit_date || !stop.visit_time) {
          return { 
            ...stop, 
            status: "completed",
            visit_date: format(now, "yyyy-MM-dd"),
            visit_time: format(now, "HH:mm:ss")
          };
        }
        return { ...stop, status: "completed" };
      })
    );
  };

  // Save changes
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Update each stop in the database
      for (const stop of stops) {
        const { error } = await supabase
          .from("route_stops")
          .update({ 
            status: stop.status,
            notes: stop.notes,
            visit_date: stop.visit_date,
            visit_time: stop.visit_time,
            visited: stop.status === "completed" ? true : stop.visited
          })
          .eq("id", stop.id);
        
        if (error) throw error;
      }
      
      toast({
        title: "Route updated",
        description: "Route has been successfully updated",
      });
      
      navigate(`/dashboard/routes/${id}`);
    } catch (error: any) {
      console.error("Error updating route:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update route: ${error.message}`,
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle backorder for a stop
  const handleBackorder = (stopId: string) => {
    setStops(prevStops => 
      prevStops.map(stop => {
        if (stop.id === stopId) {
          return { ...stop, status: "not_ordered" };
        }
        return stop;
      })
    );
    
    toast({
      title: "Backorder created",
      description: `Stop has been set for backorder`,
    });
  };

  return {
    id,
    route,
    stops,
    loading,
    saving,
    navigate,
    handleStatusChange,
    handleNotesChange,
    handleMarkAllCompleted,
    handleBackorder,
    handleSave
  };
};
