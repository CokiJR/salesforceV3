import { ShoppingCart } from "lucide-react";
import { OrderItemWithDetails } from "../utils/orderFormUtils";
import { formatCurrency } from "../utils/currencyUtils";

interface OrderSummaryPanelProps {
  orderItems: OrderItemWithDetails[];
  totalAmount: number;
}

export function OrderSummaryPanel({ orderItems, totalAmount }: OrderSummaryPanelProps) {
  return (
    <div className="rounded-xl border border-dashed p-8 flex flex-col items-center justify-center text-center sticky top-6">
      <div className="rounded-full bg-primary/10 p-4 mb-4">
        <ShoppingCart className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Order Summary</h3>
      <div className="w-full space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Items:</span>
          <span className="font-medium">{orderItems.length}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Quantity:</span>
          <span className="font-medium">
            {orderItems.reduce((sum, item) => sum + item.quantity, 0)}
          </span>
        </div>
        <div className="flex justify-between text-sm pt-2 border-t">
          <span className="font-medium">Order Total:</span>
          <span className="font-bold">{formatCurrency(totalAmount)}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Review the details above before creating the order.
      </p>
    </div>
  );
}
