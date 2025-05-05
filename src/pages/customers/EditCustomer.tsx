import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Customer, BankAccount } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Save,
  Loader2,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  Users,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { BankAccountInputs } from "./components/BankAccountInputs";
import { CustomerSalesmanService } from "./services/CustomerSalesmanService";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  account_holder_name: z
    .string()
    .min(2, { message: "Account holder name is required" }),
});

// Define the validation schema
const customerSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Customer name must be at least 2 characters" }),
  contact_person: z
    .string()
    .min(2, { message: "Contact person name is required" }),
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
  salesman_ids: z.array(z.string()).optional().default([]),
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
  const [salesmen, setSalesmen] = useState<{ id: string; full_name: string }[]>([]);
  const [isLoadingSalesmen, setIsLoadingSalesmen] = useState(false);
  const [customerSalesmenIds, setCustomerSalesmenIds] = useState<string[]>([]);
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
      salesman_ids: [],
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

  // Fetch salesmen from database
  const fetchSalesmen = async () => {
    try {
      setIsLoadingSalesmen(true);
      const data = await CustomerSalesmanService.getSalesmen();
      setSalesmen(data);
    } catch (error: any) {
      console.error("Error fetching salesmen:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load salesmen: ${error.message}`,
      });
    } finally {
      setIsLoadingSalesmen(false);
    }
  };

  // Fetch customer's assigned salesmen
  const fetchCustomerSalesmen = async (customerId: string) => {
    try {
      const salesmenIds = await CustomerSalesmanService.getCustomerSalesmen(customerId);
      setCustomerSalesmenIds(salesmenIds);
      form.setValue("salesman_ids", salesmenIds);
    } catch (error: any) {
      console.error("Error fetching customer salesmen:", error.message);
      toast({
        variant: "warning",
        title: "Warning",
        description: `Failed to load assigned salesmen: ${error.message}`,
      });
    }
  };

  // Fetch customer's bank accounts
  const fetchBankAccounts = async (customerId: string) => {
    try {
      // First get the relationships from customer_bank_accounts
      const { data: relationships, error: relError } = await supabase
        .from("customer_bank_accounts")
        .select("bank_account_id")
        .eq("customer_uuid", customerId);

      if (relError) throw relError;

      if (relationships && relationships.length > 0) {
        // Get all bank account IDs
        const bankAccountIds = relationships.map((rel) => rel.bank_account_id);

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
          location: data.location
            ? {
                lat: Number((data.location as any).lat || 0),
                lng: Number((data.location as any).lng || 0),
              }
            : undefined,
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
          salesman_ids: [],
        });

        // Fetch bank accounts for this customer
        await fetchBankAccounts(typedCustomer.id);

        // Fetch payment terms
        await fetchPayterms();
        
        // Fetch salesmen
        await fetchSalesmen();
        
        // Fetch customer's assigned salesmen
        await fetchCustomerSalesmen(typedCustomer.id);
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
        location: customer.location
          ? {
              lat: customer.location.lat,
              lng: customer.location.lng,
            }
          : null,
      };

      // Update customer data
      const { error: customerError } = await supabase
        .from("customers")
        .update(customerData)
        .eq("id", customer.id);

      if (customerError) throw customerError;
      
      // Update salesman assignments
      try {
        await CustomerSalesmanService.assignSalesmen(customer.id, values.salesman_ids || []);
      } catch (error: any) {
        console.error("Error assigning salesmen:", error.message);
        toast({
          variant: "warning",
          title: "Warning",
          description: `Perubahan data customer berhasil disimpan, tetapi terjadi kesalahan saat menyimpan assignment salesman: ${error.message}`,
        });
      }

      // Handle bank accounts
      if (values.bank_accounts && values.bank_accounts.length > 0) {
        try {
          // First, get existing relationships to avoid deleting them all
          const { data: existingRelationships, error: fetchError } =
            await supabase
              .from("customer_bank_accounts")
              .select("bank_account_id")
              .eq("customer_uuid", customer.id);

          if (fetchError) throw fetchError;

          // Create a set of existing bank account IDs for quick lookup
          const existingBankAccountIds = new Set(
            existingRelationships?.map((rel) => rel.bank_account_id) || [],
          );

          // Process each bank account
          const relationships = await Promise.all(
            values.bank_accounts.map(async (account) => {
              // If the account has no ID, it's a new account that needs to be created
              if (!account.id) {
                // Check if account with this number already exists
                const { data: existingAccount, error: checkError } =
                  await supabase
                    .from("bank_accounts")
                    .select("id, bank_name, account_holder_name")
                    .eq("account_number", account.account_number)
                    .maybeSingle();

                if (checkError) throw checkError;

                // If account already exists, use that instead of creating a new one
                if (existingAccount) {
                  // Update the existing account with new details if needed
                  if (
                    existingAccount.bank_name !== account.bank_name ||
                    existingAccount.account_holder_name !==
                      account.account_holder_name
                  ) {
                    const { error: updateError } = await supabase
                      .from("bank_accounts")
                      .update({
                        bank_name: account.bank_name,
                        account_holder_name: account.account_holder_name,
                      })
                      .eq("id", existingAccount.id);

                    if (updateError) throw updateError;
                  }

                  // Remove from existing set if it's already linked
                  existingBankAccountIds.delete(existingAccount.id);

                  return {
                    customer_uuid: customer.id,
                    customer_id: customer.customer_id,
                    bank_account_id: existingAccount.id,
                    already_exists: existingBankAccountIds.has(
                      existingAccount.id,
                    ),
                  };
                } else {
                  // Create new account if it doesn't exist
                  const { data, error } = await supabase
                    .from("bank_accounts")
                    .insert({
                      id: crypto.randomUUID(), // Explicitly set UUID
                      bank_name: account.bank_name,
                      account_number: account.account_number,
                      account_holder_name: account.account_holder_name,
                      created_at: new Date().toISOString(),
                    })
                    .select();

                  if (error) throw error;
                  if (data && data[0]) {
                    return {
                      customer_uuid: customer.id,
                      customer_id: customer.customer_id,
                      bank_account_id: data[0].id,
                      already_exists: false,
                    };
                  }
                  return null;
                }
              } else {
                // If the account has an ID, check if relationship already exists
                const alreadyExists = existingBankAccountIds.has(account.id);

                // Remove from existing set to mark as processed
                existingBankAccountIds.delete(account.id);

                return {
                  customer_uuid: customer.id,
                  customer_id: customer.customer_id,
                  bank_account_id: account.id,
                  already_exists: alreadyExists,
                };
              }
            }),
          );

          // Filter out any null relationships and those that already exist
          const newRelationships = relationships
            .filter((rel) => rel !== null && !rel.already_exists)
            .map((rel) => ({
              customer_uuid: rel.customer_uuid,
              customer_id: rel.customer_id,
              bank_account_id: rel.bank_account_id,
              created_at: new Date().toISOString(),
            }));

          // Insert new relationships if any
          if (newRelationships.length > 0) {
            console.log("Inserting new relationships:", newRelationships);

            const { error: insertError } = await supabase
              .from("customer_bank_accounts")
              .insert(newRelationships);

            if (insertError) {
              console.error("Error inserting relationships:", insertError);
              throw insertError;
            }
          }

          // Delete relationships that are no longer needed
          if (existingBankAccountIds.size > 0) {
            const idsToDelete = Array.from(existingBankAccountIds);
            console.log(
              "Deleting old relationships for bank accounts:",
              idsToDelete,
            );

            const { error: deleteError } = await supabase
              .from("customer_bank_accounts")
              .delete()
              .eq("customer_uuid", customer.id)
              .in("bank_account_id", idsToDelete);

            if (deleteError) {
              console.error("Error deleting old relationships:", deleteError);
              throw deleteError;
            }
          }
        } catch (error) {
          console.error("Error managing bank accounts:", error);
          throw error;
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
    switch (cycle) {
      case "YYYY":
        return "Every Week";
      case "YTYT":
        return "Week 1 & 3";
      case "TYTY":
        return "Week 2 & 4";
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
                          <SelectItem
                            key={term.payterm_code}
                            value={term.payterm_code}
                          >
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
              
              {/* Salesman Assignment */}
              <div className="space-y-2">
                <FormLabel>Salesman</FormLabel>
                <div className="space-y-1">
                  {salesmen.map((salesman) => (
                    <div key={salesman.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`salesman-${salesman.id}`}
                        checked={form.watch("salesman_ids")?.includes(salesman.id)}
                        onCheckedChange={(checked) => {
                          const currentValues = form.getValues("salesman_ids") || [];
                          const newValues = checked
                            ? [...currentValues, salesman.id]
                            : currentValues.filter((id) => id !== salesman.id);
                          form.setValue("salesman_ids", newValues, { shouldValidate: true });
                        }}
                        disabled={isLoadingSalesmen}
                      />
                      <Label
                        htmlFor={`salesman-${salesman.id}`}
                        className="text-sm font-normal"
                      >
                        {salesman.full_name}
                      </Label>
                    </div>
                  ))}
                  {isLoadingSalesmen && (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Memuat data salesman...</span>
                    </div>
                  )}
                  {!isLoadingSalesmen && salesmen.length === 0 && (
                    <p className="text-sm text-muted-foreground">Tidak ada salesman yang tersedia</p>
                  )}
                </div>
                <FormDescription>
                  Pilih salesman yang akan ditugaskan ke customer ini
                </FormDescription>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/dashboard/customers/${customer.id}`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
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
