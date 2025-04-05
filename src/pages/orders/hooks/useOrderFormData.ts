
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Customer, Product } from "@/types";
import { toast } from "@/components/ui/use-toast";

export function useOrderFormData() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  // Fetch form data from Supabase
  useEffect(() => {
    const fetchFormData = async () => {
      setLoadingItems(true);
      try {
        // Fetch customers
        const { data: customersData, error: customersError } = await supabase
          .from("customers")
          .select("*")
          .eq("status", "active")
          .order("name");
        
        if (customersError) throw customersError;
        
        // Convert the raw data to properly typed Customer objects
        const typedCustomers: Customer[] = customersData?.map(customer => ({
          id: customer.id,
          name: customer.name,
          address: customer.address,
          city: customer.city,
          phone: customer.phone,
          email: customer.email || "",
          contact_person: customer.contact_person,
          status: customer.status as "active" | "inactive",
          cycle: customer.cycle || "YYYY", // Ensure cycle is included
          created_at: customer.created_at,
          location: customer.location ? {
            lat: Number((customer.location as any).lat || 0),
            lng: Number((customer.location as any).lng || 0)
          } : undefined
        })) || [];
        
        // Fetch products
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("*")
          .order("name");
        
        if (productsError) throw productsError;
        
        setCustomers(typedCustomers);
        setProducts(productsData as Product[]);
      } catch (error: any) {
        console.error("Error fetching form data:", error.message);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to load form data: ${error.message}`,
        });
      } finally {
        setLoadingItems(false);
      }
    };

    fetchFormData();
  }, []);

  return { customers, products, loadingItems };
}
