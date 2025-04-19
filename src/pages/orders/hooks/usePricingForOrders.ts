import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GeneralPricingWithDetails, SpecialPriceWithDetails } from "@/types/pricing";

export const usePricingForOrders = () => {
  const [generalPricing, setGeneralPricing] = useState<GeneralPricingWithDetails[]>([]);
  const [specialPricing, setSpecialPricing] = useState<SpecialPriceWithDetails[]>([]);
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

  return {
    generalPricing,
    specialPricing,
    loading: isLoading,
    fetchPricingData,
    getProductPrice
  };
};