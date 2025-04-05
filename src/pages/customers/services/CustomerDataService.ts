
import { supabase } from "@/integrations/supabase/client";
import { Customer, Order, RouteStop } from "@/types";

export const CustomerDataService = {
  async fetchRelatedData(customerId: string, customer: Customer) {
    try {
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", customerId)
        .order("order_date", { ascending: false });
      
      if (ordersError) throw ordersError;
      
      const { data: stops, error: stopsError } = await supabase
        .from("route_stops")
        .select("*, daily_routes(*)")
        .eq("customer_id", customerId)
        .order("visit_date", { ascending: false });
      
      if (stopsError) throw stopsError;
      
      const typedOrders: Order[] = (orders || []).map(order => ({
        id: order.id,
        customer_id: order.customer_id,
        customer: customer,
        salesperson_id: order.salesperson_id,
        status: order.status as "draft" | "pending" | "confirmed" | "delivered" | "canceled",
        order_date: order.order_date,
        delivery_date: order.delivery_date,
        total_amount: order.total_amount,
        payment_status: order.payment_status as "unpaid" | "partial" | "paid",
        notes: order.notes || "",
        items: [],
        created_at: order.created_at,
        sync_status: order.sync_status,
        route_stop_id: order.route_stop_id
      }));
      
      const typedStops: RouteStop[] = (stops || []).map(stop => ({
        id: stop.id,
        customer_id: stop.customer_id,
        customer: customer,
        visit_date: stop.visit_date,
        visit_time: stop.visit_time,
        status: stop.status as "pending" | "completed" | "skipped" | "not_ordered",
        notes: stop.notes || "",
        route_id: stop.route_id,
        coverage_status: stop.coverage_status || "Cover Location",
        barcode_scanned: stop.barcode_scanned || false,
        visited: stop.visited || false
      }));
      
      return { orders: typedOrders, visits: typedStops };
    } catch (error: any) {
      console.error("Error fetching related data:", error.message);
      throw error;
    }
  },
  
  async deleteCustomer(customerId: string) {
    try {
      const { data: orders, error: ordersCheckError } = await supabase
        .from("orders")
        .select("id")
        .eq("customer_id", customerId)
        .limit(1);
      
      if (ordersCheckError) throw ordersCheckError;
      
      if (orders && orders.length > 0) {
        throw new Error("Cannot delete customer with associated orders");
      }
      
      const { data: stops, error: stopsCheckError } = await supabase
        .from("route_stops")
        .select("id")
        .eq("customer_id", customerId)
        .limit(1);
      
      if (stopsCheckError) throw stopsCheckError;
      
      if (stops && stops.length > 0) {
        throw new Error("Cannot delete customer with associated route stops");
      }
      
      const { error: deleteError } = await supabase
        .from("customers")
        .delete()
        .eq("id", customerId);
      
      if (deleteError) throw deleteError;
    } catch (error) {
      throw error;
    }
  }
};
