
import { OrderItem } from "@/types";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";

interface OrderItemsSectionProps {
  items: OrderItem[];
  totalAmount: number;
  formatCurrency: (amount: number) => string;
}

export function OrderItemsSection({ items, totalAmount, formatCurrency }: OrderItemsSectionProps) {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Order Items</h3>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item: OrderItem) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.product.name}</TableCell>
                <TableCell>{item.quantity} {item.product.unit}</TableCell>
                <TableCell>{formatCurrency(item.price)}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3} className="text-right font-semibold">Total:</TableCell>
              <TableCell className="text-right font-bold">{formatCurrency(totalAmount)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
