
import { Order } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface CustomerOrdersListProps {
  orders: Order[];
  isLoading: boolean;
}

export function CustomerOrdersList({ orders, isLoading }: CustomerOrdersListProps) {
  const navigate = useNavigate();
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (orders.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-4">No orders found for this customer</p>
    );
  }
  
  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id} className="overflow-hidden">
          <div className="flex items-start p-4">
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Order #{order.id.substring(0, 8)}</h4>
                <Badge className={
                  order.status === "delivered" ? "bg-green-100 text-green-800" :
                  order.status === "canceled" ? "bg-red-100 text-red-800" :
                  "bg-blue-100 text-blue-800"
                }>
                  {order.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Date:</span> 
                  <span className="ml-1">{format(new Date(order.order_date), "MMM d, yyyy")}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="ml-1 font-medium">${order.total_amount.toFixed(2)}</span>
                </div>
              </div>
              <Button 
                variant="link" 
                className="p-0 h-auto mt-2" 
                onClick={() => navigate(`/dashboard/orders/${order.id}`)}
              >
                View Details
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
