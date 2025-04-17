import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { InventoryWithDetails } from '@/types/inventory';

export const useInventory = () => {
  const [inventory, setInventory] = useState<InventoryWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      // Join inventory with products and warehouses to get all details
      const { data, error } = await supabase
        .from("inventory")
        .select(`
          *,
          products:sku(id, name, sku, description, price, category, unit),
          warehouses:warehouse_code(code, name, location)
        `);

      if (error) throw error;

      // Transform the data to match our InventoryWithDetails type
      const inventoryWithDetails: InventoryWithDetails[] = data?.map((item: any) => ({
        id: item.id,
        sku: item.sku,
        warehouse_code: item.warehouse_code,
        quantity: item.quantity,
        uom: item.uom,
        last_updated_at: item.last_updated_at,
        product: item.products,
        warehouse: item.warehouses
      })) || [];
      
      setInventory(inventoryWithDetails);
    } catch (error: any) {
      console.error("Error fetching inventory:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load inventory: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateInventoryQuantity = async (id: string, quantity: number) => {
    try {
      const { error } = await supabase
        .from("inventory")
        .update({
          quantity,
          last_updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;

      // Refresh inventory data
      fetchInventory();
      
      return { success: true };
    } catch (error: any) {
      console.error("Error updating inventory:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update inventory: ${error.message}`,
      });
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  return {
    inventory,
    isLoading,
    fetchInventory,
    updateInventoryQuantity
  };
};