
import { useState, useEffect, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { CollectionPreviewTable } from './collections/components/CollectionPreviewTable';
import { CollectionsTable } from './collections/components/CollectionsTable';
import { CollectionsFilter } from './collections/components/CollectionsFilter';
import { CollectionAlerts } from './collections/components/CollectionAlerts';
import { ExportDialog } from './collections/components/ExportDialog';
import { useCollections } from './collections/hooks/useCollections';
import { Collection } from '@/types/collection';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';

export default function Collections() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    filteredCollections, 
    isLoading, 
    filters,
    dueSoonCollections,
    paymentTotals,
    updateFilters,
    changePaymentStatus,
    refresh,
    importFromExcel
  } = useCollections();
  
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  useEffect(() => {
    if (dueSoonCollections.length > 0 && !showNotifications) {
      setShowNotifications(true);
    }
  }, [dueSoonCollections]);
  
  const handleAddCollection = () => {
    navigate('/dashboard/collections/add');
  };
  
  const handleViewPayments = () => {
    navigate('/dashboard/payments');
  };
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'xlsx' && fileExt !== 'xls' && fileExt !== 'csv') {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please upload a valid Excel or CSV file",
      });
      return;
    }
    
    try {
      setIsImporting(true);
      
      const data = await readExcelFile(file);
      
      if (!validateImportData(data)) {
        toast({
          variant: "destructive",
          title: "Invalid data",
          description: "The imported file does not have the required columns",
        });
        return;
      }
      
      setPreviewData(data);
      setShowPreview(true);
      
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error.message,
      });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };
  
  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];
          
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(new Error('Failed to parse file'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };
  
  const validateImportData = (data: any[]): boolean => {
    if (data.length === 0) return false;
    
    const requiredColumns = ['invoice_number', 'customer_name', 'due_date', 'amount'];
    const firstRow = data[0];
    
    return requiredColumns.every(col => 
      Object.keys(firstRow).some(key => 
        key.toLowerCase().includes(col.toLowerCase())
      )
    );
  };
  
  const processImportData = async () => {
    if (!previewData.length) return;
    
    try {
      setIsImporting(true);
      
      await importFromExcel(constructFileFromData(previewData));
      
      toast({
        title: "Import successful",
        description: `${previewData.length} collections have been imported`,
      });
      
      setShowPreview(false);
      
    } catch (error: any) {
      console.error('Error processing import data:', error);
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error.message,
      });
    } finally {
      setIsImporting(false);
    }
  };
  
  const constructFileFromData = (data: any[]): File => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Collections');
    
    const binaryString = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i) & 0xff;
    }
    
    const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    return new File([blob], 'collections_import.xlsx', { type: blob.type });
  };
  
  const cancelImport = () => {
    setPreviewData([]);
    setShowPreview(false);
  };
  
  const handleChangeStatus = async (id: string, status: 'Paid' | 'Unpaid') => {
    try {
      await changePaymentStatus(id, status);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  return (
    <div className="space-y-4">
      <AlertDialog open={showPreview} onOpenChange={setShowPreview}>
        <AlertDialogContent className="max-w-4xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Preview Import Data</AlertDialogTitle>
            <AlertDialogDescription>
              Please review the data before importing
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="max-h-[60vh] overflow-auto">
            <CollectionPreviewTable data={previewData} />
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelImport}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={processImportData}
              disabled={isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                'Import Data'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <ExportDialog 
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={(dateRange) => {
          const { exportToExcel } = useCollections();
          exportToExcel(dateRange);
        }}
      />
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Collections</h2>
          <p className="text-muted-foreground">
            Manage customer payment collections and track due dates
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleViewPayments}>
            View Payments
          </Button>
          <Button onClick={handleAddCollection}>
            <Plus className="mr-2 h-4 w-4" />
            Add Collection
          </Button>
        </div>
      </div>
      
      <CollectionAlerts 
        dueSoonCollections={dueSoonCollections}
        showNotifications={showNotifications}
        onDismiss={() => setShowNotifications(false)}
      />
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Collection Records</CardTitle>
        </CardHeader>
        <CardContent>
          <CollectionsFilter 
            statusFilter={filters.status}
            onStatusFilterChange={(value) => updateFilters({ status: value })}
            dateFilter={filters.dateFilter}
            onDateFilterChange={(date) => updateFilters({ dateFilter: date })}
            onImportClick={handleFileUpload}
            onExportClick={() => setShowExportDialog(true)}
            isImporting={isImporting}
          />
          
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <CollectionsTable
              collections={filteredCollections}
              paymentTotals={paymentTotals}
              onChangeStatus={handleChangeStatus}
              onPaymentAdded={refresh}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
