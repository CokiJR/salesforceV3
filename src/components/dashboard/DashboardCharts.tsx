import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { FileDown, BarChart3, PieChart, LineChart, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartPieChart,
  Pie,
  Cell,
  LineChart as RechartLineChart,
  Line,
} from 'recharts';

interface ChartData {
  name: string;
  value: number;
  fill?: string;
}

interface TimeSeriesData {
  date: string;
  value: number;
}

interface DashboardChartsProps {
  onRefresh?: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const DashboardCharts: React.FC<DashboardChartsProps> = ({ onRefresh }) => {
  const [activeTab, setActiveTab] = useState('sales');
  const [isLoading, setIsLoading] = useState(false);
  
  // Filter states for each tab
  const [salesTimeRange, setSalesTimeRange] = useState('6months');
  const [collectionsTimeRange, setCollectionsTimeRange] = useState('6months');
  const [paymentsTimeRange, setPaymentsTimeRange] = useState('6months');
  const [giroTimeRange, setGiroTimeRange] = useState('6months');
  const [salespersonTimeRange, setSalespersonTimeRange] = useState('6months');
  
  // Data states
  const [salesData, setSalesData] = useState<ChartData[]>([]);
  const [salesTimeData, setSalesTimeData] = useState<TimeSeriesData[]>([]);
  const [collectionsData, setCollectionsData] = useState<ChartData[]>([]);
  const [collectionsTimeData, setCollectionsTimeData] = useState<TimeSeriesData[]>([]);
  const [paymentsData, setPaymentsData] = useState<ChartData[]>([]);
  const [paymentsTimeData, setPaymentsTimeData] = useState<TimeSeriesData[]>([]);
  const [giroData, setGiroData] = useState<ChartData[]>([]);
  const [salespersonData, setSalespersonData] = useState<ChartData[]>([]);
  const [salespersonTimeData, setSalespersonTimeData] = useState<TimeSeriesData[]>([]);
  
  // Effect hooks for each tab's data fetching
  useEffect(() => {
    fetchSalesData();
  }, [salesTimeRange]);
  
  useEffect(() => {
    fetchCollectionsData();
  }, [collectionsTimeRange]);
  
  useEffect(() => {
    fetchPaymentsData();
  }, [paymentsTimeRange]);
  
  useEffect(() => {
    fetchGiroData();
  }, [giroTimeRange]);
  
  useEffect(() => {
    fetchSalespersonData();
  }, [salespersonTimeRange]);
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      switch (activeTab) {
        case 'sales':
          await fetchSalesData();
          break;
        case 'collections':
          await fetchCollectionsData();
          break;
        case 'payments':
          await fetchPaymentsData();
          break;
        case 'giro':
          await fetchGiroData();
          break;
        case 'salesperson':
          await fetchSalespersonData();
          break;
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getDateRange = (timeRange: string) => {
    const endDate = new Date();
    let startDate;
    
    switch (timeRange) {
      case '1month':
        startDate = subMonths(endDate, 1);
        break;
      case '3months':
        startDate = subMonths(endDate, 3);
        break;
      case '6months':
        startDate = subMonths(endDate, 6);
        break;
      case '12months':
        startDate = subMonths(endDate, 12);
        break;
      default:
        startDate = subMonths(endDate, 6);
    }
    
    return {
      start: startOfMonth(startDate),
      end: endOfMonth(endDate)
    };
  };
  
  // Get current time range based on active tab
  const getCurrentTimeRange = () => {
    switch (activeTab) {
      case 'sales':
        return salesTimeRange;
      case 'collections':
        return collectionsTimeRange;
      case 'payments':
        return paymentsTimeRange;
      case 'giro':
        return giroTimeRange;
      case 'salesperson':
        return salespersonTimeRange;
      default:
        return salesTimeRange;
    }
  };
  
  // Set time range based on active tab
  const setCurrentTimeRange = (value: string) => {
    switch (activeTab) {
      case 'sales':
        setSalesTimeRange(value);
        break;
      case 'collections':
        setCollectionsTimeRange(value);
        break;
      case 'payments':
        setPaymentsTimeRange(value);
        break;
      case 'giro':
        setGiroTimeRange(value);
        break;
      case 'salesperson':
        setSalespersonTimeRange(value);
        break;
    }
  };
  
  const fetchSalesData = async () => {
    const { start, end } = getDateRange(salesTimeRange);
    
    // Fetch sales by customer with customer name from the customers table
    const { data: customerSales, error: customerError } = await supabase
      .from('orders')
      .select(`
        id,
        customer_id,
        total_amount,
        created_at,
        customer:customer_id (name)
      `)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());
    
    if (customerError) throw customerError;
    
    // Aggregate sales by customer
    const salesByCustomer = customerSales?.reduce((acc: Record<string, number>, order) => {
      // Use customer.name from the joined relationship
      const customerName = order.customer?.name || 'Unknown Customer';
      if (!acc[customerName]) acc[customerName] = 0;
      acc[customerName] += order.total_amount;
      return acc;
    }, {});
    
    // Convert to chart data format
    const chartData = Object.entries(salesByCustomer || {}).map(([name, value], index) => ({
      name,
      value,
      fill: COLORS[index % COLORS.length]
    })).sort((a, b) => b.value - a.value).slice(0, 5); // Top 5 customers
    
    setSalesData(chartData);
    
    // Fetch sales by month
    const salesByMonth: Record<string, number> = {};
    
    customerSales?.forEach(order => {
      // Pastikan created_at ada sebelum memformat tanggal
      if (order.created_at) {
        const monthYear = format(new Date(order.created_at), 'MMM yyyy', { locale: id });
        if (!salesByMonth[monthYear]) salesByMonth[monthYear] = 0;
        salesByMonth[monthYear] += order.total_amount;
      }
    });
    
    const timeSeriesData = Object.entries(salesByMonth).map(([date, value]) => ({
      date,
      value
    })).sort((a, b) => {
      // Sort by date
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
    
    setSalesTimeData(timeSeriesData);
  };
  
  const fetchSalespersonData = async () => {
    const { start, end } = getDateRange(salespersonTimeRange);
    
    // Pertama, ambil data orders dengan salesperson_id
    const { data: salesData, error: salesError } = await supabase
      .from('orders')
      .select(`
        id,
        total_amount,
        created_at,
        salesperson_id
      `)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());
    
    if (salesError) {
      console.error('Error fetching salesperson data:', salesError);
      throw salesError;
    }
    
    // Jika tidak ada data, set data kosong
    if (!salesData || salesData.length === 0) {
      setSalespersonData([]);
      setSalespersonTimeData([]);
      return;
    }
    
    // Ambil semua salesperson_id unik dari data orders
    const salespersonIds = [...new Set(salesData.map(order => order.salesperson_id).filter(Boolean))];
    
    // Ambil data profiles untuk semua salesperson_id
    const { data: salespersonProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', salespersonIds);
    
    if (profilesError) {
      console.error('Error fetching salesperson profiles:', profilesError);
    }
    
    // Buat mapping dari salesperson_id ke nama
    const salespersonMap: Record<string, string> = {};
    if (salespersonProfiles) {
      salespersonProfiles.forEach(profile => {
        salespersonMap[profile.id] = profile.full_name;
      });
    }
    
    // Aggregate sales by salesperson
    const salesBySalesperson = salesData.reduce((acc: Record<string, number>, order) => {
      // Gunakan nama dari mapping atau ID jika tidak ditemukan
      const salespersonName = salespersonMap[order.salesperson_id] || `ID: ${order.salesperson_id || 'Unknown'}`;
      if (!acc[salespersonName]) acc[salespersonName] = 0;
      acc[salespersonName] += order.total_amount;
      return acc;
    }, {});
    
    // Convert to chart data format
    const chartData = Object.entries(salesBySalesperson).map(([name, value], index) => ({
      name,
      value,
      fill: COLORS[index % COLORS.length]
    })).sort((a, b) => b.value - a.value); // Sort by value
    
    setSalespersonData(chartData);
    
    // Fetch sales by month for each salesperson
    const salesByMonth: Record<string, Record<string, number>> = {};
    
    salesData.forEach(order => {
      if (order.created_at) {
        const monthYear = format(new Date(order.created_at), 'MMM yyyy', { locale: id });
        const salespersonName = salespersonMap[order.salesperson_id] || `ID: ${order.salesperson_id || 'Unknown'}`;
        
        if (!salesByMonth[monthYear]) salesByMonth[monthYear] = {};
        if (!salesByMonth[monthYear][salespersonName]) salesByMonth[monthYear][salespersonName] = 0;
        salesByMonth[monthYear][salespersonName] += order.total_amount;
      }
    });
    
    // Convert to time series data format (using the total for each month)
    const timeSeriesData = Object.entries(salesByMonth).map(([date, salespeople]) => ({
      date,
      value: Object.values(salespeople).reduce((sum, value) => sum + value, 0)
    })).sort((a, b) => {
      // Sort by date
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
    
    setSalespersonTimeData(timeSeriesData);
  };
  
  const fetchCollectionsData = async () => {
    const { start, end } = getDateRange(collectionsTimeRange);
    
    // Fetch collections data
    const { data: collections, error: collectionsError } = await supabase
      .from('collections')
      .select(`
        id,
        customer_id,
        customer_name,
        amount,
        status,
        due_date,
        created_at
      `)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());
    
    if (collectionsError) throw collectionsError;
    
    // Aggregate collections by status
    const collectionsByStatus = collections?.reduce((acc: Record<string, number>, collection) => {
      const status = collection.status;
      if (!acc[status]) acc[status] = 0;
      acc[status] += collection.amount;
      return acc;
    }, {});
    
    // Convert to chart data format
    const chartData = Object.entries(collectionsByStatus || {}).map(([name, value], index) => ({
      name,
      value,
      fill: COLORS[index % COLORS.length]
    }));
    
    setCollectionsData(chartData);
    
    // Fetch collections by month
    const collectionsByMonth: Record<string, number> = {};
    
    collections?.forEach(collection => {
      const monthYear = format(new Date(collection.created_at), 'MMM yyyy', { locale: id });
      if (!collectionsByMonth[monthYear]) collectionsByMonth[monthYear] = 0;
      collectionsByMonth[monthYear] += collection.amount;
    });
    
    const timeSeriesData = Object.entries(collectionsByMonth).map(([date, value]) => ({
      date,
      value
    })).sort((a, b) => {
      // Sort by date
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
    
    setCollectionsTimeData(timeSeriesData);
  };
  
  const fetchPaymentsData = async () => {
    const { start, end } = getDateRange(paymentsTimeRange);
    
    // Fetch payments data
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        payment_method,
        status,
        payment_date
      `)
      .gte('payment_date', start.toISOString())
      .lte('payment_date', end.toISOString());
    
    if (paymentsError) throw paymentsError;
    
    // Aggregate payments by method
    const paymentsByMethod = payments?.reduce((acc: Record<string, number>, payment) => {
      const method = payment.payment_method || 'Tidak Diketahui';
      if (!acc[method]) acc[method] = 0;
      acc[method] += payment.amount;
      return acc;
    }, {});
    
    // Convert to chart data format
    const chartData = Object.entries(paymentsByMethod || {}).map(([name, value], index) => ({
      name,
      value,
      fill: COLORS[index % COLORS.length]
    }));
    
    setPaymentsData(chartData);
    
    // Fetch payments by month
    const paymentsByMonth: Record<string, number> = {};
    
    payments?.forEach(payment => {
      const monthYear = format(new Date(payment.payment_date), 'MMM yyyy', { locale: id });
      if (!paymentsByMonth[monthYear]) paymentsByMonth[monthYear] = 0;
      paymentsByMonth[monthYear] += payment.amount;
    });
    
    const timeSeriesData = Object.entries(paymentsByMonth).map(([date, value]) => ({
      date,
      value
    })).sort((a, b) => {
      // Sort by date
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
    
    setPaymentsTimeData(timeSeriesData);
  };
  
  const fetchGiroData = async () => {
    const { start, end } = getDateRange(giroTimeRange);
    
    // Fetch giro data
    const { data: giros, error: girosError } = await supabase
      .from('giros')
      .select(`
        id,
        amount,
        status,
        due_date
      `)
      .gte('due_date', start.toISOString())
      .lte('due_date', end.toISOString());
    
    if (girosError) throw girosError;
    
    // Aggregate giros by status
    const girosByStatus = giros?.reduce((acc: Record<string, number>, giro) => {
      const status = giro.status;
      if (!acc[status]) acc[status] = 0;
      acc[status] += giro.amount;
      return acc;
    }, {});
    
    // Convert to chart data format
    const chartData = Object.entries(girosByStatus || {}).map(([name, value], index) => ({
      name,
      value,
      fill: COLORS[index % COLORS.length]
    }));
    
    setGiroData(chartData);
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  const handleExport = () => {
    let dataToExport: any[] = [];
    let fileName = '';
    
    switch (activeTab) {
      case 'sales':
        dataToExport = salesTimeData.map(item => ({
          'Bulan': item.date,
          'Total Penjualan': item.value
        }));
        fileName = 'laporan-penjualan';
        break;
      case 'collections':
        dataToExport = collectionsTimeData.map(item => ({
          'Bulan': item.date,
          'Total Koleksi': item.value
        }));
        fileName = 'laporan-collection';
        break;
      case 'payments':
        dataToExport = paymentsTimeData.map(item => ({
          'Bulan': item.date,
          'Total Pembayaran': item.value
        }));
        fileName = 'laporan-payment';
        break;
      case 'giro':
        dataToExport = giroData.map(item => ({
          'Status': item.name,
          'Total': item.value
        }));
        fileName = 'laporan-giro';
        break;
      case 'salesperson':
        dataToExport = salespersonData.map(item => ({
          'Salesperson': item.name,
          'Total Penjualan': item.value
        }));
        fileName = 'laporan-salesperson';
        break;
    }
    
    if (dataToExport.length === 0) {
      console.error('No data to export');
      return;
    }
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    
    // Generate Excel file
    const today = format(new Date(), 'yyyy-MM-dd');
    const excelFileName = `${fileName}-${today}.xlsx`;
    
    // Convert to binary string
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });
    
    // Convert binary string to ArrayBuffer
    function s2ab(s: string) {
      const buf = new ArrayBuffer(s.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < s.length; i++) {
        view[i] = s.charCodeAt(i) & 0xff;
      }
      return buf;
    }
    
    // Create blob and download
    const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = excelFileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };
  
  const handleRefresh = () => {
    fetchData();
    if (onRefresh) onRefresh();
  };
  
  // Effect untuk mengubah tab
  useEffect(() => {
    fetchData();
  }, [activeTab]);
  
  const renderActiveChart = () => {
    switch (activeTab) {
      case 'sales':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Penjualan per Pelanggan (Top 5)</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="value" fill="#0088FE" name="Total Penjualan" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Tren Penjualan Bulanan</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartLineChart data={salesTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Line type="monotone" dataKey="value" stroke="#0088FE" name="Total Penjualan" />
                  </RechartLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        );
      case 'collections':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Collection berdasarkan Status</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartPieChart>
                    <Pie
                      data={collectionsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {collectionsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </RechartPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Tren Collection Bulanan</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartLineChart data={collectionsTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Line type="monotone" dataKey="value" stroke="#00C49F" name="Total Collection" />
                  </RechartLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        );
      case 'payments':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Pembayaran berdasarkan Metode</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartPieChart>
                    <Pie
                      data={paymentsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </RechartPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Tren Pembayaran Bulanan</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartLineChart data={paymentsTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Line type="monotone" dataKey="value" stroke="#FFBB28" name="Total Pembayaran" />
                  </RechartLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        );
      case 'giro':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Giro berdasarkan Status</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartPieChart>
                    <Pie
                      data={giroData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {giroData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </RechartPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        );
      case 'salesperson':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Penjualan per Salesperson</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salespersonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="value" fill="#8884d8" name="Total Penjualan" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Tren Penjualan Bulanan per Salesperson</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartLineChart data={salespersonTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" name="Total Penjualan" />
                  </RechartLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Laporan Grafik</CardTitle>
        <div className="flex space-x-2">
          <Select value={getCurrentTimeRange()} onValueChange={setCurrentTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Pilih Rentang Waktu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">1 Bulan Terakhir</SelectItem>
              <SelectItem value="3months">3 Bulan Terakhir</SelectItem>
              <SelectItem value="6months">6 Bulan Terakhir</SelectItem>
              <SelectItem value="12months">12 Bulan Terakhir</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleExport}>
            <FileDown className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Penjualan</span>
            </TabsTrigger>
            <TabsTrigger value="collections" className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              <span>Collection</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              <span>Pembayaran</span>
            </TabsTrigger>
            <TabsTrigger value="giro" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              <span>Giro</span>
            </TabsTrigger>
            <TabsTrigger value="salesperson" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Salesperson</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-80">
                <div className="flex flex-col items-center gap-2">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Memuat data...</p>
                </div>
              </div>
            ) : (
              renderActiveChart()
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DashboardCharts;