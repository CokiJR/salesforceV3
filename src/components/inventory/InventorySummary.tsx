import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { InventoryWithDetails } from '@/types/inventory';

interface InventorySummaryProps {
  onNavigate?: () => void;
}

export function InventorySummary({ onNavigate }: InventorySummaryProps) {
  const [inventoryStats, setInventoryStats] = useState({
    total: 0,
    lowStock: 0,
    outOfStock: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentInventory, setRecentInventory] = useState<InventoryWithDetails[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInventoryStats();
    fetchRecentInventory();
  }, []);

  const fetchInventoryStats = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory')
        .select('*');

      if (error) throw error;

      const lowStockCount = data?.filter(item => item.quantity > 0 && item.quantity < 10).length || 0;
      const outOfStockCount = data?.filter(item => item.quantity <= 0).length || 0;

      setInventoryStats({
        total: data?.length || 0,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
      });
    } catch (error: any) {
      console.error('Error fetching inventory stats:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          products:sku(id, name, sku, description, price, category, unit),
          warehouses:warehouse_code(code, name, location)
        `)
        .order('last_updated_at', { ascending: false })
        .limit(3);

      if (error) throw error;

      // Transform the data to match our InventoryWithDetails type
      const inventoryWithDetails: InventoryWithDetails[] = data?.map((item: any) => ({
        id: item.id,
        sku: item.sku,
        warehouse_code: item.warehouse_code,
        quantity: item.quantity,
        uom: item.uom,
        last_updated_at: item.last_updated_at,
        product: item.products,
        warehouse: item.warehouses
      })) || [];
      
      setRecentInventory(inventoryWithDetails);
    } catch (error: any) {
      console.error('Error fetching recent inventory:', error.message);
    }
  };

  const handleViewAll = () => {
    if (onNavigate) {
      onNavigate();
    } else {
      navigate('/dashboard/inventory');
    }
  };

  const getStockStatusBadge = (quantity: number) => {
    if (quantity <= 0) {
      return <Badge variant="destructive" className="ml-2">Habis</Badge>;
    } else if (quantity < 10) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 ml-2">Stok Rendah</Badge>;
    } else {
      return <Badge variant="outline" className="bg-green-100 text-green-800 ml-2">Tersedia</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Ringkasan Inventory</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-md">
            <Package className="h-8 w-8 text-blue-500 mb-1" />
            <div className="text-2xl font-bold">{loading ? '...' : inventoryStats.total}</div>
            <p className="text-xs text-muted-foreground text-center">Total Produk</p>
          </div>
          <div className="flex flex-col items-center justify-center p-3 bg-yellow-50 rounded-md">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mb-1" />
            <div className="text-2xl font-bold">{loading ? '...' : inventoryStats.lowStock}</div>
            <p className="text-xs text-muted-foreground text-center">Stok Rendah</p>
          </div>
          <div className="flex flex-col items-center justify-center p-3 bg-red-50 rounded-md">
            <AlertTriangle className="h-8 w-8 text-red-500 mb-1" />
            <div className="text-2xl font-bold">{loading ? '...' : inventoryStats.outOfStock}</div>
            <p className="text-xs text-muted-foreground text-center">Habis</p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium">Inventory Terbaru</h4>
          {recentInventory.length > 0 ? (
            <div className="space-y-2">
              {recentInventory.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-muted/40 rounded-md">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.warehouse?.name}</p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium mr-2">{item.quantity} {item.uom}</span>
                    {getStockStatusBadge(item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-4 text-center">
              <p className="text-sm text-muted-foreground">Tidak ada data inventory</p>
            </div>
          )}
        </div>

        <Button 
          variant="outline" 
          className="w-full mt-4" 
          onClick={handleViewAll}
        >
          Lihat Semua Inventory
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}