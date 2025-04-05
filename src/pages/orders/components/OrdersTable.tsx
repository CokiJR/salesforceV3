
import { Order } from "@/types";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { format } from "date-fns";

interface OrdersTableProps {
  orders: Order[];
  formatCurrency: (amount: number) => string;
  getStatusColor: (status: string) => string;
  getPaymentStatusColor: (status: string) => string;
  onOrderClick: (orderId: string) => void;
}

export const OrdersTable = ({ 
  orders, 
  formatCurrency, 
  onOrderClick
}: OrdersTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow 
              key={order.id} 
              className="cursor-pointer hover:bg-muted/60"
              onClick={() => onOrderClick(order.id)}
            >
              <TableCell className="font-medium">{order.id.substring(0, 8)}</TableCell>
              <TableCell>{order.customer?.name}</TableCell>
              <TableCell>{format(new Date(order.order_date), "MMM d, yyyy")}</TableCell>
              <TableCell>{formatCurrency(order.total_amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
