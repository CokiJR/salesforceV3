
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OrdersHeaderProps {
  onAddOrder: () => void;
}

export const OrdersHeader = ({ onAddOrder }: OrdersHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
      <Button onClick={onAddOrder}>
        <Plus className="mr-2 h-4 w-4" />
        New Order
      </Button>
    </div>
  );
};
