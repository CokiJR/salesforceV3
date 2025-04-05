
import { Transaction } from "@/types";

export const filterTransactions = (
  transactions: Transaction[],
  searchQuery: string,
  statusFilter: string,
  syncFilter: string
): Transaction[] => {
  return transactions.filter(transaction => {
    // Apply search filter
    const searchMatch = 
      transaction.transaction_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.payment_method.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply status filter
    const statusMatch = statusFilter === "all" || transaction.status === statusFilter;
    
    // Apply sync filter
    const syncMatch = syncFilter === "all" || transaction.sync_status === syncFilter;
    
    return searchMatch && statusMatch && syncMatch;
  });
};
