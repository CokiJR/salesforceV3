import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GeneralPricingWithDetails, SpecialPriceWithDetails } from "@/types/pricing";
import { InventoryWithDetails } from "@/types/inventory";

export const usePricingForOrders = () => {
  const [generalPricing, setGeneralPricing] = useState<GeneralPricingWithDetails[]>([]);
  const [specialPricing, setSpecialPricing] = useState<SpecialPriceWithDetails[]>([]);
  const [inventory, setInventory] = useState<InventoryWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchPricingData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch general pricing data
      const { data: generalData, error: generalError } = await supabase
        .from("pricing")
        .select(`
          *,
          products:sku(id, name, sku, description, category, unit)
        `);

      if (generalError) throw generalError;

      // Transform the data to match our GeneralPricingWithDetails type
      const generalPricingWithDetails: GeneralPricingWithDetails[] = generalData?.map((item: any) => ({
        id: item.id,
        sku: item.sku,
        price: item.price,
        currency: item.currency,
        min_qty: item.min_qty,
        valid_from: item.valid_from,
        valid_to: item.valid_to,
        created_at: item.created_at,
        updated_at: item.updated_at,
        product: item.products
      })) || [];
      
      setGeneralPricing(generalPricingWithDetails);

      // Fetch special pricing data
      const { data: specialData, error: specialError } = await supabase
        .from("special_prices")
        .select(`
          *,
          products:sku(id, name, sku, description, category, unit),
          customers:customer_id(id, customer_id, name, address, city, phone)
        `);

      if (specialError) throw specialError;

      // Transform the data to match our SpecialPriceWithDetails type
      const specialPricingWithDetails: SpecialPriceWithDetails[] = specialData?.map((item: any) => ({
        id: item.id,
        customer_id: item.customer_id,
        sku: item.sku,
        special_price: item.special_price,
        currency: item.currency,
        min_qty: item.min_qty,
        valid_from: item.valid_from,
        valid_to: item.valid_to,
        active: item.active,
        created_at: item.created_at,
        updated_at: item.updated_at,
        product: item.products,
        customer: item.customers
      })) || [];
      
      setSpecialPricing(specialPricingWithDetails);
      
      // Fetch inventory data
      const { data: inventoryData, error: inventoryError } = await supabase
        .from("inventory")
        .select(`
          *,
          products:sku(id, name, sku, description, price, category, unit),
          warehouses:warehouse_code(code, name, location)
        `);

      if (inventoryError) throw inventoryError;

      // Transform the data to match our InventoryWithDetails type
      const inventoryWithDetails: InventoryWithDetails[] = inventoryData?.map((item: any) => ({
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
      console.error("Error fetching pricing data:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load pricing data: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get price for a product
  const getProductPrice = (sku: string, customerId?: string, quantity: number = 1) => {
    // If customerId is provided and customer has special pricing, use that
    if (customerId) {
      const today = new Date().toISOString().split('T')[0];
      
      // Find active special price for this customer and product
      const specialPrice = specialPricing.find(price => {
        return price.sku === sku && 
        price.customer?.id === customerId &&
        price.active &&
        price.min_qty <= quantity &&
        new Date(price.valid_from) <= new Date(today) &&
        (!price.valid_to || new Date(price.valid_to) >= new Date(today));
      });
      
      if (specialPrice) {
        console.log("Using special price for customer:", customerId, "product:", sku, "price:", specialPrice.special_price);
        return specialPrice.special_price;
      }
    }
    
    // Otherwise use general pricing
    const today = new Date().toISOString().split('T')[0];
    
    // Find valid general price for this product
    const generalPrice = generalPricing.find(price => 
      price.sku === sku &&
      price.min_qty <= quantity &&
      new Date(price.valid_from) <= new Date(today) &&
      (!price.valid_to || new Date(price.valid_to) >= new Date(today))
    );
    
    if (generalPrice) {
      return generalPrice.price;
    }
    
    // If no pricing found, return null
    return null;
  };

  useEffect(() => {
    fetchPricingData();
  }, []);

  // Function to check if a product has enough stock
  const checkProductStock = (sku: string, quantity: number = 1) => {
    // Sum up quantities across all warehouses for this SKU
    const totalStock = inventory
      .filter(item => item.sku === sku)
      .reduce((sum, item) => sum + item.quantity, 0);
    
    // Check if we have enough stock
    return {
      inStock: totalStock >= quantity,
      availableQuantity: totalStock
    };
  };
  
  // Function to update inventory when an order is created
  const updateInventoryForOrder = async (items: {sku: string, quantity: number}[]) => {
    try {
      // For each order item, reduce inventory
      for (const item of items) {
        // Find inventory items for this SKU
        const inventoryItems = inventory.filter(inv => inv.sku === item.sku);
        
        if (inventoryItems.length === 0) {
          throw new Error(`No inventory found for product SKU: ${item.sku}`);
        }
        
        // Check total stock across all warehouses
        const totalStock = inventoryItems.reduce((sum, inv) => sum + inv.quantity, 0);
        
        if (totalStock < item.quantity) {
          throw new Error(`Insufficient stock for product SKU: ${item.sku}. Available: ${totalStock}, Requested: ${item.quantity}`);
        }
        
        // Reduce inventory from warehouses (starting with the first one that has stock)
        let remainingQty = item.quantity;
        
        for (const invItem of inventoryItems) {
          if (remainingQty <= 0) break;
          
          const qtyToReduce = Math.min(invItem.quantity, remainingQty);
          
          if (qtyToReduce > 0) {
            // Update inventory in database
            const { error } = await supabase
              .from("inventory")
              .update({
                quantity: invItem.quantity - qtyToReduce,
                last_updated_at: new Date().toISOString()
              })
              .eq("id", invItem.id);
            
            if (error) throw error;
            
            remainingQty -= qtyToReduce;
          }
        }
      }
      
      // Refresh inventory data
      await fetchPricingData();
      
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

  return {
    generalPricing,
    specialPricing,
    inventory,
    loading: isLoading,
    fetchPricingData,
    getProductPrice,
    checkProductStock,
    updateInventoryForOrder
  };
};