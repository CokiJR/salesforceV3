import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { Collection, Payment } from "@/types/collection";
import { Customer, BankAccount } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { PaymentService } from "../services/PaymentService";
import { toast } from "@/components/ui/use-toast";

interface AddPaymentModalProps {
  collection: Collection;
  customer?: Customer;
  isOpen: boolean;
  onClose: () => void;
  onPaymentAdded: () => void;
}

const paymentSchema = z.object({
  bank_account_id: z.string().min(1, "Bank account is required"),
  amount: z.number().positive("Amount must be positive"),
  payment_date: z.date({
    required_error: "Payment date is required",
  }),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export function AddPaymentModal({
  collection,
  customer,
  isOpen,
  onClose,
  onPaymentAdded,
}: AddPaymentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remainingAmount, setRemainingAmount] = useState<number>(
    collection.amount,
  );
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoadingBankAccounts, setIsLoadingBankAccounts] = useState(false);

  useEffect(() => {
    const fetchTotalPayments = async () => {
      try {
        const totalPaid = await PaymentService.getTotalPaymentsByCollectionId(
          collection.id,
        );
        setRemainingAmount(Math.max(0, collection.amount - totalPaid));
      } catch (error) {
        console.error("Error fetching total payments:", error);
      }
    };

    if (isOpen && collection) {
      fetchTotalPayments();
    }
  }, [isOpen, collection]);

  // Fetch customer bank accounts
  useEffect(() => {
    const fetchBankAccounts = async () => {
      if (!collection.customer_id) return;

      try {
        setIsLoadingBankAccounts(true);
        // First get the relationships from customer_bank_accounts
        const { data: relationships, error: relError } = await supabase
          .from("customer_bank_accounts")
          .select("bank_account_id")
          .eq("customer_uuid", collection.customer_id);

        if (relError) throw relError;

        if (relationships && relationships.length > 0) {
          // Get all bank account IDs
          const bankAccountIds = relationships.map(
            (rel) => rel.bank_account_id,
          );

          // Fetch the actual bank accounts
          const { data: accounts, error: accError } = await supabase
            .from("bank_accounts")
            .select("*")
            .in("id", bankAccountIds);

          if (accError) throw accError;
          setBankAccounts(accounts || []);
          console.log("Fetched bank accounts:", accounts);
        } else {
          console.log(
            "No bank account relationships found for customer_uuid:",
            collection.customer_id,
          );
        }
      } catch (error: any) {
        console.error("Error fetching bank accounts:", error.message);
      } finally {
        setIsLoadingBankAccounts(false);
      }
    };

    if (isOpen && collection.customer_id) {
      fetchBankAccounts();
    }
  }, [isOpen, collection.customer_id]);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      bank_account_id: "",
      amount: remainingAmount,
      payment_date: new Date(),
    },
  });

  // Update form when the remaining amount changes
  useEffect(() => {
    form.setValue("amount", remainingAmount);
  }, [remainingAmount, form]);

  // Set first bank account when bank accounts are loaded
  useEffect(() => {
    if (bankAccounts.length > 0) {
      console.log("Setting default bank account:", bankAccounts[0].id);
      form.setValue("bank_account_id", bankAccounts[0].id);
    }
  }, [bankAccounts, form]);

  const onSubmit = async (values: PaymentFormValues) => {
    if (values.amount > remainingAmount) {
      form.setError("amount", {
        type: "manual",
        message: `Amount cannot exceed the remaining amount of ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(remainingAmount)}`,
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Find the selected bank account to get its account number
      const selectedBankAccount = bankAccounts.find(account => account.id === values.bank_account_id);
      
      const paymentData: Omit<Payment, "id" | "created_at" | "updated_at"> = {
        collection_id: collection.id,
        customer_id: collection.customer_id,
        bank_account_id: values.bank_account_id,
        account_number: selectedBankAccount?.account_number, // Save the account number
        amount: values.amount,
        payment_date: values.payment_date.toISOString(),
        status: "Pending",
      };

      await PaymentService.createPayment(paymentData);

      toast({
        title: "Payment added successfully",
        description: "The payment has been recorded.",
      });

      onPaymentAdded();
      onClose();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to add payment",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Invoice:{" "}
                <span className="font-medium text-foreground">
                  {collection.invoice_number}
                </span>{" "}
                | Customer:{" "}
                <span className="font-medium text-foreground">
                  {collection.customer_name}
                </span>
              </p>
              <p className="text-sm mb-4">
                <span className="font-medium">Invoice Amount:</span>{" "}
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                }).format(collection.amount)}{" "}
                |<span className="font-medium"> Remaining:</span>{" "}
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                }).format(remainingAmount)}
              </p>
            </div>

            <FormField
              control={form.control}
              name="bank_account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Account</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a bank account" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingBankAccounts ? (
                          <SelectItem value="loading" disabled>
                            Loading accounts...
                          </SelectItem>
                        ) : bankAccounts.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No bank accounts found
                          </SelectItem>
                        ) : (
                          bankAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              <span className="font-medium">{account.bank_name}</span> - <span className="text-muted-foreground">{account.account_number}</span> (
                              {account.account_holder_name})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      min="0.01"
                      max={remainingAmount}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value))
                      }
                      value={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Payment Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Add Payment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
