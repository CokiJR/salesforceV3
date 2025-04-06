
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Customer, BankAccount } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2, Building, User, Mail, Phone, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { BankAccountInputs } from "./components/BankAccountInputs";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define bank account schema
const bankAccountSchema = z.object({
  id: z.string().optional(),
  bank_name: z.string().min(2, { message: "Bank name is required" }),
  account_number: z.string().min(5, { message: "Account number is required" }),
  account_holder_name: z.string().min(2, { message: "Account holder name is required" }),
});

// Define the validation schema
const customerSchema = z.object({
  name: z.string().min(2, { message: "Customer name must be at least 2 characters" }),
  contact_person: z.string().min(2, { message: "Contact person name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(5, { message: "Phone number is required" }),
  address: z.string().min(5, { message: "Address is required" }),
  city: z.string().min(2, { message: "City is required" }),
  status: z.enum(["active", "inactive"]),
  cycle: z.enum(["YYYY", "YTYT", "TYTY"], {
    message: "Please select a valid visit cycle",
  }),
  bank_accounts: z.array(bankAccountSchema).optional().default([]),
  payment_term: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

const EditCustomer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payterms, setPayterms] = useState<
    { payterm_code: string; description: string }[]
  >([]);
  const [isLoadingPayterms, setIsLoadingPayterms] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      status: "active",
      cycle: "YYYY",
      bank_accounts: [],
      payment_term: "",
    },
  });

  // Fetch payment terms from database
  const fetchPayterms = async () => {
    try {
      setIsLoadingPayterms(true);
      const { data, error } = await supabase
        .from("payterms")
        .select("payterm_code, description")
        .order("payterm_code");

      if (error) throw error;
      setPayterms(data || []);
    } catch (error: any) {
      console.error("Error fetching payment terms:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load payment terms: ${error.message}`,
      });
    } finally {
      setIsLoadingPayterms(false);
    }
  };

  // Fetch customer's bank accounts
  const fetchBankAccounts = async (customerId: string) => {
    try {
      // First get the relationships from customer_bank_accounts
      const { data: relationships, error: relError } = await supabase
        .from("customer_bank_accounts")
        .select("bank_account_id")
        .eq("customer_id", customerId);
      
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
        setBankAccounts(accounts || []);
        
        // Update the form with bank accounts
        form.setValue("bank_accounts", accounts || []);
      }
    } catch (error: any) {
      console.error("Error fetching bank accounts:", error.message);
      toast({
        variant: "warning",
        title: "Warning",
        description: `Failed to load bank accounts: ${error.message}`,
      });
    }
  };

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
        
        // Set form values
        form.reset({
          name: typedCustomer.name,
          contact_person: typedCustomer.contact_person,
          email: typedCustomer.email || "",
          phone: typedCustomer.phone,
          address: typedCustomer.address,
          city: typedCustomer.city,
          status: typedCustomer.status,
          cycle: typedCustomer.cycle,
          payment_term: typedCustomer.payment_term || "",
          bank_accounts: [],
        });
        
        // Fetch bank accounts for this customer
        await fetchBankAccounts(typedCustomer.id);
        
        // Fetch payment terms
        await fetchPayterms();
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

  const onSubmit = async (values: CustomerFormValues) => {
    if (!customer) return;
    
    try {
      setSaving(true);
      
      // Prepare the data for saving
      const customerData = {
        ...customer,
        name: values.name,
        contact_person: values.contact_person,
        email: values.email,
        phone: values.phone,
        address: values.address,
        city: values.city,
        status: values.status,
        cycle: values.cycle,
        payment_term: values.payment_term,
        // Convert location object to JSON format for storage
        location: customer.location ? {
          lat: customer.location.lat,
          lng: customer.location.lng
        } : null
      };
      
      // Update customer data
      const { error: customerError } = await supabase
        .from("customers")
        .update(customerData)
        .eq("id", customer.id);
      
      if (customerError) throw customerError;
      
      // Handle bank accounts
      if (values.bank_accounts && values.bank_accounts.length > 0) {
        // First, delete existing relationships
        const { error: deleteError } = await supabase
          .from("customer_bank_accounts")
          .delete()
          .eq("customer_id", customer.id);
        
        if (deleteError) throw deleteError;
        
        // Then create new relationships
        const relationships = await Promise.all(values.bank_accounts.map(async account => {
          // If the account has no ID, it's a new account that needs to be created
          if (!account.id) {
            // Check if account with this number already exists
            const { data: existingAccount, error: checkError } = await supabase
              .from("bank_accounts")
              .select("id")
              .eq("account_number", account.account_number)
              .maybeSingle();
            
            if (checkError) throw checkError;
            
            // If account already exists, use that instead of creating a new one
            if (existingAccount) {
              // Update the existing account with new details
              const { error: updateError } = await supabase
                .from("bank_accounts")
                .update({
                  bank_name: account.bank_name,
                  account_holder_name: account.account_holder_name
                })
                .eq("id", existingAccount.id);
              
              if (updateError) throw updateError;
              
              return {
                customer_id: customer.id,
                bank_account_id: existingAccount.id
              };
            } else {
              // Create new account if it doesn't exist
              const { data, error } = await supabase
                .from("bank_accounts")
                .insert({
                  bank_name: account.bank_name,
                  account_number: account.account_number,
                  account_holder_name: account.account_holder_name
                })
                .select();
              
              if (error) throw error;
              if (data && data[0]) {
                return {
                  customer_id: customer.id,
                  bank_account_id: data[0].id
                };
              }
              return null;
            }
          } else {
            // If the account has an ID, just create the relationship
            return {
              customer_id: customer.id,
              bank_account_id: account.id
            };
          }
        }));
        
        // Filter out any null relationships
        const validRelationships = relationships.filter(rel => rel !== null);
        
        if (validRelationships.length > 0) {
          // Use the correct column names as defined in the migration file
          // The column is 'customer_id' not 'customer_uuid'
          const relationshipsWithCorrectColumns = validRelationships.map(rel => ({
            customer_id: rel.customer_id,
            bank_account_id: rel.bank_account_id
            // created_at will be automatically filled by Supabase
          }));
          
          // Debug the data being inserted
          console.log('Inserting relationships:', relationshipsWithCorrectColumns);
          
          const { error: relError } = await supabase
            .from("customer_bank_accounts")
            .insert(relationshipsWithCorrectColumns);
          
          if (relError) {
            console.error('Error inserting relationships:', relError);
            throw relError;
          }
        }
      }
      
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
  
  const handleSave = () => {
    form.handleSubmit(onSubmit)();
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contact_person"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cycle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visit Cycle</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue>
                              {getCycleDescription(field.value)}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="YYYY">Every Week</SelectItem>
                          <SelectItem value="YTYT">Week 1 & 3</SelectItem>
                          <SelectItem value="TYTY">Week 2 & 4</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="payment_term"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Term</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoadingPayterms}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment term" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {payterms.map((term) => (
                          <SelectItem key={term.payterm_code} value={term.payterm_code}>
                            {term.payterm_code} - {term.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Payment terms define when payment is due
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <BankAccountInputs control={form.control} name="bank_accounts" />
            </CardContent>
            <CardFooter className="justify-between">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => navigate(`/dashboard/customers/${customer.id}`)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
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
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default EditCustomer;
