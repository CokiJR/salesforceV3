
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface RoutesHeaderProps {
  onCreateRoute: () => void;
}

export function RoutesHeader({ onCreateRoute }: RoutesHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold tracking-tight">Daily Routes</h1>
      <div className="flex items-center gap-2">
        <Button onClick={onCreateRoute} variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Manual Route
        </Button>
      </div>
    </div>
  );
}
