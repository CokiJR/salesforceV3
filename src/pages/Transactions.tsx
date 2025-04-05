
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTransactions } from "./transactions/hooks/useTransactions";
import { filterTransactions } from "./transactions/utils/filterTransactions";
import { TransactionTable } from "./transactions/components/TransactionTable";
import { TransactionFilters } from "./transactions/components/TransactionFilters";
import { EmptyTransactions } from "./transactions/components/EmptyTransactions";

const Transactions = () => {
  const { transactions, isLoading, error } = useTransactions();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [syncFilter, setSyncFilter] = useState<string>("all");
  const navigate = useNavigate();

  const handleAddTransaction = () => {
    navigate("/dashboard/transactions/add");
  };

  const handleTransactionDetails = (transactionId: string) => {
    navigate(`/dashboard/transactions/${transactionId}`);
  };

  const filteredTransactions = filterTransactions(
    transactions,
    searchQuery,
    statusFilter,
    syncFilter
  );

  // Fix the issue by ensuring hasFilters is always a boolean
  const hasFilters = searchQuery !== "" || statusFilter !== "all" || syncFilter !== "all";

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
        <Button onClick={handleAddTransaction}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      <TransactionFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        syncFilter={syncFilter}
        setSyncFilter={setSyncFilter}
      />

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTransactions.length > 0 ? (
        <TransactionTable
          transactions={filteredTransactions}
          onRowClick={handleTransactionDetails}
        />
      ) : (
        <EmptyTransactions
          hasFilters={hasFilters}
          onAddTransaction={handleAddTransaction}
        />
      )}
    </div>
  );
};

export default Transactions;
