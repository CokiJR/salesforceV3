
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { usePayments } from './hooks/usePayments';
import { PaymentService } from './services/PaymentService';
import { Payment } from '@/types/collection';
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

const paymentSchema = z.object({
  collection_id: z.string().min(1, 'Collection is required'),
  bank_account: z.string().min(1, 'Bank account is required'),
  amount: z.number().positive('Amount must be positive'),
  payment_date: z.date({
    required_error: 'Payment date is required',
  }),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export default function AddPayment() {
  const navigate = useNavigate();
  const { addPayment } = usePayments();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unpaidCollections, setUnpaidCollections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState<any | null>(null);

  useEffect(() => {
    const fetchUnpaidCollections = async () => {
      try {
        setIsLoading(true);
        const collections = await PaymentService.getUnpaidCollections();
        setUnpaidCollections(collections);
      } catch (error) {
        console.error('Error fetching unpaid collections:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load unpaid collections",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnpaidCollections();
  }, []);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      collection_id: '',
      bank_account: '',
      amount: 0,
      payment_date: new Date(),
    },
  });

  const onSubmit = async (values: PaymentFormValues) => {
    if (!selectedCollection) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a collection",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const paymentData: Omit<Payment, 'id' | 'created_at' | 'updated_at'> = {
        collection_id: values.collection_id,
        customer_id: selectedCollection.customer_id,
        bank_account: values.bank_account,
        amount: values.amount,
        payment_date: values.payment_date.toISOString(),
        status: 'Pending',
      };
      
      await addPayment(paymentData);
      
      toast({
        title: "Payment added",
        description: "The payment has been successfully recorded",
      });
      
      navigate('/dashboard/payments');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to add payment: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCollectionChange = (collectionId: string) => {
    const selected = unpaidCollections.find(c => c.id === collectionId);
    setSelectedCollection(selected);
    
    if (selected) {
      form.setValue('collection_id', selected.id);
      form.setValue('amount', selected.amount);
      
      if (selected.customer?.bank_account) {
        form.setValue('bank_account', selected.customer.bank_account);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add New Payment</h1>
        <p className="text-muted-foreground">Record a payment for an unpaid collection</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : unpaidCollections.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">There are no unpaid collections to add payments for.</p>
              <Button onClick={() => navigate('/dashboard/collections')}>
                View Collections
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="collection_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Collection</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleCollectionChange(value);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a collection" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {unpaidCollections.map((collection) => (
                            <SelectItem key={collection.id} value={collection.id}>
                              {collection.invoice_number} - {collection.customer_name} - {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD'
                              }).format(collection.amount)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {selectedCollection && (
                  <div className="bg-muted p-3 rounded-md">
                    <p><span className="font-medium">Invoice:</span> {selectedCollection.invoice_number}</p>
                    <p><span className="font-medium">Customer:</span> {selectedCollection.customer_name}</p>
                    <p><span className="font-medium">Due Date:</span> {format(new Date(selectedCollection.due_date), 'MMM dd, yyyy')}</p>
                    <p><span className="font-medium">Amount Due:</span> {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(selectedCollection.amount)}</p>
                  </div>
                )}
                
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

                <CardFooter className="justify-between px-0">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/dashboard/payments')}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Add Payment'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
