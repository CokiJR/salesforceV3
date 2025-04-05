
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Collection } from '@/types/collection';
import { CollectionService } from './services/CollectionService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Customer } from '@/types';

export default function AddCollection() {
  const navigate = useNavigate();
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  
  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);
  
  const fetchCustomers = async () => {
    try {
      setIsLoadingCustomers(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });
        
      if (error) throw error;
      
      // Map the data to ensure it matches the Customer type
      const mappedCustomers: Customer[] = (data || []).map(customer => ({
        id: customer.id,
        name: customer.name,
        address: customer.address,
        city: customer.city,
        phone: customer.phone,
        email: customer.email || '',
        contact_person: customer.contact_person,
        status: (customer.status === 'active' || customer.status === 'inactive') 
          ? customer.status 
          : 'inactive', // Default to 'inactive' if not a valid status
        cycle: customer.cycle || 'YYYY',
        created_at: customer.created_at,
        bank_account: customer.bank_account || undefined,
        payment_term: customer.payment_term || undefined,
        payment_term_description: customer.payment_term_description || undefined,
        location: customer.location ? {
          lat: Number((customer.location as any).lat || 0),
          lng: Number((customer.location as any).lng || 0)
        } : undefined
      }));
      
      setCustomers(mappedCustomers);
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load customers: ${error.message}`,
      });
    } finally {
      setIsLoadingCustomers(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invoiceNumber || !selectedCustomerId || !amount || !dueDate) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in all required fields",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Find selected customer to get customer_name
      const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
      
      if (!selectedCustomer) {
        throw new Error("Selected customer not found");
      }
      
      const newCollection = {
        invoice_number: invoiceNumber,
        customer_name: selectedCustomer.name,
        customer_id: selectedCustomerId,
        amount: parseFloat(amount),
        due_date: dueDate.toISOString(),
        status: 'Unpaid' as const,
      };
      
      try {
        // First check for duplicate invoice number
        const { data: existingCollection, error: checkError } = await supabase
          .from('collections')
          .select('id')
          .eq('invoice_number', invoiceNumber)
          .maybeSingle();
          
        if (checkError) {
          console.error('Error checking for duplicate invoice:', checkError);
          throw checkError;
        }
          
        if (existingCollection) {
          toast({
            variant: "destructive",
            title: "Duplicate invoice",
            description: "An invoice with this number already exists",
          });
          setIsSubmitting(false);
          return;
        }
        
        // Create the collection using the service
        await CollectionService.createCollection(newCollection);
        
        toast({
          title: "Collection added",
          description: "The collection has been successfully added",
        });
        
        navigate('/dashboard/collections');
      } catch (error: any) {
        console.error('Error in collection service:', error);
        throw error;
      }
      
    } catch (error: any) {
      console.error('Error adding collection:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to add collection: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Add Collection</h2>
        <p className="text-muted-foreground">
          Add a new invoice for collection
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Collection Details</CardTitle>
          <CardDescription>
            Enter the details for the new collection
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invoice-number">Invoice Number *</Label>
                <Input
                  id="invoice-number"
                  placeholder="Enter invoice number"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer">Customer *</Label>
                {isLoadingCustomers ? (
                  <div className="flex items-center space-x-2 h-10 px-3 border rounded-md bg-muted">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">Loading customers...</span>
                  </div>
                ) : (
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left ${!dueDate ? 'text-muted-foreground' : ''}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => navigate('/dashboard/collections')}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Collection'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
