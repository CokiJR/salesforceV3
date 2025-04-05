
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { Order } from "@/types";

interface OrderDetailFooterProps {
  order: Order;
}

export function OrderDetailFooter({ order }: OrderDetailFooterProps) {
  const navigate = useNavigate();
  
  return (
    <CardFooter className="flex justify-between">
      <Button variant="outline" onClick={() => navigate("/dashboard/orders")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Orders
      </Button>
      <div className="flex gap-2">
        {order.payment_status !== "paid" && (
          <Button onClick={() => navigate(`/dashboard/transactions/add?order=${order.id}`)}>
            Record Payment
          </Button>
        )}
      </div>
    </CardFooter>
  );
}
