
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const RouteNotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Route not found</h2>
      <Button 
        variant="outline" 
        onClick={() => navigate("/dashboard/routes")}
        className="mt-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Routes
      </Button>
    </div>
  );
};
