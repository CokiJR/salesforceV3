
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  RefreshCw, 
  Upload, 
  Download, 
  CheckCircle, 
  AlertCircle 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SyncStatus } from "@/types";

interface SyncManagerProps {
  onSyncComplete?: () => void;
}

const SyncManager = ({ onSyncComplete }: SyncManagerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    last_sync: localStorage.getItem('last_sync') || 'Never',
    pending_uploads: parseInt(localStorage.getItem('pending_uploads') || '0'),
    pending_downloads: parseInt(localStorage.getItem('pending_downloads') || '0')
  });
  const { toast } = useToast();

  const syncAll = async () => {
    setIsLoading(true);
    toast({
      title: "Synchronization started",
      description: "Syncing all data with the server...",
    });

    try {
      // Simulate sync delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate successful sync
      const newStatus = {
        last_sync: new Date().toISOString(),
        pending_uploads: 0,
        pending_downloads: 0
      };
      
      // Update local storage
      localStorage.setItem('last_sync', newStatus.last_sync);
      localStorage.setItem('pending_uploads', '0');
      localStorage.setItem('pending_downloads', '0');
      
      setSyncStatus(newStatus);
      
      toast({
        title: "Synchronization complete",
        description: "All data has been successfully synchronized.",
      });
      
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error: any) {
      console.error("Sync error:", error);
      toast({
        variant: "destructive",
        title: "Synchronization failed",
        description: error.message || "An unexpected error occurred during synchronization.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const uploadData = async () => {
    setIsLoading(true);
    toast({
      title: "Upload started",
      description: "Uploading local data to the server...",
    });

    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update sync status
      const newStatus = {
        ...syncStatus,
        last_sync: new Date().toISOString(),
        pending_uploads: 0
      };
      
      localStorage.setItem('last_sync', newStatus.last_sync);
      localStorage.setItem('pending_uploads', '0');
      
      setSyncStatus(newStatus);
      
      toast({
        title: "Upload complete",
        description: "All local data has been successfully uploaded to the server.",
      });
      
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "An unexpected error occurred during upload.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadData = async () => {
    setIsLoading(true);
    toast({
      title: "Download started",
      description: "Downloading data from the server...",
    });

    try {
      // Simulate download delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update sync status
      const newStatus = {
        ...syncStatus,
        last_sync: new Date().toISOString(),
        pending_downloads: 0
      };
      
      localStorage.setItem('last_sync', newStatus.last_sync);
      localStorage.setItem('pending_downloads', '0');
      
      setSyncStatus(newStatus);
      
      toast({
        title: "Download complete",
        description: "All server data has been successfully downloaded.",
      });
      
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error: any) {
      console.error("Download error:", error);
      toast({
        variant: "destructive",
        title: "Download failed",
        description: error.message || "An unexpected error occurred during download.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatLastSync = () => {
    if (syncStatus.last_sync === 'Never') return 'Never synced';
    
    const lastSync = new Date(syncStatus.last_sync);
    const now = new Date();
    const diffMs = now.getTime() - lastSync.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Data Synchronization</h3>
          <p className="text-sm text-muted-foreground">
            Last synced: {formatLastSync()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {syncStatus.pending_uploads > 0 && (
            <div className="flex items-center text-amber-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span className="text-xs">{syncStatus.pending_uploads} pending uploads</span>
            </div>
          )}
          {syncStatus.pending_downloads > 0 && (
            <div className="flex items-center text-amber-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span className="text-xs">{syncStatus.pending_downloads} pending downloads</span>
            </div>
          )}
          {syncStatus.pending_uploads === 0 && syncStatus.pending_downloads === 0 && syncStatus.last_sync !== 'Never' && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span className="text-xs">All synced</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={syncAll}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Sync All
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={uploadData}
          disabled={isLoading || syncStatus.pending_uploads === 0}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload
          {syncStatus.pending_uploads > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">
              {syncStatus.pending_uploads}
            </span>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={downloadData}
          disabled={isLoading || syncStatus.pending_downloads === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Download
          {syncStatus.pending_downloads > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">
              {syncStatus.pending_downloads}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SyncManager;
