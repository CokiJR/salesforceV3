import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, CreditCard, Building, Hash, DollarSign, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { Giro, GiroClearing } from '@/types/giro';
import { GiroService } from './services/GiroService';

export default function GiroDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [giro, setGiro] = useState<Giro | null>(null);
  const [clearingRecords, setClearingRecords] = useState<GiroClearing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [remainingAmount, setRemainingAmount] = useState<number>(0);

  useEffect(() => {
    if (id) {
      fetchGiroData(id);
    } else {
      navigate('/dashboard/giro');
    }
  }, [id, navigate]);

  const fetchGiroData = async (giroId: string) => {
    try {
      setIsLoading(true);
      const giroData = await GiroService.getGiroById(giroId);
      setGiro(giroData);
      
      // Fetch clearing records
      await fetchClearingRecords(giroId, giroData);
    } catch (error: any) {
      console.error('Error fetching giro:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load giro: ${error.message}`,
      });
      navigate('/dashboard/giro');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClearingRecords = async (giroId: string, currentGiro?: Giro | null) => {
    try {
      const records = await GiroService.getGiroClearing(giroId);
      setClearingRecords(records);
      
      const giroToUse = currentGiro || giro;
      
      if (giroToUse) {
        // Calculate remaining amount - include only cleared records
        const totalCleared = records
          .filter(record => record.clearing_status === 'cleared')
          .reduce((sum, record) => sum + Number(record.clearing_amount), 0);
        
        setRemainingAmount(Math.max(0, giroToUse.amount - totalCleared));
      }
    } catch (error: any) {
      console.error('Error fetching clearing records:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load clearing records: ${error.message}`,
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'cleared':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Cleared</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Partial</Badge>;
      case 'bounced':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Bounced</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Pending</Badge>;
    }
  };

  const getClearingStatusIcon = (status: string) => {
    switch (status) {
      case 'cleared':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'bounced':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const handleClearGiro = () => {
    if (giro) {
      navigate(`/dashboard/giro/clearing/${giro.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!giro) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Giro not found</p>
        <Button onClick={() => navigate('/dashboard/giro')} className="mt-4">
          Back to Giro List
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard/giro')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Giro Detail</h1>
            <p className="text-muted-foreground">Giro #{giro.giro_number}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(giro.status)}
          {giro.status !== 'cleared' && (
            <Button onClick={handleClearGiro}>
              <CreditCard className="h-4 w-4 mr-2" />
              Process Clearing
            </Button>
          )}
        </div>
      </div>

      {/* Giro Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Giro Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Giro Number</label>
                <div className="flex items-center mt-1">
                  <Hash className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">{giro.giro_number}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Amount</label>
                <div className="flex items-center mt-1">
                  <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">{formatCurrency(giro.amount)}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                <div className="flex items-center mt-1">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{format(new Date(giro.due_date), 'dd MMM yyyy')}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Received Date</label>
                <div className="flex items-center mt-1">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{format(new Date(giro.received_date), 'dd MMM yyyy')}</span>
                </div>
              </div>
            </div>

            {giro.invoice_number && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Invoice Number</label>
                <div className="flex items-center mt-1">
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{giro.invoice_number}</span>
                </div>
              </div>
            )}

            {giro.remarks && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Remarks</label>
                <p className="mt-1 text-sm">{giro.remarks}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bank Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Bank Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Bank Name</label>
              <div className="flex items-center mt-1">
                <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">{giro.bank_name}</span>
              </div>
            </div>
            
            {giro.bank_account && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Account Number</label>
                <div className="flex items-center mt-1">
                  <Hash className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-mono">{giro.bank_account}</span>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-muted-foreground">Customer</label>
              <div className="mt-1">
                <span className="font-medium">{giro.customer?.name || 'Unknown Customer'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Amount Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Amount Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(giro.amount)}</div>
              <div className="text-sm text-muted-foreground">Total Amount</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(giro.amount - remainingAmount)}
              </div>
              <div className="text-sm text-muted-foreground">Cleared Amount</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{formatCurrency(remainingAmount)}</div>
              <div className="text-sm text-muted-foreground">Remaining Amount</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clearing History */}
      <Card>
        <CardHeader>
          <CardTitle>Clearing History</CardTitle>
        </CardHeader>
        <CardContent>
          {clearingRecords.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clearing Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Reference Doc</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clearingRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          {format(new Date(record.clearing_date), 'dd MMM yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getClearingStatusIcon(record.clearing_status)}
                          <span className="ml-2 capitalize">{record.clearing_status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(record.clearing_amount)}
                      </TableCell>
                      <TableCell>{record.invoice_number || '-'}</TableCell>
                      <TableCell>{record.reference_doc || '-'}</TableCell>
                      <TableCell>{record.remarks || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(record.created_at), 'dd MMM yyyy HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No clearing records found</p>
              <p className="text-sm text-muted-foreground mt-1">
                This giro has not been processed for clearing yet
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}