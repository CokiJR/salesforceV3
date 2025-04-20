import { useState, useEffect } from 'react';
import { Giro } from '@/types/giro';
import { GiroService } from '../services/GiroService';
import { toast } from '@/components/ui/use-toast';

export function useGiros() {
  const [giros, setGiros] = useState<Giro[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchGiros();
  }, []);

  const fetchGiros = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await GiroService.getGiros();
      setGiros(data);
    } catch (err: any) {
      console.error('Error fetching giros:', err);
      setError(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load giros: ${err.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addGiro = async (giro: Omit<Giro, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newGiro = await GiroService.createGiro(giro);
      setGiros(prev => [newGiro, ...prev]);
      return newGiro;
    } catch (err: any) {
      console.error('Error adding giro:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to add giro: ${err.message}`,
      });
      throw err;
    }
  };

  const updateGiro = async (id: string, updates: Partial<Giro>) => {
    try {
      const updatedGiro = await GiroService.updateGiro(id, updates);
      setGiros(prev => prev.map(giro => giro.id === id ? updatedGiro : giro));
      return updatedGiro;
    } catch (err: any) {
      console.error('Error updating giro:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update giro: ${err.message}`,
      });
      throw err;
    }
  };

  const deleteGiro = async (id: string) => {
    try {
      await GiroService.deleteGiro(id);
      setGiros(prev => prev.filter(giro => giro.id !== id));
    } catch (err: any) {
      console.error('Error deleting giro:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete giro: ${err.message}`,
      });
      throw err;
    }
  };

  return {
    giros,
    isLoading,
    error,
    fetchGiros,
    addGiro,
    updateGiro,
    deleteGiro
  };
}