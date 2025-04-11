
import { useState } from 'react';
import { format } from 'date-fns';
import { Collection } from '@/types/collection';
import { Customer } from '@/types';
import { DollarSign } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AddPaymentModal } from './AddPaymentModal';

interface CollectionsTableProps {
  collections: Collection[];
  paymentTotals: {[key: string]: number};
  onChangeStatus: (id: string, status: 'Paid' | 'Unpaid' | 'Pending') => Promise<void>;
  onPaymentAdded: () => void;
}

export function CollectionsTable({ 
  collections, 
  paymentTotals, 
  onChangeStatus, 
  onPaymentAdded 
}: CollectionsTableProps) {
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const handleAddPayment = (collection: Collection) => {
    setSelectedCollection(collection);
    setShowPaymentModal(true);
  };

  return (
    <>
      {collections.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collections.map((collection) => (
                <TableRow key={collection.id}>
                  <TableCell className="font-medium">{collection.invoice_number}</TableCell>
                  <TableCell>{collection.customer_name}</TableCell>
                  <TableCell>{format(new Date(collection.due_date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{formatCurrency(collection.amount)}</TableCell>
                  <TableCell>
                    {collection.status === 'Unpaid' && paymentTotals[collection.id] ? (
                      <span className="text-green-600">
                        {formatCurrency(paymentTotals[collection.id])}
                      </span>
                    ) : collection.status === 'Paid' ? (
                      <span className="text-green-600">
                        {formatCurrency(collection.amount)}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      collection.status === 'Paid' 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : collection.status === 'Pending'
                          ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        : collection.status === 'Unpaid' && paymentTotals[collection.id] > 0
                          ? paymentTotals[collection.id] === collection.amount
                            ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }>
                      {collection.status === 'Pending'
                        ? 'Pending'
                        : collection.status === 'Unpaid' && paymentTotals[collection.id] > 0 
                          ? paymentTotals[collection.id] === collection.amount
                            ? 'Pending' 
                            : 'Partial'
                          : collection.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {collection.status === 'Unpaid' || collection.status === 'Pending' ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAddPayment(collection)}
                        >
                          <DollarSign className="mr-1 h-3 w-3" />
                          Add Payment
                        </Button>
                      ) : (
                        <div>{/* Tombol Mark as Unpaid dinonaktifkan */}</div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-muted-foreground">No collections found. Import data or add a new collection.</p>
        </div>
      )}

      {selectedCollection && (
        <AddPaymentModal
          collection={selectedCollection}
          customer={selectedCollection.customer || undefined}
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentAdded={onPaymentAdded}
        />
      )}
    </>
  );
}