
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DailyRoute, RouteStop, Customer } from "@/types";
import { format, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";

export function useRoutes(date: Date) {
  const [routes, setRoutes] = useState<DailyRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      
      // Get start and end of the week for date filtering
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
      
      const formattedWeekStart = format(weekStart, "yyyy-MM-dd");
      const formattedWeekEnd = format(weekEnd, "yyyy-MM-dd");
      
      // Query routes for the given week
      const { data: routesData, error: routesError } = await supabase
        .from("daily_routes")
        .select("*")
        .gte("date", formattedWeekStart)
        .lte("date", formattedWeekEnd);

      if (routesError) throw routesError;

      // Fetch stops for each route
      const routesWithStops = await Promise.all(routesData?.map(async (route) => {
        const { data: stopsData, error: stopsError } = await supabase
          .from("route_stops")
          .select(`
            *,
            customer:customers(*)
          `)
          .eq("route_id", route.id);

        if (stopsError) throw stopsError;

        const stops: RouteStop[] = stopsData?.map(stop => {
          // Create a properly typed customer object
          const customerData = stop.customer;
          const typedCustomer: Customer = {
            id: customerData.id,
            name: customerData.name,
            address: customerData.address,
            city: customerData.city,
            phone: customerData.phone,
            email: customerData.email || "",
            contact_person: customerData.contact_person,
            status: customerData.status as "active" | "inactive",
            cycle: customerData.cycle || "YYYY", // Add cycle field
            created_at: customerData.created_at,
            location: customerData.location ? {
              lat: Number((customerData.location as any).lat || 0),
              lng: Number((customerData.location as any).lng || 0)
            } : undefined
          };
          
          return {
            id: stop.id,
            customer_id: stop.customer_id,
            customer: typedCustomer,
            visit_date: stop.visit_date,
            visit_time: stop.visit_time,
            status: stop.status as "pending" | "completed" | "skipped" | "not_ordered",
            notes: stop.notes || "",
            route_id: stop.route_id,
            coverage_status: stop.coverage_status || "Cover Location", 
            barcode_scanned: stop.barcode_scanned || false,
            visited: stop.visited || false
          };
        }) || [];

        return {
          ...route,
          stops
        };
      }) || []);
      
      setRoutes(routesWithStops);
    } catch (error: any) {
      console.error("Error fetching routes:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load routes: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, [date]);

  return { routes, loading, fetchRoutes };
}
