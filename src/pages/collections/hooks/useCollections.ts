
import { useState, useEffect } from 'react';
import { Collection } from '@/types/collection';
import { Customer } from '@/types';
import { CollectionService } from '../services/CollectionService';
import { useToast } from '@/hooks/use-toast';
import { format, isAfter, isBefore } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface CollectionFilters {
  status: string;
  dateFilter?: Date;
  dateRange?: DateRange;
}

export function useCollections() {
  const { toast } = useToast();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<Collection[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CollectionFilters>({ status: 'all' });
  const [dueSoonCollections, setDueSoonCollections] = useState<Collection[]>([]);
  const [paymentTotals, setPaymentTotals] = useState<{[key: string]: number}>({});
  
  useEffect(() => {
    fetchCollections();
  }, []);
  
  useEffect(() => {
    applyFilters();
    checkDueSoonCollections();
  }, [collections, filters]);

  const fetchCollections = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const collectionsData = await CollectionService.getCollections();
      setCollections(collectionsData);
      
      // Get customers with due payments
      const customersData = await CollectionService.getCustomersWithDuePayments();
      setCustomers(customersData);
      
      fetchPaymentTotals(collectionsData);
    } catch (err: any) {
      console.error('Error in useCollections:', err);
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to fetch collections: ${err.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchPaymentTotals = async (collections: Collection[]) => {
    try {
      const totals: {[key: string]: number} = {};
      
      // Fetch totals only for unpaid collections to improve performance
      const unpaidCollections = collections.filter(c => c.status === 'Unpaid');
      
      for (const collection of unpaidCollections) {
        const total = await CollectionService.getPaymentTotalByCollectionId(collection.id);
        totals[collection.id] = total;
      }
      
      setPaymentTotals(totals);
    } catch (error: any) {
      console.error('Error fetching payment totals:', error);
    }
  };
  
  const applyFilters = () => {
    let filtered = [...collections];
    
    if (filters.status !== 'all') {
      filtered = filtered.filter(collection => 
        collection.status === filters.status
      );
    }
    
    if (filters.dateFilter) {
      const filterDate = new Date(filters.dateFilter);
      filterDate.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(collection => {
        const dueDate = new Date(collection.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === filterDate.getTime();
      });
    }
    
    if (filters.dateRange?.from) {
      filtered = filtered.filter(c => {
        const dueDate = new Date(c.due_date);
        return isAfter(dueDate, filters.dateRange!.from!) || 
               (dueDate.getDate() === filters.dateRange!.from!.getDate() && 
                dueDate.getMonth() === filters.dateRange!.from!.getMonth() && 
                dueDate.getFullYear() === filters.dateRange!.from!.getFullYear());
      });
    }
    
    if (filters.dateRange?.to) {
      filtered = filtered.filter(c => {
        const dueDate = new Date(c.due_date);
        return isBefore(dueDate, filters.dateRange!.to!) || 
               (dueDate.getDate() === filters.dateRange!.to!.getDate() && 
                dueDate.getMonth() === filters.dateRange!.to!.getMonth() && 
                dueDate.getFullYear() === filters.dateRange!.to!.getFullYear());
      });
    }
    
    setFilteredCollections(filtered);
  };
  
  const checkDueSoonCollections = () => {
    const dueSoon = collections.filter(collection => {
      if (collection.status === 'Paid') return false;
      
      const dueDate = new Date(collection.due_date);
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      
      today.setHours(0, 0, 0, 0);
      tomorrow.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      
      return dueDate.getTime() === today.getTime() || dueDate.getTime() === tomorrow.getTime();
    });
    
    setDueSoonCollections(dueSoon);
  };
  
  const updateFilters = (newFilters: Partial<CollectionFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  const changePaymentStatus = async (id: string, status: 'Paid' | 'Unpaid') => {
    try {
      const updatedCollection = await updateCollection(id, { status });
      toast({
        title: "Status updated",
        description: `Collection marked as ${status}`,
      });
      return updatedCollection;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update status: ${error.message}`,
      });
      throw error;
    }
  };
  
  const createCollection = async (collection: Omit<Collection, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newCollection = await CollectionService.createCollection(collection);
      setCollections(prev => [...prev, newCollection]);
      return newCollection;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateCollection = async (id: string, updates: Partial<Collection>) => {
    try {
      const updatedCollection = await CollectionService.updateCollection(id, updates);
      setCollections(prev => 
        prev.map(collection => 
          collection.id === id ? updatedCollection : collection
        )
      );
      return updatedCollection;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteCollection = async (id: string) => {
    try {
      await CollectionService.deleteCollection(id);
      setCollections(prev => prev.filter(collection => collection.id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const markAsPaid = async (id: string, transactionId?: string) => {
    try {
      const updatedCollection = await CollectionService.markAsPaid(id, transactionId);
      setCollections(prev => 
        prev.map(collection => 
          collection.id === id ? updatedCollection : collection
        )
      );
      return updatedCollection;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const importFromExcel = async (file: File) => {
    try {
      const importedCollections = await CollectionService.importFromExcel(file);
      setCollections(prev => [...prev, ...importedCollections]);
      return importedCollections;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const exportToExcel = (dateRange?: DateRange) => {
    try {
      let dataToExport = [...filteredCollections];
      
      if (dateRange?.from) {
        dataToExport = dataToExport.filter(c => {
          const dueDate = new Date(c.due_date);
          return isAfter(dueDate, dateRange.from!) || 
                 (dueDate.getDate() === dateRange.from!.getDate() && 
                  dueDate.getMonth() === dateRange.from!.getMonth() && 
                  dueDate.getFullYear() === dateRange.from!.getFullYear());
        });
      }
      
      if (dateRange?.to) {
        dataToExport = dataToExport.filter(c => {
          const dueDate = new Date(c.due_date);
          return isBefore(dueDate, dateRange.to!) || 
                 (dueDate.getDate() === dateRange.to!.getDate() && 
                  dueDate.getMonth() === dateRange.to!.getMonth() && 
                  dueDate.getFullYear() === dateRange.to!.getFullYear());
        });
      }
      
      CollectionService.exportToExcel(dataToExport);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    collections,
    filteredCollections,
    customers,
    isLoading,
    error,
    filters,
    dueSoonCollections,
    paymentTotals,
    refresh: fetchCollections,
    updateFilters,
    changePaymentStatus,
    createCollection,
    updateCollection,
    deleteCollection,
    markAsPaid,
    importFromExcel,
    exportToExcel
  };
}
