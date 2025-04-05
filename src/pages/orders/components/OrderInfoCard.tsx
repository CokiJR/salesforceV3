
import { format } from "date-fns";
import { ShoppingCart } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Order } from "@/types";

interface OrderInfoCardProps {
  order: Order;
  formatCurrency: (amount: number) => string;
}

export function OrderInfoCard({ order, formatCurrency }: OrderInfoCardProps) {
  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="text-base flex items-center">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Order Information
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Order Date:</span>
            <span>{format(new Date(order.order_date), "MMM d, yyyy")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Delivery Date:</span>
            <span>{format(new Date(order.delivery_date), "MMM d, yyyy")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Total Amount:</span>
            <span className="font-semibold">{formatCurrency(order.total_amount)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
