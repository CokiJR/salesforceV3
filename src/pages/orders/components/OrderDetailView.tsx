
import { Order } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "../utils/currencyUtils";
import { OrderDetailHeader } from "./OrderDetailHeader";
import { CustomerInfoCard } from "./CustomerInfoCard";
import { OrderInfoCard } from "./OrderInfoCard";
import { OrderItemsSection } from "./OrderItemsSection";
import { OrderNotes } from "./OrderNotes";
import { OrderDetailFooter } from "./OrderDetailFooter";

interface OrderDetailViewProps {
  order: Order | null;
  isLoading: boolean;
}

export function OrderDetailView({ order, isLoading }: OrderDetailViewProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-lg font-medium">No Order Selected</p>
          <p className="text-sm text-muted-foreground mt-1">
            Select an order from the list to view its details
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <OrderDetailHeader order={order} />

      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CustomerInfoCard customer={order.customer} />
            <OrderInfoCard order={order} formatCurrency={formatCurrency} />
          </div>

          <Separator />

          <OrderItemsSection 
            items={order.items} 
            totalAmount={order.total_amount} 
            formatCurrency={formatCurrency} 
          />

          {order.notes && (
            <>
              <Separator />
              <OrderNotes notes={order.notes} />
            </>
          )}
        </CardContent>
        
        <OrderDetailFooter order={order} />
      </Card>
    </div>
  );
}
