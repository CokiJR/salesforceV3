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
      // Get invoice data first
      const { data: invoice, error: fetchError } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", id)
        .single();
      
      if (fetchError) throw fetchError;
      
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
      
      // Update invoice_items with delivery and invoice dates
      const { error: itemsError } = await supabase
        .from("invoice_items")
        .update({
          delivery_date: updateData.delivery_date || invoice.delivery_date,
          invoice_date: invoice.invoice_date
        })
        .eq("invoice_id", id);
      
      if (itemsError) throw itemsError;
      
      // Log the status update with additional info
      await this.createDeliveryLog({
        invoice_id: id,
        action_type: "update_status",
        status: "success",
        message: `Status diperbarui ke ${status}`,
        delivery_date: updateData.delivery_date || invoice.delivery_date,
        invoice_date: invoice.invoice_date,
        noken: deliveryInfo?.vehicle_number || invoice.vehicle_number,
        supir: deliveryInfo?.driver_name || invoice.driver_name
      });
    } catch (error) {
      console.error("Error updating invoice status:", error);
      
      // Log the error with complete information
      await this.createDeliveryLog({
        invoice_id: id,
        action_type: "update_status",
        status: "failed",
        message: `Gagal memperbarui status: ${error}`,
        delivery_date: invoice?.delivery_date || null,
        invoice_date: invoice?.invoice_date || null,
        noken: invoice?.vehicle_number || null,
        supir: invoice?.driver_name || null
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
      
      // Update invoice_items for all selected invoices
      for (const invoiceId of invoiceIds) {
        // Get invoice data first to get invoice_date
        const { data: invoice, error: fetchError } = await supabase
          .from("invoices")
          .select("*")
          .eq("id", invoiceId)
          .single();
        
        if (fetchError) {
          console.error(`Error fetching invoice ${invoiceId}:`, fetchError);
          continue; // Skip to next invoice if this one fails
        }
        
        // Update invoice_items with delivery and invoice dates
        const { error: itemsError } = await supabase
          .from("invoice_items")
          .update({
            delivery_date: updateData.delivery_date,
            invoice_date: invoice.invoice_date
          })
          .eq("invoice_id", invoiceId);
        
        if (itemsError) {
          console.error(`Error updating invoice_items for ${invoiceId}:`, itemsError);
        }
        
        // Log the batch update with complete information
        await this.createDeliveryLog({
          invoice_id: invoiceId,
          action_type: "batch_update",
          status: "success",
          message: `Pengiriman massal diperbarui: ${deliveryInfo.status}`,
          delivery_date: updateData.delivery_date,
          invoice_date: invoice.invoice_date,
          noken: deliveryInfo.vehicle_number,
          supir: deliveryInfo.driver_name
        });
      }
    } catch (error) {
      console.error("Error batch updating delivery status:", error);
      
      // Log the error for each invoice with complete information
      for (const invoiceId of invoiceIds) {
        await this.createDeliveryLog({
          invoice_id: invoiceId,
          action_type: "batch_update",
          status: "failed",
          message: `Gagal memperbarui pengiriman massal: ${error}`,
          delivery_date: deliveryInfo.delivery_date || null,
          invoice_date: null, // We don't have invoice_date in error case
          noken: deliveryInfo.vehicle_number || null,
          supir: deliveryInfo.driver_name || null
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