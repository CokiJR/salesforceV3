import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Hanya menerima metode POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Ambil customer_id dari parameter URL
  const { customer_id } = req.query;
  
  // Validasi customer_id
  if (!customer_id || typeof customer_id !== 'string') {
    return res.status(400).json({ error: 'Invalid customer ID' });
  }

  try {
    // Ambil data dari body request
    const { salesman_ids } = req.body;
    
    // Validasi salesman_ids
    if (!Array.isArray(salesman_ids)) {
      return res.status(400).json({ error: 'salesman_ids harus berupa array' });
    }

    // Validasi customer_id
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', customer_id)
      .single();

    if (customerError) {
      return res.status(404).json({ error: `Customer dengan ID ${customer_id} tidak ditemukan` });
    }

    // Validasi salesman_ids
    if (salesman_ids.length > 0) {
      const { data: salesmen, error: salesmenError } = await supabase
        .from('profiles')
        .select('id')
        .in('id', salesman_ids)
        .eq('role', 'salesman');

      if (salesmenError) {
        return res.status(500).json({ error: 'Error validating salesmen IDs' });
      }

      // Pastikan semua salesman_id valid
      if (salesmen?.length !== salesman_ids.length) {
        return res.status(400).json({ error: 'Beberapa ID salesman tidak valid' });
      }
    }

    // Hapus assignment yang sudah ada
    const { error: deleteError } = await supabase
      .from('customer_salesman')
      .delete()
      .eq('customer_id', customer_id);

    if (deleteError) {
      return res.status(500).json({ error: 'Error deleting existing assignments' });
    }

    // Jika tidak ada salesman yang dipilih, selesai di sini
    if (salesman_ids.length === 0) {
      return res.status(200).json({ success: true, message: 'All salesmen unassigned successfully' });
    }

    // Buat array data untuk insert
    const assignmentData = salesman_ids.map(salesmanId => ({
      customer_id,
      salesman_id: salesmanId,
      assigned_at: new Date().toISOString()
    }));

    // Insert assignment baru
    const { error: insertError } = await supabase
      .from('customer_salesman')
      .insert(assignmentData);

    if (insertError) {
      return res.status(500).json({ error: 'Error creating assignments' });
    }

    return res.status(200).json({ success: true, message: 'Salesmen assigned successfully' });
  } catch (error: any) {
    console.error('Error in salesmen assignment API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}