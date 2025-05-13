import { Trash2, ShoppingCart, Plus, Search } from "lucide-react";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useState, useEffect, useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Filter products based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts([]);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = products.filter(product => 
      product.sku.toLowerCase().includes(query) || 
      product.name.toLowerCase().includes(query)
    );
    
    setFilteredProducts(filtered);
  }, [searchQuery, products]);
  
  // Handle product selection
  const handleSelectProduct = (productId: string) => {
    setSelectedProduct(productId);
    setSearchQuery("");
    setOpen(false);
    
    // Focus on quantity input after selecting a product
    setTimeout(() => {
      const quantityInput = document.querySelector('input[type="number"]') as HTMLInputElement;
      if (quantityInput) quantityInput.focus();
    }, 100);
  };
  
  // Get selected product details
  const selectedProductDetails = products.find(p => p.id === selectedProduct);
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Order Items</h3>
      
      <div className="flex gap-2">
        <div className="relative w-[300px]">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <div className="relative w-full">
                <Input
                  ref={inputRef}
                  placeholder="Cari produk berdasarkan SKU atau nama"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!open) setOpen(true);
                  }}
                  className="w-full pr-10"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filteredProducts.length > 0) {
                      handleSelectProduct(filteredProducts[0].id);
                    }
                  }}
                />
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start" side="bottom" sideOffset={5} style={{ width: 'var(--radix-popover-trigger-width)' }}>
              <Command>
                <CommandList>
                  <CommandEmpty>Produk tidak ditemukan</CommandEmpty>
                  <CommandGroup>
                    {filteredProducts.slice(0, 10).map((product) => (
                      <CommandItem
                        key={product.id}
                        value={product.id}
                        onSelect={() => handleSelectProduct(product.id)}
                      >
                        <div className="flex flex-col">
                          <span>{product.name}</span>
                          <span className="text-xs text-muted-foreground">SKU: {product.sku} | {product.unit}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        
        <Input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
          className="w-24"
          placeholder="Qty"
        />
        
        <Button 
          type="button" 
          onClick={handleAddItem} 
          variant="secondary"
          disabled={!selectedProduct}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>
      
      {selectedProductDetails && (
        <div className="text-sm text-muted-foreground mt-1">
          Produk terpilih: <span className="font-medium">{selectedProductDetails.name}</span> ({selectedProductDetails.sku})
        </div>
      )}
      
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
