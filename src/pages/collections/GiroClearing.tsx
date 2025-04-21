import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Info, ArrowLeft } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Giro, GiroClearing as GiroClearingType } from '@/types/giro';
import { GiroService } from './services/GiroService';
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

export default function GiroClearingPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [giro, setGiro] = useState<Giro | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clearingRecords, setClearingRecords] = useState<GiroClearingType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [remainingAmount, setRemainingAmount] = useState<number>(0);

  const form = useForm<ClearingFormValues>({
    resolver: zodResolver(clearingSchema),
    defaultValues: {
      clearing_date: new Date(),
      clearing_status: 'cleared',
      clearing_amount: 0,
      reference_doc: '',
      remarks: '',
    },
  });

  useEffect(() => {
    if (id) {
      fetchGiroData(id);
    } else {
      navigate('/dashboard/giro');
    }
  }, [id, navigate]);

  // Update form when the remaining amount changes
  useEffect(() => {
    form.setValue('clearing_amount', remainingAmount);
  }, [remainingAmount, form]);

  const fetchGiroData = async (giroId: string) => {
    try {
      setIsLoading(true);
      const giroData = await GiroService.getGiroById(giroId);
      setGiro(giroData);
      fetchClearingRecords(giroId);
    } catch (error: any) {
      console.error('Error fetching giro:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load giro: ${error.message}`,
      });
      navigate('/dashboard/giro');
    }
  };

  const fetchClearingRecords = async (giroId: string) => {
    try {
      const records = await GiroService.getGiroClearing(giroId);
      setClearingRecords(records);
      
      if (giro) {
        // Calculate remaining amount
        const totalCleared = records
          .filter(record => record.clearing_status === 'cleared')
          .reduce((sum, record) => sum + record.clearing_amount, 0);
        
        setRemainingAmount(Math.max(0, giro.amount - totalCleared));
      }
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
    if (!giro) return;

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

      // Reset form and refresh data
      form.reset({
        clearing_date: new Date(),
        clearing_status: 'cleared',
        clearing_amount: 0,
        reference_doc: '',
        remarks: '',
      });
      
      // Refresh giro data and clearing records
      fetchGiroData(giro.id);
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

  const getStatusBadge = (status: string) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        status === 'cleared' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {status === 'cleared' ? 'Cleared' : 'Bounced'}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!giro) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/giro")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">Giro Clearing</h2>
        </div>
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Giro not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/giro")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Giro Clearing</h2>
            <p className="text-muted-foreground">
              Manage clearing process for giro {giro.giro_number}
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Giro Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Giro Number</p>
                <p className="text-base font-medium">{giro.giro_number}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bank</p>
                <p className="text-base font-medium">{giro.bank_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Customer</p>
                <p className="text-base font-medium">{giro.customer?.name || giro.customer_id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                <p className="text-base font-medium">{format(new Date(giro.due_date), 'MMM dd, yyyy')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <p className="text-base font-medium">{formatCurrency(giro.amount)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Remaining Amount</p>
                <p className="text-base font-medium font-bold">{formatCurrency(remainingAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Record Clearing</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      <FormLabel>Status</FormLabel>
                      <Select
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

                <FormField
                  control={form.control}
                  name="clearing_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                      <FormLabel>Reference Document</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter reference document"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter remarks"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/dashboard/giro')}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Record Clearing
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Clearing History */}
      <Card>
        <CardHeader>
          <CardTitle>Clearing History</CardTitle>
        </CardHeader>
        <CardContent>
          {clearingRecords.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clearingRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.clearing_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{formatCurrency(record.clearing_amount)}</TableCell>
                      <TableCell>{getStatusBadge(record.clearing_status)}</TableCell>
                      <TableCell>{record.reference_doc || '-'}</TableCell>
                      <TableCell>{record.remarks || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No clearing records found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}