
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Product } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { ProductDetailView } from "./components/ProductDetailView";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .single();
        
        if (error) throw error;
        
        setProduct(data);
      } catch (error: any) {
        console.error("Error fetching product:", error.message);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to load product: ${error.message}`,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  return (
    <div className="animate-fade-in">
      <ProductDetailView 
        product={product}
        isLoading={loading}
      />
    </div>
  );
};

export default ProductDetail;
