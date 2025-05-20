import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  HashRouter,
  Routes,
  Route,
  Navigate,
  useRoutes,
  RouteObject,
} from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider } from "@/hooks/useAuthentication";
import AppShell from "@/components/layout/AppShell";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Customers from "@/pages/Customers";
import Products from "@/pages/Products";
import Orders from "@/pages/Orders";
import RoutesPage from "@/pages/Routes"; // Renamed import to avoid conflict
import Transactions from "@/pages/Transactions";
import Collections from "@/pages/Collections";
import BankAccounts from "@/pages/BankAccounts";
import Warehouses from "@/pages/Warehouses";
import Inventory from "@/pages/Inventory";
import Pricing from "@/pages/Pricing";
import NotFound from "./pages/NotFound";
import Index from "@/pages/Index";

// Import the new add/create page components
import AddCustomer from "@/pages/customers/AddCustomer";
import AddProduct from "@/pages/products/AddProduct";
import AddOrder from "@/pages/orders/AddOrder";
import CreateRoute from "@/pages/routes/CreateRoute";
import AddTransaction from "@/pages/transactions/AddTransaction";
import AddCollection from "@/pages/collections/AddCollection";
import AddPayment from "@/pages/collections/AddPayment";
import Payments from "@/pages/collections/Payments";
import Giro from "@/pages/collections/Giro";
import GiroClearing from "@/pages/collections/GiroClearing";
import AddInventory from "@/pages/inventory/AddInventory";

// Import the new detail view components
import CustomerDetail from "@/pages/customers/CustomerDetail";
import ProductDetail from "@/pages/products/ProductDetail";
import OrderDetail from "@/pages/orders/OrderDetail";
import RouteDetail from "@/pages/routes/RouteDetail";
import EditCustomer from "@/pages/customers/EditCustomer";
import EditProduct from "@/pages/products/EditProduct";

// Import the edit route component
import EditRoute from "@/pages/routes/EditRoute";

// Import tempo routes for storyboards
import routes from "tempo-routes";

// Create a wrapper component for Tempo routes
const TempoRoutes = ({ routes }: { routes: RouteObject[] }) => {
  return useRoutes(routes);
};

const queryClient = new QueryClient();

