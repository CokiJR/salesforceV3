import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  User,
  Mail,
  Building,
  Phone,
  MapPin,
  UserPlus,
  Calendar,
  CreditCard,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the validation schema
const customerSchema = z.object({
  customer_id: z
    .string()
    .min(8, { message: "Customer ID must be at least 8 characters" })
    .regex(/^C\d{7}$/, {
      message:
        "Customer ID must be in format C followed by 7 digits (e.g., C1234567)",
    }),
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
  bank_name: z.string().min(2, { message: "Bank name is required" }),
  bank_branch: z.string().optional(),
  account_number: z.string().min(5, { message: "Account number is required" }),
  account_holder_name: z
    .string()
    .min(2, { message: "Account holder name is required" }),
  payment_term: z.string().min(1, { message: "Payment term is required" }),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export default function AddCustomer() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingId, setIsGeneratingId] = useState(true);
  const [payterms, setPayterms] = useState<
    { payterm_code: string; description: string }[]
  >([]);
  const [isLoadingPayterms, setIsLoadingPayterms] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const defaultValues: Partial<CustomerFormValues> = {
    customer_id: "",
    status: "active",
    cycle: "YYYY",
    bank_name: "",
    bank_branch: "",
    account_number: "",
    account_holder_name: "",
    payment_term: "",
  };

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues,
  });

  // Function to generate a new customer ID
  const generateCustomerId = async () => {
    try {
      setIsGeneratingId(true);

      // Fetch the last customer ID from the database
      const { data, error } = await supabase
        .from("customers")
        .select("customer_id")
        .order("customer_id", { ascending: false })
        .limit(1);

      if (error) throw error;

      let nextId = "C0000001"; // Default starting ID

      if (data && data.length > 0 && data[0].customer_id) {
        // Extract the numeric part of the last ID
        const lastId = data[0].customer_id;
        const numericPart = lastId.substring(1); // Remove the 'C' prefix

        // Increment by 1 and pad to 7 digits
        const nextNumericId = (parseInt(numericPart, 10) + 1)
          .toString()
          .padStart(7, "0");
        nextId = `C${nextNumericId}`;
      }

      // Set the generated ID in the form
      form.setValue("customer_id", nextId);
    } catch (error: any) {
      console.error("Error generating customer ID:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to generate customer ID: ${error.message}`,
      });
    } finally {
      setIsGeneratingId(false);
    }
  };

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

  // Generate customer ID and fetch payment terms on component mount
  useEffect(() => {
    generateCustomerId();
    fetchPayterms();
  }, []);

  const onSubmit = async (data: CustomerFormValues) => {
    try {
      setIsSubmitting(true);

      // Create a customerData object with the shape expected by Supabase
      // Important: data is already validated by Zod so all required fields are present
      const customerData = {
        customer_id: data.customer_id,
        name: data.name,
        contact_person: data.contact_person,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        status: data.status,
        cycle: data.cycle,
        bank_name: data.bank_name,
        bank_branch: data.bank_branch,
        account_number: data.account_number,
        account_holder_name: data.account_holder_name,
        payment_term: data.payment_term,
        created_at: new Date().toISOString(),
      };

      // Now the customerData has all required fields explicitly defined
      const { data: newCustomer, error } = await supabase
        .from("customers")
        .insert(customerData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Customer added successfully",
        description: `${data.name} has been added to your customers.`,
      });

      // Navigate back to customers list
      navigate("/dashboard/customers");
    } catch (error: any) {
      console.error("Error adding customer:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to add customer: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/dashboard/customers");
  };

  return (
    <div className="max-w-2xl mx-auto py-6 animate-fade-in">
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">Add New Customer</CardTitle>
          <CardDescription>
            Enter the customer's information below to add them to your system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="customer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer ID *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-10"
                            placeholder="C0000000"
                            {...field}
                            disabled={isGeneratingId}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Unique identifier for this customer (format: C followed
                        by 7 digits)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-10"
                            placeholder="Enter business name"
                            {...field}
                          />
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
                      <FormLabel>Contact Person *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-10"
                            placeholder="Primary contact name"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              className="pl-10"
                              placeholder="contact@example.com"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              className="pl-10"
                              placeholder="(555) 123-4567"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Card className="p-4 border-dashed">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-lg">
                      Bank Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="bank_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank Name *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                  className="pl-10"
                                  placeholder="Enter bank name"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bank_branch"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank Branch</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                  className="pl-10"
                                  placeholder="Enter bank branch (optional)"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-4">
                      <FormField
                        control={form.control}
                        name="account_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Number *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                  className="pl-10"
                                  placeholder="Enter account number"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="account_holder_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Holder Name *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                  className="pl-10"
                                  placeholder="Enter account holder name"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Textarea
                            className="pl-10 min-h-[80px]"
                            placeholder="Enter street address"
                            {...field}
                          />
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
                      <FormLabel>City *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-10"
                            placeholder="Enter city"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Customer Status</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="active" />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                Active
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="inactive" />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                Inactive
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
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
                            <div className="relative">
                              <SelectTrigger className="pl-10">
                                <SelectValue placeholder="Select visit cycle" />
                              </SelectTrigger>
                              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            </div>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="YYYY">
                              Every Week (YYYY)
                            </SelectItem>
                            <SelectItem value="YTYT">
                              Week 1 & 3 (YTYT)
                            </SelectItem>
                            <SelectItem value="TYTY">
                              Week 2 & 4 (TYTY)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Determines when this customer will be automatically
                          scheduled for visits.
                        </FormDescription>
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
                      <FormLabel>Payment Terms *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <div className="relative">
                            <SelectTrigger className="pl-10">
                              <SelectValue placeholder="Select payment terms" />
                            </SelectTrigger>
                            <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          </div>
                        </FormControl>
                        <SelectContent>
                          {isLoadingPayterms ? (
                            <div className="flex items-center justify-center p-2">
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                              Loading...
                            </div>
                          ) : payterms.length > 0 ? (
                            payterms.map((term) => (
                              <SelectItem
                                key={term.payterm_code}
                                value={term.payterm_code}
                              >
                                {term.payterm_code} - {term.description}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-center text-muted-foreground">
                              No payment terms found
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the payment terms for this customer
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <CardFooter className="flex justify-between px-0 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="mr-2">Saving...</span>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Customer
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
