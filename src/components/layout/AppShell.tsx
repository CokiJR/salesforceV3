
import React, { useState } from "react";
import { useNavigate, Link, Outlet } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  BarChart3,
  Home,
  Package,
  Users,
  ShoppingCart,
  Map,
  UserCog,
  LogOut,
  RefreshCw,
  Upload,
  Download,
  CreditCard,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuthentication } from "@/hooks/useAuthentication";

export default function AppShell() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuthentication();
  const [syncStatus, setSyncStatus] = useState({
    isLoading: false,
    pendingUploads: 2,
    pendingDownloads: 3,
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: "There was an error signing out. Please try again.",
      });
    }
  };

  const handleSync = () => {
    setSyncStatus({ ...syncStatus, isLoading: true });
    toast({
      title: "Synchronization started",
      description: "Your data is being synchronized...",
    });
    
    // Simulate synchronization
    setTimeout(() => {
      setSyncStatus({
        isLoading: false,
        pendingUploads: 0,
        pendingDownloads: 0,
      });
      toast({
        title: "Synchronization complete",
        description: "All your data has been synchronized successfully.",
      });
    }, 2000);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar 
          onSignOut={handleSignOut} 
          onSync={handleSync}
          syncStatus={syncStatus}
          user={user}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="container py-6 px-4 md:px-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

interface AppSidebarProps {
  onSignOut: () => void;
  onSync: () => void;
  syncStatus: {
    isLoading: boolean;
    pendingUploads: number;
    pendingDownloads: number;
  };
  user: any;
}

function AppSidebar({ onSignOut, onSync, syncStatus, user }: AppSidebarProps) {
  return (
    <Sidebar className="border-r">
      <SidebarHeader className="flex h-14 items-center border-b px-6">
        <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
          <div className="rounded-md bg-sales-600 p-1">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold">SalesForce</span>
        </Link>
        <SidebarTrigger className="ml-auto h-8 w-8" />
      </SidebarHeader>
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/dashboard" className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/dashboard/customers" className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span>Customers</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/dashboard/products" className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    <span>Products</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/dashboard/orders" className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    <span>Orders</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/dashboard/collections" className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    <span>Collections</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/dashboard/transactions" className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Transactions</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/dashboard/routes" className="flex items-center gap-2">
                    <Map className="h-5 w-5" />
                    <span>Routes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {user?.role === "admin" && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/dashboard/admin" className="flex items-center gap-2">
                      <UserCog className="h-5 w-5" />
                      <span>Admin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Synchronization</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-4 py-2">
              <Button 
                variant="outline" 
                className="w-full justify-start mb-2" 
                disabled={syncStatus.isLoading}
                onClick={onSync}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncStatus.isLoading ? "animate-spin" : ""}`} />
                Sync All Data
              </Button>
              <div className="flex justify-between mb-2">
                <Button variant="ghost" size="sm" className="w-[48%] justify-start">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                  {syncStatus.pendingUploads > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {syncStatus.pendingUploads}
                    </Badge>
                  )}
                </Button>
                <Button variant="ghost" size="sm" className="w-[48%] justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                  {syncStatus.pendingDownloads > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {syncStatus.pendingDownloads}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-2 mb-2">
          <Avatar>
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback className="bg-sales-100 text-sales-800">
              {user?.full_name?.split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.full_name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start text-destructive" 
          onClick={onSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