const App = () => {
  // Log when running in Tempo environment for debugging
  if (import.meta.env.VITE_TEMPO === "true") {
    console.log("Running in Tempo environment");
  }

  // Use HashRouter when in Tempo environment to ensure proper routing in iframe
  const Router =
    import.meta.env.VITE_TEMPO === "true" ? HashRouter : BrowserRouter;

  return (
    <React.StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Router>
              {/* Create a wrapper component to use routes inside Router context */}
              {import.meta.env.VITE_TEMPO === "true" && (
                <TempoRoutes routes={routes} />
              )}
              <AuthProvider>
                <Routes>
                  {/* Tempo routes for storyboards */}
                  {import.meta.env.VITE_TEMPO === "true" && (
                    <Route path="/tempobook/*" element={null} />
                  )}
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />

                  <Route path="/dashboard" element={<AppShell />}>
                    <Route index element={<Dashboard />} />

                    <Route path="customers" element={<Customers />} />
                    <Route path="customers/:id" element={<CustomerDetail />} />
                    <Route path="customers/add" element={<AddCustomer />} />
                    <Route
                      path="customers/edit/:id"
                      element={<EditCustomer />}
                    />

                    <Route path="products" element={<Products />} />
                    <Route path="products/add" element={<AddProduct />} />
                    <Route path="products/edit/:id" element={<EditProduct />} />
                    <Route path="products/:id" element={<ProductDetail />} />

                    <Route path="orders" element={<Orders />} />
                    <Route path="orders/:id" element={<OrderDetail />} />
                    <Route path="orders/add" element={<AddOrder />} />

                    <Route path="delivery" element={
                      <Suspense fallback={<div className="p-4 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
                        {React.createElement(React.lazy(() => import("@/pages/delivery/Delivery")))} 
                      </Suspense>
                    } />
                    <Route path="delivery/:id" element={
                      <Suspense fallback={<div className="p-4 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
                        {React.createElement(React.lazy(() => import("@/pages/delivery/InvoiceDetail")))} 
                      </Suspense>
                    } />

                    <Route path="routes" element={<RoutesPage />} />
                    <Route path="routes/:id" element={<RouteDetail />} />
                    <Route path="routes/create" element={<CreateRoute />} />
                    <Route path="routes/edit/:id" element={<EditRoute />} />

                    <Route path="collections" element={<Collections />} />
                    <Route path="collections/add" element={<AddCollection />} />

                    <Route path="payments" element={<Payments />} />
                    <Route path="payments/add" element={<AddPayment />} />
                    <Route path="giro" element={<Giro />} />
                    <Route path="giro/clearing/:id" element={<GiroClearing />} />

                    <Route path="bank-accounts" element={<BankAccounts />} />

                    <Route path="warehouses" element={<Warehouses />} />

                    <Route path="inventory" element={<Inventory />} />
                    <Route path="inventory/add" element={<AddInventory />} />

                    {/* WMS Routes */}
                    <Route path="wms" element={<Navigate to="/dashboard/wms/dashboard" replace />} />
                    <Route path="wms/dashboard" element={
                      <Suspense fallback={<div className="p-4 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
                        {React.createElement(React.lazy(() => import("@/pages/wms/WMSDashboard")))} 
                      </Suspense>
                    } />
                    <Route path="wms/locations" element={
                      <Suspense fallback={<div className="p-4 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
                        {React.createElement(React.lazy(() => import("@/pages/wms/StorageLocations")))} 
                      </Suspense>
                    } />
                    <Route path="wms/movements" element={
                      <Suspense fallback={<div className="p-4 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
                        {React.createElement(React.lazy(() => import("@/pages/wms/InventoryMovements")))} 
                      </Suspense>
                    } />

                    <Route path="wms/reports" element={
                      <Suspense fallback={<div className="p-4 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
                        {React.createElement(React.lazy(() => import("@/pages/wms/WMSReports")))} 
                      </Suspense>
                    } />

                    <Route path="pricing" element={<Pricing />} />
                    <Route path="pricing/add" element={
                      <Suspense fallback={<div className="p-4 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
                        {React.createElement(React.lazy(() => import("@/pages/pricing/AddPricing")))}
                      </Suspense>
                    } />
                    <Route path="pricing/add-special" element={
                      <Suspense fallback={<div className="p-4 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
                        {React.createElement(React.lazy(() => import("@/pages/pricing/AddSpecialPricing")))}
                      </Suspense>
                    } />
                    <Route path="pricing/edit/:id" element={
                      <Suspense fallback={<div className="p-4 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
                        {React.createElement(React.lazy(() => import("@/pages/pricing/EditPricing")))}
                      </Suspense>
                    } />
                    <Route path="pricing/edit-special/:id" element={
                      <Suspense fallback={<div className="p-4 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
                        {React.createElement(React.lazy(() => import("@/pages/pricing/EditSpecialPricing")))}
                      </Suspense>
                    } />

                    <Route path="transactions" element={<Transactions />} />
                    <Route
                      path="transactions/:id"
                      element={
                        <div className="p-4 animate-fade-in">
                          Transaction details coming soon
                        </div>
                      }
                    />
                    <Route
                      path="transactions/add"
                      element={<AddTransaction />}
                    />

                    <Route
                      path="admin"
                      element={
                        <div className="p-4 animate-fade-in">
                          Admin page coming soon
                        </div>
                      }
                    />
                  </Route>

                  {/* Tempo routes are now handled above */}

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AuthProvider>
            </Router>
          </TooltipProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
};

export default App;
