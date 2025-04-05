
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Package, ArrowLeft, Loader2 } from "lucide-react";

// Product form schema for validation
const productSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().positive("Price must be a positive number"),
  category: z.string().min(1, "Category is required"),
  unit: z.string().min(1, "Unit is required"),
  stock: z.coerce.number().int().nonnegative("Stock must be a non-negative number"),
  image_url: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function AddProduct() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Initialize the form with default values
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      description: "",
      price: 0,
      category: "",
      unit: "unit",
      stock: 0,
      image_url: "",
    },
  });

  const onSubmit = async (data: ProductFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Create a productData object with the shape expected by Supabase
      // Important: data is already validated by Zod so all required fields are present
      const productData = {
        name: data.name,
        sku: data.sku,
        description: data.description,
        price: data.price,
        category: data.category,
        unit: data.unit,
        stock: data.stock,
        image_url: data.image_url || null,
        created_at: new Date().toISOString(),
      };
      
      const { data: newProduct, error } = await supabase
        .from("products")
        .insert(productData)
        .select("*")
        .single();

      if (error) throw error;

      toast({
        title: "Product added",
        description: `${newProduct.name} has been added to your product catalog.`,
      });
      
      navigate("/dashboard/products");
    } catch (error: any) {
      console.error("Error adding product:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to add product: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/products")}
            className="rounded-full"
            aria-label="Back to products"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Add Product</h1>
        </div>
      </div>
      
      <div className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-3 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter SKU" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter product description" 
                        {...field} 
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="0.00" 
                          type="number" 
                          step="0.01" 
                          min="0"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="0" 
                          type="number" 
                          min="0" 
                          step="1" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unit">Unit</SelectItem>
                          <SelectItem value="kg">Kilogram (kg)</SelectItem>
                          <SelectItem value="g">Gram (g)</SelectItem>
                          <SelectItem value="l">Liter (L)</SelectItem>
                          <SelectItem value="ml">Milliliter (ml)</SelectItem>
                          <SelectItem value="box">Box</SelectItem>
                          <SelectItem value="pair">Pair</SelectItem>
                          <SelectItem value="set">Set</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beverages">Beverages</SelectItem>
                          <SelectItem value="dairy">Dairy</SelectItem>
                          <SelectItem value="bakery">Bakery</SelectItem>
                          <SelectItem value="meat">Meat</SelectItem>
                          <SelectItem value="produce">Produce</SelectItem>
                          <SelectItem value="seafood">Seafood</SelectItem>
                          <SelectItem value="snacks">Snacks</SelectItem>
                          <SelectItem value="frozen">Frozen</SelectItem>
                          <SelectItem value="canned">Canned</SelectItem>
                          <SelectItem value="household">Household</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/image.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard/products")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>Save Product</>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
        
        <div className="md:col-span-2">
          <div className="rounded-xl border border-dashed p-8 flex flex-col items-center justify-center text-center h-full">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Product Information</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Fill out the form to add a new product to your catalog. 
              Make sure to include accurate details to help with inventory management.
            </p>
            <div className="text-xs text-muted-foreground">
              <p>Fields marked with * are required</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
