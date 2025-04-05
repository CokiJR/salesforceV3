import { Trash2, ShoppingCart, Plus } from "lucide-react";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { OrderItemWithDetails } from "../utils/orderFormUtils";
import { formatCurrency } from "../utils/currencyUtils";

interface OrderItemsTableProps {
  orderItems: OrderItemWithDetails[];
  products: Product[];
  selectedProduct: string;
  quantity: number;
  handleAddItem: () => void;
  handleRemoveItem: (index: number) => void;
  setSelectedProduct: (value: string) => void;
  setQuantity: (value: number) => void;
  totalAmount: number;
}

export function OrderItemsTable({
  orderItems,
  products,
  selectedProduct,
  quantity,
  handleAddItem,
  handleRemoveItem,
  setSelectedProduct,
  setQuantity,
  totalAmount,
}: OrderItemsTableProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Order Items</h3>
      
      <div className="flex gap-2">
        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select product" />
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name} - {formatCurrency(product.price)} / {product.unit}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
          className="w-24"
          placeholder="Qty"
        />
        
        <Button type="button" onClick={handleAddItem} variant="secondary">
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>
      
      {orderItems.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderItems.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.product.name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                  <TableCell className="text-right">{item.quantity} {item.product.unit}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRemoveItem(index)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} className="text-right font-medium">
                  Total:
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(totalAmount)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="border border-dashed rounded-md p-6 flex flex-col items-center justify-center text-center">
          <ShoppingCart className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No items added to this order yet</p>
          <p className="text-xs text-muted-foreground mt-1">Use the form above to add products</p>
        </div>
      )}
    </div>
  );
}
