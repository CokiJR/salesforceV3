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
          customer:customers!collections_customer_uuid_fkey(*)
        `)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      
      // Transform data to match Collection type by handling the customer property correctly
      const transformedData = (data || []).map(item => {
        return {
          ...item,
          // If customer exists, format it correctly
          customer: item.customer ? {
            ...item.customer,
            location: item.customer.location ? {
              lat: Number((item.customer.location as any).lat || 0),
              lng: Number((item.customer.location as any).lng || 0)
            } : undefined,
            status: item.customer.status as "active" | "inactive"
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
      // Pastikan data yang dimasukkan sesuai dengan struktur tabel baru
      const collectionData = {
        customer_id: collection.customer_id,
        customer_uuid: collection.customer_uuid,
        customer_name: collection.customer_name,
        invoice_number: collection.invoice_number,
        amount: collection.amount,
        due_date: collection.due_date,
        status: collection.status || 'Pending',
        notes: collection.notes,
        invoice_date: collection.invoice_date,
        bank_account: collection.bank_account,
        payment_method: collection.payment_method
      };
      
      const { data, error } = await supabase
        .from('collections')
        .insert(collectionData)
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
      // Tambahkan log untuk membantu debugging
      console.log('Mulai proses import dari Excel:', file.name, 'ukuran:', file.size);
      
      // Parse file Excel
      let data;
      try {
        data = await this.parseExcelFile(file);
      } catch (parseError: any) {
        console.error('Error saat parsing file Excel:', parseError);
        // Tampilkan pesan error yang lebih informatif
        throw new Error(`Gagal memproses file Excel: ${parseError.message}`);
      }
      
      if (!data || data.length === 0) {
        throw new Error('Tidak ada data ditemukan dalam file Excel. Pastikan file memiliki data dan format yang benar.');
      }
      
      console.log(`Berhasil parse ${data.length} baris data dari Excel`);
      
      // Validasi kolom yang diperlukan sudah dilakukan di parseExcelFile
      // Kita hanya perlu memastikan data yang dihasilkan valid
      const requiredColumns = ['invoice_number', 'customer_id', 'amount', 'invoice_date'];
      const missingColumns = [];
      
      // Periksa apakah data memiliki semua kolom yang diperlukan
      if (data.length > 0) {
        const firstRow = data[0];
        for (const col of requiredColumns) {
          // Khusus untuk customer_id, tidak perlu validasi jika customer_name ada
          if (col === 'customer_id' && firstRow['customer_name'] !== undefined && firstRow['customer_name'] !== '') {
            continue;
          }
          
          if (firstRow[col as keyof typeof firstRow] === undefined || 
              firstRow[col as keyof typeof firstRow] === '') {
            missingColumns.push(col);
          }
        }
      }
      
      if (missingColumns.length > 0) {
        const errorMsg = `Invalid data\n\nFile yang diimpor tidak memiliki nilai untuk kolom yang diperlukan: ${missingColumns.join(', ')}\n\n` +
                       `Kolom wajib yang harus ada dan memiliki nilai:\n` +
                       `- invoice_number\n` +
                       `- customer_id (atau customer_name sebagai alternatif)\n` +
                       `- amount\n` +
                       `- invoice_date\n\n` +
                       `Kolom opsional:\n` +
                       `- customer_name (opsional jika customer_id ada)\n` +
                       `- due_date (opsional)\n\n` +
                       `Silakan periksa kembali file Excel Anda dan pastikan kolom-kolom tersebut memiliki nilai.`;
        
        throw new Error(errorMsg);
      }
      
      console.log('Validasi kolom berhasil, melanjutkan proses import...');
      
      // Format the data for insertion with only required fields
      const collectionsToInsert = [];
      const skippedRows = [];
      
      // Process each row and calculate due_date based on customer's payment_term
      console.log(`Memproses ${data.length} baris data untuk mencari customer...`);
      
      for (const row of data) {
        let customerUuid = '';
        let customerIdFormat = '';
        let customerData = null;
        
        console.log(`Memproses baris dengan invoice ${row.invoice_number}, customer ${row.customer_name}`);
        
        // Coba identifikasi customer dengan prioritas: customer_id > customer_uuid > customer_name
        if (row.customer_id) {
          console.log(`Mencari customer dengan customer_id: ${row.customer_id}`);
          // Cari customer berdasarkan customer_id (format CXXXXXXX)
          const { data: foundCustomer, error } = await supabase
            .from('customers')
            .select('id, customer_id, payment_term, name')
            .eq('customer_id', row.customer_id)
            .single();
          
          if (!error && foundCustomer) {
            customerData = foundCustomer;
            customerUuid = foundCustomer.id;
            customerIdFormat = foundCustomer.customer_id;
            console.log(`Customer ditemukan dengan customer_id: ${customerIdFormat}, name: ${foundCustomer.name}`);
          } else if (error) {
            console.warn(`Error saat mencari customer dengan customer_id ${row.customer_id}:`, error);
          }
        }
        
        // Jika belum ditemukan, coba cari berdasarkan UUID
        if (!customerData && row.customer_uuid) {
          console.log(`Mencari customer dengan UUID: ${row.customer_uuid}`);
          const { data: foundCustomer, error } = await supabase
            .from('customers')
            .select('id, customer_id, payment_term, name')
            .eq('id', row.customer_uuid)
            .single();
          
          if (!error && foundCustomer) {
            customerData = foundCustomer;
            customerUuid = foundCustomer.id;
            customerIdFormat = foundCustomer.customer_id;
            console.log(`Customer ditemukan dengan UUID: ${customerUuid}, name: ${foundCustomer.name}`);
          } else if (error) {
            console.warn(`Error saat mencari customer dengan UUID ${row.customer_uuid}:`, error);
          }
        }
        
        // Jika masih belum ditemukan dan ada customer_name, coba cari berdasarkan nama
        // Catatan: Ini adalah fallback terakhir, prioritas utama tetap pada customer_id
        if (!customerData && row.customer_name) {
          console.log(`Mencari customer dengan nama: ${row.customer_name}`);
          const { data: foundCustomer, error } = await supabase
            .from('customers')
            .select('id, customer_id, payment_term, name')
            .ilike('name', row.customer_name)
            .single();
          
          if (!error && foundCustomer) {
            customerData = foundCustomer;
            customerUuid = foundCustomer.id;
            customerIdFormat = foundCustomer.customer_id;
            console.log(`Customer ditemukan dengan nama: ${foundCustomer.name}, id: ${customerUuid}`);
          } else if (error) {
            // Jika error bukan NOT_FOUND, log error
            if (error.code !== 'PGRST116') { // PGRST116 adalah kode untuk 'not found'
              console.warn(`Error saat mencari customer dengan nama ${row.customer_name}:`, error);
            } else {
              console.log(`Tidak ada customer dengan nama yang cocok: ${row.customer_name}`);
              
              // Coba pencarian fuzzy dengan ILIKE yang lebih longgar
              try {
                const { data: similarCustomers } = await supabase
                  .from('customers')
                  .select('id, customer_id, name')
                  .ilike('name', `%${row.customer_name.split(' ')[0]}%`) // Cari dengan kata pertama saja
                  .limit(5);
                
                if (similarCustomers && similarCustomers.length > 0) {
                  console.log(`Ditemukan ${similarCustomers.length} customer dengan nama serupa:`, 
                    similarCustomers.map(c => c.name).join(', '));
                }
              } catch (fuzzyError) {
                console.warn('Error saat mencari customer dengan nama serupa:', fuzzyError);
              }
            }
          }
        }
        
        // Jika customer ditemukan, buat collection baru
        if (customerData) {
          // Parse invoice date (gunakan tanggal hari ini jika tidak ada)
          let invoiceDate;
          try {
            invoiceDate = row.invoice_date ? new Date(row.invoice_date) : new Date();
            // Validasi tanggal
            if (isNaN(invoiceDate.getTime())) {
              console.warn(`Tanggal invoice tidak valid: ${row.invoice_date}, menggunakan tanggal hari ini`);
              invoiceDate = new Date();
            }
          } catch (dateError) {
            console.warn(`Error saat parsing tanggal invoice: ${row.invoice_date}`, dateError);
            invoiceDate = new Date();
          }
          
          // Calculate due date based on payment term
          let dueDate;
          try {
            // Pastikan invoiceDate valid sebelum digunakan untuk menghitung due date
            const parsedInvoiceDate = new Date(invoiceDate);
            if (isNaN(parsedInvoiceDate.getTime())) {
              console.warn(`Tanggal invoice tidak valid: ${invoiceDate}, menggunakan tanggal hari ini`);
              dueDate = new Date(); // Gunakan tanggal hari ini jika invoice date tidak valid
            } else {
              dueDate = new Date(parsedInvoiceDate);
            }
            
            const paymentTerm = customerData?.payment_term ? parseInt(customerData.payment_term, 10) : 30; // Default to 30 days if no payment term
            dueDate.setDate(dueDate.getDate() + paymentTerm);
          } catch (e) {
            console.warn('Error saat menghitung due date:', e);
            dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 30); // Default 30 hari dari hari ini
          }
          
          // Konversi amount ke number jika string
          let amount = 0;
          if (typeof row.amount === 'number') {
            amount = row.amount;
          } else if (typeof row.amount === 'string') {
            // Bersihkan string dan konversi
            let amountStr = row.amount.replace(/[^0-9.,]/g, '');
            // Handle format Indonesia
            if (amountStr.includes('.') && amountStr.includes(',')) {
              amountStr = amountStr.replace(/\./g, '').replace(',', '.');
            } else if (amountStr.includes(',')) {
              amountStr = amountStr.replace(',', '.');
            }
            amount = parseFloat(amountStr) || 0;
          }
          
          // Validasi invoice_number tidak boleh kosong
          if (!row.invoice_number) {
            console.warn(`Baris dengan customer ${row.customer_name} dilewati: invoice_number kosong`);
            skippedRows.push({
              row_number: data.indexOf(row) + 1,
              customer_name: row.customer_name || 'Tidak ada nama',
              invoice_number: 'Tidak ada nomor invoice',
              reason: 'Nomor invoice kosong'
            });
            continue; // Lewati baris ini
          }
          
          // Pastikan invoice_number tetap sama persis dengan nilai yang diimpor
          const invoiceNumber = row.invoice_number;
          
          // Buat objek collection dengan data dari Excel dan database
          const newCollection = {
            invoice_date: invoiceDate,
            invoice_number: invoiceNumber, // Gunakan nilai yang sudah divalidasi
            customer_id: customerIdFormat,
            customer_uuid: customerUuid, // Tidak perlu validasi
            customer_name: customerData.name || row.customer_name,
            amount: amount,
            due_date: dueDate instanceof Date && !isNaN(dueDate.getTime()) ? dueDate.toISOString() : new Date().toISOString(),
            status: row.status || 'Unpaid',
            notes: row.notes || '',
            bank_account: row.bank_account || '',
            payment_method: row.payment_method || ''
          };
          
          console.log(`Menambahkan collection baru: ${newCollection.invoice_number} untuk ${newCollection.customer_name}`);
          collectionsToInsert.push(newCollection);
        } else {
          // Jika customer tidak ditemukan, catat baris yang dilewati
          console.warn(`Customer tidak ditemukan untuk baris dengan invoice ${row.invoice_number}, customer ${row.customer_name}`);
          skippedRows.push({
            row_number: data.indexOf(row) + 1,
            customer_name: row.customer_name || 'Tidak ada nama',
            invoice_number: row.invoice_number || 'Tidak ada nomor invoice',
            reason: 'Customer tidak ditemukan di database'
          });
        }
      }
      
      // Tampilkan informasi tentang hasil pemrosesan
      console.log(`Total baris yang akan diimpor: ${validCollections.length}`);
      console.log(`Total baris yang dilewati: ${skippedRows.length}`);
      
      // Log detail tentang invoice_number yang diimpor
      validCollections.forEach(collection => {
        console.log(`Invoice yang akan diimpor: ${collection.invoice_number} untuk ${collection.customer_name}`);
      });
      
      if (validCollections.length === 0) {
        if (skippedRows.length > 0) {
          // Format detail baris yang dilewati dengan lebih informatif
          const skippedDetails = skippedRows.map(row => 
            `Baris ${row.row_number}: ${row.invoice_number} - ${row.customer_name} (${row.reason})`
          ).join('\n');
          
          // Tambahkan saran untuk mengatasi masalah
          const errorMsg = `Tidak ada data valid yang dapat diimpor. Semua baris dilewati:\n\n${skippedDetails}\n\n` +
                         `Saran: \n` +
                         `1. Pastikan nama customer di Excel cocok dengan nama di database\n` +
                         `2. Atau gunakan customer_id yang valid (format CXXXXXXX)\n` +
                         `3. Periksa kembali format file Excel Anda`;
          
          throw new Error(errorMsg);
        } else {
          throw new Error('Tidak ada data valid yang dapat diimpor. Pastikan customer_id, customer_uuid, atau customer_name valid dan cocok dengan data di database.');
        }
      }
      
      // Validasi final untuk memastikan semua collection memiliki invoice_number
      const validCollections = collectionsToInsert.filter(collection => {
        if (!collection.invoice_number) {
          console.warn(`Collection untuk ${collection.customer_name} dilewati: invoice_number kosong`);
          skippedRows.push({
            row_number: collectionsToInsert.indexOf(collection) + 1,
            customer_name: collection.customer_name || 'Tidak ada nama',
            invoice_number: 'Tidak ada nomor invoice',
            reason: 'Nomor invoice kosong'
          });
          return false;
        }
        return true;
      });
      
      // Insert the collections
      console.log(`Menyimpan ${validCollections.length} collections ke database...`);
      try {
        const { data: insertedData, error } = await supabase
          .from('collections')
          .insert(validCollections)
          .select('*');
        
        if (error) {
          console.error('Error saat menyimpan collections ke database:', error);
          throw new Error(`Gagal menyimpan data ke database: ${error.message}. Periksa apakah ada duplikasi nomor invoice.`);
        }
        
        console.log(`Berhasil menyimpan ${insertedData?.length || 0} collections ke database`);
        
        // Jika ada baris yang dilewati, tambahkan informasi ke hasil
        const result = insertedData as Collection[];
        
        // Tampilkan peringatan jika ada baris yang dilewati
        if (skippedRows.length > 0) {
          const skippedDetails = skippedRows.map(row => 
            `Baris ${row.row_number}: ${row.invoice_number} - ${row.customer_name} (${row.reason})`
          ).join('\n');
          
          console.warn(`${skippedRows.length} baris dilewati karena customer tidak ditemukan:`, skippedRows);
          console.warn(`Detail baris yang dilewati:\n${skippedDetails}`);
        }
        
        return result;
      } catch (insertError: any) {
        console.error('Error saat menyimpan collections:', insertError);
        throw new Error(`Gagal menyimpan data: ${insertError.message}`);
      }
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
          // KOLOM WAJIB - HARUS ADA
          'invoice_number': 'INV-001', // WAJIB - Nomor invoice
          'customer_name': 'ACME Corporation', // WAJIB - Nama pelanggan
          'amount': 1000, // WAJIB - Jumlah tagihan
          'invoice_date': '2023-12-01', // WAJIB - Tanggal invoice
          
          // KOLOM OPSIONAL - BOLEH KOSONG
          'customer_id': 'C0000001', // Opsional - Format CXXXXXXX dari customers.customer_id
          'customer_uuid': '00000000-0000-0000-0000-000000000000', // Opsional - UUID dari customers.id
          'status': 'Unpaid', // Opsional - Status awal (default: Unpaid)
          'notes': 'Catatan tambahan', // Opsional - Catatan
          'bank_account': 'BCA', // Opsional - Informasi rekening bank
          'payment_method': 'Cash' // Opsional - Metode pembayaran
          // due_date dihitung otomatis berdasarkan payment_term pelanggan
        }
      ];
      
      // Tambahkan contoh data kedua dengan format berbeda
      sampleData.push({
        'Nomor Invoice': 'INV-002', // Alternatif nama kolom
        'Nama Pelanggan': 'PT Maju Jaya', // Alternatif nama kolom
        'Jumlah': 2500000, // Alternatif nama kolom
        'Tanggal Invoice': '2023-12-15', // Alternatif nama kolom
        'ID Customer': 'C0000002', // Alternatif nama kolom
        'Status': 'Unpaid',
        'Catatan': 'Pembayaran paling lambat 30 hari',
        'Bank': 'BRI',
        'Metode Pembayaran': 'Transfer Bank'
      });
      
      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
      
      // Tambahkan catatan tentang kolom wajib dan perhitungan due_date
      const notes = [
        'CATATAN PENTING:',
        '1. KOLOM WAJIB yang HARUS ada: invoice_number, amount, invoice_date',
        '   (Nama kolom bisa bervariasi, sistem akan mengenali berbagai format nama kolom)',
        '2. Jika kolom wajib tidak ada, proses import akan gagal',
        '3. due_date akan dihitung otomatis berdasarkan payment_term pelanggan',
        '4. Identifikasi pelanggan dapat menggunakan salah satu dari:',
        '   - customer_id (format CXXXXXXX) - DIUTAMAKAN',
        '   - customer_uuid (UUID dari customers.id)',
        '   - customer_name (akan dicocokkan dengan nama pelanggan di database)',
        '5. Format nama kolom yang dikenali:',
        '   - Nomor Invoice: invoice_number, Invoice Number, InvoiceNumber, Nomor Invoice, No Invoice, No. Invoice, No Faktur, dll',
        '   - Jumlah: amount, Amount, Jumlah, Total, Nilai, Nominal, Harga, Price, dll',
        '   - Tanggal Invoice: invoice_date, Invoice Date, InvoiceDate, Tanggal Invoice, Tgl Invoice, dll',
        '   - ID Customer: customer_id, Customer ID, CustomerId, ID Pelanggan, ID Customer, Kode Pelanggan, dll'
      ];
      
      for (let i = 0; i < notes.length; i++) {
        XLSX.utils.sheet_add_aoa(worksheet, [[notes[i]]], { origin: `A${i+5}` });
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
          
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as Record<string, any>[];
          
          if (jsonData.length === 0) {
            reject(new Error('File tidak memiliki data'));
            return;
          }
          
          // Definisi kolom yang diperlukan dan alternatifnya (lebih fleksibel)
          const columnMappings = {
            'invoice_number': ['invoice_number', 'Invoice Number', 'InvoiceNumber', 'Nomor Invoice', 'No Invoice', 'No. Invoice', 'No Faktur', 'Nomor Faktur', 'Invoice', 'Faktur', 'No'],
            'customer_name': ['customer_name', 'Customer Name', 'CustomerName', 'Nama Pelanggan', 'Nama Customer', 'Nama', 'Customer', 'Pelanggan', 'Client', 'Nama Client'],
            'amount': ['amount', 'Amount', 'Jumlah', 'Total', 'Nilai', 'Nominal', 'Harga', 'Price', 'Tagihan', 'Nilai Tagihan', 'Jumlah Tagihan'],
            'invoice_date': ['invoice_date', 'Invoice Date', 'InvoiceDate', 'Tanggal Invoice', 'Tgl Invoice', 'Tanggal', 'Tgl', 'Date', 'Tanggal Faktur'],
            'customer_id': ['customer_id', 'Customer ID', 'CustomerId', 'ID Pelanggan', 'ID Customer', 'Kode Pelanggan', 'Kode Customer'],
            'customer_uuid': ['customer_uuid', 'Customer UUID', 'CustomerUuid', 'UUID Pelanggan', 'UUID', 'ID'],
            'status': ['status', 'Status', 'Status Tagihan', 'Kondisi', 'State'],
            'notes': ['notes', 'Notes', 'Catatan', 'Keterangan', 'Deskripsi', 'Description', 'Remark', 'Remarks'],
            'bank_account': ['bank_account', 'Bank Account', 'BankAccount', 'Rekening Bank', 'Bank', 'Akun Bank', 'No Rekening'],
            'payment_method': ['payment_method', 'Payment Method', 'PaymentMethod', 'Metode Pembayaran', 'Cara Bayar', 'Pembayaran', 'Payment']
          };
          
          // Buat pemetaan dari nama kolom di file ke nama kolom yang digunakan dalam aplikasi
          const actualColumnMapping: Record<string, string> = {};
          const firstRow = jsonData[0];
          const fileColumns = Object.keys(firstRow);
          
          // Untuk debugging - tampilkan kolom yang ditemukan di file
          console.log('Kolom yang ditemukan di file:', fileColumns);
          
          // Untuk setiap kolom yang ada di file, cari padanannya dalam columnMappings
          fileColumns.forEach(fileColumn => {
            for (const [appColumn, alternatives] of Object.entries(columnMappings)) {
              // Cek kecocokan dengan lebih fleksibel (termasuk partial match)
              if (alternatives.some(alt => {
                // Exact match (case insensitive)
                if (alt.toLowerCase() === fileColumn.toLowerCase()) return true;
                
                // Partial match untuk kolom dengan nama panjang
                // Contoh: "Nomor Invoice Pelanggan" akan cocok dengan "Nomor Invoice"
                if (fileColumn.toLowerCase().includes(alt.toLowerCase()) && alt.length > 3) return true;
                
                return false;
              })) {
                actualColumnMapping[fileColumn] = appColumn;
                console.log(`Kolom '${fileColumn}' dipetakan ke '${appColumn}'`);
                break;
              }
            }
          });
          
          // Validasi kolom yang diperlukan
          const requiredColumns = ['invoice_number', 'customer_id', 'amount', 'invoice_date'];
          const optionalColumns = ['customer_name', 'due_date'];
          const missingColumns = [];
          const foundColumns = Object.values(actualColumnMapping);
          
          console.log('Kolom yang berhasil dipetakan:', foundColumns);
          
          // Periksa apakah semua kolom yang diperlukan ada dalam pemetaan
          for (const requiredCol of requiredColumns) {
            if (!foundColumns.includes(requiredCol)) {
              // Khusus untuk customer_id, jika customer_name ada, maka customer_id tidak wajib
              if (requiredCol === 'customer_id' && foundColumns.includes('customer_name')) {
                console.log('customer_name ditemukan, customer_id tidak wajib');
                continue;
              }
              // Cari nama alternatif untuk ditampilkan dalam pesan error
              const alternatives = columnMappings[requiredCol];
              missingColumns.push(alternatives[0]); // Gunakan nama kolom standar saja
            }
          }
          
          if (missingColumns.length > 0) {
            // Buat pesan error yang lebih informatif
            const errorMsg = `Invalid data\n\nFile yang diimpor tidak memiliki kolom yang diperlukan: ${missingColumns.join(', ')}\n\n` +
                           `Kolom yang ditemukan: ${fileColumns.join(', ')}\n` +
                           `Kolom wajib yang harus ada:\n` +
                           `- invoice_number\n` +
                           `- customer_id (atau customer_name sebagai alternatif)\n` +
                           `- amount\n` +
                           `- invoice_date\n\n` +
                           `Kolom opsional:\n` +
                           `- customer_name (opsional jika customer_id ada)\n` +
                           `- due_date (opsional)\n\n` +
                           `Pastikan file Excel memiliki minimal kolom berikut (atau variasinya):\n` +
                           `- Nomor Invoice / Invoice Number / No Faktur\n` +
                           `- Customer ID / ID Pelanggan (atau Customer Name jika ID tidak tersedia)\n` +
                           `- Jumlah / Amount / Total / Nilai\n` +
                           `- Tanggal Invoice / Invoice Date / Tgl Invoice`;
            
            reject(new Error(errorMsg));
            return;
          }
          
          // Map the data to our CollectionImportFormat with only required fields
          const mappedData = jsonData.map((row, index) => {
            const result: Record<string, any> = {};
            
            // Untuk setiap kolom di file, ambil nilai dan masukkan ke kolom yang sesuai
            Object.entries(row).forEach(([fileColumn, value]) => {
              const appColumn = actualColumnMapping[fileColumn];
              if (appColumn) {
                result[appColumn] = value;
              }
            });
            
            // Log untuk debugging
            console.log(`Baris ${index + 1} setelah pemetaan:`, result);
            
            // Pastikan semua kolom yang diperlukan ada dan memiliki nilai default jika tidak ada
            // Untuk invoice_date, coba parse berbagai format tanggal
            let invoiceDate = new Date().toISOString();
            if (result.invoice_date) {
              try {
                // Coba parse tanggal dengan berbagai format
                const dateValue = result.invoice_date;
                let parsedDate: Date | null = null;
                
                if (typeof dateValue === 'string') {
                  // Jika format Excel (serial number)
                  if (/^\d+(\.\d+)?$/.test(dateValue)) {
                    try {
                      parsedDate = XLSX.SSF.parse_date_code(Number(dateValue));
                    } catch (e) {
                      console.warn(`Gagal parse serial number Excel: ${dateValue}`, e);
                    }
                  } else {
                    // Coba parse sebagai string tanggal
                    parsedDate = new Date(dateValue);
                  }
                } else if (typeof dateValue === 'number') {
                  // Jika format Excel (serial number)
                  try {
                    parsedDate = XLSX.SSF.parse_date_code(dateValue);
                  } catch (e) {
                    console.warn(`Gagal parse serial number Excel: ${dateValue}`, e);
                    // Coba parse sebagai timestamp
                    parsedDate = new Date(dateValue);
                  }
                } else if (dateValue instanceof Date) {
                  parsedDate = dateValue;
                }
                
                // Validasi tanggal sebelum mengkonversi ke ISO string
                if (parsedDate && !isNaN(parsedDate.getTime())) {
                  invoiceDate = parsedDate.toISOString();
                } else {
                  console.warn(`Tanggal tidak valid pada baris ${index + 1}: ${dateValue}, menggunakan tanggal hari ini`);
                  invoiceDate = new Date().toISOString();
                }
              } catch (e) {
                console.warn(`Gagal parse tanggal invoice pada baris ${index + 1}:`, e);
                // Gunakan tanggal hari ini sebagai fallback
                invoiceDate = new Date().toISOString();
              }
            }
            
            // Pastikan invoice_number tetap sama dengan yang ada di Excel dan tidak boleh kosong
          const invoiceNumber = result.invoice_number;
          
          // Validasi invoice_number tidak boleh kosong
          if (!invoiceNumber) {
            console.warn(`Baris ${index + 1} dilewati: invoice_number kosong`);
            return null; // Baris akan difilter nanti
          }
            const customerId = result.customer_id || '';
            const customerUuid = result.customer_uuid || '';
            const customerName = result.customer_name || '';
            
            // Konversi amount ke number dengan penanganan berbagai format
            let amount = 0;
            if (result.amount !== undefined && result.amount !== '') {
              try {
                if (typeof result.amount === 'number') {
                  // Jika sudah number, gunakan langsung
                  amount = result.amount;
                } else {
                  // Jika string, bersihkan dan konversi
                  // Hapus karakter non-numerik kecuali titik desimal dan koma
                  let cleanedAmount = String(result.amount);
                  
                  // Tangani format angka Indonesia (1.234.567,89)
                  if (cleanedAmount.includes('.') && cleanedAmount.includes(',')) {
                    cleanedAmount = cleanedAmount.replace(/\./g, '').replace(',', '.');
                  }
                  // Tangani format angka dengan koma sebagai desimal (1234567,89)
                  else if (cleanedAmount.includes(',') && !cleanedAmount.includes('.')) {
                    cleanedAmount = cleanedAmount.replace(',', '.');
                  }
                  
                  // Hapus karakter non-numerik lainnya
                  cleanedAmount = cleanedAmount.replace(/[^0-9.]/g, '');
                  amount = Number(cleanedAmount) || 0;
                }
              } catch (e) {
                console.warn(`Gagal parse amount pada baris ${index + 1}:`, e, result.amount);
                amount = 0;
              }
            }
            
            // Buat objek CollectionImportFormat dengan invoice_number yang tidak diubah
            const importData = {
              invoice_date: invoiceDate,
              invoice_number: invoiceNumber, // Nilai asli dari Excel yang sudah divalidasi tidak kosong
              customer_id: customerId,
              customer_uuid: customerUuid,
              customer_name: customerName,
              amount: amount,
              status: result.status || 'Unpaid',
              notes: result.notes || '',
              bank_account: result.bank_account || '',
              payment_method: result.payment_method || ''
            } as CollectionImportFormat;
            
            console.log(`Data import baris ${index + 1}:`, importData);
            return importData;
          });
          
          // Log jumlah data yang berhasil dipetakan
          console.log(`Berhasil memetakan ${mappedData.length} baris data dari file Excel`);
          
          // Filter baris yang memiliki invoice_number kosong
          const validData = mappedData.filter(item => item !== null);
          console.log(`${mappedData.length - validData.length} baris dilewati karena invoice_number kosong`);
          
          resolve(validData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Gagal membaca file'));
      reader.readAsArrayBuffer(file);
    });
  }
}
