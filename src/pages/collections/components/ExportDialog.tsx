
import { useState } from 'react';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (dateRange?: DateRange) => void;
}

export function ExportDialog({ isOpen, onClose, onExport }: ExportDialogProps) {
  const [exportDateRange, setExportDateRange] = useState<DateRange>();

  const handleExport = () => {
    onExport(exportDateRange);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Collections</DialogTitle>
          <DialogDescription>
            Select a date range for the collections you want to export.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Select Date Range (Optional)</h4>
            <div className="border rounded-md p-4">
              <Calendar
                mode="range"
                selected={exportDateRange}
                onSelect={setExportDateRange}
                className="rounded-md border"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            <FileDown className="mr-2 h-4 w-4" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
