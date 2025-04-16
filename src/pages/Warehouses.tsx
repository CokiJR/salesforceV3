import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
import { Loader2, Warehouse as WarehouseIcon, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { WarehouseForm } from "./warehouses/components/WarehouseForm";

const Warehouses = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [warehouseToDelete, setWarehouseToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleAddWarehouse = () => {
    setSelectedWarehouse(null);
    setShowForm(true);
  };

  const handleEditWarehouse = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedWarehouse(null);
  };

  const handleFormSubmit = async (formData: Omit<Warehouse, "created_at" | "updated_at">) => {
    try {
      if (selectedWarehouse) {
        // Update existing warehouse
        const { error } = await supabase
          .from("warehouses")
          .update({
            name: formData.name,
            location: formData.location,
            updated_at: new Date().toISOString(),
          })
          .eq("code", selectedWarehouse.code);

        if (error) throw error;

        toast({
          title: "Warehouse updated",
          description: "The warehouse has been updated successfully.",
        });
      } else {
        // Create new warehouse
        const { error } = await supabase.from("warehouses").insert({
          code: formData.code,
          name: formData.name,
          location: formData.location,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;

        toast({
          title: "Warehouse added",
          description: "The warehouse has been added successfully.",
        });
      }

      // Refresh the list and close the form
      fetchWarehouses();
      handleFormClose();
    } catch (error: any) {
      console.error("Error saving warehouse:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to save warehouse: ${error.message}`,
      });
    }
  };

  const confirmDelete = (code: string) => {
    setWarehouseToDelete(code);
  };

  const handleDeleteWarehouse = async () => {
    if (!warehouseToDelete) return;
    
    try {
      const { error } = await supabase
        .from("warehouses")
        .delete()
        .eq("code", warehouseToDelete);

      if (error) throw error;

      toast({
        title: "Warehouse deleted",
        description: "The warehouse has been deleted successfully.",
      });

      // Refresh the list
      fetchWarehouses();
      setWarehouseToDelete(null);
    } catch (error: any) {
      console.error("Error deleting warehouse:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete warehouse: ${error.message}`,
      });
    }
  };

  const filteredWarehouses = warehouses.filter(warehouse => 
    warehouse.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    warehouse.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (warehouse.location && warehouse.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Warehouses</h2>
          <p className="text-muted-foreground">
            Manage your warehouse locations
          </p>
        </div>
        <Button onClick={handleAddWarehouse}>
          <Plus className="mr-2 h-4 w-4" />
          Add Warehouse
        </Button>
      </div>

      {showForm && (
        <WarehouseForm
          warehouse={selectedWarehouse}
          onSubmit={handleFormSubmit}
          onCancel={handleFormClose}
        />
      )}

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search warehouses..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Warehouse Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredWarehouses.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWarehouses.map((warehouse) => (
                    <TableRow key={warehouse.code}>
                      <TableCell className="font-medium">{warehouse.code}</TableCell>
                      <TableCell>{warehouse.name}</TableCell>
                      <TableCell>{warehouse.location || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditWarehouse(warehouse)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the warehouse "{warehouse.name}" (Code: {warehouse.code}).
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => confirmDelete(warehouse.code)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <WarehouseIcon className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No warehouses found</h3>
              <p className="text-muted-foreground mt-1">
                {searchQuery ? "Try a different search term" : "Add your first warehouse to get started"}
              </p>
              {!searchQuery && (
                <Button onClick={handleAddWarehouse} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Warehouse
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!warehouseToDelete} onOpenChange={() => setWarehouseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this warehouse? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteWarehouse}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Warehouses;