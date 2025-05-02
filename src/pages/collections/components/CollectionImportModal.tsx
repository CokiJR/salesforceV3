
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { CollectionService } from '../services/CollectionService';
import { CollectionImportFormat } from '@/types/collection';
import * as XLSX from 'xlsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { DownloadIcon, UploadIcon } from 'lucide-react';

interface CollectionImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export function CollectionImportModal({ isOpen, onClose, onImportComplete }: CollectionImportModalProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<CollectionImportFormat[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];

        // Map to standardized format
        const formattedData = jsonData.map(row => {
          // Prioritize snake_case format first to match the template
          const invoiceNumber = row.invoice_number || row['Invoice Number'] || row.InvoiceNumber || '';
          const customerName = row.customer_name || row['Customer Name'] || row.CustomerName || '';
          const amount = Number(row.amount || row.Amount || 0);
          const customerId = row.customer_id || row['Customer ID'] || row.CustomerId || ''; // Format CXXXXXXX
          const customerUuid = row.customer_uuid || row['Customer UUID'] || row.CustomerUuid || ''; // UUID
          
          // Parse invoice date
          let invoiceDate = '';
          try {
            const rawInvoiceDate = row.invoice_date || row['Invoice Date'] || row.InvoiceDate;
            if (rawInvoiceDate) {
              // Try to parse as date 
              const parsedDate = new Date(rawInvoiceDate);
              // Validasi tanggal sebelum mengkonversi ke ISO string
              if (!isNaN(parsedDate.getTime())) {
                invoiceDate = parsedDate.toISOString();
              } else {
                console.warn(`Tanggal invoice tidak valid: ${rawInvoiceDate}, menggunakan tanggal hari ini`);
                invoiceDate = new Date().toISOString();
              }
            } else {
              // Default to today if not provided
              invoiceDate = new Date().toISOString();
            }
          } catch (e) {
            console.error('Invoice date parsing error:', e);
            invoiceDate = new Date().toISOString(); // Default to today if parsing fails
          }
          
          return {
            invoice_number: invoiceNumber,
            customer_name: customerName,
            amount: amount,
            customer_id: customerId, // Format CXXXXXXX
            customer_uuid: customerUuid, // UUID
            status: (row.status || row.Status || 'Unpaid') === 'Paid' ? 'Paid' : 'Unpaid',
            notes: row.notes || row.Notes || '',
            bank_account: row.bank_account || row['Bank Account'] || '',
            invoice_date: invoiceDate
            // due_date will be calculated automatically based on customer's payment_term
          } as CollectionImportFormat;
        });

        setPreviewData(formattedData);
        setIsLoading(false);

      } catch (error: any) {
        console.error('Error parsing Excel file:', error);
        toast({
          variant: "destructive",
          title: "Error saat memproses file",
          description: error.message || "Tidak dapat memproses file Excel. Kolom wajib: invoice_number, customer_name, amount, invoice_date. Silakan periksa format file.",
          duration: 5000, // Tampilkan pesan lebih lama agar pengguna bisa membaca
        });
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      toast({
        variant: "destructive",
        title: "Error membaca file",
        description: "Tidak dapat membaca file. Silakan coba lagi.",
        duration: 5000,
      });
      setIsLoading(false);
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "Tidak ada file dipilih",
        description: "Silakan pilih file untuk diimpor.",
        duration: 5000,
      });
      return;
    }

    setIsImporting(true);

    try {
      await CollectionService.importFromExcel(file);
      
      toast({
        title: "Import berhasil",
        description: `Berhasil mengimpor ${previewData.length} koleksi.`,
      });
      
      onImportComplete();
      onClose();
      
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        variant: "destructive",
        title: "Import gagal",
        description: error.message || "Gagal mengimpor koleksi. Pastikan file memiliki kolom wajib: invoice_number, customer_name, amount, invoice_date.",
        duration: 5000, // Tampilkan pesan lebih lama agar pengguna bisa membaca
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    try {
      const blob = CollectionService.generateImportTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'collections_import_template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download template.",
      });
    }
  };

  const renderPreviewTable = () => {
    if (previewData.length === 0) {
      return <p className="text-center text-muted-foreground py-4">Tidak ada data untuk ditampilkan</p>;
    }

    return (
      <div className="max-h-96 overflow-auto border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice Number</TableHead>
              <TableHead>Customer ID</TableHead>
              <TableHead>Customer Name</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Invoice Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewData.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.invoice_number}</TableCell>
                <TableCell>{item.customer_id || 'Akan dicocokkan dengan nama'}</TableCell>
                <TableCell>{item.customer_name}</TableCell>
                <TableCell>{typeof item.amount === 'number' ? item.amount.toFixed(2) : item.amount}</TableCell>
                <TableCell>
                  {item.invoice_date ? 
                    (typeof item.invoice_date === 'string' && item.invoice_date.includes('T') ? 
                      format(new Date(item.invoice_date), 'PP') : 
                      item.invoice_date) : 
                    'N/A'
                  }
                </TableCell>
                <TableCell>{item.status || 'Unpaid'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="p-2 text-xs text-muted-foreground">
          <p className="font-medium">* Kolom wajib: invoice_number, customer_name, amount, invoice_date</p>
          <p>* Due date akan dihitung otomatis berdasarkan payment term pelanggan</p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import Koleksi</DialogTitle>
          <DialogDescription>
            Unggah file Excel untuk mengimpor koleksi. Kolom wajib: <strong>invoice_number, customer_name, amount, invoice_date</strong>. Anda dapat mengunduh template untuk melihat format yang diperlukan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end">
            <div className="space-y-2 flex-1">
              <Label htmlFor="file-input">Pilih File Excel</Label>
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="block w-full text-sm file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0 file:text-sm file:font-semibold
                  file:bg-primary file:text-primary-foreground
                  hover:file:bg-primary/90"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={handleDownloadTemplate}
              className="w-full sm:w-auto"
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              Unduh Template
            </Button>
          </div>

          <Card className="p-4">
            <h3 className="font-medium mb-2">Pratinjau</h3>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              renderPreviewTable()
            )}
          </Card>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isImporting}>
            Batal
          </Button>
          <Button 
            onClick={handleImport}
            disabled={isLoading || isImporting || previewData.length === 0}
          >
            {isImporting ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
                Mengimpor...
              </>
            ) : (
              <>
                <UploadIcon className="w-4 h-4 mr-2" />
                Import Koleksi
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
