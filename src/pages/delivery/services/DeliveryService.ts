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

  static async getInvoicesByFilter(filter: {
    status?: string;
    salesman_id?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<Invoice[]> {
    try {
      let query = supabase
        .from("invoices")
        .select(`
          *,
          salesman:salesmen(*)
        `);

      // Apply filters
      if (filter.status) {
        query = query.eq("status", filter.status);
      }

      if (filter.salesman_id) {
        query = query.eq("salesman_id", filter.salesman_id);
      }

      if (filter.date_from) {
        query = query.gte("created_at", filter.date_from);
      }

      if (filter.date_to) {
        query = query.lte("created_at", filter.date_to);
      }

      // Order by created_at
      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;
      
      if (error) throw error;
      
      return data as Invoice[];
    } catch (error) {
      console.error("Error fetching invoices with filter:", error);
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

  static async updateInvoiceStatus(id: string, status: string, deliveryInfo?: {
    driver_name?: string;
    vehicle_number?: string;
    delivery_date?: string;
  }): Promise<void> {
    try {
      // Update invoice status
      const updateData: any = { status };
      
      // Add delivery date if status is "Terkirim" or if provided
      if (status === "Terkirim") {
        updateData.delivery_date = new Date().toISOString();
      } else if (deliveryInfo?.delivery_date) {
        updateData.delivery_date = new Date(deliveryInfo.delivery_date).toISOString();
      }
      
      // Add driver and vehicle info if provided
      if (deliveryInfo?.driver_name) {
        updateData.driver_name = deliveryInfo.driver_name;
      }
      
      if (deliveryInfo?.vehicle_number) {
        updateData.vehicle_number = deliveryInfo.vehicle_number;
      }
      
      const { error } = await supabase
        .from("invoices")
        .update(updateData)
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
  
  static async batchUpdateDeliveryStatus(invoiceIds: string[], deliveryInfo: {
    status: string;
    driver_name: string;
    vehicle_number: string;
    delivery_date: string;
  }): Promise<void> {
    try {
      // Prepare update data
      const updateData = {
        status: deliveryInfo.status,
        driver_name: deliveryInfo.driver_name,
        vehicle_number: deliveryInfo.vehicle_number,
        delivery_date: new Date(deliveryInfo.delivery_date).toISOString()
      };
      
      // Update all selected invoices
      const { error } = await supabase
        .from("invoices")
        .update(updateData)
        .in("id", invoiceIds);
      
      if (error) throw error;
      
      // Log the batch update
      for (const invoiceId of invoiceIds) {
        await this.createDeliveryLog({
          invoice_id: invoiceId,
          action_type: "batch_update",
          status: "success",
          message: `Pengiriman massal diperbarui: ${deliveryInfo.status}`
        });
      }
    } catch (error) {
      console.error("Error batch updating delivery status:", error);
      
      // Log the error for each invoice
      for (const invoiceId of invoiceIds) {
        await this.createDeliveryLog({
          invoice_id: invoiceId,
          action_type: "batch_update",
          status: "failed",
          message: `Gagal memperbarui pengiriman massal: ${error}`
        });
      }
      
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