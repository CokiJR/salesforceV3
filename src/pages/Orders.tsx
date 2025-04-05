
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useOrdersData } from "./orders/hooks/useOrdersData";
import { formatCurrency } from "./orders/utils/currencyUtils";
import { OrdersHeader } from "./orders/components/OrdersHeader";
import { OrderSearch } from "./orders/components/OrderSearch";
import { OrdersTable } from "./orders/components/OrdersTable";
import { EmptyOrdersState } from "./orders/components/EmptyOrdersState";

const Orders = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { orders, loading } = useOrdersData();
  const navigate = useNavigate();

  const handleAddOrder = () => {
    navigate("/dashboard/orders/add");
  };

  const handleOrderDetails = (orderId: string) => {
    navigate(`/dashboard/orders/${orderId}`);
  };

  const filteredOrders = orders.filter(order => 
    order.customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <OrdersHeader onAddOrder={handleAddOrder} />
      
      <OrderSearch 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
      />

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredOrders.length > 0 ? (
        <OrdersTable 
          orders={filteredOrders}
          formatCurrency={formatCurrency}
          getStatusColor={() => ""}
          getPaymentStatusColor={() => ""}
          onOrderClick={handleOrderDetails}
        />
      ) : (
        <EmptyOrdersState 
          searchQuery={searchQuery} 
          onAddOrder={handleAddOrder} 
        />
      )}
    </div>
  );
};

export default Orders;
