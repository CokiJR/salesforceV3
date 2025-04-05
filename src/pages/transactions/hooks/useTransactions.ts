
import { useState, useEffect } from 'react';
import { Transaction } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          order:orders(id, total_amount),
          customer:customers(id, name)
        `)
        .order('transaction_date', { ascending: false });

      if (error) throw error;

      // Add customer_name when available from joined table
      const formattedTransactions = data.map((transaction: any) => ({
        ...transaction,
        customer_name: transaction.customer ? transaction.customer.name : 'Unknown Customer'
      }));

      setTransactions(formattedTransactions as Transaction[]);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert(transaction)
        .select()
        .single();

      if (error) throw error;

      setTransactions(prev => [data as Transaction, ...prev]);
      return data as Transaction;
    } catch (err: any) {
      console.error('Error creating transaction:', err);
      setError(err.message);
      throw err;
    }
  };

  return {
    transactions,
    isLoading,
    error,
    fetchTransactions,
    createTransaction
  };
}
