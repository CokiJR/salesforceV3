
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface CollectionPreviewTableProps {
  data: any[];
}

export function CollectionPreviewTable({ data }: CollectionPreviewTableProps) {
  // Helper function to format date values that could be in various formats
  const formatDate = (value: any): string => {
    if (!value) return 'Invalid date';
    
    try {
      let date;
      
      if (typeof value === 'string') {
        date = new Date(value);
      } else if (typeof value === 'number') {
        // Handle Excel date format (days since 1900-01-01)
        date = new Date(Math.round((value - 25569) * 86400 * 1000));
      } else {
        date = new Date(value);
      }
      
      // Check if the date is valid
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Extract column headers from the first row
  const headers = data.length > 0 ? Object.keys(data[0]) : [];
  
  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
            <TableHead>Validation</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => {
            // Perform validation checks
            const invoiceNumber = Object.keys(row).find(key => key.toLowerCase().includes('invoice'))
              ? row[Object.keys(row).find(key => key.toLowerCase().includes('invoice'))!]
              : null;
              
            const amount = Object.keys(row).find(key => key.toLowerCase().includes('amount'))
              ? row[Object.keys(row).find(key => key.toLowerCase().includes('amount'))!]
              : null;
              
            const dueDate = Object.keys(row).find(key => key.toLowerCase().includes('due'))
              ? row[Object.keys(row).find(key => key.toLowerCase().includes('due'))!]
              : null;
            
            const hasErrors = !invoiceNumber || 
                             (typeof amount !== 'number' && isNaN(Number(amount))) || 
                             !dueDate;
            
            return (
              <TableRow key={index}>
                {headers.map((header) => {
                  // Format date fields
                  if (header.toLowerCase().includes('date')) {
                    return <TableCell key={header}>{formatDate(row[header])}</TableCell>;
                  }
                  
                  // Format amount fields
                  if (header.toLowerCase().includes('amount') || header.toLowerCase().includes('total')) {
                    const value = typeof row[header] === 'number' 
                      ? row[header] 
                      : parseFloat(String(row[header]).replace(/[^0-9.-]+/g, ''));
                      
                    return (
                      <TableCell key={header}>
                        {!isNaN(value) 
                          ? new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD'
                            }).format(value)
                          : 'Invalid amount'
                        }
                      </TableCell>
                    );
                  }
                  
                  // Default rendering
                  return <TableCell key={header}>{row[header]}</TableCell>;
                })}
                <TableCell>
                  {hasErrors ? (
                    <Badge className="bg-red-100 text-red-800">
                      Missing required data
                    </Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-800">
                      Valid
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
