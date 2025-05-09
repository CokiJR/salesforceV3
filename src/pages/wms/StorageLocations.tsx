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
import { Loader2, Plus, Search, Pencil, Trash2, Warehouse } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StorageLocationForm } from "./components/StorageLocationForm";

interface StorageLocation {
  id: string;
  warehouse_code: string;
  warehouse_name?: string;
  location_code: string;
  location_type: 'RECEIVING' | 'STORAGE' | 'PICKING' | 'SHIPPING' | 'DAMAGE';
  max_capacity: number;
  current_quantity: number;
  is_active: boolean;
}

export default function StorageLocations() {
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [warehouses, setWarehouses] = useState<{code: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<StorageLocation | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchWarehouses();
    fetchLocations();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const { data, error } = await supabase
        .from("warehouses")
        .select("code, name")
        .order("name");

      if (error) throw error;
      setWarehouses(data || []);
    } catch (error: any) {
      console.error("Error fetching warehouses:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat data gudang: ${error.message}`,
      });
    }
  };

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("storage_locations")
        .select(`
          *,
          warehouses:warehouse_code (name)
        `)
        .order("warehouse_code")
        .order("location_code");

      if (error) throw error;
      
      // Transform data to include warehouse_name
      const transformedData = data?.map(item => ({
        ...item,
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
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocation = () => {
    setSelectedLocation(null);
    setShowForm(true);
  };

  const handleEditLocation = (location: StorageLocation) => {
    setSelectedLocation(location);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedLocation(null);
  };

  const handleFormSubmit = async (formData: Omit<StorageLocation, "id">) => {
    try {
      if (selectedLocation) {
        // Update existing location
        const { error } = await supabase
          .from("storage_locations")
          .update({
            warehouse_code: formData.warehouse_code,
            location_code: formData.location_code,
            location_type: formData.location_type,
            max_capacity: formData.max_capacity,
            is_active: formData.is_active,
          })
          .eq("id", selectedLocation.id);

        if (error) throw error;

        toast({
          title: "Lokasi berhasil diperbarui",
          description: "Data lokasi penyimpanan telah diperbarui.",
        });
      } else {
        // Create new location
        const { error } = await supabase.from("storage_locations").insert({
          warehouse_code: formData.warehouse_code,
          location_code: formData.location_code,
          location_type: formData.location_type,
          max_capacity: formData.max_capacity,
          current_quantity: 0,
          is_active: formData.is_active,
        });

        if (error) throw error;

        toast({
          title: "Lokasi berhasil ditambahkan",
          description: "Lokasi penyimpanan baru telah ditambahkan.",
        });
      }

      // Refresh the list and close the form
      fetchLocations();
      handleFormClose();
    } catch (error: any) {
      console.error("Error saving storage location:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal menyimpan lokasi penyimpanan: ${error.message}`,
      });
    }
  };

  const confirmDelete = (id: string) => {
    setLocationToDelete(id);
  };

  const handleDeleteLocation = async () => {
    if (!locationToDelete) return;
    
    try {
      const { error } = await supabase
        .from("storage_locations")
        .delete()
        .eq("id", locationToDelete);

      if (error) throw error;

      toast({
        title: "Lokasi berhasil dihapus",
        description: "Lokasi penyimpanan telah dihapus.",
      });

      // Refresh the list
      fetchLocations();
      setLocationToDelete(null);
    } catch (error: any) {
      console.error("Error deleting storage location:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal menghapus lokasi penyimpanan: ${error.message}`,
      });
    }
  };

  const getLocationTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'RECEIVING': 'Penerimaan',
      'STORAGE': 'Penyimpanan',
      'PICKING': 'Pengambilan',
      'SHIPPING': 'Pengiriman',
      'DAMAGE': 'Barang Rusak'
    };
    return types[type] || type;
  };

  const getLocationTypeBadgeStyle = (type: string) => {
    switch (type) {
      case 'RECEIVING':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'STORAGE':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'PICKING':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'SHIPPING':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'DAMAGE':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const filteredLocations = locations.filter(location => {
    // Filter by search query
    const matchesSearch = 
      location.location_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.warehouse_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (location.warehouse_name && location.warehouse_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by warehouse
    const matchesWarehouse = warehouseFilter === 'all' || location.warehouse_code === warehouseFilter;
    
    // Filter by location type
    const matchesType = typeFilter === 'all' || location.location_type === typeFilter;
    
    return matchesSearch && matchesWarehouse && matchesType;
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Lokasi Penyimpanan</h2>
          <p className="text-muted-foreground">
            Kelola lokasi penyimpanan di gudang
          </p>
        </div>
        <Button onClick={handleAddLocation}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Lokasi
        </Button>
      </div>

      {showForm && (
        <StorageLocationForm
          location={selectedLocation}
          warehouses={warehouses}
          onSubmit={handleFormSubmit}
          onCancel={handleFormClose}
        />
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Daftar Lokasi Penyimpanan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari lokasi..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-64">
              <Select
                value={warehouseFilter}
                onValueChange={setWarehouseFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter gudang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Gudang</SelectItem>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.code} value={warehouse.code}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  <SelectItem value="STORAGE">Penyimpanan</SelectItem>
                  <SelectItem value="PICKING">Pengambilan</SelectItem>
                  <SelectItem value="SHIPPING">Pengiriman</SelectItem>
                  <SelectItem value="DAMAGE">Barang Rusak</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLocations.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode Lokasi</TableHead>
                    <TableHead>Gudang</TableHead>
                    <TableHead>Tipe Lokasi</TableHead>
                    <TableHead>Kapasitas</TableHead>
                    <TableHead>Terisi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLocations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium">
                        {location.location_code}
                      </TableCell>
                      <TableCell>{location.warehouse_name || location.warehouse_code}</TableCell>
                      <TableCell>
                        <Badge className={getLocationTypeBadgeStyle(location.location_type)}>
                          {getLocationTypeLabel(location.location_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>{location.max_capacity}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-full max-w-24 bg-gray-200 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${location.current_quantity > location.max_capacity ? 'bg-red-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.min(100, (location.current_quantity / location.max_capacity) * 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs">{location.current_quantity}/{location.max_capacity}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={location.is_active ? "default" : "outline"}>
                          {location.is_active ? "Aktif" : "Tidak Aktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditLocation(location)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => confirmDelete(location.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Lokasi Penyimpanan</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus lokasi {location.location_code}? Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground"
                                  onClick={handleDeleteLocation}
                                >
                                  Hapus
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
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Warehouse className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <p className="text-lg font-medium">Tidak ada lokasi penyimpanan</p>
              <p className="text-muted-foreground mb-4">
                Belum ada lokasi penyimpanan yang ditambahkan atau sesuai dengan filter.
              </p>
              <Button onClick={handleAddLocation}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Lokasi Penyimpanan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}