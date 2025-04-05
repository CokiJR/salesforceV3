
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
}

export function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");

  // In a real implementation, this would use a barcode scanning library
  // This is a simple mock implementation for demonstration purposes
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (scanning) {
      // Simulate scanning process
      timeoutId = setTimeout(() => {
        // Generate a random barcode for demo purposes
        const mockBarcode = `LOC${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        onScan(mockBarcode);
        setScanning(false);
      }, 2000);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [scanning, onScan]);

  const handleStartScan = () => {
    setScanning(true);
  };

  const handleManualEntry = () => {
    if (manualCode.trim()) {
      onScan(manualCode.trim());
    }
  };

  return (
    <div className="space-y-4 py-2">
      {scanning ? (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-md">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-center text-sm text-muted-foreground">Scanning barcode...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={handleStartScan}
            className="flex items-center justify-center p-8 border border-dashed rounded-md hover:bg-muted/50 transition-colors"
          >
            <div className="text-center">
              <p className="font-medium">Click to Scan Barcode</p>
              <p className="text-sm text-muted-foreground mt-1">
                Position the barcode in front of your camera
              </p>
            </div>
          </button>
          
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Or enter barcode manually:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter barcode"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button
                type="button"
                onClick={handleManualEntry}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
