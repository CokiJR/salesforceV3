import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Warehouse, Package, ArrowRightLeft, ClipboardCheck, BarChart3 } from "lucide-react";

export default function WMSDashboard() {
  const navigate = useNavigate();

  const modules = [
    {
      title: "Lokasi Penyimpanan",
      description: "Kelola lokasi penyimpanan di gudang",
      icon: <Warehouse className="h-8 w-8 text-sales-600" />,
      path: "/dashboard/wms/locations"
    },
    {
      title: "Perpindahan Barang",
      description: "Catat dan kelola perpindahan barang",
      icon: <ArrowRightLeft className="h-8 w-8 text-sales-600" />,
      path: "/dashboard/wms/movements"
    },
    {
      title: "Stok Opname",
      description: "Lakukan dan kelola stok opname",
      icon: <ClipboardCheck className="h-8 w-8 text-sales-600" />,
      path: "/dashboard/wms/stock-counts"
    },
    {
      title: "Laporan WMS",
      description: "Lihat laporan ketersediaan stok dan riwayat perpindahan",
      icon: <BarChart3 className="h-8 w-8 text-sales-600" />,
      path: "/dashboard/wms/reports"
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Warehouse Management System</h2>
        <p className="text-muted-foreground">
          Kelola gudang, lokasi penyimpanan, dan perpindahan barang
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.map((module, index) => (
          <Card key={index} className="hover:shadow-md transition-all cursor-pointer" onClick={() => navigate(module.path)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{module.title}</CardTitle>
                {module.icon}
              </div>
              <CardDescription>{module.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => navigate(module.path)}>
                Buka {module.title}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Stok</CardTitle>
            <CardDescription>Status stok di semua gudang</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-40">
              <Package className="h-16 w-16 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground ml-4">Pilih gudang untuk melihat detail stok</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
            <CardDescription>Perpindahan barang terbaru</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-40">
              <ArrowRightLeft className="h-16 w-16 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground ml-4">Belum ada aktivitas perpindahan barang</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}