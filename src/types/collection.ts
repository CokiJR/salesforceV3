import { Customer, Transaction } from ".";

export interface Collection {
  id: string;
  customer_id: string; // Format CXXXXXXX dari customers.customer_id
  customer_uuid?: string; // UUID dari customers.id
  customer?: Customer;
  invoice_number: string;
  customer_name: string;
  amount: number;
  due_date: string;
  payment_date?: string;
  status: "Paid" | "Unpaid" | "Pending";
  notes?: string;
  created_at: string;
  updated_at: string;
  bank_account?: string;
  transaction_id?: string;
  transaction?: Transaction;
  sync_status?: string;
  invoice_date: string;
  payment_method?: string;
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
  status?: "Paid" | "Unpaid";
  notes?: string;
  bank_account?: string;
  invoice_date: string;
  customer_id?: string; // Format CXXXXXXX dari customers.customer_id
  customer_uuid?: string; // UUID dari customers.id
  // due_date removed as it will be calculated automatically based on customer's payment_term
}

export interface Payment {
  id: string;
  collection_id: string;
  customer_id: string; // Format CXXXXXXX dari customers.customer_id
  customer_uuid?: string; // UUID dari customers.id
  customers_uuid?: string; // Field lama, untuk kompatibilitas dengan kode yang sudah ada
  bank_account_id: string;
  account_number?: string;
  amount: number;
  payment_date: string;
  status: "Pending" | "Completed" | "Failed";
  created_at: string;
  updated_at: string;
  collection?: Collection;
  customer?: Customer;
  bank_account_details?: BankAccount;
  payment_method?: string;
  giro_number?: string;
}
