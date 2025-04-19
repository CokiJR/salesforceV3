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
import { Pencil } from "lucide-react";
import { GeneralPricingWithDetails } from "@/types/pricing";

interface PricingTableProps {
  pricing: GeneralPricingWithDetails[];
}

export function PricingTable({ pricing }: PricingTableProps) {
  const navigate = useNavigate();

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

  const isPriceActive = (validFrom: string, validTo: string | null) => {
    const today = new Date();
    const fromDate = new Date(validFrom);
    const toDate = validTo ? new Date(validTo) : null;
    
    return fromDate <= today && (!toDate || toDate >= today);
  };

  const handleEditPrice = (id: string) => {
    navigate(`/dashboard/pricing/edit/${id}`);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produk</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Harga</TableHead>
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
              <TableCell className="font-medium">{price.product?.name || "-"}</TableCell>
              <TableCell>{price.sku}</TableCell>
              <TableCell>{formatCurrency(price.price, price.currency)}</TableCell>
              <TableCell>{price.min_qty}</TableCell>
              <TableCell>{formatDate(price.valid_from)}</TableCell>
              <TableCell>{formatDate(price.valid_to)}</TableCell>
              <TableCell>
                {isPriceActive(price.valid_from, price.valid_to) ? (
                  <Badge variant="outline" className="bg-green-100 text-green-800">Aktif</Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-100 text-gray-800">Tidak Aktif</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleEditPrice(price.id)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}