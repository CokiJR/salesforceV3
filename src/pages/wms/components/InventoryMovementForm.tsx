import React, { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthentication } from "@/hooks/useAuthentication";

interface InventoryMovement {
  id: string;
  sku: string;
  from_location: string | null;
  to_location: string | null;
  quantity: number;
  uom: string;
  movement_type: 'RECEIVING' | 'PUTAWAY' | 'PICKING' | 'TRANSFER' | 'ADJUSTMENT';
  reference_doc: string | null;
  movement_time: string;
  user_id: string | null;
}

interface Product {
  sku: string;
  name: string;
}

interface Location {
  location_code: string;
  warehouse_code: string;
  warehouse_name: string;
}

interface InventoryMovementFormProps {
  products: Product[];
  locations: Location[];
  onSubmit: (data: Omit<InventoryMovement, "id" | "movement_time" | "product_name" | "from_warehouse_name" | "to_warehouse_name">) => void;
  onCancel: () => void;
}

export function InventoryMovementForm({ products, locations, onSubmit, onCancel }: InventoryMovementFormProps) {
  const { user } = useAuthentication();
  const [formData, setFormData] = useState<Omit<InventoryMovement, "id" | "movement_time" | "product_name" | "from_warehouse_name" | "to_warehouse_name">>(() => {
    return {
      sku: "",
      from_location: null,
      to_location: null,
      quantity: 1,
      uom: "pcs",
      movement_type: "TRANSFER",
      reference_doc: null,
      user_id: user?.id || null,
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Update user_id when user changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, user_id: user?.id || null }));
  }, [user]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is edited
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleProductChange = (sku: string) => {
    handleChange("sku", sku);
    const product = products.find(p => p.sku === sku) || null;
    setSelectedProduct(product);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.sku) {
      newErrors.sku = "Produk harus dipilih";
    }

    if (formData.movement_type === "RECEIVING" && !formData.to_location) {
      newErrors.to_location = "Lokasi tujuan harus dipilih untuk penerimaan";
    }

    if (formData.movement_type === "PICKING" && !formData.from_location) {
      newErrors.from_location = "Lokasi asal harus dipilih untuk pengambilan";
    }

    if (formData.movement_type === "TRANSFER") {
      if (!formData.from_location) {
        newErrors.from_location = "Lokasi asal harus dipilih untuk transfer";
      }
      if (!formData.to_location) {
        newErrors.to_location = "Lokasi tujuan harus dipilih untuk transfer";
      }
      if (formData.from_location === formData.to_location) {
        newErrors.to_location = "Lokasi asal dan tujuan tidak boleh sama";
      }
    }

    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = "Jumlah harus lebih dari 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  // Adjust form fields based on movement type
  const showFromLocation = ["PICKING", "TRANSFER", "ADJUSTMENT"].includes(formData.movement_type);
  const showToLocation = ["RECEIVING", "PUTAWAY", "TRANSFER"].includes(formData.movement_type);

  return (
    <Card className="mb-6">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Catat Perpindahan Barang</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="movement_type">Tipe Perpindahan</Label>
              <Select
                value={formData.movement_type}
                onValueChange={(value) => handleChange("movement_type", value as any)}
              >
                <SelectTrigger id="movement_type" className={errors.movement_type ? "border-destructive" : ""}>
                  <SelectValue placeholder="Pilih tipe perpindahan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECEIVING">Penerimaan</SelectItem>
                  <SelectItem value="PUTAWAY">Penyimpanan</SelectItem>
                  <SelectItem value="PICKING">Pengambilan</SelectItem>
                  <SelectItem value="TRANSFER">Transfer</SelectItem>
                  <SelectItem value="ADJUSTMENT">Penyesuaian</SelectItem>
                </SelectContent>
              </Select>
              {errors.movement_type && <p className="text-sm text-destructive">{errors.movement_type}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="sku">Produk</Label>
              <Select
                value={formData.sku}
                onValueChange={handleProductChange}
              >
                <SelectTrigger id="sku" className={errors.sku ? "border-destructive" : ""}>
                  <SelectValue placeholder="Pilih produk" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.sku} value={product.sku}>
                      {product.name} ({product.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.sku && <p className="text-sm text-destructive">{errors.sku}</p>}
              {selectedProduct && (
                <p className="text-xs text-muted-foreground">{selectedProduct.sku}</p>
              )}
            </div>

            {showFromLocation && (
              <div className="space-y-2">
                <Label htmlFor="from_location">Lokasi Asal</Label>
                <Select
                  value={formData.from_location || ""}
                  onValueChange={(value) => handleChange("from_location", value)}
                >
                  <SelectTrigger id="from_location" className={errors.from_location ? "border-destructive" : ""}>
                    <SelectValue placeholder="Pilih lokasi asal" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.location_code} value={location.location_code}>
                        {location.location_code} ({location.warehouse_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.from_location && <p className="text-sm text-destructive">{errors.from_location}</p>}
              </div>
            )}

            {showToLocation && (
              <div className="space-y-2">
                <Label htmlFor="to_location">Lokasi Tujuan</Label>
                <Select
                  value={formData.to_location || ""}
                  onValueChange={(value) => handleChange("to_location", value)}
                >
                  <SelectTrigger id="to_location" className={errors.to_location ? "border-destructive" : ""}>
                    <SelectValue placeholder="Pilih lokasi tujuan" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.location_code} value={location.location_code}>
                        {location.location_code} ({location.warehouse_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.to_location && <p className="text-sm text-destructive">{errors.to_location}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="quantity">Jumlah</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => handleChange("quantity", parseFloat(e.target.value))}
                placeholder="Masukkan jumlah"
                className={errors.quantity ? "border-destructive" : ""}
              />
              {errors.quantity && <p className="text-sm text-destructive">{errors.quantity}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="uom">Satuan</Label>
              <Select
                value={formData.uom}
                onValueChange={(value) => handleChange("uom", value)}
              >
                <SelectTrigger id="uom">
                  <SelectValue placeholder="Pilih satuan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pcs">Pcs</SelectItem>
                  <SelectItem value="box">Box</SelectItem>
                  <SelectItem value="carton">Carton</SelectItem>
                  <SelectItem value="kg">Kg</SelectItem>
                  <SelectItem value="liter">Liter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="reference_doc">Dokumen Referensi</Label>
              <Input
                id="reference_doc"
                value={formData.reference_doc || ""}
                onChange={(e) => handleChange("reference_doc", e.target.value)}
                placeholder="Contoh: PO-001, SO-002, dll"
              />
              <p className="text-xs text-muted-foreground">Nomor dokumen terkait (PO, SO, dll)</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button type="submit">
            Simpan Perpindahan
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}