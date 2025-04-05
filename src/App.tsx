
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

// Import the new detail view components
import CustomerDetail from "@/pages/customers/CustomerDetail";
import ProductDetail from "@/pages/products/ProductDetail";
import OrderDetail from "@/pages/orders/OrderDetail";
import RouteDetail from "@/pages/routes/RouteDetail";
import EditCustomer from "@/pages/customers/EditCustomer";

// Import the edit route component
import EditRoute from "@/pages/routes/EditRoute";

const queryClient = new QueryClient();

const App = () => {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                
                <Route path="/dashboard" element={<AppShell />}>
                  <Route index element={<Dashboard />} />
                  
                  <Route path="customers" element={<Customers />} />
                  <Route path="customers/:id" element={<CustomerDetail />} />
                  <Route path="customers/add" element={<AddCustomer />} />
                  <Route path="customers/edit/:id" element={<EditCustomer />} />
                  
                  <Route path="products" element={<Products />} />
                  <Route path="products/:id" element={<ProductDetail />} />
                  <Route path="products/add" element={<AddProduct />} />
                  
                  <Route path="orders" element={<Orders />} />
                  <Route path="orders/:id" element={<OrderDetail />} />
                  <Route path="orders/add" element={<AddOrder />} />
                  
                  <Route path="routes" element={<RoutesPage />} />
                  <Route path="routes/:id" element={<RouteDetail />} />
                  <Route path="routes/create" element={<CreateRoute />} />
                  <Route path="routes/edit/:id" element={<EditRoute />} />
                  
                  <Route path="collections" element={<Collections />} />
                  <Route path="collections/add" element={<AddCollection />} />
                  
                  <Route path="payments" element={<Payments />} />
                  <Route path="payments/add" element={<AddPayment />} />
                  
                  <Route path="transactions" element={<Transactions />} />
                  <Route path="transactions/:id" element={<div className="p-4 animate-fade-in">Transaction details coming soon</div>} />
                  <Route path="transactions/add" element={<AddTransaction />} />
                  
                  <Route path="admin" element={<div className="p-4 animate-fade-in">Admin page coming soon</div>} />
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
