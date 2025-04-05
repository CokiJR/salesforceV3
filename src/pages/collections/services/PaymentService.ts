
import { supabase } from '@/integrations/supabase/client';
import { Payment } from '@/types/collection';
import { Customer } from '@/types';

export class PaymentService {
  static async getPayments(): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        collection:collections(*),
        customer:customers(*)
      `)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
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
        status: item.status as 'Pending' | 'Completed' | 'Failed',
        customer: customerData as Customer | undefined
      };
    }) as Payment[];
  }

  static async getPaymentsByCollectionId(collectionId: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        collection:collections(*),
        customer:customers(*)
      `)
      .eq('collection_id', collectionId)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching collection payments:', error);
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
        status: item.status as 'Pending' | 'Completed' | 'Failed',
        customer: customerData as Customer | undefined
      };
    }) as Payment[];
  }

  static async createPayment(payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .insert(payment)
      .select()
      .single();

    if (error) {
      console.error('Error creating payment:', error);
      throw new Error(error.message);
    }

    return {
      ...data,
      status: data.status as 'Pending' | 'Completed' | 'Failed'
    } as Payment;
  }

  static async updatePaymentStatus(id: string, status: 'Pending' | 'Completed' | 'Failed'): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment status:', error);
      throw new Error(error.message);
    }

    return {
      ...data,
      status: data.status as 'Pending' | 'Completed' | 'Failed'
    } as Payment;
  }

  static async deletePayment(id: string): Promise<void> {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting payment:', error);
      throw new Error(error.message);
    }
  }

  static async getUnpaidCollections(): Promise<any[]> {
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        customer:customers(*)
      `)
      .eq('status', 'Unpaid')
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching unpaid collections:', error);
      throw new Error(error.message);
    }

    // Process customer data to ensure location is properly formatted
    return (data || []).map(item => {
      if (item.customer) {
        // Check if customer is an array or an object and handle accordingly
        if (Array.isArray(item.customer) && item.customer.length > 0) {
          return {
            ...item,
            customer: {
              ...item.customer[0],
              location: item.customer[0].location ? {
                lat: Number((item.customer[0].location as any).lat || 0),
                lng: Number((item.customer[0].location as any).lng || 0)
              } : undefined,
              status: item.customer[0].status as "active" | "inactive"
            }
          };
        } else {
          // Handle as a direct object
          return {
            ...item,
            customer: {
              ...(item.customer as any),
              location: (item.customer as any).location ? {
                lat: Number(((item.customer as any).location as any).lat || 0),
                lng: Number(((item.customer as any).location as any).lng || 0)
              } : undefined,
              status: (item.customer as any).status as "active" | "inactive"
            }
          };
        }
      }
      return item;
    });
  }
  
  static async getTotalPaymentsByCollectionId(collectionId: string): Promise<number> {
    const { data, error } = await supabase
      .from('payments')
      .select('amount')
      .eq('collection_id', collectionId)
      .eq('status', 'Completed');
    
    if (error) {
      console.error('Error fetching total payments:', error);
      throw new Error(error.message);
    }
    
    return (data || []).reduce((total, payment) => total + Number(payment.amount), 0);
  }
}
