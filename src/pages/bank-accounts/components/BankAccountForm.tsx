import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Building, CreditCard, User, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BankAccount } from "@/pages/BankAccounts";
import { Customer } from "@/types";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the validation schema
const bankAccountSchema = z.object({
  bank_name: z.string().min(2, { message: "Bank name is required" }),
  account_number: z.string().min(5, { message: "Account number is required" }),
  account_holder_name: z
    .string()
    .min(2, { message: "Account holder name is required" }),
  customer_id: z.string().optional(),
});

type BankAccountFormValues = z.infer<typeof bankAccountSchema>;

interface BankAccountFormProps {
  account: BankAccount | null;
  onSubmit: (data: BankAccountFormValues) => void;
  onCancel: () => void;
}

export function BankAccountForm({
  account,
  onSubmit,
  onCancel,
}: BankAccountFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const defaultValues: Partial<BankAccountFormValues> = {
    bank_name: account?.bank_name || "",
    account_number: account?.account_number || "",
    account_holder_name: account?.account_holder_name || "",
    customer_id: account?.customer_id || undefined,
  };

  const form = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues,
  });

  // Fetch customers for the dropdown
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("customers")
          .select("id, customer_id, name")
          .eq("status", "active")
          .order("name");

        if (error) throw error;
        setCustomers(data || []);
      } catch (error: any) {
        console.error("Error fetching customers:", error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const handleFormSubmit = (data: BankAccountFormValues) => {
    onSubmit(data);
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle>{account ? "Edit" : "Add"} Bank Account</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="bank_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Name</FormLabel>
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
              name="account_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Number</FormLabel>
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
                  <FormLabel>Account Holder Name</FormLabel>
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

            <FormField
              control={form.control}
              name="customer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <div className="relative">
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.customer_id
                            ? `${customer.customer_id} - ${customer.name}`
                            : customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Link this bank account to a customer (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">
                {account ? "Update" : "Add"} Bank Account
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
