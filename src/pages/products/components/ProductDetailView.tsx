
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Product } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, ArrowLeft, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProductDetailViewProps {
  product: Product | null;
  isLoading: boolean;
}

export function ProductDetailView({ product, isLoading }: ProductDetailViewProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const handleEdit = () => {
    if (product) {
      navigate(`/dashboard/products/edit/${product.id}`);
    }
  };

  const handleDelete = async () => {
    if (!product) return;

    try {
      setIsDeleting(true);
      
      // Check if product is used in any orders
      const { data: orderItems, error: checkError } = await supabase
        .from("order_items")
        .select("id")
        .eq("product_id", product.id)
        .limit(1);
      
      if (checkError) throw checkError;
      
      if (orderItems && orderItems.length > 0) {
        throw new Error("Cannot delete product that is used in orders");
      }
      
      // Delete the product
      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);
      
      if (deleteError) throw deleteError;
      
      toast({
        title: "Product deleted",
        description: "The product has been successfully deleted",
      });
      
      navigate("/dashboard/products");
    } catch (error: any) {
      console.error("Error deleting product:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete product: ${error.message}`,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount);
  };

  const getStockStatus = (stock: number) => {
    if (stock > 10) return "bg-green-100 text-green-800";
    if (stock > 0) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!product) {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <CardTitle>No Product Selected</CardTitle>
          <CardDescription>
            Select a product from the list to view its details
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <Button variant="outline" onClick={() => navigate("/dashboard/products")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/products")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Product Details</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the product.
                  If this product is used in any orders, it cannot be deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{product.name}</CardTitle>
              <CardDescription>SKU: {product.sku}</CardDescription>
            </div>
            <Badge className={getStockStatus(product.stock)}>
              {product.stock} {product.unit} in stock
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Price</p>
              <p className="text-xl font-semibold">{formatCurrency(product.price)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Category</p>
              <p>{product.category}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Unit</p>
              <p>{product.unit}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p>{format(new Date(product.created_at), "MMM d, yyyy")}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-medium mb-2">Description</h3>
            <p className="text-muted-foreground">{product.description || "No description available"}</p>
          </div>

          {product.image_url && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-medium mb-2">Product Image</h3>
                <div className="border rounded-md overflow-hidden w-full max-w-md">
                  <img 
                    src={product.image_url} 
                    alt={product.name} 
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate("/dashboard/products")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
