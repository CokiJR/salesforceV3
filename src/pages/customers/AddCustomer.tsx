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
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BankAccount } from "@/types";
import { BankAccountInputs } from "./components/BankAccountInputs";

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

// Define bank account schema
const bankAccountSchema = z.object({
  bank_name: z.string().min(1, { message: "Bank name is required" }),
  account_number: z.string().min(1, { message: "Account number is required" }),
  account_holder_name: z.string().optional(),
});

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
  payment_term: z.string().min(1, { message: "Payment term is required" }),
  // Bank accounts array
  bank_accounts: z.array(bankAccountSchema).optional().default([]),
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
    payment_term: "",
    bank_accounts: [],
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

      // VALIDASI: Validasi bank accounts jika ada yang disediakan
      if (data.bank_accounts && data.bank_accounts.length > 0) {
        for (const bankAccount of data.bank_accounts) {
          if (bankAccount.bank_name && !bankAccount.account_number) {
            toast({
              variant: "destructive",
              title: "Validasi Error",
              description: "Silakan pilih nomor rekening untuk setiap bank yang Anda tambahkan.",
            });
            setIsSubmitting(false);
            return;
          }
        }
      }

      // LANGKAH 1: Buat objek customerData dengan format yang diharapkan oleh Supabase
      const customerData = {
        id: crypto.randomUUID(), // Generate UUID untuk primary key
        customer_id: data.customer_id,
        name: data.name,
        contact_person: data.contact_person,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        status: data.status,
        cycle: data.cycle,
        payment_term: data.payment_term,
        created_at: new Date().toISOString(),
      };

      // LANGKAH 2: Simpan data customer ke tabel customers
      console.log("Menyimpan data customer...");
      const { data: newCustomer, error: customerError } = await supabase
        .from("customers")
        .insert(customerData)
        .select()
        .single();

      // Jika gagal menyimpan data customer, tampilkan error dan batalkan proses
      if (customerError) {
        throw new Error(`Gagal membuat customer: ${customerError.message}`);
      }

      if (!newCustomer) {
        throw new Error("Gagal membuat customer: Tidak ada data yang dikembalikan");
      }

      // LANGKAH 3: Dapatkan customer_uuid dari response
      const customer_uuid = newCustomer.id;
      console.log("Customer berhasil disimpan dengan UUID:", customer_uuid);
      
      // Pastikan customer_uuid tidak null saat menyimpan ke customer_bank_accounts
      if (!customer_uuid) {
        throw new Error("UUID Customer tidak ditemukan. Tidak dapat menghubungkan rekening bank.");
      }

      let bankAccountsLinked = 0;

      // LANGKAH 4: Gunakan customer_uuid untuk menyimpan data ke tabel customer_bank_accounts
      if (data.bank_accounts && data.bank_accounts.length > 0) {
        console.log("Menyimpan data rekening bank...");
        // Buat array untuk menyimpan semua relasi rekening bank
        const bankAccountRelationships = [];
        
        for (const bankAccount of data.bank_accounts) {
          // Lewati rekening bank yang kosong
          if (!bankAccount.bank_name || !bankAccount.account_number) continue;
          
          // Cari ID rekening bank
          console.log(`Mencari rekening bank: ${bankAccount.bank_name} - ${bankAccount.account_number}`);
          const { data: bankAccountData, error: bankAccountError } = await supabase
            .from("bank_accounts")
            .select("id")
            .eq("bank_name", bankAccount.bank_name)
            .eq("account_number", bankAccount.account_number)
            .single();
            
          if (bankAccountError) {
            throw new Error(`Gagal menemukan rekening bank: ${bankAccountError.message}`);
          }
          
          if (!bankAccountData) {
            throw new Error("Rekening bank yang dipilih tidak ditemukan");
          }
          
          // Tambahkan ke array relasi dengan customer_uuid
          bankAccountRelationships.push({
            customer_id: customer_uuid, // Gunakan customer_uuid dari langkah 3
            bank_account_id: bankAccountData.id,
            created_at: new Date().toISOString(),
          });
        }
        
        // Simpan semua relasi sekaligus
        if (bankAccountRelationships.length > 0) {
          console.log(`Menyimpan ${bankAccountRelationships.length} relasi rekening bank...`);
          const { error: relationError } = await supabase
            .from("customer_bank_accounts")
            .insert(bankAccountRelationships);
  
          if (relationError) {
            // Jika gagal menyimpan relasi rekening bank, tampilkan error
            // Catatan: Supabase tidak mendukung transaksi sejati, jadi kita tidak bisa dengan mudah rollback customer
            throw new Error(`Gagal menghubungkan rekening bank: ${relationError.message}`);
          }
          
          bankAccountsLinked = bankAccountRelationships.length;
          console.log(`${bankAccountsLinked} rekening bank berhasil dihubungkan`);
        }
      }

      // Jika sampai di sini, berarti semua proses berhasil
      toast({
        title: "Customer berhasil ditambahkan",
        description: `${data.name} telah ditambahkan ke daftar customer Anda${bankAccountsLinked > 0 ? ` dengan ${bankAccountsLinked} rekening bank` : ''}.`,
      });

      // Navigasi kembali ke daftar customer
      navigate("/dashboard/customers");
    } catch (error: any) {
      console.error("Error menambahkan customer:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `${error.message}`,
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
                
                {/* Bank Account Section */}
                <div className="mt-6">
                  <FormField
                    control={form.control}
                    name="bank_accounts"
                    render={() => (
                      <FormItem>
                        <BankAccountInputs control={form.control} name="bank_accounts" />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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

              <CardFooter className="flex justify-between border-t pt-5">
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
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Add Customer"
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
