
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { Collection, Payment } from '@/types/collection';
import { Customer } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { PaymentService } from '../services/PaymentService';
import { toast } from '@/components/ui/use-toast';

interface AddPaymentModalProps {
  collection: Collection;
  customer?: Customer;
  isOpen: boolean;
  onClose: () => void;
  onPaymentAdded: () => void;
}

const paymentSchema = z.object({
  bank_account: z.string().min(1, 'Bank account is required'),
  amount: z.number().positive('Amount must be positive'),
  payment_date: z.date({
    required_error: 'Payment date is required',
  }),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export function AddPaymentModal({ 
  collection, 
  customer, 
  isOpen, 
  onClose, 
  onPaymentAdded 
}: AddPaymentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remainingAmount, setRemainingAmount] = useState<number>(collection.amount);

  useEffect(() => {
    const fetchTotalPayments = async () => {
      try {
        const totalPaid = await PaymentService.getTotalPaymentsByCollectionId(collection.id);
        setRemainingAmount(Math.max(0, collection.amount - totalPaid));
      } catch (error) {
        console.error('Error fetching total payments:', error);
      }
    };

    if (isOpen && collection) {
      fetchTotalPayments();
    }
  }, [isOpen, collection]);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      bank_account: customer?.bank_account || '',
      amount: remainingAmount,
      payment_date: new Date(),
    },
  });

  // Update form when the remaining amount changes
  useEffect(() => {
    form.setValue('amount', remainingAmount);
  }, [remainingAmount, form]);

  // Set bank account when customer data is available
  useEffect(() => {
    if (customer?.bank_account) {
      form.setValue('bank_account', customer.bank_account);
    }
  }, [customer, form]);

  const onSubmit = async (values: PaymentFormValues) => {
    if (values.amount > remainingAmount) {
      form.setError('amount', { 
        type: 'manual', 
        message: `Amount cannot exceed the remaining amount of ${new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(remainingAmount)}` 
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const paymentData: Omit<Payment, 'id' | 'created_at' | 'updated_at'> = {
        collection_id: collection.id,
        customer_id: collection.customer_id,
        bank_account: values.bank_account,
        amount: values.amount,
        payment_date: values.payment_date.toISOString(),
        status: 'Pending',
      };
      
      await PaymentService.createPayment(paymentData);
      
      toast({
        title: 'Payment added successfully',
        description: 'The payment has been recorded.',
      });
      
      onPaymentAdded();
      onClose();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to add payment',
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
                Invoice: <span className="font-medium text-foreground">{collection.invoice_number}</span> | 
                Customer: <span className="font-medium text-foreground">{collection.customer_name}</span>
              </p>
              <p className="text-sm mb-4">
                <span className="font-medium">Invoice Amount:</span> {new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(collection.amount)} | 
                <span className="font-medium"> Remaining:</span> {new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(remainingAmount)}
              </p>
            </div>
            
            <FormField
              control={form.control}
              name="bank_account"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Account</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter bank account" {...field} />
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
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                            !field.value && "text-muted-foreground"
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
                {isSubmitting ? 'Processing...' : 'Add Payment'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
