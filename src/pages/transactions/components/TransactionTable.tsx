
import { Transaction } from "@/types";
import { format } from "date-fns";
import {
  BadgeCheck,
  Clock,
  CreditCard,
  TrendingDown,
  TrendingUp,
  WifiOff,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

interface TransactionTableProps {
  transactions: Transaction[];
  onRowClick: (transactionId: string) => void;
}

export const TransactionTable = ({
  transactions,
  onRowClick,
}: TransactionTableProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "credit_card":
        return <CreditCard className="h-4 w-4 text-blue-500" />;
      case "cash":
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      case "bank_transfer":
        return <TrendingUp className="h-4 w-4 text-purple-500" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <BadgeCheck className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSyncStatusIcon = (syncStatus: string) => {
    switch (syncStatus) {
      case "synced":
        return <BadgeCheck className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed":
        return <WifiOff className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transaction ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sync</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow
              key={transaction.id}
              className="cursor-pointer hover:bg-muted/60"
              onClick={() => onRowClick(transaction.id)}
            >
              <TableCell className="font-medium">
                {transaction.transaction_id}
              </TableCell>
              <TableCell>
                {format(
                  new Date(transaction.transaction_date),
                  "MMM d, yyyy"
                )}
              </TableCell>
              <TableCell>{transaction.customer_name}</TableCell>
              <TableCell>{formatCurrency(transaction.amount)}</TableCell>
              <TableCell className="whitespace-nowrap">
                <div className="flex items-center gap-2">
                  {getPaymentMethodIcon(transaction.payment_method)}
                  <span className="capitalize">
                    {transaction.payment_method.replace("_", " ")}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getStatusIcon(transaction.status)}
                  <span className="capitalize">{transaction.status}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getSyncStatusIcon(transaction.sync_status)}
                  <span className="capitalize">{transaction.sync_status}</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
