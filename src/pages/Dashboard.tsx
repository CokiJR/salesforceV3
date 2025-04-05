
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthentication } from "@/hooks/useAuthentication";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Users, Package, Map, ShoppingCart, CalendarDays } from "lucide-react";
import SyncManager from "@/components/sync/SyncManager";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuthentication();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    customers: 0,
    products: 0,
    orders: 0,
    routes: 0
  });
  const [todayRoutes, setTodayRoutes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch customers count
      const { count: customersCount, error: customersError } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });
      
      if (customersError) throw customersError;
      
      // Fetch products count
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      
      if (productsError) throw productsError;
      
      // Fetch orders count
      const { count: ordersCount, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
      
      if (ordersError) throw ordersError;
      
      // Fetch routes count
      const { count: routesCount, error: routesError } = await supabase
        .from('daily_routes')
        .select('*', { count: 'exact', head: true });
      
      if (routesError) throw routesError;
      
      // Fetch today's routes
      const today = format(new Date(), 'yyyy-MM-dd');
      const { count: todayRoutesCount, error: todayRoutesError } = await supabase
        .from('daily_routes')
        .select('*', { count: 'exact', head: true })
        .eq('date', today)
        .eq('salesperson_id', user?.id);
      
      if (todayRoutesError) throw todayRoutesError;
      
      setStats({
        customers: customersCount || 0,
        products: productsCount || 0,
        orders: ordersCount || 0,
        routes: routesCount || 0
      });
      
      setTodayRoutes(todayRoutesCount || 0);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Navigation handlers for each card
  const navigateToCustomers = () => navigate("/dashboard/customers");
  const navigateToProducts = () => navigate("/dashboard/products");
  const navigateToOrders = () => navigate("/dashboard/orders");
  const navigateToRoutes = () => navigate("/dashboard/routes");

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.full_name}</h1>
        <p className="text-muted-foreground">
          Here's an overview of your sales activities
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50" 
          onClick={navigateToCustomers}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.customers}</div>
            <p className="text-xs text-muted-foreground">
              Active accounts in your territory
            </p>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50" 
          onClick={navigateToProducts}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.products}</div>
            <p className="text-xs text-muted-foreground">
              Items available for sale
            </p>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50" 
          onClick={navigateToOrders}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.orders}</div>
            <p className="text-xs text-muted-foreground">
              All time orders processed
            </p>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50" 
          onClick={navigateToRoutes}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Routes
            </CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.routes}</div>
            <p className="text-xs text-muted-foreground">
              Daily routes planned
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            {todayRoutes > 0 ? (
              <div className="flex items-center space-x-4">
                <CalendarDays className="h-8 w-8 text-sales-600" />
                <div>
                  <p className="text-lg font-medium">You have {todayRoutes} route{todayRoutes > 1 ? 's' : ''} planned for today</p>
                  <p className="text-sm text-muted-foreground">Check your route details for more information</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <CalendarDays className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">No routes planned for today</p>
                  <p className="text-sm text-muted-foreground">Create a new route to plan your customer visits</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Synchronization</CardTitle>
          </CardHeader>
          <CardContent>
            <SyncManager onSyncComplete={fetchDashboardStats} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
