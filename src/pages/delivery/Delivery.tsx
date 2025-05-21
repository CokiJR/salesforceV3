import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Search, Truck, FileCheck, Filter, Calendar } from "lucide-react";
import { format, parse } from "date-fns";
import { id } from "date-fns/locale";
import { DeliveryService } from "./services/DeliveryService";
import { Invoice } from "@/types/delivery";

const Delivery = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // Form state untuk dialog pengiriman massal
  const [deliveryForm, setDeliveryForm] = useState({
    driver_name: "",
    vehicle_number: "",
    delivery_date: format(new Date(), "yyyy-MM-dd"),
    status: "Sedang"
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      let data;
      
      if (filterStatus) {
        data = await DeliveryService.getInvoicesByFilter({ status: filterStatus });
      } else {
        data = await DeliveryService.getInvoices();
      }
      
      setInvoices(data);
    } catch (error: any) {
      console.error("Error fetching invoices:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat data invoice: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
    setSelectedInvoices([]);
    
    // Fetch invoices with the selected filter
    const fetchWithFilter = async () => {
      try {
        setLoading(true);
        const data = await DeliveryService.getInvoicesByFilter({ status });
        setInvoices(data);
      } catch (error: any) {
        console.error("Error fetching filtered invoices:", error.message);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Gagal memuat data invoice: ${error.message}`,
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (status && status !== 'all') {
      fetchWithFilter();
    } else {
      fetchInvoices();
    }
  };
  
  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    if (checked) {
      setSelectedInvoices([...selectedInvoices, invoiceId]);
    } else {
      setSelectedInvoices(selectedInvoices.filter(id => id !== invoiceId));
    }
  };
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredInvoices.map(invoice => invoice.id);
      setSelectedInvoices(allIds);
    } else {
      setSelectedInvoices([]);
    }
  };
  
  const handleBatchDelivery = async () => {
    if (selectedInvoices.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Pilih minimal satu invoice untuk dikirim",
      });
      return;
    }
    
    setShowDeliveryDialog(true);
  };
  
  const handleSubmitBatchDelivery = async () => {
    try {
      await DeliveryService.batchUpdateDeliveryStatus(selectedInvoices, {
        status: deliveryForm.status,
        driver_name: deliveryForm.driver_name,
        vehicle_number: deliveryForm.vehicle_number,
        delivery_date: deliveryForm.delivery_date
      });
      
      toast({
        title: "Sukses",
        description: `${selectedInvoices.length} invoice berhasil diperbarui status pengirimannya`,
      });
      
      // Reset form dan selection
      setSelectedInvoices([]);
      setShowDeliveryDialog(false);
      setDeliveryForm({
        driver_name: "",
        vehicle_number: "",
        delivery_date: format(new Date(), "yyyy-MM-dd"),
        status: "Sedang"
      });
      
      // Refresh data
      fetchInvoices();
    } catch (error: any) {
      console.error("Error batch updating invoices:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memperbarui status pengiriman: ${error.message}`,
      });
    }
  };
  
  const handleInputChange = (field: string, value: string) => {
    setDeliveryForm({
      ...deliveryForm,
      [field]: value
    });
  };

  const handlePostDelivery = async (invoiceId: string) => {
    try {
      // Buka dialog untuk mengisi informasi pengiriman
      setSelectedInvoices([invoiceId]);
      setShowDeliveryDialog(true);
    } catch (error: any) {
      console.error("Error preparing delivery:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal mempersiapkan pengiriman: ${error.message}`,
      });
    }
  };

  const handleCompleteDelivery = async (invoiceId: string) => {
    try {
      await DeliveryService.updateInvoiceStatus(invoiceId, "Terkirim");
      toast({
        title: "Sukses",
        description: "Pengiriman berhasil diselesaikan",
      });
      fetchInvoices(); // Refresh data
    } catch (error: any) {
      console.error("Error completing delivery:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal menyelesaikan pengiriman: ${error.message}`,
      });
    }
  };

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Belum dikirim":
        return <Badge variant="outline">Belum dikirim</Badge>;
      case "Sedang":
        return <Badge variant="secondary">Sedang dikirim</Badge>;
      case "Terkirim":
        return <Badge variant="success">Terkirim</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="animate-fade-in space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Manajemen Pengiriman</CardTitle>
          <CardDescription>
            Kelola status pengiriman invoice ke pelanggan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4 gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari invoice atau pelanggan..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={filterStatus} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="Filter Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="Belum dikirim">Belum dikirim</SelectItem>
                  <SelectItem value="Sedang">Sedang dikirim</SelectItem>
                  <SelectItem value="Terkirim">Terkirim</SelectItem>
                </SelectContent>
              </Select>
              
              {selectedInvoices.length > 0 && (
                <Button onClick={handleBatchDelivery} className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Kirim ({selectedInvoices.length})
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox 
                      checked={filteredInvoices.length > 0 && selectedInvoices.length === filteredInvoices.length}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>No. Invoice</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Tanggal Invoice</TableHead>
                  <TableHead>Tanggal Kirim</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Salesman</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10">
                      <div className="flex justify-center">
                        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        Memuat data...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10">
                      <div className="text-muted-foreground">
                        Tidak ada data pengiriman
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedInvoices.includes(invoice.id)}
                          onCheckedChange={(checked) => handleSelectInvoice(invoice.id, checked as boolean)}
                          disabled={invoice.status === "Terkirim"}
                          aria-label={`Select invoice ${invoice.invoice_number}`}
                        />
                      </TableCell>
                      <TableCell>
                        <button
                          className="text-primary hover:underline font-medium"
                          onClick={() => navigate(`/dashboard/delivery/${invoice.id}`)}
                        >
                          {invoice.invoice_number}
                        </button>
                      </TableCell>
                      <TableCell>{invoice.customer_name}</TableCell>
                      <TableCell>
                        {invoice.invoice_date
                          ? format(new Date(invoice.invoice_date), "dd MMM yyyy", {
                              locale: id,
                            })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {invoice.delivery_date
                          ? format(new Date(invoice.delivery_date), "dd MMM yyyy", {
                              locale: id,
                            })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0,
                        }).format(invoice.total_amount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>{invoice.salesman?.name || "-"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Aksi</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => navigate(`/dashboard/delivery/${invoice.id}`)}
                            >
                              Lihat Detail
                            </DropdownMenuItem>
                            {invoice.status === "Belum dikirim" && (
                              <DropdownMenuItem
                                onClick={() => handlePostDelivery(invoice.id)}
                              >
                                <Truck className="mr-2 h-4 w-4" />
                                Kirim Sekarang
                              </DropdownMenuItem>
                            )}
                            {invoice.status === "Sedang" && (
                              <DropdownMenuItem
                                onClick={() => handleCompleteDelivery(invoice.id)}
                              >
                                <FileCheck className="mr-2 h-4 w-4" />
                                Selesaikan Pengiriman
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Dialog Form Pengiriman Massal */}
      <Dialog open={showDeliveryDialog} onOpenChange={setShowDeliveryDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Pengiriman Massal</DialogTitle>
            <DialogDescription>
              Isi informasi pengiriman untuk {selectedInvoices.length} invoice yang dipilih
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="driver_name" className="text-right">
                Nama Supir
              </Label>
              <Input
                id="driver_name"
                value={deliveryForm.driver_name}
                onChange={(e) => handleInputChange("driver_name", e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vehicle_number" className="text-right">
                No. Kendaraan
              </Label>
              <Input
                id="vehicle_number"
                value={deliveryForm.vehicle_number}
                onChange={(e) => handleInputChange("vehicle_number", e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="delivery_date" className="text-right">
                Tanggal Kirim
              </Label>
              <div className="col-span-3 flex items-center">
                <Input
                  id="delivery_date"
                  type="date"
                  value={deliveryForm.delivery_date}
                  onChange={(e) => handleInputChange("delivery_date", e.target.value)}
                  className="flex-1"
                />
                <Calendar className="ml-2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select 
                value={deliveryForm.status} 
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sedang">Sedang dikirim</SelectItem>
                  <SelectItem value="Terkirim">Terkirim</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeliveryDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmitBatchDelivery}>
              Kirim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Delivery;