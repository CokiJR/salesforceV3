import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

interface Warehouse {
  code: string;
  name: string;
}

interface StockCountFormProps {
  warehouses: Warehouse[];
  onSubmit: (data: { warehouse_code: string, count_date: string }) => void;
  onCancel: () => void;
}

export function StockCountForm({ warehouses, onSubmit, onCancel }: StockCountFormProps) {
  const [warehouseCode, setWarehouseCode] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: Record<string, string> = {};
    if (!warehouseCode) {
      newErrors.warehouse_code = "Gudang harus dipilih";
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onSubmit({
        warehouse_code: warehouseCode,
        count_date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      });
    }
  };

  return (
    <Card className="mb-6">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Buat Stok Opname Baru</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="warehouse_code">Gudang</Label>
              <Select
                value={warehouseCode}
                onValueChange={setWarehouseCode}
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
              <Label htmlFor="count_date">Tanggal Stok Opname</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${errors.count_date ? "border-destructive" : ""}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(date, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.count_date && <p className="text-sm text-destructive">{errors.count_date}</p>}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button type="submit">
            Buat Stok Opname
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}