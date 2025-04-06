
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Customer, BankAccount } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { CustomerDetailView } from "./components/CustomerDetailView";

const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("customers")
          .select("*")
          .eq("id", id)
          .single();
        
        if (error) throw error;
        
        // Convert the raw data to properly typed Customer object
        const typedCustomer: Customer = {
          ...data,
          status: data.status as "active" | "inactive",
          cycle: data.cycle || "YYYY",
          location: data.location ? {
            lat: Number((data.location as any).lat || 0),
            lng: Number((data.location as any).lng || 0)
          } : undefined
        };
        
        // Fetch bank accounts for this customer
        const fetchBankAccounts = async () => {
          try {
            // First get the relationships from customer_bank_accounts
            const { data: relationships, error: relError } = await supabase
              .from("customer_bank_accounts")
              .select("bank_account_id")
              .eq("customer_id", typedCustomer.id);
            
            if (relError) throw relError;
            
            if (relationships && relationships.length > 0) {
              // Get all bank account IDs
              const bankAccountIds = relationships.map(rel => rel.bank_account_id);
              
              // Fetch the actual bank accounts
              const { data: accounts, error: accError } = await supabase
                .from("bank_accounts")
                .select("*")
                .in("id", bankAccountIds);
                
              if (accError) throw accError;
              
              // Add bank accounts to customer object
              typedCustomer.bank_accounts = accounts || [];
            }
          } catch (error: any) {
            console.error("Error fetching bank accounts:", error.message);
          }
        };
        
        await fetchBankAccounts();
        setCustomer(typedCustomer);
      } catch (error: any) {
        console.error("Error fetching customer:", error.message);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to load customer: ${error.message}`,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [id]);

  return (
    <div className="animate-fade-in">
      {customer && (
        <CustomerDetailView 
          customer={customer}
          isLoading={loading}
        />
      )}
    </div>
  );
};

export default CustomerDetail;
