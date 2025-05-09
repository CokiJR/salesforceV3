import React, { useState, useEffect } from "react";
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
import { Loader2, Search, Download, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

interface StockAvailability {
  sku: string;
  product_name: string;
  warehouse_code: string;
  warehouse_name: string;
  on_hand: number;
  uom: string;
  min_stock_level: number | null;
  max_stock_level: number | null;
  stock_status: 'LOW' | 'NORMAL' | 'OVER';
}

interface MovementHistory {
  id: string;
  sku: string;
  product_name: string;
  movement_type: string;
  quantity: number;
  uom: string;
  from_warehouse_code: string | null;
  from_warehouse_name: string | null;
  from_location: string | null;
  to_warehouse_code: string | null;
  to_warehouse_name: string | null;
  to_location: string | null;
  reference_doc: string | null;
  movement_time: string;
  user_id: string | null;
}

export default function WMSReports() {
  const [activeTab, setActiveTab] = useState("stock");
  const [stockData, setStockData] = useState<StockAvailability[]>([]);
  const [movementData, setMovementData] = useState<MovementHistory[]>([]);
  const [warehouses, setWarehouses] = useState<{code: string, name: string}[]>([]);
  const [loadingStock, setLoadingStock] = useState(true);
  const [loadingMovements, setLoadingMovements] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchWarehouses();
    if (activeTab === "stock") {
      fetchStockData();
    } else if (activeTab === "movements") {
      fetchMovementData();
    }
  }, [activeTab]);

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

  const fetchStockData = async () => {
    try {
      setLoadingStock(true);
      const { data, error } = await supabase
        .from("stock_availability_view")
        .select("*")
        .order("warehouse_code")
        .order("product_name");

      if (error) throw error;
      setStockData(data || []);
    } catch (error: any) {
      console.error("Error fetching stock data:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat data stok: ${error.message}`,
      });
    } finally {
      setLoadingStock(false);
    }
  };

  const fetchMovementData = async () => {
    try {
      setLoadingMovements(true);
      const { data, error } = await supabase
        .from("movement_history_view")
        .select("*")
        .order("movement_time", { ascending: false });

      if (error) throw error;
      setMovementData(data || []);
    } catch (error: any) {
      console.error("Error fetching movement data:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat data perpindahan: ${error.message}`,
      });
    } finally {
      setLoadingMovements(false);
    }
  };

  const handleExportStock = () => {
    try {
      const filteredData = filteredStockData;
      if (filteredData.length === 0) {
        toast({
          variant: "destructive",
          title: "Tidak ada data",
          description: "Tidak ada data yang dapat diekspor.",
        });
        return;
      }

      // Convert data to CSV
      const headers = ["SKU", "Nama Produk", "Gudang", "Stok", "Satuan", "Min Stok", "Max Stok", "Status"];
      const csvContent = [
        headers.join(","),
        ...filteredData.map(item => [
          `"${item.sku}"`,
          `"${item.product_name}"`,
          `"${item.warehouse_name}"`,
          item.on_hand,
          item.uom,
          item.min_stock_level || "",
          item.max_stock_level || "",
          item.stock_status
        ].join(","))
      ].join("\n");

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `stock_report_${format(new Date(), "yyyyMMdd")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Ekspor berhasil",
        description: "Data stok berhasil diekspor ke CSV.",
      });
    } catch (error: any) {
      console.error("Error exporting stock data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal mengekspor data stok.",
      });
    }
  };

  const handleExportMovements = () => {
    try {
      const filteredData = filteredMovementData;
      if (filteredData.length === 0) {
        toast({
          variant: "destructive",
          title: "Tidak ada data",
          description: "Tidak ada data yang dapat diekspor.",
        });
        return;
      }

      // Convert data to CSV
      const headers = ["Tanggal", "Tipe", "SKU", "Produk", "Dari Lokasi", "Dari Gudang", "Ke Lokasi", "Ke Gudang", "Jumlah", "Satuan", "Referensi", "Operator"];
      const csvContent = [
        headers.join(","),
        ...filteredData.map(item => [
          format(new Date(item.movement_time), "yyyy-MM-dd HH:mm:ss"),
          `"${item.movement_type}"`,
          `"${item.sku}"`,
          `"${item.product_name}"`,
          `"${item.from_location || ''}"`,
          `"${item.from_warehouse_name || ''}"`,
          `"${item.to_location || ''}"`,
          `"${item.to_warehouse_name || ''}"`,
          item.quantity,
          item.uom,
          `"${item.reference_doc || ''}"`,
          `"${item.user_id || ''}"`
        ].join(","))
      ].join("\n");

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `movement_report_${format(new Date(), "yyyyMMdd")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Ekspor berhasil",
        description: "Data perpindahan berhasil diekspor ke CSV.",
      });
    } catch (error: any) {
      console.error("Error exporting movement data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal mengekspor data perpindahan.",
      });
    }
  };

  const getStockStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'LOW':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'NORMAL':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'OVER':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getStockStatusLabel = (status: string) => {
    const statuses: Record<string, string> = {
      'LOW': 'Rendah',
      'NORMAL': 'Normal',
      'OVER': 'Berlebih'
    };
    return statuses[status] || status;
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

  // Filter stock data
  const filteredStockData = stockData.filter(item => {
    // Filter by search query
    const matchesSearch = 
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.warehouse_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.warehouse_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by warehouse
    const matchesWarehouse = warehouseFilter === 'all' || item.warehouse_code === warehouseFilter;
    
    // Filter by status
    const matchesStatus = statusFilter === 'all' || item.stock_status === statusFilter;
    
    return matchesSearch && matchesWarehouse && matchesStatus;
  });

  // Filter movement data
  const filteredMovementData = movementData.filter(item => {
    // Filter by search query
    const matchesSearch = 
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.reference_doc && item.reference_doc.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.from_location && item.from_location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.to_location && item.to_location.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by warehouse (check both from and to warehouses)
    const matchesWarehouse = warehouseFilter === 'all' || 
      (item.from_warehouse_code && item.from_warehouse_code === warehouseFilter) ||
      (item.to_warehouse_code && item.to_warehouse_code === warehouseFilter);
    
    // Filter by movement type
    const matchesType = movementTypeFilter === 'all' || item.movement_type === movementTypeFilter;
    
    return matchesSearch && matchesWarehouse && matchesType;
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Laporan WMS</h2>
        <p className="text-muted-foreground">
          Laporan ketersediaan stok dan riwayat perpindahan barang
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="stock">Ketersediaan Stok</TabsTrigger>
          <TabsTrigger value="movements">Riwayat Perpindahan</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stock">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle>Laporan Ketersediaan Stok</CardTitle>
              <Button variant="outline" onClick={handleExportStock}>
                <Download className="mr-2 h-4 w-4" />
                Ekspor CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari berdasarkan SKU, produk, atau gudang..."
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
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="LOW">Stok Rendah</SelectItem>
                      <SelectItem value="NORMAL">Stok Normal</SelectItem>
                      <SelectItem value="OVER">Stok Berlebih</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {loadingStock ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredStockData.length > 0 ? (
                <div className="border rounded-md overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Produk</TableHead>
                        <TableHead>Gudang</TableHead>
                        <TableHead>Stok</TableHead>
                        <TableHead>Min</TableHead>
                        <TableHead>Max</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStockData.map((item, index) => (
                        <TableRow key={`${item.sku}-${item.warehouse_code}-${index}`}>
                          <TableCell className="font-medium">{item.sku}</TableCell>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell>{item.warehouse_name}</TableCell>
                          <TableCell>
                            <div className="font-medium">{item.on_hand}</div>
                            <div className="text-xs text-muted-foreground">{item.uom}</div>
                          </TableCell>
                          <TableCell>{item.min_stock_level || "-"}</TableCell>
                          <TableCell>{item.max_stock_level || "-"}</TableCell>
                          <TableCell>
                            <Badge className={getStockStatusBadgeStyle(item.stock_status)}>
                              {getStockStatusLabel(item.stock_status)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                  <p className="text-lg font-medium">Tidak ada data stok</p>
                  <p className="text-muted-foreground mb-4">
                    Tidak ada data stok yang tersedia atau sesuai dengan filter.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="movements">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle>Laporan Riwayat Perpindahan</CardTitle>
              <Button variant="outline" onClick={handleExportMovements}>
                <Download className="mr-2 h-4 w-4" />
                Ekspor CSV
              </Button>
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
                    value={movementTypeFilter}
                    onValueChange={setMovementTypeFilter}
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
              
              {loadingMovements ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredMovementData.length > 0 ? (
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMovementData.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(item.movement_time), "dd MMM yyyy HH:mm")}
                          </TableCell>
                          <TableCell>
                            <Badge className={getMovementTypeBadgeStyle(item.movement_type)}>
                              {getMovementTypeLabel(item.movement_type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{item.product_name}</div>
                            <div className="text-xs text-muted-foreground">{item.sku}</div>
                          </TableCell>
                          <TableCell>
                            {item.from_location ? (
                              <div>
                                <div>{item.from_location}</div>
                                <div className="text-xs text-muted-foreground">{item.from_warehouse_name}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.to_location ? (
                              <div>
                                <div>{item.to_location}</div>
                                <div className="text-xs text-muted-foreground">{item.to_warehouse_name}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{item.quantity}</div>
                            <div className="text-xs text-muted-foreground">{item.uom}</div>
                          </TableCell>
                          <TableCell>
                            {item.reference_doc || <span className="text-muted-foreground">-</span>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                  <p className="text-lg font-medium">Tidak ada data perpindahan</p>
                  <p className="text-muted-foreground mb-4">
                    Tidak ada data perpindahan yang tersedia atau sesuai dengan filter.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}