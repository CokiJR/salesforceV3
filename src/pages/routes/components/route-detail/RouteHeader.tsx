
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";

interface RouteHeaderProps {
  onBack: () => void;
  addingOutlet: boolean;
  toggleAddOutlet: () => void;
}

export function RouteHeader({ onBack, addingOutlet, toggleAddOutlet }: RouteHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Route Details</h1>
      </div>
      <div>
        <Button 
          variant="outline" 
          onClick={toggleAddOutlet}
        >
          <Plus className="mr-2 h-4 w-4" />
          {addingOutlet ? "Cancel" : "Add Outlet"}
        </Button>
      </div>
    </div>
  );
}
