import { Product, Warehouse } from "."; 

export interface Inventory {
  id: string;
  sku: string;
  warehouse_code: string;
  quantity: number;
  uom: string;
  last_updated_at: string;
  product?: Product; // Relasi ke produk
  warehouse?: Warehouse; // Relasi ke gudang
}

export interface InventoryWithDetails extends Inventory {
  product: Product;
  warehouse: Warehouse;
}

export interface InventoryFilters {
  searchQuery?: string;
  warehouseCode?: string;
  lowStock?: boolean;
}