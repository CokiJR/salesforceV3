
import { Customer, Transaction } from '.';

export interface Collection {
  id: string;
  customer_id: string;
  customer?: Customer;
  invoice_number: string;
  customer_name: string;
  amount: number;
  due_date: string;
  payment_date?: string;
  status: 'Paid' | 'Unpaid';
  notes?: string;
  created_at: string;
  updated_at: string;
  bank_account?: string;
  transaction_id?: string;
  transaction?: Transaction;
  sync_status?: string;
  invoice_date?: string;
}

export interface CollectionFilters {
  status?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  customerId?: string;
}

export interface CollectionImportFormat {
  invoice_number: string;
  customer_name: string;
  amount: number | string;
  due_date: string;
  status?: 'Paid' | 'Unpaid';
  notes?: string;
  bank_account?: string;
  invoice_date?: string;
  customer_id?: string; // Added customer_id as optional for imports
}

export interface Payment {
  id: string;
  collection_id: string;
  customer_id: string;
  bank_account: string;
  amount: number;
  payment_date: string;
  status: 'Pending' | 'Completed' | 'Failed';
  created_at: string;
  updated_at: string;
  collection?: Collection;
  customer?: Customer;
}
