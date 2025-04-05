
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuthentication } from "@/hooks/useAuthentication";
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Search, UserPlus } from "lucide-react";

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuthentication();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name");

      if (error) throw error;
      
      // Convert the raw data to match the Customer type
      const typedCustomers: Customer[] = data?.map(customer => ({
        ...customer,
        status: customer.status as "active" | "inactive",
        cycle: customer.cycle || "YYYY", // Add cycle field with default
        // Convert JSON location to the expected format if it exists
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
      setLoading(false);
    }
  };

  const handleAddCustomer = () => {
    navigate("/dashboard/customers/add");
  };

  const handleCustomerDetails = (customerId: string) => {
    navigate(`/dashboard/customers/${customerId}`);
  };

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.contact_person.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Function to get cycle description
  const getCycleDescription = (cycle: string) => {
    switch(cycle) {
      case 'YYYY':
        return 'Every Week';
      case 'YTYT':
        return 'Week 1 & 3';
      case 'TYTY':
        return 'Week 2 & 4';
      default:
        return cycle;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
        <Button onClick={handleAddCustomer}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredCustomers.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Visit Cycle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow 
                  key={customer.id} 
                  className="cursor-pointer hover:bg-muted/60"
                  onClick={() => handleCustomerDetails(customer.id)}
                >
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.contact_person}</TableCell>
                  <TableCell>{customer.city}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      customer.status === "active" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {customer.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                      {getCycleDescription(customer.cycle)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-full bg-muted p-3">
            <UserPlus className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No customers found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchQuery ? "Try a different search term" : "Get started by adding your first customer"}
          </p>
          {!searchQuery && (
            <Button onClick={handleAddCustomer} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Customers;
