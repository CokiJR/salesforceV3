import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Truck, FileCheck } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { DeliveryService } from "./services/DeliveryService";
import { Invoice } from "@/types/delivery";

const InvoiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchInvoiceDetails(id);
  }, [id]);

  const fetchInvoiceDetails = async (invoiceId: string) => {
    try {
      setLoading(true);
      const data = await DeliveryService.getInvoiceById(invoiceId);
      setInvoice(data);
    } catch (error: any) {
      console.error("Error fetching invoice details:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat detail invoice: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePostDelivery = async () => {
    if (!invoice) return;
    
    try {
      await DeliveryService.updateInvoiceStatus(invoice.id, "Sedang");
      toast({
        title: "Sukses",
        description: "Status pengiriman berhasil diperbarui",
      });
      fetchInvoiceDetails(invoice.id); // Refresh data
    } catch (error: any) {
      console.error("Error updating invoice status:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memperbarui status: ${error.message}`,
      });
    }
  };

  const handleCompleteDelivery = async () => {
    if (!invoice) return;
    
    try {
      await DeliveryService.updateInvoiceStatus(invoice.id, "Terkirim");
      toast({
        title: "Sukses",
        description: "Pengiriman berhasil diselesaikan",
      });
      fetchInvoiceDetails(invoice.id); // Refresh data
    } catch (error: any) {
      console.error("Error completing delivery:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal menyelesaikan pengiriman: ${error.message}`,
      });
    }
  };

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-3">Memuat data...</span>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold">Invoice tidak ditemukan</h2>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/dashboard/delivery")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/dashboard/delivery")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>

        <div className="flex space-x-2">
          {invoice.status === "Belum dikirim" && (
            <Button onClick={handlePostDelivery}>
              <Truck className="mr-2 h-4 w-4" />
              Kirim Sekarang
            </Button>
          )}
          {invoice.status === "Sedang" && (
            <Button onClick={handleCompleteDelivery}>
              <FileCheck className="mr-2 h-4 w-4" />
              Selesaikan Pengiriman
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Detail Invoice</CardTitle>
              <CardDescription>Informasi invoice dan pengiriman</CardDescription>
            </div>
            <div>{getStatusBadge(invoice.status)}</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">No. Invoice</h3>
                <p className="text-lg font-semibold">{invoice.invoice_number}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Pelanggan</h3>
                <p className="text-lg">{invoice.customer_name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Kontak</h3>
                <p>{invoice.customer_phone || "-"}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Tanggal Pengiriman</h3>
                <p>
                  {invoice.delivery_date
                    ? format(new Date(invoice.delivery_date), "dd MMMM yyyy", {
                        locale: id,
                      })
                    : "-"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Salesman</h3>
                <p>{invoice.salesman?.name || "-"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Total</h3>
                <p className="text-lg font-semibold">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                  }).format(invoice.total_amount)}
                </p>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div>
            <h3 className="text-lg font-semibold mb-4">Item Barang</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama Barang</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead>Satuan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.item_code}</TableCell>
                        <TableCell>{item.item_name}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell>{item.uom}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        Tidak ada data item
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceDetail;