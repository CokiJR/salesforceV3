import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Transaction } from "@/types";

const GenerateDummyData = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const generateCustomers = async () => {
    const dummyCustomers = [
      {
        name: "ABC Mart",
        address: "123 Main St",
        city: "San Francisco",
        phone: "415-555-1234",
        email: "contact@abcmart.com",
        contact_person: "John Smith",
        status: "active",
        location: { lat: 37.7749, lng: -122.4194 }
      },
      {
        name: "Quick Stop",
        address: "456 Market St",
        city: "San Francisco",
        phone: "415-555-5678",
        email: "info@quickstop.com",
        contact_person: "Jane Doe",
        status: "active",
        location: { lat: 37.7899, lng: -122.4014 }
      },
      {
        name: "Corner Shop",
        address: "789 Mission St",
        city: "San Francisco",
        phone: "415-555-9012",
        email: "shop@cornershop.com",
        contact_person: "Bob Johnson",
        status: "active",
        location: { lat: 37.7847, lng: -122.4079 }
      },
      {
        name: "Fresh Foods",
        address: "321 Howard St",
        city: "San Francisco",
        phone: "415-555-3456",
        email: "orders@freshfoods.com",
        contact_person: "Sarah Lee",
        status: "active",
        location: { lat: 37.7914, lng: -122.3964 }
      },
      {
        name: "Sunny Grocers",
        address: "654 Folsom St",
        city: "San Francisco",
        phone: "415-555-7890",
        email: "hello@sunnygrocers.com",
        contact_person: "Mike Wang",
        status: "active",
        location: { lat: 37.7853, lng: -122.3982 }
      }
    ];

    const { error } = await supabase
      .from("customers")
      .upsert(dummyCustomers, { onConflict: "name" });

    if (error) throw error;
    setProgress(15);
    return "Customers generated successfully";
  };

  const generateProducts = async () => {
    const dummyProducts = [
      {
        name: "Premium Coffee",
        sku: "COF-001",
        description: "High-quality coffee beans, 100% Arabica",
        price: 12.99,
        category: "Beverages",
        unit: "kg",
        stock: 50,
        image_url: "https://images.unsplash.com/photo-1523374228107-6e44bd2b524e?auto=format&fit=crop&q=80&w=300&h=300"
      },
      {
        name: "Fresh Milk",
        sku: "MLK-002",
        description: "Organic whole milk",
        price: 3.49,
        category: "Dairy",
        unit: "L",
        stock: 100,
        image_url: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&q=80&w=300&h=300"
      },
      {
        name: "Wheat Bread",
        sku: "BRD-003",
        description: "Freshly baked wheat bread",
        price: 4.99,
        category: "Bakery",
        unit: "loaf",
        stock: 30,
        image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=300&h=300"
      },
      {
        name: "Chocolate Bar",
        sku: "CHC-004",
        description: "Dark chocolate with 70% cocoa",
        price: 2.99,
        category: "Confectionery",
        unit: "bar",
        stock: 80,
        image_url: "https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&q=80&w=300&h=300"
      },
      {
        name: "Bottled Water",
        sku: "WAT-005",
        description: "Natural spring water",
        price: 1.49,
        category: "Beverages",
        unit: "bottle",
        stock: 120,
        image_url: "https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&q=80&w=300&h=300"
      },
      {
        name: "Potato Chips",
        sku: "CHP-006",
        description: "Crispy salted potato chips",
        price: 3.29,
        category: "Snacks",
        unit: "bag",
        stock: 60,
        image_url: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&q=80&w=300&h=300"
      },
      {
        name: "Fresh Apples",
        sku: "APL-007",
        description: "Organic Granny Smith apples",
        price: 0.99,
        category: "Produce",
        unit: "each",
        stock: 150,
        image_url: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&q=80&w=300&h=300"
      }
    ];

    const { error } = await supabase
      .from("products")
      .upsert(dummyProducts, { onConflict: "sku" });

    if (error) throw error;
    setProgress(30);
    return "Products generated successfully";
  };

  const generateRoutes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data: customers } = await supabase
      .from("customers")
      .select("id")
      .limit(5);

    if (!customers?.length) throw new Error("No customers found");

    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];

    const { data: routeData, error: routeError } = await supabase
      .from("daily_routes")
      .upsert({
        salesperson_id: user.id,
        date: formattedDate
      }, { onConflict: "salesperson_id, date" })
      .select();

    if (routeError) throw routeError;
    if (!routeData?.length) throw new Error("Failed to create route");

    const routeId = routeData[0].id;

    const stops = customers.map((customer, index) => {
      const hour = 9 + index;
      return {
        route_id: routeId,
        customer_id: customer.id,
        visit_date: formattedDate,
        visit_time: `${hour}:00:00`,
        status: "pending",
        notes: "Scheduled visit"
      };
    });

    const { error: stopError } = await supabase
      .from("route_stops")
      .upsert(stops, { onConflict: "route_id, customer_id" });

    if (stopError) throw stopError;
    setProgress(45);
    return "Routes generated successfully";
  };

  const generateOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data: customers } = await supabase
      .from("customers")
      .select("id")
      .limit(3);

    if (!customers?.length) throw new Error("No customers found");

    const { data: products } = await supabase
      .from("products")
      .select("id, price")
      .limit(5);

    if (!products?.length) throw new Error("No products found");

    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    for (const customer of customers) {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: customer.id,
          salesperson_id: user.id,
          status: "pending",
          delivery_date: nextWeek.toISOString(),
          payment_status: "unpaid",
          notes: "Test order"
        })
        .select();

      if (orderError) throw orderError;
      if (!orderData?.length) continue;

      const orderId = orderData[0].id;

      const numProducts = Math.floor(Math.random() * 2) + 2;
      let totalAmount = 0;

      for (let i = 0; i < numProducts; i++) {
        const product = products[i % products.length];
        const quantity = Math.floor(Math.random() * 5) + 1;
        const price = Number(product.price);
        const total = price * quantity;
        totalAmount += total;

        const { error: itemError } = await supabase
          .from("order_items")
          .insert({
            order_id: orderId,
            product_id: product.id,
            quantity: quantity,
            price: price,
            total: total
          });

        if (itemError) throw itemError;
      }

      const { error: updateError } = await supabase
        .from("orders")
        .update({ total_amount: totalAmount })
        .eq("id", orderId);

      if (updateError) throw updateError;
    }

    setProgress(60);
    return "Orders generated successfully";
  };

  const generateTransactions = async () => {
    const { data: orders, error: ordersFetchError } = await supabase
      .from("orders")
      .select("id, customer_id, total_amount, notes")
      .limit(5);

    if (ordersFetchError) throw ordersFetchError;
    if (!orders?.length) throw new Error("No orders found");

    for (const order of orders) {
      const transactionData = {
        order_id: order.id,
        customer_id: order.customer_id,
        amount: order.total_amount,
        transaction_id: `TRX-${Math.floor(Math.random() * 10000)}`,
        status: ["pending", "completed", "failed"][Math.floor(Math.random() * 3)] as "pending" | "completed" | "failed",
        sync_status: ["pending", "synced", "failed"][Math.floor(Math.random() * 3)] as "pending" | "synced" | "failed",
        payment_method: ["cash", "credit_card", "bank_transfer"][Math.floor(Math.random() * 3)] as "cash" | "credit_card" | "bank_transfer",
        transaction_date: new Date().toISOString()
      };
      
      const { error: insertError } = await supabase
        .from("transactions")
        .insert(transactionData);
        
      if (insertError) {
        console.error("Error inserting transaction:", insertError);
        throw insertError;
      }
      
      const updateData: { 
        sync_status: string, 
        notes: string 
      } = { 
        sync_status: ["pending", "synced", "failed"][Math.floor(Math.random() * 3)],
        notes: `${order.notes || ''} Transaction ID: ${transactionData.transaction_id}`
      };
      
      const { error: updateError } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", order.id);
        
      if (updateError) throw updateError;
    }
    
    setProgress(80);
    return "Transactions generated successfully";
  };

  const generateSyncData = async () => {
    const lastSync = new Date();
    lastSync.setHours(lastSync.getHours() - Math.floor(Math.random() * 24));
    
    localStorage.setItem('syncStatus', JSON.stringify({
      last_sync: lastSync.toISOString(),
      pending_uploads: Math.floor(Math.random() * 5),
      pending_downloads: Math.floor(Math.random() * 3),
      sync_history: [
        {
          timestamp: lastSync.toISOString(),
          status: "success",
          items_synced: Math.floor(Math.random() * 20) + 5
        },
        {
          timestamp: new Date(lastSync.getTime() - 1000 * 60 * 60 * 3).toISOString(),
          status: "partial",
          items_synced: Math.floor(Math.random() * 10) + 2,
          error: "Network timeout on 3 items"
        },
        {
          timestamp: new Date(lastSync.getTime() - 1000 * 60 * 60 * 24).toISOString(),
          status: "success",
          items_synced: Math.floor(Math.random() * 15) + 10
        }
      ]
    }));
    
    setProgress(100);
    return "Sync data generated successfully";
  };

  const handleGenerateAll = async () => {
    try {
      setLoading(true);
      setProgress(0);

      await generateCustomers();
      await generateProducts();
      await generateRoutes();
      await generateOrders();
      await generateTransactions();
      await generateSyncData();
      
      toast({
        title: "Success",
        description: "Dummy data generated successfully!",
      });

      setTimeout(() => {
        navigate("/dashboard/orders");
      }, 1500);
    } catch (error: any) {
      console.error("Error generating dummy data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to generate data: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto py-8 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Generate Dummy Data</CardTitle>
          <CardDescription>
            Create sample customers, products, routes, orders and transactions for testing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will create:
          </p>
          <ul className="list-disc pl-5 text-sm space-y-1">
            <li>5 sample customers</li>
            <li>7 products with different categories</li>
            <li>A route for today with customer stops</li>
            <li>Sample orders with multiple products</li>
            <li>Transaction records with sync status</li>
            <li>Sync history data for testing</li>
          </ul>
          
          {progress > 0 && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-right text-muted-foreground">{progress}% complete</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleGenerateAll} 
            disabled={loading} 
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Dummy Data"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default GenerateDummyData;
