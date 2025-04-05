
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types";

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const { toast } = useToast();

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      
      // Convert the raw data to properly typed Customer objects
      const typedCustomers: Customer[] = data?.map(customer => ({
        id: customer.id,
        name: customer.name,
        address: customer.address,
        city: customer.city,
        phone: customer.phone,
        email: customer.email || "",
        contact_person: customer.contact_person,
        status: customer.status as "active" | "inactive",
        cycle: customer.cycle || "YYYY", // Add cycle field
        created_at: customer.created_at,
        location: customer.location ? {
          lat: Number((customer.location as any).lat || 0),
          lng: Number((customer.location as any).lng || 0)
        } : undefined
      })) || [];
      
      setCustomers(typedCustomers);
    } catch (error: any) {
      console.error("Error fetching customers:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load customers: ${error.message}`,
      });
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return { customers, loadingCustomers };
}
