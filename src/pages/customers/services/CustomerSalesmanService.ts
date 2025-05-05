import { supabase } from '@/integrations/supabase/client';

export class CustomerSalesmanService {
  /**
   * Mengambil daftar salesman yang tersedia
   * @returns Array of salesman profiles
   */
  static async getSalesmen() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'salesman')
        .order('full_name');

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching salesmen:', error.message);
      throw error;
    }
  }

  /**
   * Mengambil daftar salesman yang diassign ke customer tertentu
   * @param customerId ID customer
   * @returns Array of salesman IDs
   */
  static async getCustomerSalesmen(customerId: string) {
    try {
      const { data, error } = await supabase
        .from('customer_salesman')
        .select('salesman_id')
        .eq('customer_id', customerId);

      if (error) throw error;
      return (data || []).map(item => item.salesman_id);
    } catch (error: any) {
      console.error('Error fetching customer salesmen:', error.message);
      throw error;
    }
  }

  /**
   * Mengassign salesman ke customer
   * @param customerId ID customer
   * @param salesmanIds Array of salesman IDs
   */
  static async assignSalesmen(customerId: string, salesmanIds: string[]) {
    try {
      // Validasi customer_id
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('id', customerId)
        .single();

      if (customerError) throw new Error(`Customer dengan ID ${customerId} tidak ditemukan`);

      // Validasi salesman_ids
      const { data: salesmen, error: salesmenError } = await supabase
        .from('profiles')
        .select('id')
        .in('id', salesmanIds)
        .eq('role', 'salesman');

      if (salesmenError) throw salesmenError;

      // Pastikan semua salesman_id valid
      if (salesmen?.length !== salesmanIds.length) {
        throw new Error('Beberapa ID salesman tidak valid');
      }

      // Hapus assignment yang sudah ada
      const { error: deleteError } = await supabase
        .from('customer_salesman')
        .delete()
        .eq('customer_id', customerId);

      if (deleteError) throw deleteError;

      // Jika tidak ada salesman yang dipilih, selesai di sini
      if (salesmanIds.length === 0) return;

      // Buat array data untuk insert
      const assignmentData = salesmanIds.map(salesmanId => ({
        customer_id: customerId,
        salesman_id: salesmanId,
        assigned_at: new Date().toISOString()
      }));

      // Insert assignment baru
      const { error: insertError } = await supabase
        .from('customer_salesman')
        .insert(assignmentData);

      if (insertError) throw insertError;

      return true;
    } catch (error: any) {
      console.error('Error assigning salesmen:', error.message);
      throw error;
    }
  }
}