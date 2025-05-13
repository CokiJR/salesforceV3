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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthentication } from "@/hooks/useAuthentication";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  
  const [postingDate, setPostingDate] = useState<Date>(new Date());

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailItems, setDetailItems] = useState<Array<{sku: string, product_name: string, quantity: number, uom: string, from_location: string | null, to_location: string | null}>>([]);

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
  
  // Fungsi untuk mencari produk berdasarkan SKU atau nama
  const searchProducts = () => {
    if (!formData.sku) return [];
    
    return products.filter(product => 
      product.sku.toLowerCase().includes(formData.sku.toLowerCase()) ||
      product.name.toLowerCase().includes(formData.sku.toLowerCase())
    );
  };
  
  const handleAddDetail = () => {
    if (!formData.sku) {
      setErrors(prev => ({ ...prev, sku: "Produk harus dipilih" }));
      return;
    }
    
    // Validasi SKU yang dimasukkan ada dalam daftar produk
    const product = products.find(p => p.sku === formData.sku);
    if (!product) {
      setErrors(prev => ({ ...prev, sku: "SKU produk tidak valid" }));
      return;
    }
    
    if (!formData.quantity || formData.quantity <= 0) {
      setErrors(prev => ({ ...prev, quantity: "Jumlah harus lebih dari 0" }));
      return;
    }
    
    // Validasi lokasi berdasarkan tipe perpindahan
    if (formData.movement_type === "TRANSFER") {
      if (!formData.from_location) {
        setErrors(prev => ({ ...prev, from_location: "Lokasi asal harus dipilih untuk transfer" }));
        return;
      }
      if (!formData.to_location) {
        setErrors(prev => ({ ...prev, to_location: "Lokasi tujuan harus dipilih untuk transfer" }));
        return;
      }
    } else if (formData.movement_type === "RECEIVING" && !formData.to_location) {
      setErrors(prev => ({ ...prev, to_location: "Lokasi tujuan harus dipilih untuk penerimaan" }));
      return;
    } else if (formData.movement_type === "PICKING" && !formData.from_location) {
      setErrors(prev => ({ ...prev, from_location: "Lokasi asal harus dipilih untuk pengambilan" }));
      return;
    }
    
    // Gunakan product yang sudah didefinisikan sebelumnya
    if (!product) return;
    
    const newItem = {
      sku: formData.sku,
      product_name: product.name,
      quantity: formData.quantity,
      uom: formData.uom,
      from_location: formData.from_location,
      to_location: formData.to_location
    };
    
    setDetailItems([...detailItems, newItem]);
    
    // Reset form fields except movement_type and reference_doc
    setFormData(prev => ({
      ...prev,
      sku: "",
      quantity: 1,
      uom: "pcs",
    }));
    setSelectedProduct(null);
  };
  
  const handleRemoveDetail = (index: number) => {
    const newItems = [...detailItems];
    newItems.splice(index, 1);
    setDetailItems(newItems);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (detailItems.length === 0) {
      newErrors.details = "Tambahkan minimal satu item detail";
    }

    if (!formData.reference_doc) {
      newErrors.reference_doc = "Dokumen referensi harus diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Untuk setiap item detail, buat perpindahan terpisah
      for (const item of detailItems) {
        const movementData = {
          sku: item.sku,
          from_location: item.from_location,
          to_location: item.to_location,
          quantity: item.quantity,
          uom: item.uom,
          movement_type: formData.movement_type,
          reference_doc: formData.reference_doc,
          user_id: user?.id || null,
        };
        onSubmit(movementData);
      }
    }
  };

  // Adjust form fields based on movement type
  const showFromLocation = ["PICKING", "TRANSFER", "ADJUSTMENT"].includes(formData.movement_type);
  const showToLocation = ["RECEIVING", "PUTAWAY", "TRANSFER", "ADJUSTMENT"].includes(formData.movement_type);

  return (
    <Card className="mb-6">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Catat Perpindahan Barang</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Header Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
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
            
            <div className="space-y-2">
              <Label htmlFor="posting_date">Tanggal Posting</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !postingDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {postingDate ? format(postingDate, "PPP") : <span>Pilih tanggal</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={postingDate}
                    onSelect={(date) => date && setPostingDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reference_doc">Dokumen Referensi</Label>
              <Input
                id="reference_doc"
                value={formData.reference_doc || ""}
                onChange={(e) => handleChange("reference_doc", e.target.value)}
                placeholder="Contoh: PO-001, SO-002, dll"
                className={errors.reference_doc ? "border-destructive" : ""}
              />
              {errors.reference_doc && <p className="text-sm text-destructive">{errors.reference_doc}</p>}
            </div>
          </div>
          
          {/* Tabs Detail Section */}
          <Tabs defaultValue="detail" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="detail">Detail Perpindahan</TabsTrigger>
            </TabsList>
            <TabsContent value="detail" className="space-y-4 mt-4">
              {/* Input Form for Detail */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 border p-4 rounded-md">
                <div className="space-y-2">
                  <Label htmlFor="sku">Produk</Label>
                  <div className="relative">
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => {
                        handleChange("sku", e.target.value);
                        setSelectedProduct(null);
                      }}
                      placeholder="Masukkan SKU produk"
                      className={errors.sku ? "border-destructive" : ""}
                    />
                    {formData.sku && !selectedProduct && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                        {searchProducts().map((product) => (
                          <div
                            key={product.sku}
                            className="px-3 py-2 cursor-pointer hover:bg-muted"
                            onClick={() => handleProductChange(product.sku)}
                          >
                            {product.name} ({product.sku})
                          </div>
                        ))}
                        {searchProducts().length === 0 && (
                          <div className="px-3 py-2 text-muted-foreground">Tidak ada produk yang ditemukan</div>
                        )}
                      </div>
                    )}
                  </div>
                  {errors.sku && <p className="text-sm text-destructive">{errors.sku}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label>Deskripsi</Label>
                  <div className="h-10 flex items-center px-3 border rounded-md bg-muted/50">
                    {selectedProduct ? selectedProduct.name : "-"}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quantity">Qty</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleChange("quantity", parseFloat(e.target.value))}
                    placeholder="Jumlah"
                    className={errors.quantity ? "border-destructive" : ""}
                  />
                  {errors.quantity && <p className="text-sm text-destructive">{errors.quantity}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="uom">UOM</Label>
                  <Select
                    value={formData.uom}
                    onValueChange={(value) => handleChange("uom", value)}
                  >
                    <SelectTrigger id="uom">
                      <SelectValue placeholder="Satuan" />
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
                
                {showFromLocation && (
                  <div className="space-y-2">
                    <Label htmlFor="from_location">Lokasi Asal</Label>
                    <Select
                      value={formData.from_location || ""}
                      onValueChange={(value) => handleChange("from_location", value)}
                    >
                      <SelectTrigger id="from_location" className={errors.from_location ? "border-destructive" : ""}>
                        <SelectValue placeholder="Lokasi asal" />
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
                        <SelectValue placeholder="Lokasi tujuan" />
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
                
                <div className="md:col-span-5 flex justify-end">
                  <Button type="button" onClick={handleAddDetail}>
                    Tambah Item
                  </Button>
                </div>
              </div>
              
              {/* Detail Items Table */}
              {detailItems.length > 0 ? (
                <div className="border rounded-md overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Detail</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>UOM</TableHead>
                        {formData.movement_type === "TRANSFER" && <TableHead>Lokasi Asal</TableHead>}
                        <TableHead>Lokasi Tujuan</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.sku}</TableCell>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.uom}</TableCell>
                          {formData.movement_type === "TRANSFER" && (
                            <TableCell>{item.from_location || "-"}</TableCell>
                          )}
                          <TableCell>{item.to_location || "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRemoveDetail(index)}
                            >
                              Hapus
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-4 border rounded-md bg-muted/10">
                  <p className="text-muted-foreground">Belum ada item yang ditambahkan</p>
                </div>
              )}
              {errors.details && <p className="text-sm text-destructive">{errors.details}</p>}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button type="submit" disabled={detailItems.length === 0}>
            Simpan Perpindahan
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}