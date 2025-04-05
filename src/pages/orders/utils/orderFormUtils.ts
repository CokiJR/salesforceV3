
import { format } from "date-fns";
import { Product, Customer } from "@/types";

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
  }).format(amount);
};

export type OrderItemWithDetails = {
  product_id: string;
  product: Product;
  quantity: number;
  price: number;
  total: number;
};

export const calculateOrderTotal = (items: OrderItemWithDetails[]): number => {
  return items.reduce((total, item) => total + item.total, 0);
};
