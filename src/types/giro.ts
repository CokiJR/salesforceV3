import { Customer } from "."

export interface Giro {
  id: string;
  customer_id: string;
  customer?: Customer;
  giro_number: string;
  bank_name: string;
  bank_account?: string;
  amount: number;
  due_date: string;
  received_date: string;
  status: "pending" | "partial" | "cleared" | "bounced";
  remarks?: string;
  created_at: string;
  updated_at: string;
  sales_person_id?: string;
  created_by?: string;
  invoice_number?: string;
}

export interface GiroClearing {
  id: string;
  giro_id: string;
  giro?: Giro;
  clearing_date: string;
  clearing_status: "cleared" | "bounced";
  clearing_amount: number;
  reference_doc?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  giro_number?: string;
  bank_name?: string;
  bank_account?: string;
  invoice_number?: string;
}

export interface GiroFilters {
  status?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  customerId?: string;
}