
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Check, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { usePayments } from './hooks/usePayments';

export default function Payments() {
  const navigate = useNavigate();
  const { payments, isLoading, updatePaymentStatus } = usePayments();
  const [statusFilter, setStatusFilter] = useState('all');
  
  const handleAddPayment = () => {
    navigate('/dashboard/payments/add');
  };
  
  const handleConfirmPayment = async (paymentId: string) => {
    try {
      await updatePaymentStatus(paymentId, 'Completed');
      toast({
        title: "Payment confirmed",
        description: "The payment has been confirmed successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to confirm payment: ${error.message}`,
      });
    }
  };
  
  const filteredPayments = payments.filter(payment => {
    if (statusFilter === 'all') return true;
    return payment.status === statusFilter;
  });
  
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'Failed':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payments</h2>
          <p className="text-muted-foreground">
            Track and manage collection payments
          </p>
        </div>
        <Button onClick={handleAddPayment}>
          <Plus className="mr-2 h-4 w-4" />
          Add Payment
        </Button>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Payment Records</CardTitle>
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
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPayments.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Bank Account</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.collection?.invoice_number || 'N/A'}
                      </TableCell>
                      <TableCell>{payment.collection?.customer_name || 'N/A'}</TableCell>
                      <TableCell>{payment.bank_account}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format(payment.amount)}
                      </TableCell>
                      <TableCell>{format(new Date(payment.payment_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeStyle(payment.status)}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {payment.status === 'Pending' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleConfirmPayment(payment.id)}
                          >
                            <Check className="mr-1 h-3 w-3" />
                            Confirm
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No payments found. Add a new payment or adjust filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
