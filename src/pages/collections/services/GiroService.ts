import { supabase } from '@/integrations/supabase/client';
import { Giro, GiroClearing } from '@/types/giro';
import { Customer } from '@/types';

export class GiroService {
  static async getGiros(): Promise<Giro[]> {
    const { data, error } = await supabase
      .from('giro')
      .select(`
        *,
        customer:customers(*)
      `)
      .order('due_date', { ascending: false });

    if (error) {
      console.error('Error fetching giros:', error);
      throw new Error(error.message);
    }

    // Process data and handle customer location properly
    return (data || []).map(item => {
      // Check if customer is an array or an object and handle accordingly
      const customerData = item.customer ? (
        // If it's an array, handle it that way
        Array.isArray(item.customer) && item.customer.length > 0 ? {
          ...item.customer[0],
          // Properly convert location from Json to expected type or undefined
          location: item.customer[0].location ? {
            lat: Number((item.customer[0].location as any).lat || 0),
            lng: Number((item.customer[0].location as any).lng || 0)
          } : undefined,
          status: item.customer[0].status as "active" | "inactive"
        } : 
        // If it's an object, handle it directly
        {
          ...item.customer as any,
          location: (item.customer as any).location ? {
            lat: Number(((item.customer as any).location as any).lat || 0),
            lng: Number(((item.customer as any).location as any).lng || 0)
          } : undefined,
          status: (item.customer as any).status as "active" | "inactive"
        }
      ) : undefined;

      return {
        ...item,
        status: item.status as 'pending' | 'partial' | 'cleared' | 'bounced',
        customer: customerData as Customer | undefined
      };
    }) as Giro[];
  }

  static async getGiroById(id: string): Promise<Giro> {
    const { data, error } = await supabase
      .from('giro')
      .select(`
        *,
        customer:customers(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching giro:', error);
      throw new Error(error.message);
    }

    // Process customer data
    const customerData = data.customer ? (
      Array.isArray(data.customer) && data.customer.length > 0 ? {
        ...data.customer[0],
        location: data.customer[0].location ? {
          lat: Number((data.customer[0].location as any).lat || 0),
          lng: Number((data.customer[0].location as any).lng || 0)
        } : undefined,
        status: data.customer[0].status as "active" | "inactive"
      } : 
      {
        ...data.customer as any,
        location: (data.customer as any).location ? {
          lat: Number(((data.customer as any).location as any).lat || 0),
          lng: Number(((data.customer as any).location as any).lng || 0)
        } : undefined,
        status: (data.customer as any).status as "active" | "inactive"
      }
    ) : undefined;

    return {
      ...data,
      status: data.status as 'pending' | 'partial' | 'cleared' | 'bounced',
      customer: customerData as Customer | undefined
    } as Giro;
  }

  static async createGiro(giro: Omit<Giro, 'id' | 'created_at' | 'updated_at'>): Promise<Giro> {
    const { data, error } = await supabase
      .from('giro')
      .insert(giro)
      .select()
      .single();

    if (error) {
      console.error('Error creating giro:', error);
      throw new Error(error.message);
    }

    return data as Giro;
  }

  static async updateGiro(id: string, updates: Partial<Giro>): Promise<Giro> {
    const { data, error } = await supabase
      .from('giro')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating giro:', error);
      throw new Error(error.message);
    }

    return data as Giro;
  }

  static async deleteGiro(id: string): Promise<void> {
    const { error } = await supabase
      .from('giro')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting giro:', error);
      throw new Error(error.message);
    }
  }

  static async getGiroClearing(giroId: string): Promise<GiroClearing[]> {
    const { data, error } = await supabase
      .from('giro_clearing')
      .select('*')
      .eq('giro_id', giroId)
      .order('clearing_date', { ascending: false });

    if (error) {
      console.error('Error fetching giro clearing records:', error);
      throw new Error(error.message);
    }

    return data as GiroClearing[];
  }

  static async createGiroClearing(clearing: Omit<GiroClearing, 'id' | 'created_at' | 'updated_at'>): Promise<GiroClearing> {
    const { data, error } = await supabase
      .from('giro_clearing')
      .insert(clearing)
      .select()
      .single();

    if (error) {
      console.error('Error creating giro clearing:', error);
      throw new Error(error.message);
    }

    // Update giro status based on clearing
    await this.updateGiroStatusAfterClearing(clearing.giro_id);

    return data as GiroClearing;
  }

  static async updateGiroStatusAfterClearing(giroId: string): Promise<void> {
    try {
      // Get the giro
      const giro = await this.getGiroById(giroId);
      
      // Get all clearing records for this giro
      const clearingRecords = await this.getGiroClearing(giroId);
      
      // Calculate total cleared amount
      const totalClearedAmount = clearingRecords
        .filter(record => record.clearing_status === 'cleared')
        .reduce((sum, record) => sum + record.clearing_amount, 0);
      
      // Determine new status
      let newStatus: 'pending' | 'partial' | 'cleared' | 'bounced' = 'pending';
      
      if (totalClearedAmount >= giro.amount) {
        newStatus = 'cleared';
      } else if (totalClearedAmount > 0) {
        newStatus = 'partial';
      }
      
      // Check if there are any bounced records
      const hasBounced = clearingRecords.some(record => record.clearing_status === 'bounced');
      if (hasBounced) {
        newStatus = 'bounced';
      }
      
      // Update giro status
      await this.updateGiro(giroId, { status: newStatus });
      
    } catch (error) {
      console.error('Error updating giro status after clearing:', error);
      throw error;
    }
  }

  static async deleteGiroClearing(id: string): Promise<void> {
    const { error } = await supabase
      .from('giro_clearing')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting giro clearing:', error);
      throw new Error(error.message);
    }
  }
}