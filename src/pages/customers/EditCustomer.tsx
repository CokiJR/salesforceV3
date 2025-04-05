
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Customer } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";

const EditCustomer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!customer) return;
    
    const { name, value } = e.target;
    setCustomer({ ...customer, [name]: value });
  };

  const handleStatusChange = (value: string) => {
    if (!customer) return;
    setCustomer({ ...customer, status: value as "active" | "inactive" });
  };

  const handleCycleChange = (value: string) => {
    if (!customer) return;
    setCustomer({ ...customer, cycle: value });
  };

  const handleSave = async () => {
    if (!customer) return;
    
    try {
      setSaving(true);
      
      // Prepare the data for saving
      const customerData = {
        ...customer,
        // Convert location object to JSON format for storage
        location: customer.location ? {
          lat: customer.location.lat,
          lng: customer.location.lng
        } : null
      };
      
      const { error } = await supabase
        .from("customers")
        .update(customerData)
        .eq("id", customer.id);
      
      if (error) throw error;
      
      toast({
        title: "Customer updated",
        description: "Customer details have been successfully updated.",
      });
      
      // Navigate back to customer detail page
      navigate(`/dashboard/customers/${customer.id}`);
      
    } catch (error: any) {
      console.error("Error updating customer:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update customer: ${error.message}`,
      });
    } finally {
      setSaving(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="bg-destructive/10 text-destructive p-4 rounded-md">
        Customer not found
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Edit Customer</CardTitle>
          <CardDescription>Update customer information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Customer Name</Label>
              <Input
                id="name"
                name="name"
                value={customer.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                name="contact_person"
                value={customer.contact_person}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={customer.phone}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                value={customer.email || ""}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={customer.address}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                value={customer.city}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={customer.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="cycle">Visit Cycle</Label>
              <Select
                value={customer.cycle}
                onValueChange={handleCycleChange}
              >
                <SelectTrigger>
                  <SelectValue>
                    {getCycleDescription(customer.cycle)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YYYY">Every Week</SelectItem>
                  <SelectItem value="YTYT">Week 1 & 3</SelectItem>
                  <SelectItem value="TYTY">Week 2 & 4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="bank_account">Bank Account</Label>
            <Input
              id="bank_account"
              name="bank_account"
              value={customer.bank_account || ""}
              onChange={handleChange}
              placeholder="Bank account number"
            />
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/dashboard/customers/${customer.id}`)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default EditCustomer;
