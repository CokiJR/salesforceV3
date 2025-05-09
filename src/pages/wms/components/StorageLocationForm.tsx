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
import { Switch } from "@/components/ui/switch";

interface StorageLocation {
  id: string;
  warehouse_code: string;
  location_code: string;
  location_type: 'RECEIVING' | 'STORAGE' | 'PICKING' | 'SHIPPING' | 'DAMAGE';
  max_capacity: number;
  current_quantity: number;
  is_active: boolean;
}

interface Warehouse {
  code: string;
  name: string;
}

interface StorageLocationFormProps {
  location: StorageLocation | null;
  warehouses: Warehouse[];
  onSubmit: (data: Omit<StorageLocation, "id" | "current_quantity">) => void;
  onCancel: () => void;
}

export function StorageLocationForm({ location, warehouses, onSubmit, onCancel }: StorageLocationFormProps) {
  const [formData, setFormData] = useState<Omit<StorageLocation, "id" | "current_quantity">>(() => {
    if (location) {
      const { id, current_quantity, ...rest } = location;
      return rest;
    }
    return {
      warehouse_code: "",
      location_code: "",
      location_type: "STORAGE",
      max_capacity: 100,
      is_active: true,
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.warehouse_code) {
      newErrors.warehouse_code = "Gudang harus dipilih";
    }

    if (!formData.location_code) {
      newErrors.location_code = "Kode lokasi harus diisi";
    }

    if (!formData.location_type) {
      newErrors.location_type = "Tipe lokasi harus dipilih";
    }

    if (!formData.max_capacity || formData.max_capacity <= 0) {
      newErrors.max_capacity = "Kapasitas harus lebih dari 0";
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

  return (
    <Card className="mb-6">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>{location ? "Edit Lokasi Penyimpanan" : "Tambah Lokasi Penyimpanan"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="warehouse_code">Gudang</Label>
              <Select
                value={formData.warehouse_code}
                onValueChange={(value) => handleChange("warehouse_code", value)}
              >
                <SelectTrigger id="warehouse_code" className={errors.warehouse_code ? "border-destructive" : ""}>
                  <SelectValue placeholder="Pilih gudang" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.code} value={warehouse.code}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.warehouse_code && <p className="text-sm text-destructive">{errors.warehouse_code}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location_code">Kode Lokasi</Label>
              <Input
                id="location_code"
                value={formData.location_code}
                onChange={(e) => handleChange("location_code", e.target.value)}
                placeholder="Contoh: RAK-A-01"
                className={errors.location_code ? "border-destructive" : ""}
                disabled={!!location} // Disable editing location code for existing locations
              />
              {errors.location_code && <p className="text-sm text-destructive">{errors.location_code}</p>}
              {!!location && <p className="text-xs text-muted-foreground">Kode lokasi tidak dapat diubah</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location_type">Tipe Lokasi</Label>
              <Select
                value={formData.location_type}
                onValueChange={(value) => handleChange("location_type", value as any)}
              >
                <SelectTrigger id="location_type" className={errors.location_type ? "border-destructive" : ""}>
                  <SelectValue placeholder="Pilih tipe lokasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECEIVING">Penerimaan</SelectItem>
                  <SelectItem value="STORAGE">Penyimpanan</SelectItem>
                  <SelectItem value="PICKING">Pengambilan</SelectItem>
                  <SelectItem value="SHIPPING">Pengiriman</SelectItem>
                  <SelectItem value="DAMAGE">Barang Rusak</SelectItem>
                </SelectContent>
              </Select>
              {errors.location_type && <p className="text-sm text-destructive">{errors.location_type}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_capacity">Kapasitas Maksimum</Label>
              <Input
                id="max_capacity"
                type="number"
                value={formData.max_capacity}
                onChange={(e) => handleChange("max_capacity", parseFloat(e.target.value))}
                placeholder="Masukkan kapasitas maksimum"
                className={errors.max_capacity ? "border-destructive" : ""}
              />
              {errors.max_capacity && <p className="text-sm text-destructive">{errors.max_capacity}</p>}
            </div>

            <div className="space-y-2 flex items-center">
              <div className="flex-1">
                <Label htmlFor="is_active">Status Aktif</Label>
                <p className="text-sm text-muted-foreground">Lokasi dapat digunakan jika aktif</p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleChange("is_active", checked)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button type="submit">
            {location ? "Simpan Perubahan" : "Tambah Lokasi"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}