
import { Button } from "@/components/ui/button";
import { Map, Plus } from "lucide-react";
import { format } from "date-fns";

interface EmptyRoutesStateProps {
  date: Date;
  onCreateRoute: () => void;
}

export function EmptyRoutesState({ date, onCreateRoute }: EmptyRoutesStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center border rounded-md">
      <div className="rounded-full bg-muted p-3">
        <Map className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No routes found for {format(date, "MMMM d, yyyy")}</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Plan your customer visits by creating a route
      </p>
      <div className="flex gap-3 mt-4">
        <Button onClick={onCreateRoute} variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Manual Route
        </Button>
      </div>
    </div>
  );
}
