
import { CreditCard, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyTransactionsProps {
  hasFilters: boolean;
  onAddTransaction: () => void;
}

export const EmptyTransactions = ({
  hasFilters,
  onAddTransaction,
}: EmptyTransactionsProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="rounded-full bg-muted p-3">
        <CreditCard className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No transactions found</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {hasFilters
          ? "Try adjusting your filters"
          : "Get started by adding your first transaction"}
      </p>
      {!hasFilters && (
        <Button onClick={onAddTransaction} className="mt-4">
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      )}
    </div>
  );
};
