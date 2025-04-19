import { Product, Customer } from "./index";

export interface GeneralPricing {
  id: string;
  sku: string;
  price: number;
  currency: string;
  min_qty: number;
  valid_from: string;
  valid_to: string | null;
  created_at: string;
  updated_at: string;
  product?: Product; // Relasi ke produk
}

export interface GeneralPricingWithDetails extends GeneralPricing {
  product: Product;
}

export interface SpecialPrice {
  id: string;
  customer_id: string;
  sku: string;
  special_price: number;
  currency: string;
  min_qty: number;
  valid_from: string;
  valid_to: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  product?: Product; // Relasi ke produk
  customer?: Customer; // Relasi ke customer
}

export interface SpecialPriceWithDetails extends SpecialPrice {
  product: Product;
  customer: Customer;
}

export interface PricingFilters {
  searchQuery?: string;
  activeOnly?: boolean;
}