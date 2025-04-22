import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Giro, GiroClearing as GiroClearingType } from '@/types/giro';
import { GiroService } from '../services/GiroService';
import { cn } from '@/lib/utils';

const clearingSchema = z.object({
  clearing_date: z.date({
    required_error: 'Clearing date is required',
  }),
  clearing_status: z.enum(['cleared', 'bounced']),
  clearing_amount: z.number().positive('Amount must be positive'),
  reference_doc: z.string().optional(),
  remarks: z.string().optional(),
});

type ClearingFormValues = z.infer<typeof clearingSchema>;

interface GiroClearingProps {
  giro: Giro;
  onComplete: () => void;
  onCancel: () => void;
}

export function GiroClearing({ giro, onComplete, onCancel }: GiroClearingProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clearingRecords, setClearingRecords] = useState<GiroClearingType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [remainingAmount, setRemainingAmount] = useState<number>(giro.amount);

  const form = useForm<ClearingFormValues>({
    resolver: zodResolver(clearingSchema),
    defaultValues: {
      clearing_date: new Date(),
      clearing_status: 'cleared',
      clearing_amount: remainingAmount,
      reference_doc: '',
      remarks: '',
    },
  });

  useEffect(() => {
    fetchClearingRecords();
  }, []);

  // Update form when the remaining amount changes
  useEffect(() => {
    form.setValue('clearing_amount', remainingAmount);
  }, [remainingAmount, form]);

  const fetchClearingRecords = async () => {
    try {
      setIsLoading(true);
      const records = await GiroService.getGiroClearing(giro.id);
      setClearingRecords(records);
      
      // Calculate remaining amount - include both cleared records
      const totalCleared = records
        .filter(record => record.clearing_status === 'cleared')
        .reduce((sum, record) => sum + Number(record.clearing_amount), 0);
      
      setRemainingAmount(Math.max(0, giro.amount - totalCleared));
    } catch (error: any) {
      console.error('Error fetching clearing records:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load clearing records: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: ClearingFormValues) => {
    if (values.clearing_amount > remainingAmount) {
      form.setError("clearing_amount", {
        type: "manual",
        message: `Amount cannot exceed the remaining amount of ${formatCurrency(remainingAmount)}`,
      });
      return;
    }

    try {
      setIsSubmitting(true);

      await GiroService.createGiroClearing({
        giro_id: giro.id,
        clearing_date: values.clearing_date.toISOString(),
        clearing_status: values.clearing_status,
        clearing_amount: values.clearing_amount,
        reference_doc: values.reference_doc,
        remarks: values.remarks,
        created_by: 'system', // Replace with actual user ID when available
        giro_number: giro.giro_number,
        bank_name: giro.bank_name,
        bank_account: giro.bank_account,
        invoice_number: giro.invoice_number,
      });

      toast({
        title: "Clearing recorded",
        description: "The giro clearing has been successfully recorded",
      });

      // Calculate new remaining amount after this clearing
      const newRemainingAmount = remainingAmount - values.clearing_amount;
      
      // Reset form but keep the date and status
      form.reset({
        clearing_date: new Date(),
        clearing_status: 'cleared',
        clearing_amount: newRemainingAmount > 0 ? newRemainingAmount : 0, // Set to new remaining amount
        reference_doc: '',
        remarks: '',
      });
      
      fetchClearingRecords();
    } catch (error: any) {
      console.error('Error creating clearing record:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to record clearing: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Giro Information</AlertTitle>
          <AlertDescription>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <p className="text-sm font-medium">Giro Number:</p>
                <p className="text-sm">{giro.giro_number}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Bank:</p>
                <p className="text-sm">{giro.bank_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Total Amount:</p>
                <p className="text-sm">{formatCurrency(giro.amount)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Remaining Amount:</p>
                <p className="text-sm font-semibold">{formatCurrency(remainingAmount)}</p>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Clearing History */}
        {clearingRecords.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">Clearing History</h3>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clearingRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.clearing_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{formatCurrency(record.clearing_amount)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.clearing_status === 'cleared' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {record.clearing_status === 'cleared' ? 'Cleared' : 'Bounced'}
                        </span>
                      </TableCell>
                      <TableCell>{record.reference_doc || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* New Clearing Form */}
        {remainingAmount > 0 ? (
          <div>
            <h3 className="text-lg font-medium mb-2">Add New Clearing</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clearing_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Clearing Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                                disabled={isSubmitting}
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
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clearing_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Clearing Status</FormLabel>
                        <Select
                          disabled={isSubmitting}
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cleared">Cleared</SelectItem>
                            <SelectItem value="bounced">Bounced</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clearing_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Clearing Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter amount"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reference_doc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference Document (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter reference document"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter any additional notes"
                          className="resize-none"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Record Clearing
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">This giro has been fully cleared.</p>
            <Button
              type="button"
              variant="outline"
              onClick={onComplete}
              className="mt-4"
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}