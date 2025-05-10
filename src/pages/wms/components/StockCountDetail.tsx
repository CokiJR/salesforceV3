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
import { Loader2, Save, ArrowLeft, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { useAuthentication } from "@/hooks/useAuthentication";

interface StockCount {
  id: string;
  warehouse_code: string;
  warehouse_name?: string;
  count_date: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';
  completed_by: string | null;
  completed_at: string | null;
}

interface StockCountDetail {
  id: string;
  count_id: string;
  sku: string;
  product_name?: string;
  location_code: string | null;
  system_quantity: number;
  counted_quantity: number | null;
  variance: number | null;
}

interface StockCountDetailProps {
  countId: string;
  onBack: () => void;
}

export function StockCountDetail({ countId, onBack }: StockCountDetailProps) {
  const [stockCount, setStockCount] = useState<StockCount | null>(null);
  const [details, setDetails] = useState<StockCountDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const { user } = useAuthentication();

  useEffect(() => {
    fetchStockCount();
    fetchStockCountDetails();
  }, [countId]);

  const fetchStockCount = async () => {
    try {
      const { data, error } = await supabase
        .from("stock_counts")
        .select(`
          *,
          warehouses:warehouse_code (name)
        `)
        .eq("id", countId)
        .single();

      if (error) throw error;
      
      setStockCount({
        ...data,
        warehouse_name: data.warehouses?.name
      });
    } catch (error: any) {
      console.error("Error fetching stock count:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat data stok opname: ${error.message}`,
      });
    }
  };

  const fetchStockCountDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("stock_count_details")
        .select(`
          *,
          products:sku (name)
        `)
        .eq("count_id", countId)
        .order("sku");

      if (error) throw error;
      
      // Transform data to include product_name
      const transformedData = data?.map(item => ({
        ...item,
        product_name: item.products?.name
      })) || [];
      
      setDetails(transformedData);
    } catch (error: any) {
      console.error("Error fetching stock count details:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat detail stok opname: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCountedQuantityChange = (id: string, value: number) => {
    setDetails(prev => 
      prev.map(detail => 
        detail.id === id ? { ...detail, counted_quantity: value } : detail
      )
    );
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      
      // Filter only details with counted_quantity
      const detailsToUpdate = details
        .filter(detail => detail.counted_quantity !== null)
        .map(({ id, counted_quantity }) => ({
          id,
          counted_quantity
        }));
      
      if (detailsToUpdate.length === 0) {
        toast({
          variant: "destructive",
          title: "Tidak ada perubahan",
          description: "Tidak ada data yang perlu disimpan.",
        });
        return;
      }

      // Update details
      const { error: updateError } = await supabase
        .from("stock_count_details")
        .upsert(detailsToUpdate);

      if (updateError) throw updateError;

      // Update stock count status if it's still DRAFT
      if (stockCount?.status === 'DRAFT') {
        const { error: statusError } = await supabase
          .from("stock_counts")
          .update({ status: 'IN_PROGRESS' })
          .eq("id", countId);

        if (statusError) throw statusError;
        
        // Update local state
        setStockCount(prev => prev ? { ...prev, status: 'IN_PROGRESS' } : null);
      }

      toast({
        title: "Data berhasil disimpan",
        description: `${detailsToUpdate.length} item telah diperbarui.`,
      });

      // Refresh data
      fetchStockCountDetails();
    } catch (error: any) {
      console.error("Error saving stock count details:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal menyimpan data: ${error.message}`,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    try {
      setSaving(true);
      
      // Check if all items have been counted
      const uncountedItems = details.filter(detail => detail.counted_quantity === null);
      if (uncountedItems.length > 0) {
        toast({
          variant: "destructive",
          title: "Tidak dapat menyelesaikan",
          description: `${uncountedItems.length} item belum dihitung. Semua item harus dihitung sebelum menyelesaikan.`,
        });
        return;
      }

      // Update stock count status to COMPLETED
      const { error } = await supabase
        .from("stock_counts")
        .update({
          status: 'COMPLETED',
          completed_by: user?.id || null,
          completed_at: new Date().toISOString()
        })
        .eq("id", countId);

      if (error) throw error;
      
      // Update local state
      setStockCount(prev => prev ? {
        ...prev,
        status: 'COMPLETED',
        completed_by: user?.id || null,
        completed_at: new Date().toISOString()
      } : null);

      toast({
        title: "Stok opname selesai",
        description: "Stok opname telah berhasil diselesaikan.",
      });
    } catch (error: any) {
      console.error("Error completing stock count:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal menyelesaikan stok opname: ${error.message}`,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    try {
      if (details.length === 0) {
        toast({
          variant: "destructive",
          title: "Tidak ada data",
          description: "Tidak ada data yang dapat diekspor.",
        });
        return;
      }

      // Convert data to CSV
      const headers = ["SKU", "Nama Produk", "Lokasi", "Jumlah Sistem", "Jumlah Dihitung", "Selisih"];
      const csvContent = [
        headers.join(","),
        ...details.map(item => [
          `"${item.sku}"`,
          `"${item.product_name || ''}"`,
          `"${item.location_code || ''}"`,
          item.system_quantity,
          item.counted_quantity || "",
          item.variance || ""
        ].join(","))
      ].join("\n");

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `stock_count_${countId}_${format(new Date(), "yyyyMMdd")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Ekspor berhasil",
        description: "Data stok opname berhasil diekspor ke CSV.",
      });
    } catch (error: any) {
      console.error("Error exporting stock count data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal mengekspor data stok opname.",
      });
    }
  };

  // Filter details based on search query
  const filteredDetails = details.filter(detail =>
    detail.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (detail.product_name && detail.product_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (detail.location_code && detail.location_code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Calculate summary
  const totalItems = details.length;
  const countedItems = details.filter(d => d.counted_quantity !== null).length;
  const totalVariance = details.reduce((sum, detail) => sum + (detail.variance || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </Button>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Ekspor CSV
          </Button>
          {stockCount?.status !== 'COMPLETED' && (
            <Button onClick={handleSaveAll} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Simpan Semua
            </Button>
          )}
          {stockCount?.status === 'IN_PROGRESS' && (
            <Button variant="default" onClick={handleComplete} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Selesaikan Stok Opname
            </Button>
          )}
        </div>
      </div>

      {stockCount && (
        <Card>
          <CardHeader>
            <CardTitle>Detail Stok Opname</CardTitle>
            <CardDescription>
              Gudang: {stockCount.warehouse_name} | 
              Tanggal: {format(new Date(stockCount.count_date), "dd MMMM yyyy")} | 
              Status: <Badge variant={stockCount.status === 'COMPLETED' ? "default" : "outline"}>{stockCount.status}</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm font-medium">Total Item</p>
                <p className="text-2xl font-bold">{totalItems}</p>
              </div>
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm font-medium">Item Terhitung</p>
                <p className="text-2xl font-bold">{countedItems} dari {totalItems}</p>
              </div>
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm font-medium">Total Selisih</p>
                <p className={`text-2xl font-bold ${totalVariance < 0 ? 'text-red-500' : totalVariance > 0 ? 'text-green-500' : ''}`}>
                  {totalVariance}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center mb-4">
        <Input
          placeholder="Cari berdasarkan SKU, nama produk, atau lokasi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredDetails.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchQuery ? "Tidak ada hasil yang cocok dengan pencarian" : "Tidak ada data detail stok opname"}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead className="text-right">Jumlah Sistem</TableHead>
                  <TableHead className="text-right">Jumlah Dihitung</TableHead>
                  <TableHead className="text-right">Selisih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDetails.map((detail) => (
                  <TableRow key={detail.id}>
                    <TableCell className="font-medium">{detail.sku}</TableCell>
                    <TableCell>{detail.product_name}</TableCell>
                    <TableCell>{detail.location_code || "-"}</TableCell>
                    <TableCell className="text-right">{detail.system_quantity}</TableCell>
                    <TableCell className="text-right">
                      {stockCount?.status === 'COMPLETED' ? (
                        detail.counted_quantity
                      ) : (
                        <Input
                          type="number"
                          min="0"
                          value={detail.counted_quantity || ''}
                          onChange={(e) => handleCountedQuantityChange(detail.id, parseFloat(e.target.value) || 0)}
                          className="w-24 text-right ml-auto"
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={detail.variance ? (detail.variance < 0 ? 'text-red-500' : detail.variance > 0 ? 'text-green-500' : '') : ''}>
                        {detail.variance || '-'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}