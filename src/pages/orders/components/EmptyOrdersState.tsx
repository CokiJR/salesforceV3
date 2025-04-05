
import { Button } from "@/components/ui/button";
import { Plus, ShoppingCart } from "lucide-react";

interface EmptyOrdersStateProps {
  searchQuery: string;
  onAddOrder: () => void;
}

export const EmptyOrdersState = ({ searchQuery, onAddOrder }: EmptyOrdersStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="rounded-full bg-muted p-3">
        <ShoppingCart className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No orders found</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {searchQuery ? "Try a different search term" : "Get started by creating your first order"}
      </p>
      {!searchQuery && (
        <Button onClick={onAddOrder} className="mt-4">
          <Plus className="mr-2 h-4 w-4" />
          Create Order
        </Button>
      )}
    </div>
  );
};
