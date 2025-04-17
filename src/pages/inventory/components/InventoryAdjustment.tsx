import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Minus, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { InventoryWithDetails } from '@/types/inventory';

interface InventoryAdjustmentProps {
  inventory: InventoryWithDetails;
  onAdjust: (id: string, quantity: number) => Promise<{ success: boolean; error?: string }>;
}

export function InventoryAdjustment({ inventory, onAdjust }: InventoryAdjustmentProps) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(inventory.quantity);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract' | 'set'>('set');
  const [adjustmentAmount, setAdjustmentAmount] = useState(0);

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (open) {
      // Reset form when opening
      setQuantity(inventory.quantity);
      setAdjustmentType('set');
      setAdjustmentAmount(0);
    }
  };

  const applyAdjustment = () => {
    let newQuantity = quantity;
    
    if (adjustmentType === 'add') {
      newQuantity = inventory.quantity + adjustmentAmount;
    } else if (adjustmentType === 'subtract') {
      newQuantity = Math.max(0, inventory.quantity - adjustmentAmount);
    } else {
      // 'set' type - use the direct quantity value
      newQuantity = quantity;
    }
    
    setQuantity(newQuantity);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const result = await onAdjust(inventory.id, quantity);
      if (result.success) {
        setOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Adjust
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adjust Inventory</DialogTitle>
          <DialogDescription>
            Update inventory quantity for {inventory.product?.name} at {inventory.warehouse?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Current Quantity</Label>
            <div className="text-lg font-medium">
              {inventory.quantity} {inventory.uom}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button 
              variant={adjustmentType === 'set' ? "default" : "outline"}
              className="w-full" 
              onClick={() => setAdjustmentType('set')}
            >
              Set
            </Button>
            <Button 
              variant={adjustmentType === 'add' ? "default" : "outline"}
              className="w-full" 
              onClick={() => setAdjustmentType('add')}
            >
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
            <Button 
              variant={adjustmentType === 'subtract' ? "default" : "outline"}
              className="w-full" 
              onClick={() => setAdjustmentType('subtract')}
            >
              <Minus className="h-4 w-4 mr-1" /> Subtract
            </Button>
          </div>

          {adjustmentType === 'set' ? (
            <div className="space-y-2">
              <Label htmlFor="quantity">New Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="adjustment">Adjustment Amount</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="adjustment"
                  type="number"
                  min="0"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(Math.max(0, parseInt(e.target.value) || 0))}
                />
                <Button type="button" onClick={applyAdjustment}>
                  Apply
                </Button>
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                New quantity after adjustment: <span className="font-medium">{quantity} {inventory.uom}</span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}