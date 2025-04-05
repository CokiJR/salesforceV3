
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Order } from "@/types";

interface OrderDetailHeaderProps {
  order: Order | null;
}

export function OrderDetailHeader({ order }: OrderDetailHeaderProps) {
  const navigate = useNavigate();

  if (!order) return null;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard/orders")}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Order Details</h1>
      </div>
    </div>
  );
}
