
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Collection } from '@/types/collection';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { DownloadIcon, FileSpreadsheetIcon, PlusIcon, UploadIcon } from 'lucide-react';
import { CollectionImportModal } from './CollectionImportModal';

interface CollectionsListProps {
  collections: Collection[];
  isLoading: boolean;
  onExport: () => void;
  onRefresh: () => void;
}

export function CollectionsList({ collections, isLoading, onExport, onRefresh }: CollectionsListProps) {
  const navigate = useNavigate();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch (e) {
      return 'Invalid Date';
    }
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4">
              <Skeleton className="h-6" />
              <Skeleton className="h-6" />
              <Skeleton className="h-6" />
              <Skeleton className="h-6" />
              <Skeleton className="h-6" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-medium">
          Collections ({collections.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={onExport}
          >
            <DownloadIcon className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => setIsImportModalOpen(true)}
          >
            <UploadIcon className="h-4 w-4" />
            <span>Import</span>
          </Button>
          <Button
            size="sm"
            className="flex items-center gap-2"
            onClick={() => navigate('/dashboard/collections/add')}
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Collection</span>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {collections.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collections.map((collection) => (
                <TableRow key={collection.id}>
                  <TableCell>{collection.invoice_number}</TableCell>
                  <TableCell>{collection.customer_name}</TableCell>
                  <TableCell>{formatDate(collection.due_date)}</TableCell>
                  <TableCell>{formatCurrency(collection.amount)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      collection.status === 'Paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {collection.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate(`/dashboard/collections/${collection.id}`)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileSpreadsheetIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No collections found</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding a new collection or importing data
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsImportModalOpen(true)}
              >
                <UploadIcon className="h-4 w-4 mr-2" />
                Import Collections
              </Button>
              <Button 
                onClick={() => navigate('/dashboard/collections/add')}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Collection
              </Button>
            </div>
          </div>
        )}
      </div>

      <CollectionImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={onRefresh}
      />
    </Card>
  );
}
