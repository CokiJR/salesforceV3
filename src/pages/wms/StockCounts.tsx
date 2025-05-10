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
import { Loader2, Plus, Search, ClipboardCheck, Eye, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { StockCountForm } from "./components/StockCountForm";
import { StockCountDetail } from "./components/StockCountDetail";

interface StockCount {
  id: string;
  warehouse_code: string;
  warehouse_name?: string;
  count_date: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';
  completed_by: string | null;
  completed_at: string | null;
  item_count?: number;
}

export default function StockCounts() {
  const [stockCounts, setStockCounts] = useState<StockCount[]>([]);
  const [warehouses, setWarehouses] = useState<{code: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [selectedCountId, setSelectedCountId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchWarehouses();
    fetchStockCounts();
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

  const fetchStockCounts = async () => {
    try {
      setLoading(true);
      // Fetch stock counts with warehouse name and count of items
      const { data, error } = await supabase
        .from("stock_counts")
        .select(`
          *,
          warehouses:warehouse_code (name),
          stock_count_details:stock_count_details (count)
        `)
        .order("count_date", { ascending: false });

      if (error) throw error;
      
      // Transform data to include warehouse_name and item_count
      const transformedData = data?.map(item => ({
        ...item,
        warehouse_name: item.warehouses?.name,
        item_count: item.stock_count_details?.length || 0
      })) || [];
      
      setStockCounts(transformedData);
    } catch (error: any) {
      console.error("Error fetching stock counts:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat data stok opname: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStockCount = () => {
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
  };

  const handleFormSubmit = async (formData: { warehouse_code: string, count_date: string }) => {
    try {
      const { error } = await supabase.from("stock_counts").insert({
        warehouse_code: formData.warehouse_code,
        count_date: formData.count_date,
        status: "DRAFT"
      });

      if (error) throw error;

      toast({
        title: "Stok opname berhasil dibuat",
        description: "Data stok opname telah disimpan dalam status draft.",
      });

      // Refresh the list and close the form
      fetchStockCounts();
      handleFormClose();
    } catch (error: any) {
      console.error("Error saving stock count:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal menyimpan stok opname: ${error.message}`,
      });
    }
  };

  const handleViewStockCount = (id: string) => {
    setSelectedCountId(id);
  };
  
  const handleBackFromDetail = () => {
    setSelectedCountId(null);
    fetchStockCounts(); // Refresh data when returning from detail view
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    const statuses: Record<string, string> = {
      'DRAFT': 'Draft',
      'IN_PROGRESS': 'Sedang Berlangsung',
      'COMPLETED': 'Selesai'
    };
    return statuses[status] || status;
  };

  const filteredStockCounts = stockCounts.filter(stockCount => {
    // Filter by search query
    const matchesSearch = 
      stockCount.warehouse_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (stockCount.warehouse_name && stockCount.warehouse_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by status
    const matchesStatus = statusFilter === 'all' || stockCount.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4 animate-fade-in">
      {selectedCountId ? (
        <StockCountDetail countId={selectedCountId} onBack={handleBackFromDetail} />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Stok Opname</h2>
              <p className="text-muted-foreground">
                Kelola dan lakukan stok opname di gudang
              </p>
            </div>
            <Button onClick={handleAddStockCount}>
              <Plus className="mr-2 h-4 w-4" />
              Buat Stok Opname
            </Button>
          </div>

          {showForm && (
            <StockCountForm
              warehouses={warehouses}
              onSubmit={handleFormSubmit}
              onCancel={handleFormClose}
            />
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Daftar Stok Opname</CardTitle>
            </CardHeader>
            <CardContent>
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan gudang..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="IN_PROGRESS">Sedang Berlangsung</SelectItem>
                  <SelectItem value="COMPLETED">Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredStockCounts.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Gudang</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Jumlah Item</TableHead>
                    <TableHead>Diselesaikan Oleh</TableHead>
                    <TableHead>Waktu Selesai</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStockCounts.map((stockCount) => (
                    <TableRow key={stockCount.id}>
                      <TableCell className="font-medium">
                        {format(new Date(stockCount.count_date), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell>{stockCount.warehouse_name || stockCount.warehouse_code}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeStyle(stockCount.status)}>
                          {getStatusLabel(stockCount.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{stockCount.item_count}</TableCell>
                      <TableCell>
                        {stockCount.completed_by || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        {stockCount.completed_at 
                          ? format(new Date(stockCount.completed_at), "dd MMM yyyy HH:mm")
                          : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewStockCount(stockCount.id)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Lihat
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <p className="text-lg font-medium">Tidak ada data stok opname</p>
              <p className="text-muted-foreground mb-4">
                Belum ada stok opname yang dibuat atau sesuai dengan filter.
              </p>
              <Button onClick={handleAddStockCount}>
                <Plus className="mr-2 h-4 w-4" />
                Buat Stok Opname Baru
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
}