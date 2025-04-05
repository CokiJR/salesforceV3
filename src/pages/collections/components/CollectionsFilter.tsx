
import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, FileUp, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface CollectionsFilterProps {
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  dateFilter?: Date;
  onDateFilterChange: (date?: Date) => void;
  onImportClick: () => void;
  onExportClick: () => void;
  isImporting: boolean;
}

export function CollectionsFilter({ 
  statusFilter, 
  onStatusFilterChange, 
  dateFilter, 
  onDateFilterChange,
  onImportClick,
  onExportClick,
  isImporting
}: CollectionsFilterProps) {
  const [openCalendar, setOpenCalendar] = useState(false);

  return (
    <div className="flex flex-col md:flex-row gap-3 mb-4">
      <div className="flex-1">
        <Select
          value={statusFilter}
          onValueChange={onStatusFilterChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1">
        <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFilter ? format(dateFilter, "PPP") : <span>Filter by date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <div className="p-3">
              <Button 
                variant="ghost" 
                className="h-8 w-full"
                onClick={() => {
                  onDateFilterChange(undefined);
                  setOpenCalendar(false);
                }}
              >
                Clear date filter
              </Button>
            </div>
            <Calendar
              mode="single"
              selected={dateFilter}
              onSelect={(date) => {
                onDateFilterChange(date);
                setOpenCalendar(false);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex-1 flex gap-2">
        <div className="relative">
          <Input
            id="file-upload"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={onImportClick}
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={isImporting}
          />
          <Button 
            variant="outline"
            className="w-full"
            disabled={isImporting}
          >
            <FileUp className="mr-2 h-4 w-4" />
            Import
          </Button>
        </div>
        <Button 
          variant="outline"
          className="whitespace-nowrap"
          onClick={onExportClick}
        >
          <FileDown className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  );
}
