import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Product, Warehouse } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Save } from "lucide-react";

interface FormData {
  sku: string;
  warehouse_code: string;
  quantity: number;
  uom: string;
}

export default function AddInventory() {
  const [formData, setFormData] = useState<FormData>({
    sku: "",
    warehouse_code: "",
    quantity: 0,
    uom: "pcs",
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingInventory, setExistingInventory] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    fetchWarehouses();
  }, []);

  // Fetch products for dropdown
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error("Error fetching products:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load products: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch warehouses for dropdown
  const fetchWarehouses = async () => {
    try {
      const { data, error } = await supabase
        .from("warehouses")
        .select("*")
        .order("name");

      if (error) throw error;
      setWarehouses(data || []);
    } catch (error: any) {
      console.error("Error fetching warehouses:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load warehouses: ${error.message}`,
      });
    }
  };

  // Check if inventory already exists for this product and warehouse
  const checkExistingInventory = async () => {
    if (!formData.sku || !formData.warehouse_code) return;

    try {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("sku", formData.sku)
        .eq("warehouse_code", formData.warehouse_code)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is the error code for no rows returned
        throw error;
      }

      setExistingInventory(data);
      if (data) {
        // If inventory exists, update form with existing data
        setFormData(prev => ({
          ...prev,
          quantity: data.quantity,
          uom: data.uom
        }));
        toast({
          title: "Existing inventory found",
          description: "This product already exists in this warehouse. You can update the quantity.",
        });
      }
    } catch (error: any) {
      console.error("Error checking existing inventory:", error.message);
    }
  };

  // Handle form input changes
  const handleChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Check for existing inventory when both SKU and warehouse are selected
    if ((field === "sku" || field === "warehouse_code") && 
        formData.sku && formData.warehouse_code) {
      checkExistingInventory();
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.sku || !formData.warehouse_code || formData.quantity < 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields with valid values.",
      });
      return;
    }

    try {
      setSubmitting(true);

      if (existingInventory) {
        // Update existing inventory
        const { error } = await supabase
          .from("inventory")
          .update({
            quantity: formData.quantity,
            uom: formData.uom,
            last_updated_at: new Date().toISOString()
          })
          .eq("id", existingInventory.id);

        if (error) throw error;

        toast({
          title: "Inventory updated",
          description: "The inventory has been updated successfully.",
        });
      } else {
        // Create new inventory record
        const { error } = await supabase.from("inventory").insert({
          sku: formData.sku,
          warehouse_code: formData.warehouse_code,
          quantity: formData.quantity,
          uom: formData.uom,
          last_updated_at: new Date().toISOString()
        });

        if (error) throw error;

        toast({
          title: "Inventory added",
          description: "The inventory has been added successfully.",
        });
      }

      // Navigate back to inventory list
      navigate("/dashboard/inventory");
    } catch (error: any) {
      console.error("Error saving inventory:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to save inventory: ${error.message}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getSelectedProductName = () => {
    const product = products.find(p => p.sku === formData.sku);
    return product ? product.name : "";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/inventory")}
            className="rounded-full"
            aria-label="Back to inventory"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            {existingInventory ? "Update Inventory" : "Add Inventory"}
          </h1>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{existingInventory ? "Update Inventory" : "Add New Inventory"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="product">Product</Label>
                  <Select
                    value={formData.sku}
                    onValueChange={(value) => handleChange("sku", value)}
                    disabled={!!existingInventory}
                  >
                    <SelectTrigger id="product">
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.sku}>
                          {product.name} ({product.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warehouse">Warehouse</Label>
                  <Select
                    value={formData.warehouse_code}
                    onValueChange={(value) => handleChange("warehouse_code", value)}
                    disabled={!!existingInventory}
                  >
                    <SelectTrigger id="warehouse">
                      <SelectValue placeholder="Select a warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.code} value={warehouse.code}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.quantity}
                    onChange={(e) => handleChange("quantity", parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="uom">Unit of Measure</Label>
                  <Select
                    value={formData.uom}
                    onValueChange={(value) => handleChange("uom", value)}
                  >
                    <SelectTrigger id="uom">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                      <SelectItem value="box">Box</SelectItem>
                      <SelectItem value="kg">Kilogram (kg)</SelectItem>
                      <SelectItem value="ltr">Liter (ltr)</SelectItem>
                      <SelectItem value="unit">Unit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.sku && (
                <div className="bg-muted p-4 rounded-md">
                  <h3 className="font-medium mb-2">Product Information</h3>
                  <p className="text-sm">
                    <span className="font-semibold">Name:</span> {getSelectedProductName()}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">SKU:</span> {formData.sku}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard/inventory")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {existingInventory ? "Update" : "Save"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}