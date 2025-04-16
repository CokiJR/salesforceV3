import { format } from "date-fns";
import { Warehouse } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface WarehouseDetailViewProps {
  warehouse: Warehouse | null;
}

export function WarehouseDetailView({ warehouse }: WarehouseDetailViewProps) {
  if (!warehouse) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Warehouse Selected</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Select a warehouse from the list to view its details
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Warehouse Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Basic Information</h3>
          <Separator className="my-2" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Code</p>
              <p className="font-medium">{warehouse.code}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{warehouse.name}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold">Location</h3>
          <Separator className="my-2" />
          <p>{warehouse.location || "No location specified"}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold">Timestamps</h3>
          <Separator className="my-2" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Created At</p>
              <p>{format(new Date(warehouse.created_at), "MMM d, yyyy HH:mm")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p>{format(new Date(warehouse.updated_at), "MMM d, yyyy HH:mm")}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}