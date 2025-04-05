import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Download, Upload, AlertCircle } from 'lucide-react';
import { useCollections } from '../hooks/useCollections';

export function CollectionImportExport() {
  const { importFromExcel, exportToExcel } = useCollections();
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if it's an Excel file
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setImportError('Please upload an Excel file (.xlsx or .xls)');
      return;
    }
    
    setIsImporting(true);
    setImportError(null);
    setImportSuccess(null);
    
    try {
      const importedCollections = await importFromExcel(file);
      setImportSuccess(`Successfully imported ${importedCollections.length} collections`);
    } catch (error: any) {
      setImportError(error.message || 'Failed to import collections');
    } finally {
      setIsImporting(false);
      // Reset the input
      e.target.value = '';
    }
  };
  
  const handleExport = () => {
    try {
      exportToExcel();
    } catch (error: any) {
      console.error('Export error:', error);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Import & Export</CardTitle>
        <CardDescription>
          Import collections from Excel or export to Excel
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Import Collections</h3>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={isImporting}
                className="flex-1"
              />
              <Button variant="outline" disabled={isImporting}>
                <Upload className="h-4 w-4 mr-2" />
                {isImporting ? 'Importing...' : 'Import'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Excel file must include customer_id, amount, and due_date columns
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2">Export Collections</h3>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>
          </div>
        </div>
        
        {importError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{importError}</AlertDescription>
          </Alert>
        )}
        
        {importSuccess && (
          <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{importSuccess}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}