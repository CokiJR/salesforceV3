
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft } from "lucide-react";
import { useAuthentication } from "@/hooks/useAuthentication";
import { OrderSummaryPanel } from "./components/OrderSummaryPanel";
import { OrderItemsTable } from "./components/OrderItemsTable";
import { OrderForm, OrderFormValues } from "./components/OrderForm";
import { useOrderFormData } from "./hooks/useOrderFormData";
import { usePricingForOrders } from "./hooks/usePricingForOrders";
import { OrderItemWithDetails, calculateOrderTotal } from "./utils/orderFormUtils";
import { AlertCircle } from "lucide-react";


export default function AddOrder() {
  const { user } = useAuthentication();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { customers, products, loadingItems } = useOrderFormData();
  const { getProductPrice, checkProductStock, updateInventoryForOrder, inventory, loading: loadingPricing } = usePricingForOrders();
  const [orderItems, setOrderItems] = useState<OrderItemWithDetails[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [searchParams] = useSearchParams();
  const [preselectedCustomer, setPreselectedCustomer] = useState<string | null>(null);
  const [routeStopId, setRouteStopId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Parse query parameters for customer and route stop
  useEffect(() => {
    const customer = searchParams.get("customer");
    const stopId = searchParams.get("stop");
    
    if (customer) {
      setPreselectedCustomer(customer);
    }
    
    if (stopId) {
      setRouteStopId(stopId);
    }
  }, [searchParams]);

  // Calculate total amount
  const totalAmount = calculateOrderTotal(orderItems);

  // Handle adding an item to the order
  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0) return;
    
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;
    
    // Check if product is already in the items list
    if (orderItems.some(item => item.product_id === selectedProduct)) {
      toast({
        variant: "destructive",
        title: "Duplicate product",
        description: "This product is already added to the order. Please modify the quantity instead.",
      });
      return;
    }
    
    // Check inventory stock
    const stockInfo = checkProductStock(product.sku, quantity);
    if (!stockInfo.inStock) {
      toast({
        variant: "destructive",
        title: "Insufficient stock",
        description: `Not enough stock available. Available: ${stockInfo.availableQuantity}, Requested: ${quantity}`,
        action: (
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>Please reduce quantity or check inventory</span>
          </div>
        ),
      });
      return;
    }
    
    // Get price from pricing system
    // Check for special price for this customer and product
    const customerId = preselectedCustomer || "";
    const productPrice = getProductPrice(product.sku, customerId, quantity);
    
    // If no price found in pricing system, show error
    if (productPrice === null) {
      toast({
        variant: "destructive",
        title: "Price not found",
        description: "No pricing information available for this product. Please set up pricing first.",
      });
      return;
    }
    
    const finalPrice = productPrice;
    
    const newItem = {
      product_id: product.id,
      product: product,
      quantity: quantity,
      price: finalPrice,
      total: finalPrice * quantity
    };
    
    setOrderItems([...orderItems, newItem]);
    setSelectedProduct("");
    setQuantity(1);
  };

  // Handle removing an item from the order
  const handleRemoveItem = (index: number) => {
    const newItems = [...orderItems];
    newItems.splice(index, 1);
    setOrderItems(newItems);
  };

  // Handle form submission
  const onSubmit = async (data: OrderFormValues) => {
    if (orderItems.length === 0) {
      toast({
        variant: "destructive",
        title: "No items added",
        description: "Please add at least one product to the order.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Check inventory stock for all items before proceeding
      for (const item of orderItems) {
        const stockInfo = checkProductStock(item.product.sku, item.quantity);
        if (!stockInfo.inStock) {
          toast({
            variant: "destructive",
            title: "Insufficient stock",
            description: `Not enough stock for ${item.product.name}. Available: ${stockInfo.availableQuantity}, Requested: ${item.quantity}`,
          });
          setIsSubmitting(false);
          return;
        }
      }
      
      // Create order object with default status and payment_status
      const orderData = {
        customer_id: data.customer_id,
        salesperson_id: user?.id,
        delivery_date: format(data.delivery_date, "yyyy-MM-dd"),
        payment_status: "unpaid", // Default payment status
        status: "draft", // Default status
        total_amount: totalAmount,
        notes: data.notes || "",
        sync_status: "pending",
        route_stop_id: routeStopId // Include route stop ID if available
      };
      
      // Insert order
      const { data: newOrder, error: orderError } = await supabase
        .from("orders")
        .insert(orderData)
        .select("*")
        .single();
      
      if (orderError) throw orderError;
      
      // Insert order items
      const orderItemsData = orderItems.map(item => ({
        order_id: newOrder.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      }));
      
      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItemsData);
      
      if (itemsError) throw itemsError;
      
      // Update inventory quantities
      const inventoryItems = orderItems.map(item => ({
        sku: item.product.sku,
        quantity: item.quantity
      }));
      
      const inventoryResult = await updateInventoryForOrder(inventoryItems);
      if (!inventoryResult.success) {
        throw new Error(inventoryResult.error || "Failed to update inventory");
      }
      
      // If this came from a route stop, update the stop status to completed
      if (routeStopId) {
        const now = new Date();
        const { error: stopError } = await supabase
          .from("route_stops")
          .update({ 
            status: "completed",
            visited: true,
            visit_date: format(now, "yyyy-MM-dd"),
            visit_time: format(now, "HH:mm:ss")
          })
          .eq("id", routeStopId);
        
        if (stopError) {
          console.error("Error updating route stop:", stopError);
          // Don't throw here, as the order was already created
        }
      }
      
      toast({
        title: "Order created",
        description: `Order has been created successfully and inventory has been updated.`,
      });
      
      // If we came from a route detail, go back to it
      if (routeStopId) {
        // Extract route ID from the referrer if possible
        const referrer = document.referrer;
        const routeMatch = referrer.match(/\/routes\/([^\/]+)$/);
        
        if (routeMatch && routeMatch[1]) {
          navigate(`/dashboard/routes/${routeMatch[1]}`);
        } else {
          navigate("/dashboard/orders");
        }
      } else {
        navigate("/dashboard/orders");
      }
    } catch (error: any) {
      console.error("Error creating order:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create order: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Create Order</h1>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <OrderForm 
            customers={customers}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
            onCancel={() => navigate(-1)}
            hasOrderItems={orderItems.length > 0}
            preselectedCustomer={preselectedCustomer}
            readOnlyCustomer={!!routeStopId} // Make customer field read-only when coming from route
            orderItemsComponent={
              <OrderItemsTable
                orderItems={orderItems}
                products={products}
                selectedProduct={selectedProduct}
                quantity={quantity}
                handleAddItem={handleAddItem}
                handleRemoveItem={handleRemoveItem}
                setSelectedProduct={setSelectedProduct}
                setQuantity={setQuantity}
                totalAmount={totalAmount}
              />
            }
          />
        </div>
        
        <div className="md:col-span-1">
          <OrderSummaryPanel 
            orderItems={orderItems} 
            totalAmount={totalAmount} 
          />
        </div>
      </div>
    </div>
  );
}
