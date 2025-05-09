import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Search, ArrowRightLeft, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { InventoryMovementForm } from "./components/InventoryMovementForm";

interface InventoryMovement {
  id: string;
  sku: string;
  product_name?: string;
  from_location: string | null;
  from_warehouse_name?: string;
  to_location: string | null;
  to_warehouse_name?: string;
  quantity: number;
  uom: string;
  movement_type: 'RECEIVING' | 'PUTAWAY' | 'PICKING' | 'TRANSFER' | 'ADJUSTMENT';
  reference_doc: string | null;
  movement_time: string;
  user_id: string | null;
}

export default function InventoryMovements() {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [products, setProducts] = useState<{sku: string, name: string}[]>([]);
  const [locations, setLocations] = useState<{location_code: string, warehouse_code: string, warehouse_name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    fetchLocations();
    fetchMovements();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("sku, name")
        .order("name");

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error("Error fetching products:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat data produk: ${error.message}`,
      });
    }
  };

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from("storage_locations")
        .select(`
          location_code,
          warehouse_code,
          warehouses:warehouse_code (name)
        `)
        .eq("is_active", true)
        .order("location_code");

      if (error) throw error;
      
      // Transform data to include warehouse_name
      const transformedData = data?.map(item => ({
        location_code: item.location_code,
        warehouse_code: item.warehouse_code,
        warehouse_name: item.warehouses?.name
      })) || [];
      
      setLocations(transformedData);
    } catch (error: any) {
      console.error("Error fetching storage locations:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat lokasi penyimpanan: ${error.message}`,
      });
    }
  };

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("movement_history_view")
        .select("*")
        .order("movement_time", { ascending: false });

      if (error) throw error;
      setMovements(data || []);
    } catch (error: any) {
      console.error("Error fetching inventory movements:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat data perpindahan barang: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMovement = () => {
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
  };

  const handleFormSubmit = async (formData: Omit<InventoryMovement, "id" | "movement_time" | "product_name" | "from_warehouse_name" | "to_warehouse_name">) => {
    try {
      const { error } = await supabase.from("inventory_movements").insert({
        sku: formData.sku,
        from_location: formData.from_location,
        to_location: formData.to_location,
        quantity: formData.quantity,
        uom: formData.uom,
        movement_type: formData.movement_type,
        reference_doc: formData.reference_doc,
        user_id: formData.user_id,
      });

      if (error) throw error;

      toast({
        title: "Perpindahan barang berhasil dicatat",
        description: "Data perpindahan barang telah disimpan.",
      });

      // Refresh the list and close the form
      fetchMovements();
      handleFormClose();
    } catch (error: any) {
      console.error("Error saving inventory movement:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal menyimpan perpindahan barang: ${error.message}`,
      });
    }
  };

  const getMovementTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'RECEIVING': 'Penerimaan',
      'PUTAWAY': 'Penyimpanan',
      'PICKING': 'Pengambilan',
      'TRANSFER': 'Transfer',
      'ADJUSTMENT': 'Penyesuaian'
    };
    return types[type] || type;
  };

  const getMovementTypeBadgeStyle = (type: string) => {
    switch (type) {
      case 'RECEIVING':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'PUTAWAY':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'PICKING':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'TRANSFER':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'ADJUSTMENT':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const filteredMovements = movements.filter(movement => {
    // Filter by search query
    const matchesSearch = 
      movement.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (movement.product_name && movement.product_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (movement.reference_doc && movement.reference_doc.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (movement.from_location && movement.from_location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (movement.to_location && movement.to_location.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by movement type
    const matchesType = typeFilter === 'all' || movement.movement_type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Perpindahan Barang</h2>
          <p className="text-muted-foreground">
            Catat dan kelola perpindahan barang antar lokasi
          </p>
        </div>
        <Button onClick={handleAddMovement}>
          <Plus className="mr-2 h-4 w-4" />
          Catat Perpindahan
        </Button>
      </div>

      {showForm && (
        <InventoryMovementForm
          products={products}
          locations={locations}
          onSubmit={handleFormSubmit}
          onCancel={handleFormClose}
        />
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Riwayat Perpindahan Barang</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan SKU, produk, atau referensi..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-64">
              <Select
                value={typeFilter}
                onValueChange={setTypeFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="RECEIVING">Penerimaan</SelectItem>
                  <SelectItem value="PUTAWAY">Penyimpanan</SelectItem>
                  <SelectItem value="PICKING">Pengambilan</SelectItem>
                  <SelectItem value="TRANSFER">Transfer</SelectItem>
                  <SelectItem value="ADJUSTMENT">Penyesuaian</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMovements.length > 0 ? (
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>Dari</TableHead>
                    <TableHead>Ke</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Referensi</TableHead>
                    <TableHead>Operator</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(movement.movement_time), "dd MMM yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <Badge className={getMovementTypeBadgeStyle(movement.movement_type)}>
                          {getMovementTypeLabel(movement.movement_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{movement.product_name}</div>
                        <div className="text-xs text-muted-foreground">{movement.sku}</div>
                      </TableCell>
                      <TableCell>
                        {movement.from_location ? (
                          <div>
                            <div>{movement.from_location}</div>
                            <div className="text-xs text-muted-foreground">{movement.from_warehouse_name}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {movement.to_location ? (
                          <div>
                            <div>{movement.to_location}</div>
                            <div className="text-xs text-muted-foreground">{movement.to_warehouse_name}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{movement.quantity}</div>
                        <div className="text-xs text-muted-foreground">{movement.uom}</div>
                      </TableCell>
                      <TableCell>
                        {movement.reference_doc || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        {movement.user_id || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ArrowRightLeft className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <p className="text-lg font-medium">Tidak ada data perpindahan</p>
              <p className="text-muted-foreground mb-4">
                Belum ada perpindahan barang yang dicatat atau sesuai dengan filter.
              </p>
              <Button onClick={handleAddMovement}>
                <Plus className="mr-2 h-4 w-4" />
                Catat Perpindahan Baru
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}