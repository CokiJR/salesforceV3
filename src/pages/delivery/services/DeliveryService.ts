import { supabase } from "@/integrations/supabase/client";
import { Invoice, InvoiceItem, DeliveryLog } from "@/types/delivery";

export class DeliveryService {
  static async getInvoices(): Promise<Invoice[]> {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          salesman:salesmen(*)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      return data as Invoice[];
    } catch (error) {
      console.error("Error fetching invoices:", error);
      throw error;
    }
  }

  static async getInvoiceById(id: string): Promise<Invoice> {
    try {
      // Fetch invoice with salesman details
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          salesman:salesmen(*)
        `)
        .eq("id", id)
        .single();
      
      if (error) throw error;
      
      // Fetch invoice items
      const { data: itemsData, error: itemsError } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", id);
      
      if (itemsError) throw itemsError;
      
      // Combine data
      const invoice = data as Invoice;
      invoice.items = itemsData as InvoiceItem[];
      
      return invoice;
    } catch (error) {
      console.error("Error fetching invoice details:", error);
      throw error;
    }
  }

  static async updateInvoiceStatus(id: string, status: string): Promise<void> {
    try {
      // Update invoice status
      const { error } = await supabase
        .from("invoices")
        .update({ 
          status,
          delivery_date: status === "Terkirim" ? new Date().toISOString() : null
        })
        .eq("id", id);
      
      if (error) throw error;
      
      // Log the status update
      await this.createDeliveryLog({
        invoice_id: id,
        action_type: "update_status",
        status: "success",
        message: `Status diperbarui ke ${status}`
      });
    } catch (error) {
      console.error("Error updating invoice status:", error);
      
      // Log the error
      await this.createDeliveryLog({
        invoice_id: id,
        action_type: "update_status",
        status: "failed",
        message: `Gagal memperbarui status: ${error}`
      });
      
      throw error;
    }
  }

  static async createDeliveryLog(log: Omit<DeliveryLog, "id" | "created_at">): Promise<void> {
    try {
      const { error } = await supabase
        .from("delivery_logs")
        .insert(log);
      
      if (error) throw error;
    } catch (error) {
      console.error("Error creating delivery log:", error);
      // We don't throw here to prevent cascading errors
    }
  }
}