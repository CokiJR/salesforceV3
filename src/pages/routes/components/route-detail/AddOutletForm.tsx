
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search } from 'lucide-react';
import { Customer, RouteStop } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AddOutletFormProps {
  routeId: string;
  routeDate: string;
  existingStops: RouteStop[];
  onAdd?: (customerId: string) => void;
  onCancel?: () => void;
}

export function AddOutletForm({ routeId, routeDate, existingStops, onAdd, onCancel }: AddOutletFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('status', 'active')
          .order('name');

        if (error) throw error;
        
        // Cast the data to Customer[] type with proper typing
        const typedCustomers = (data || []).map((customer: any) => ({
          id: customer.id,
          name: customer.name,
          address: customer.address,
          city: customer.city,
          phone: customer.phone,
          email: customer.email || '',
          contact_person: customer.contact_person,
          status: customer.status as "active" | "inactive",
          cycle: customer.cycle,
          created_at: customer.created_at,
          location: customer.location ? {
            lat: Number((customer.location as any).lat || 0),
            lng: Number((customer.location as any).lng || 0)
          } : undefined,
          bank_account: customer.bank_account,
          due_date: customer.due_date
        }));
        
        setCustomers(typedCustomers);
        setFilteredCustomers(typedCustomers);
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchTerm, customers]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleAdd = async () => {
    if (selectedCustomer) {
      try {
        // Check if the customer is already in existingStops
        if (existingStops.some(stop => stop.customer_id === selectedCustomer)) {
          toast({
            variant: "destructive",
            title: "Customer already in route",
            description: "This customer is already added to the route.",
          });
          return;
        }

        // Get the selected customer data
        const customer = customers.find(c => c.id === selectedCustomer);
        if (!customer) return;

        // Create a new route stop in the database
        const { error } = await supabase
          .from('route_stops')
          .insert({
            route_id: routeId,
            customer_id: selectedCustomer,
            visit_date: routeDate,
            visit_time: new Date().toISOString().split('T')[1].substring(0, 8),
            status: 'pending',
            notes: '',
            coverage_status: 'Cover Location',
            barcode_scanned: false,
            visited: false
          });

        if (error) throw error;

        toast({
          title: "Stop added",
          description: `${customer.name} has been added to the route.`,
        });

        if (onAdd) onAdd(selectedCustomer);
      } catch (error: any) {
        console.error('Error adding stop:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to add stop: ${error.message}`,
        });
      }
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search customers..."
            className="pl-8"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>
      
      <div className="mb-4">
        <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
          <SelectTrigger>
            <SelectValue placeholder="Select a customer" />
          </SelectTrigger>
          <SelectContent>
            {isLoading ? (
              <div className="flex justify-center p-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : filteredCustomers.length > 0 ? (
              filteredCustomers.map(customer => (
                <SelectItem key={customer.id} value={customer.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{customer.name}</span>
                    <span className="text-xs text-muted-foreground">{customer.address}, {customer.city}</span>
                  </div>
                </SelectItem>
              ))
            ) : (
              <div className="p-2 text-center text-muted-foreground">No customers found</div>
            )}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleAdd} disabled={!selectedCustomer || isLoading}>
          Add
        </Button>
      </div>
    </div>
  );
}
