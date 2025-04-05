
import { Button } from "@/components/ui/button";
import { ArrowLeft, Map } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CustomerActionsProps {
  customerId: string;
}

export function CustomerActions({ customerId }: CustomerActionsProps) {
  const navigate = useNavigate();
  
  return (
    <div className="flex justify-between">
      <Button variant="outline" onClick={() => navigate("/dashboard/customers")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Customers
      </Button>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => navigate("/dashboard/routes/create")}>
          <Map className="mr-2 h-4 w-4" />
          Add to Route
        </Button>
      </div>
    </div>
  );
}
