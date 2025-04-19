import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import { SpecialPriceWithDetails } from "@/types/pricing";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SpecialPricesTableProps {
  pricing: SpecialPriceWithDetails[];
}

export function SpecialPricesTable({ pricing }: SpecialPricesTableProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const formatCurrency = (amount: number, currency: string = "IDR") => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd MMMM yyyy", { locale: id });
  };

  const isPriceActive = (validFrom: string, validTo: string | null, active: boolean) => {
    if (!active) return false;
    
    const today = new Date();
    const fromDate = new Date(validFrom);
    const toDate = validTo ? new Date(validTo) : null;
    
    return fromDate <= today && (!toDate || toDate >= today);
  };

  const handleEditPrice = (id: string) => {
    navigate(`/dashboard/pricing/edit-special/${id}`);
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      setUpdatingId(id);
      
      const { error } = await supabase
        .from("special_prices")
        .update({ active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Status diperbarui",
        description: `Harga khusus telah ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}.`,
      });

      // Refresh data would happen through parent component
      
    } catch (error: any) {
      console.error("Error updating special price status:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memperbarui status: ${error.message}`,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pelanggan</TableHead>
            <TableHead>Produk</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Harga Khusus</TableHead>
            <TableHead>Min. Qty</TableHead>
            <TableHead>Berlaku Dari</TableHead>
            <TableHead>Berlaku Sampai</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pricing.map((price) => (
            <TableRow key={price.id}>
              <TableCell className="font-medium">{price.customer?.name || "-"}</TableCell>
              <TableCell>{price.product?.name || "-"}</TableCell>
              <TableCell>{price.sku}</TableCell>
              <TableCell>{formatCurrency(price.special_price, price.currency)}</TableCell>
              <TableCell>{price.min_qty}</TableCell>
              <TableCell>{formatDate(price.valid_from)}</TableCell>
              <TableCell>{formatDate(price.valid_to)}</TableCell>
              <TableCell>
                {isPriceActive(price.valid_from, price.valid_to, price.active) ? (
                  <Badge variant="outline" className="bg-green-100 text-green-800">Aktif</Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-100 text-gray-800">Tidak Aktif</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => toggleActive(price.id, price.active)}
                    disabled={updatingId === price.id}
                  >
                    {price.active ? (
                      <ToggleRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleEditPrice(price.id)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}