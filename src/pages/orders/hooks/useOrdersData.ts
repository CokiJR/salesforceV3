
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Order, Customer, Product } from "@/types";
import { toast } from "@/components/ui/use-toast";

export function useOrdersData() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        
        // Fetch orders
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select(`
            *,
            items:order_items(*, product:products(*))
          `)
          .order("order_date", { ascending: false });
        
        if (ordersError) throw ordersError;
        
        // Fetch customers
        const { data: customersData, error: customersError } = await supabase
          .from("customers")
          .select("*");
        
        if (customersError) throw customersError;
        
        // Map customers to the correct type
        const typedCustomers: Customer[] = customersData.map(c => ({
          id: c.id,
          name: c.name,
          address: c.address,
          city: c.city,
          phone: c.phone,
          email: c.email || "",
          contact_person: c.contact_person,
          status: c.status as "active" | "inactive",
          cycle: c.cycle || "YYYY", // Ensure cycle is included
          created_at: c.created_at,
          location: c.location ? {
            lat: Number((c.location as any).lat || 0),
            lng: Number((c.location as any).lng || 0)
          } : undefined
        }));
        
        setCustomers(typedCustomers);
        
        // Process orders
        const processedOrders: Order[] = ordersData.map((order: any) => {
          const customer = typedCustomers.find(c => c.id === order.customer_id);
          
          return {
            id: order.id,
            customer_id: order.customer_id,
            customer: customer as Customer,
            salesperson_id: order.salesperson_id,
            status: order.status,
            order_date: order.order_date,
            delivery_date: order.delivery_date,
            total_amount: order.total_amount,
            payment_status: order.payment_status,
            notes: order.notes || "",
            items: order.items.map((item: any) => ({
              id: item.id,
              order_id: item.order_id,
              product_id: item.product_id,
              product: item.product as Product,
              quantity: item.quantity,
              price: item.price,
              total: item.total
            })),
            created_at: order.created_at,
            sync_status: order.sync_status
          };
        });
        
        setOrders(processedOrders);
      } catch (error: any) {
        console.error("Error fetching orders:", error.message);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to load orders: ${error.message}`,
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, []);

  return { orders, loading, customers };
}
