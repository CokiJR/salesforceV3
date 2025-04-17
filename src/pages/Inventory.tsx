import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Inventory, InventoryWithDetails, InventoryFilters } from "@/types/inventory";
import { Warehouse } from "@/types";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Plus, Search, Filter, RefreshCw } from "lucide-react";

const InventoryPage = () => {
  const [inventory, setInventory] = useState<InventoryWithDetails[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<InventoryFilters>({
    searchQuery: "",
    warehouseCode: "",
    lowStock: false
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchWarehouses();
    fetchInventory();
  }, []);

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

  const fetchInventory = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const handleAddInventory = () => {
    navigate("/dashboard/inventory/add");
  };

  const handleRefresh = () => {
    fetchInventory();
    toast({
      title: "Refreshed",
      description: "Inventory data has been refreshed",
    });
  };

  const handleWarehouseFilter = (warehouseCode: string) => {
    setFilters(prev => ({ ...prev, warehouseCode }));
  };

  const handleLowStockFilter = () => {
    setFilters(prev => ({ ...prev, lowStock: !prev.lowStock }));
  };

  const filteredInventory = inventory.filter(item => {
    // Apply search filter
    const matchesSearch = 
      !filters.searchQuery ||
      item.product?.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      item.product?.sku.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      item.warehouse?.name.toLowerCase().includes(filters.searchQuery.toLowerCase());
    
    // Apply warehouse filter
    const matchesWarehouse = !filters.warehouseCode || item.warehouse_code === filters.warehouseCode;
    
    // Apply low stock filter (less than 10 items)
    const matchesLowStock = !filters.lowStock || item.quantity < 10;
    
    return matchesSearch && matchesWarehouse && matchesLowStock;
  });

  const getStockStatusBadge = (quantity: number) => {
    if (quantity <= 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (quantity < 10) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Low Stock</Badge>;
    } else {
      return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">In Stock</Badge>;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
          <p className="text-muted-foreground">
            Manage your product inventory across warehouses
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleAddInventory}>
            <Plus className="mr-2 h-4 w-4" />
            Add Inventory
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Inventory Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by product name, SKU or warehouse..."
                className="pl-10"
                value={filters.searchQuery}
                onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              />
            </div>
            <div className="w-full md:w-64">
              <Select
                value={filters.warehouseCode}
                onValueChange={handleWarehouseFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by warehouse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Warehouses</SelectItem>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.code} value={warehouse.code}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant={filters.lowStock ? "default" : "outline"}
              onClick={handleLowStockFilter}
              className="w-full md:w-auto"
            >
              <Filter className="mr-2 h-4 w-4" />
              Low Stock
            </Button>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredInventory.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>UOM</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => (
                    <TableRow 
                      key={item.id} 
                      className="cursor-pointer hover:bg-muted/60"
                    >
                      <TableCell className="font-medium">{item.product?.name || 'N/A'}</TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>{item.warehouse?.name || 'N/A'}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.uom}</TableCell>
                      <TableCell>{getStockStatusBadge(item.quantity)}</TableCell>
                      <TableCell>
                        {new Date(item.last_updated_at).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-muted p-3">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No inventory found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {filters.searchQuery || filters.warehouseCode || filters.lowStock ? 
                  "Try adjusting your filters" : 
                  "Get started by adding your first inventory record"}
              </p>
              {!filters.searchQuery && !filters.warehouseCode && !filters.lowStock && (
                <Button onClick={handleAddInventory} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Inventory
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryPage;