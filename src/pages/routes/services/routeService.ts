
import { supabase } from "@/integrations/supabase/client";
import { Customer, DailyRoute } from "@/types";
import { format, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { shouldVisitThisWeek } from "@/utils/routeScheduler";

// Create an automated route based on customer visit cycles for the entire week
export async function createAutomatedRoute(
  date: Date, 
  salespersonId: string, 
  eligibleCustomers: Customer[]
) {
  // Normalize to start of week to ensure consistency
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  
  // First check if a route already exists for this week
  const { data: existingRoutes, error: checkError } = await supabase
    .from("daily_routes")
    .select("*")
    .eq("salesperson_id", salespersonId)
    .gte("date", format(weekStart, "yyyy-MM-dd"))
    .lte("date", format(weekEnd, "yyyy-MM-dd"));
  
  if (checkError) throw checkError;
  
  // If a route already exists for this week, return it
  if (existingRoutes && existingRoutes.length > 0) {
    return existingRoutes[0];
  }
  
  // Step 1: Create the weekly route record
  const { data: newRoute, error: routeError } = await supabase
    .from("daily_routes")
    .insert({
      date: format(weekStart, "yyyy-MM-dd"),
      salesperson_id: salespersonId,
    })
    .select("*")
    .single();
  
  if (routeError) throw routeError;
  
  // Step 2: Create route stops for eligible customers
  // Sort customers by name for a consistent order
  const sortedCustomers = [...eligibleCustomers].sort((a, b) => 
    a.name.localeCompare(b.name)
  );
  
  // Filter customers who should be visited this week based on their cycle
  const customersToVisit = sortedCustomers.filter(customer => shouldVisitThisWeek(customer));
  
  // For weekly routes, we spread customers throughout the week
  // Each customer is initially added with a default visit date and time
  // These can be updated when the actual visit happens
  const routeStopsData = customersToVisit.map((customer) => {
    return {
      route_id: newRoute.id,
      customer_id: customer.id,
      visit_date: format(weekStart, "yyyy-MM-dd"), // Set default visit date to the start of the week
      visit_time: "09:00:00", // Set default visit time
      status: "pending",
      notes: `Scheduled for weekly visit (${customer.cycle} cycle)`,
      coverage_status: "Covered",
      barcode_scanned: false,
      visited: false
    };
  });

  
  if (routeStopsData.length > 0) {
    const { error: stopsError } = await supabase
      .from("route_stops")
      .insert(routeStopsData);
    
    if (stopsError) throw stopsError;
  }
  
  return newRoute;
}
