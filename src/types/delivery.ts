export interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_phone: string;
  salesman_id: string;
  total_amount: number;
  status: string; // "Belum dikirim" | "Sedang" | "Terkirim"
  delivery_date: string | null;
  invoice_date: string | null;
  driver_name: string | null;
  vehicle_number: string | null;
  created_at: string;
  salesman?: {
    id: string;
    name: string;
    user_id: string;
  };
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_code: string;
  item_name: string;
  quantity: number;
  uom: string;
}

export interface DeliveryLog {
  id: string;
  invoice_id: string;
  action_type: string; // "send_notification" | "update_status" | "batch_update"
  status: string; // "success" | "failed"
  message: string;
  created_at: string;
  delivery_date?: string | null;
  invoice_date?: string | null;
  noken?: string | null;
  supir?: string | null;
}