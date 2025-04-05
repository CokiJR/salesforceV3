
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Payment } from '@/types/collection';
import { PaymentService } from '../services/PaymentService';

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await PaymentService.getPayments();
      setPayments(data);
    } catch (err: any) {
      console.error('Error fetching payments:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePaymentStatus = async (paymentId: string, status: 'Pending' | 'Completed' | 'Failed') => {
    try {
      const updatedPayment = await PaymentService.updatePaymentStatus(paymentId, status);
      setPayments(prev => 
        prev.map(payment => payment.id === paymentId ? updatedPayment : payment)
      );
      return updatedPayment;
    } catch (err: any) {
      console.error('Error updating payment status:', err);
      throw err;
    }
  };

  const deletePayment = async (paymentId: string) => {
    try {
      await PaymentService.deletePayment(paymentId);
      setPayments(prev => prev.filter(payment => payment.id !== paymentId));
    } catch (err: any) {
      console.error('Error deleting payment:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete payment: ${err.message}`,
      });
      throw err;
    }
  };

  const addPayment = async (payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newPayment = await PaymentService.createPayment(payment);
      setPayments(prev => [newPayment, ...prev]);
      return newPayment;
    } catch (err: any) {
      console.error('Error adding payment:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to add payment: ${err.message}`,
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return {
    payments,
    isLoading,
    error,
    fetchPayments,
    updatePaymentStatus,
    deletePayment,
    addPayment
  };
}
