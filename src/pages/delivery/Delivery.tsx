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
import { MoreHorizontal, Search, Truck, FileCheck } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { DeliveryService } from "./services/DeliveryService";
import { Invoice } from "@/types/delivery";

const Delivery = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await DeliveryService.getInvoices();
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

  const handlePostDelivery = async (invoiceId: string) => {
    try {
      await DeliveryService.updateInvoiceStatus(invoiceId, "Sedang");
      toast({
        title: "Sukses",
        description: "Status pengiriman berhasil diperbarui",
      });
      fetchInvoices(); // Refresh data
    } catch (error: any) {
      console.error("Error updating invoice status:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memperbarui status: ${error.message}`,
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
          <div className="flex items-center mb-4">
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
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Invoice</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Salesman</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
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
                    <TableCell colSpan={7} className="text-center py-10">
                      <div className="text-muted-foreground">
                        Tidak ada data pengiriman
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
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
    </div>
  );
};

export default Delivery;