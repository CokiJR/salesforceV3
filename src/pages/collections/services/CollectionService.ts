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

  static async markAsPaid(id: string, transactionId?: string, paymentMethod?: string): Promise<Collection> {
    try {
      const updates: Partial<Collection> = {
        status: 'Paid',
        payment_date: new Date().toISOString()
      };
      
      if (transactionId) {
        updates.transaction_id = transactionId;
      }

      if (paymentMethod) {
        updates.payment_method = paymentMethod;
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

  static async markAsPending(id: string): Promise<Collection> {
    try {
      const updates: Partial<Collection> = {
        status: 'Pending'
      };
      
      const { data, error } = await supabase
        .from('collections')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) throw error;
      
      return data as Collection;
    } catch (error) {
      console.error('Error marking collection as pending:', error);
      throw error;
    }
  }

  static async importFromExcel(file: File): Promise<Collection[]> {
    try {
      const data = await this.parseExcelFile(file);
      
      if (!data || data.length === 0) {
        throw new Error('Tidak ada data ditemukan dalam file Excel');
      }
      
      // Validasi kolom yang diperlukan
      const requiredColumns = ['invoice_number', 'customer_name', 'amount'];
      const missingColumns = [];
      
      // Periksa apakah data memiliki semua kolom yang diperlukan
      if (data.length > 0) {
        const firstRow = data[0];
        for (const col of requiredColumns) {
          if (firstRow[col as keyof typeof firstRow] === undefined) {
            missingColumns.push(col);
          }
        }
      }
      
      if (missingColumns.length > 0) {
        throw new Error(`File yang diimpor tidak memiliki kolom yang diperlukan: ${missingColumns.join(', ')}`);
      }
      
      // Format the data for insertion with only required fields
      const collectionsToInsert = [];
      
      // Process each row and calculate due_date based on customer's payment_term
      for (const row of data) {
        // Get customer data to retrieve payment_term
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('payment_term')
          .eq('id', row.customer_id)
          .single();
        
        if (customerError) {
          console.warn(`Customer not found for ID: ${row.customer_id}. Using default payment term.`);
        }
        
        // Parse invoice date
        const invoiceDate = row.invoice_date ? new Date(row.invoice_date) : new Date();
        
        // Calculate due date based on payment term
        let dueDate = new Date(invoiceDate);
        const paymentTerm = customerData?.payment_term ? parseInt(customerData.payment_term, 10) : 30; // Default to 30 days if no payment term
        dueDate.setDate(dueDate.getDate() + paymentTerm);
        
        collectionsToInsert.push({
          invoice_date: invoiceDate.toISOString(),
          invoice_number: row.invoice_number || `INV-${Date.now()}`,
          customer_id: row.customer_id || '00000000-0000-0000-0000-000000000000',
          customer_name: row.customer_name,
          amount: typeof row.amount === 'string' ? parseFloat(row.amount) : row.amount,
          due_date: dueDate.toISOString(),
          status: 'Unpaid'
        });
      }
      
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
        'invoice_number': c.invoice_number,
        'customer_name': c.customer_name,
        'due_date': format(new Date(c.due_date), 'yyyy-MM-dd'),
        'amount': c.amount,
        'status': c.status,
        'created_at': format(new Date(c.created_at), 'yyyy-MM-dd')
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
          'invoice_number': 'INV-001', // Kolom wajib
          'customer_name': 'ACME Corporation', // Kolom wajib
          'amount': 1000, // Kolom wajib
          'invoice_date': '2023-12-01', // Opsional
          'customer_id': '00000000-0000-0000-0000-000000000000', // Opsional
          'status': 'Unpaid', // Opsional
          'notes': 'Catatan tambahan', // Opsional
          'bank_account': 'BCA' // Opsional
          // due_date dihitung otomatis berdasarkan payment_term pelanggan
        }
      ];
      
      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
      
      // Tambahkan catatan tentang kolom wajib dan perhitungan due_date
      const notes = [
        'CATATAN PENTING:',
        '1. Kolom wajib: invoice_number, customer_name, amount',
        '2. due_date akan dihitung otomatis berdasarkan payment_term pelanggan',
        '3. Jika customer_id tidak diisi, sistem akan mencoba mencocokkan berdasarkan customer_name'
      ];
      
      for (let i = 0; i < notes.length; i++) {
        XLSX.utils.sheet_add_aoa(worksheet, [[notes[i]]], { origin: `A${i+3}` });
      }
      
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
          
          if (jsonData.length === 0) {
            reject(new Error('File tidak memiliki data'));
            return;
          }
          
          // Validasi kolom yang diperlukan
          const firstRow = jsonData[0];
          const requiredColumns = ['invoice_number', 'customer_name', 'amount'];
          const alternativeColumns = {
            'invoice_number': ['Invoice Number', 'InvoiceNumber'],
            'customer_name': ['Customer Name', 'CustomerName'],
            'amount': ['Amount']
          };
          
          const missingColumns = [];
          
          for (const col of requiredColumns) {
            const alternatives = alternativeColumns[col as keyof typeof alternativeColumns] || [];
            const hasColumn = col in firstRow || alternatives.some(alt => alt in firstRow);
            
            if (!hasColumn) {
              missingColumns.push(col);
            }
          }
          
          if (missingColumns.length > 0) {
            reject(new Error(`File yang diimpor tidak memiliki kolom yang diperlukan: ${missingColumns.join(', ')}`));
            return;
          }
          
          // Map the data to our CollectionImportFormat with only required fields
          const mappedData = jsonData.map(row => {
            // Handle different possible column names
            // Prioritize snake_case format first to match the template
            const invoiceDate = row.invoice_date || row['Invoice Date'] || row.InvoiceDate || new Date().toISOString();
            const invoiceNumber = row.invoice_number || row['Invoice Number'] || row.InvoiceNumber || '';
            const customerId = row.customer_id || row['Customer ID'] || row.CustomerId || '00000000-0000-0000-0000-000000000000';
            const customerName = row.customer_name || row['Customer Name'] || row.CustomerName || '';
            const amount = Number(row.amount || row.Amount || 0);
            
            return {
              invoice_date: invoiceDate,
              invoice_number: invoiceNumber,
              customer_id: customerId,
              customer_name: customerName,
              amount: amount,
              status: 'Unpaid'
            } as CollectionImportFormat;
          });
          
          resolve(mappedData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Gagal membaca file'));
      reader.readAsArrayBuffer(file);
    });
  }
}
