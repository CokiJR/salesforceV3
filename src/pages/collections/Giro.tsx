import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Loader2, Plus, Edit, Trash2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import { Giro } from '@/types/giro';
import { GiroService } from './services/GiroService';
import { GiroForm } from './components/GiroForm';
import { GiroClearing } from './components/GiroClearing';

export default function GiroPage() {
  const navigate = useNavigate();
  const [giros, setGiros] = useState<Giro[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGiro, setSelectedGiro] = useState<Giro | null>(null);
  const [showGiroForm, setShowGiroForm] = useState(false);
  const [showClearingForm, setShowClearingForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchGiros();
  }, []);

  const fetchGiros = async () => {
    try {
      setIsLoading(true);
      const data = await GiroService.getGiros();
      setGiros(data);
    } catch (error: any) {
      console.error('Error fetching giros:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load giros: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGiro = () => {
    setSelectedGiro(null);
    setIsEditing(false);
    setShowGiroForm(true);
  };

  const handleEditGiro = (giro: Giro) => {
    setSelectedGiro(giro);
    setIsEditing(true);
    setShowGiroForm(true);
  };

  const handleDeleteGiro = (giro: Giro) => {
    setSelectedGiro(giro);
    setShowDeleteDialog(true);
  };

  const confirmDeleteGiro = async () => {
    if (!selectedGiro) return;

    try {
      await GiroService.deleteGiro(selectedGiro.id);
      toast({
        title: "Giro deleted",
        description: "The giro has been successfully deleted",
      });
      fetchGiros();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete giro: ${error.message}`,
      });
    } finally {
      setShowDeleteDialog(false);
      setSelectedGiro(null);
    }
  };

  const handleGiroSaved = () => {
    fetchGiros();
    setShowGiroForm(false);
  };

  const handleClearGiro = (giro: Giro) => {
    setSelectedGiro(giro);
    setShowClearingForm(true);
  };

  const handleClearingComplete = () => {
    fetchGiros();
    setShowClearingForm(false);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Giro Management</h2>
          <p className="text-muted-foreground">
            Manage customer giros and clearing processes
          </p>
        </div>
        <Button onClick={handleAddGiro}>
          <Plus className="mr-2 h-4 w-4" />
          Add Giro
        </Button>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Giro Records</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : giros.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Giro Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {giros.map((giro) => (
                    <TableRow key={giro.id}>
                      <TableCell className="font-medium">{giro.giro_number}</TableCell>
                      <TableCell>{giro.customer?.name || giro.customer_id}</TableCell>
                      <TableCell>{giro.bank_name}</TableCell>
                      <TableCell>{formatCurrency(giro.amount)}</TableCell>
                      <TableCell>{format(new Date(giro.due_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{getStatusBadge(giro.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleClearGiro(giro)}
                            disabled={giro.status === 'cleared'}
                          >
                            <CreditCard className="mr-1 h-3 w-3" />
                            Clear
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditGiro(giro)}
                          >
                            <Edit className="mr-1 h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteGiro(giro)}
                          >
                            <Trash2 className="mr-1 h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No giros found. Add a new giro to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Giro Form Dialog */}
      <Dialog open={showGiroForm} onOpenChange={setShowGiroForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Giro' : 'Add New Giro'}</DialogTitle>
          </DialogHeader>
          <GiroForm 
            giro={selectedGiro} 
            isEditing={isEditing} 
            onSave={handleGiroSaved} 
            onCancel={() => setShowGiroForm(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* Giro Clearing Dialog */}
      <Dialog open={showClearingForm} onOpenChange={setShowClearingForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Giro Clearing</DialogTitle>
          </DialogHeader>
          {selectedGiro && (
            <GiroClearing 
              giro={selectedGiro} 
              onComplete={handleClearingComplete} 
              onCancel={() => setShowClearingForm(false)} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the giro
              {selectedGiro && ` #${selectedGiro.giro_number}`} and all associated clearing records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteGiro}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}