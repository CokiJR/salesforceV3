import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Check, AlertCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { usePayments } from './hooks/usePayments';
import { supabase } from '@/integrations/supabase/client';
import { Payment } from '@/types/collection';

// Interface untuk data Giro
interface Giro {
  id: string;
  payment_id: string;
  giro_number: string;
  bank_name: string;
  account_number: string;
  amount: number;
  due_date: string;
  status: 'Pending' | 'Cleared' | 'Rejected';
  created_at: string;
  updated_at: string;
  payment?: Payment;
}

// Interface untuk data GiroClearing
interface GiroClearing {
  id: string;
  giro_id: string;
  clearing_date: string;
  status: 'Cleared' | 'Rejected';
  notes?: string;
  created_at: string;
  updated_at: string;
  giro?: Giro;
}

export default function GiroPage() {
  const navigate = useNavigate();
  const { payments, isLoading, updatePaymentStatus } = usePayments();
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('giro');
  const [giros, setGiros] = useState<Giro[]>([]);
  const [giroClearing, setGiroClearing] = useState<GiroClearing[]>([]);
  const [isLoadingGiro, setIsLoadingGiro] = useState(true);
  
  // Fetch giro payments
  useEffect(() => {
    const fetchGiroPayments = async () => {
      try {
        setIsLoadingGiro(true);
        
        // Fetch payments with giro payment method
        const { data: giroPayments, error } = await supabase
          .from('payments')
          .select(`
            *,
            collection:collections(*),
            customer:customers(*),
            bank_account_details:bank_accounts(*)
          `)
          .eq('payment_method', 'Giro')
          .order('payment_date', { ascending: false });

        if (error) throw error;

        // Transform payments to giro format
        const transformedGiros: Giro[] = giroPayments.map(payment => ({
          id: payment.id, // Using payment id as giro id for now
          payment_id: payment.id,
          giro_number: payment.giro_number || '',
          bank_name: payment.bank_account_details?.bank_name || '',
          account_number: payment.bank_account_details?.account_number || '',
          amount: payment.amount,
          due_date: payment.payment_date, // Using payment date as due date for now
          status: payment.status === 'Completed' ? 'Cleared' : 'Pending',
          created_at: payment.created_at,
          updated_at: payment.updated_at,
          payment: payment as unknown as Payment
        }));

        setGiros(transformedGiros);

        // For now, we'll create mock clearing data based on cleared giros
        const mockClearing: GiroClearing[] = transformedGiros
          .filter(giro => giro.status === 'Cleared')
          .map(giro => ({
            id: `clearing-${giro.id}`,
            giro_id: giro.id,
            clearing_date: giro.updated_at,
            status: 'Cleared',
            notes: 'Giro telah dicairkan',
            created_at: giro.updated_at,
            updated_at: giro.updated_at,
            giro: giro
          }));

        setGiroClearing(mockClearing);
      } catch (error: any) {
        console.error('Error fetching giro payments:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to load giro data: ${error.message}`,
        });
      } finally {
        setIsLoadingGiro(false);
      }
    };

    fetchGiroPayments();
  }, []);
  
  const handleClearGiro = async (giroId: string) => {
    try {
      // Find the giro payment
      const giro = giros.find(g => g.id === giroId);
      if (!giro) throw new Error('Giro not found');
      
      // Update the payment status to Completed
      await updatePaymentStatus(giro.payment_id, 'Completed');
      
      // Update local state
      setGiros(prev => prev.map(g => 
        g.id === giroId ? {...g, status: 'Cleared'} : g
      ));
      
      // Add to clearing list
      const newClearing: GiroClearing = {
        id: `clearing-${giroId}`,
        giro_id: giroId,
        clearing_date: new Date().toISOString(),
        status: 'Cleared',
        notes: 'Giro telah dicairkan',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        giro: giros.find(g => g.id === giroId)
      };
      
      setGiroClearing(prev => [newClearing, ...prev]);
      
      toast({
        title: "Giro cleared",
        description: "The giro has been cleared successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to clear giro: ${error.message}`,
      });
    }
  };
  
  const handleRejectGiro = async (giroId: string) => {
    try {
      // Find the giro payment
      const giro = giros.find(g => g.id === giroId);
      if (!giro) throw new Error('Giro not found');
      
      // Update the payment status to Failed
      await updatePaymentStatus(giro.payment_id, 'Failed');
      
      // Update local state
      setGiros(prev => prev.map(g => 
        g.id === giroId ? {...g, status: 'Rejected'} : g
      ));
      
      // Add to clearing list
      const newClearing: GiroClearing = {
        id: `clearing-${giroId}`,
        giro_id: giroId,
        clearing_date: new Date().toISOString(),
        status: 'Rejected',
        notes: 'Giro ditolak',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        giro: giros.find(g => g.id === giroId)
      };
      
      setGiroClearing(prev => [newClearing, ...prev]);
      
      toast({
        title: "Giro rejected",
        description: "The giro has been marked as rejected",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to reject giro: ${error.message}`,
      });
    }
  };
  
  const filteredGiros = giros.filter(giro => {
    if (statusFilter === 'all') return true;
    return giro.status === statusFilter;
  });
  
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Cleared':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Giro Management</h2>
          <p className="text-muted-foreground">
            Track and manage giro payments and clearing process
          </p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="giro">Giro List</TabsTrigger>
          <TabsTrigger value="clearing">Clearing History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="giro" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Giro Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 mb-4">
                <div className="w-64">
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Cleared">Cleared</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {isLoadingGiro ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredGiros.length > 0 ? (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Giro Number</TableHead>
                        <TableHead>Invoice Number</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Bank</TableHead>
                        <TableHead>Account Number</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredGiros.map((giro) => (
                        <TableRow key={giro.id}>
                          <TableCell className="font-medium">
                            {giro.giro_number}
                          </TableCell>
                          <TableCell>
                            {giro.payment?.collection?.invoice_number || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {giro.payment?.collection?.customer_name || 'N/A'}
                          </TableCell>
                          <TableCell>{giro.bank_name}</TableCell>
                          <TableCell>{giro.account_number}</TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: 'IDR'
                            }).format(giro.amount)}
                          </TableCell>
                          <TableCell>
                            {format(new Date(giro.due_date), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeStyle(giro.status)}>
                              {giro.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {giro.status === 'Pending' && (
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                                  onClick={() => handleClearGiro(giro.id)}
                                >
                                  <Check className="mr-1 h-3 w-3" />
                                  Clear
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                                  onClick={() => handleRejectGiro(giro.id)}
                                >
                                  <AlertCircle className="mr-1 h-3 w-3" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No giro records found. Add a payment with giro method.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="clearing" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Clearing History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingGiro ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : giroClearing.length > 0 ? (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Giro Number</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Clearing Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {giroClearing.map((clearing) => (
                        <TableRow key={clearing.id}>
                          <TableCell className="font-medium">
                            {clearing.giro?.giro_number || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {clearing.giro?.payment?.collection?.customer_name || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: 'IDR'
                            }).format(clearing.giro?.amount || 0)}
                          </TableCell>
                          <TableCell>
                            {format(new Date(clearing.clearing_date), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeStyle(clearing.status)}>
                              {clearing.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{clearing.notes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No clearing history found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}