import { supabase } from '@/integrations/supabase/client';
import { Collection, CollectionImportFormat } from '@/types/collection';
import { Customer } from '@/types';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export class CollectionService {
  static async getCollections(): Promise<Collection[]> {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          customer:customers(*)
        `)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      
      // Transform data to match Collection type by handling the customer property correctly
      const transformedData = (data || []).map(item => {
        return {
          ...item,
          // If customer array exists and has at least one element, use the first element as the customer object
          // Otherwise set customer as undefined
          customer: Array.isArray(item.customer) && item.customer.length > 0 ? {
            ...item.customer[0],
            location: item.customer[0].location ? {
              lat: Number((item.customer[0].location as any).lat || 0),
              lng: Number((item.customer[0].location as any).lng || 0)
            } : undefined,
            status: item.customer[0].status as "active" | "inactive"
          } : undefined
        };
      });
      
      return transformedData as Collection[];
    } catch (error) {
      console.error('Error fetching collections:', error);
      throw error;
    }
  }

  static async getCustomersWithDuePayments(): Promise<Customer[]> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      // Map to ensure proper types
      return (data || []).map(customer => ({
        ...customer,
        location: customer.location ? {
          lat: Number((customer.location as any).lat || 0),
          lng: Number((customer.location as any).lng || 0)
        } : undefined,
        status: (customer.status === 'active' || customer.status === 'inactive') 
          ? customer.status 
          : 'inactive' // Default value if status is invalid
      })) as Customer[];
    } catch (error) {
      console.error('Error fetching customers with due payments:', error);
      throw error;
    }
  }

  static async getPaymentTotalByCollectionId(collectionId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('amount')
        .eq('collection_id', collectionId)
        .eq('status', 'Completed');
      
      if (error) throw error;
      
      return (data || []).reduce((sum, payment) => sum + (payment.amount || 0), 0);
    } catch (error) {
      console.error('Error fetching payment total:', error);
      return 0;
    }
  }

  static async createCollection(collection: Omit<Collection, 'id' | 'created_at' | 'updated_at'>): Promise<Collection> {
    try {
      const { data, error } = await supabase
        .from('collections')
        .insert(collection)
        .select('*')
        .single();
      
      if (error) throw error;
      
      return data as Collection;
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
  }

  static async updateCollection(id: string, updates: Partial<Collection>): Promise<Collection> {
    try {
      const { data, error } = await supabase
        .from('collections')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) throw error;
      
      return data as Collection;
    } catch (error) {
      console.error('Error updating collection:', error);
      throw error;
    }
  }

  static async deleteCollection(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting collection:', error);
      throw error;
    }
  }

  static async markAsPaid(id: string, transactionId?: string): Promise<Collection> {
    try {
      const updates: Partial<Collection> = {
        status: 'Paid',
        payment_date: new Date().toISOString()
      };
      
      if (transactionId) {
        updates.transaction_id = transactionId;
      }
      
      const { data, error } = await supabase
        .from('collections')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) throw error;
      
      return data as Collection;
    } catch (error) {
      console.error('Error marking collection as paid:', error);
      throw error;
    }
  }

  static async importFromExcel(file: File): Promise<Collection[]> {
    try {
      const data = await this.parseExcelFile(file);
      
      if (!data || data.length === 0) {
        throw new Error('No data found in the Excel file');
      }
      
      // Format the data for insertion
      const collectionsToInsert = data.map(row => {
        return {
          invoice_number: row.invoice_number || `INV-${Date.now()}`,
          customer_name: row.customer_name,
          customer_id: row.customer_id || '00000000-0000-0000-0000-000000000000',
          amount: typeof row.amount === 'string' ? parseFloat(row.amount) : row.amount,
          due_date: new Date(row.due_date).toISOString(),
          status: row.status || 'Unpaid',
          notes: row.notes,
          bank_account: row.bank_account,
          invoice_date: row.invoice_date ? new Date(row.invoice_date).toISOString() : new Date().toISOString()
        };
      });
      
      // Insert the collections
      const { data: insertedData, error } = await supabase
        .from('collections')
        .insert(collectionsToInsert)
        .select('*');
      
      if (error) throw error;
      
      return insertedData as Collection[];
    } catch (error) {
      console.error('Error importing from Excel:', error);
      throw error;
    }
  }

  static exportToExcel(collections: Collection[]): Blob {
    try {
      const formattedData = collections.map(c => ({
        'Invoice Number': c.invoice_number,
        'Customer Name': c.customer_name,
        'Due Date': format(new Date(c.due_date), 'yyyy-MM-dd'),
        'Amount': c.amount,
        'Status': c.status,
        'Created At': format(new Date(c.created_at), 'yyyy-MM-dd')
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Collections');
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });
      
      function s2ab(s: string) {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < s.length; i++) {
          view[i] = s.charCodeAt(i) & 0xFF;
        }
        return buf;
      }
      
      const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `collections-${today}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return blob;
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw error;
    }
  }

  static generateImportTemplate(): Blob {
    try {
      const sampleData = [
        {
          'Invoice Number': 'INV-001',
          'Customer Name': 'ACME Corporation',
          'Amount': 1000,
          'Due Date': '2023-12-31',
          'Status': 'Unpaid',
          'Notes': 'Sample note',
          'Bank Account': '123-456-789',
          'Invoice Date': '2023-12-01'
        }
      ];
      
      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
      
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });
      
      function s2ab(s: string) {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < s.length; i++) {
          view[i] = s.charCodeAt(i) & 0xFF;
        }
        return buf;
      }
      
      return new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
    } catch (error) {
      console.error('Error generating import template:', error);
      throw error;
    }
  }

  private static async parseExcelFile(file: File): Promise<CollectionImportFormat[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];
          
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];
          
          // Map the data to our CollectionImportFormat
          const mappedData = jsonData.map(row => {
            // Handle different possible column names
            const invoiceNumber = row['Invoice Number'] || row.invoice_number || row.InvoiceNumber || '';
            const customerName = row['Customer Name'] || row.customer_name || row.CustomerName || '';
            const amount = Number(row.Amount || row.amount || 0);
            
            let dueDate = '';
            try {
              const rawDueDate = row['Due Date'] || row.due_date || row.DueDate;
              if (rawDueDate) {
                // Try to parse as date 
                dueDate = new Date(rawDueDate).toISOString();
              }
            } catch (e) {
              console.error('Date parsing error:', e);
            }
            
            return {
              invoice_number: invoiceNumber,
              customer_name: customerName,
              amount: amount,
              due_date: dueDate,
              status: (row.Status || row.status || 'Unpaid') === 'Paid' ? 'Paid' : 'Unpaid',
              notes: row.Notes || row.notes || '',
              bank_account: row['Bank Account'] || row.bank_account || '',
              invoice_date: row['Invoice Date'] || row.invoice_date || ''
            } as CollectionImportFormat;
          });
          
          resolve(mappedData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }
}
