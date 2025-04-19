import { Package, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyPricingStateProps {
  type: "general" | "special";
  searchQuery: string;
  onAddClick: () => void;
}

export function EmptyPricingState({ type, searchQuery, onAddClick }: EmptyPricingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-3 mb-4">
        {type === "general" ? (
          <Package className="h-8 w-8 text-muted-foreground" />
        ) : (
          <Users className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <h3 className="text-lg font-semibold mb-1">
        {searchQuery ? "Tidak ada hasil yang ditemukan" : type === "general" ? "Belum ada harga umum" : "Belum ada harga khusus"}
      </h3>
      <p className="text-muted-foreground mb-4 max-w-md">
        {searchQuery
          ? `Tidak ada ${type === "general" ? "harga umum" : "harga khusus"} yang cocok dengan pencarian Anda. Coba kata kunci lain.`
          : type === "general"
          ? "Anda belum menambahkan harga umum untuk produk. Tambahkan harga umum untuk mulai mengelola harga produk."
          : "Anda belum menambahkan harga khusus untuk pelanggan. Tambahkan harga khusus untuk memberikan harga spesial kepada pelanggan tertentu."}
      </p>
      <Button onClick={onAddClick}>
        {type === "general" ? "Tambah Harga Umum" : "Tambah Harga Khusus"}
      </Button>
    </div>
  );
}