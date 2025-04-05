
import { AlertCircle } from 'lucide-react';
import { Collection } from '@/types/collection';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface CollectionAlertsProps {
  dueSoonCollections: Collection[];
  showNotifications: boolean;
  onDismiss: () => void;
}

export function CollectionAlerts({ 
  dueSoonCollections, 
  showNotifications, 
  onDismiss 
}: CollectionAlertsProps) {
  if (dueSoonCollections.length === 0 || !showNotifications) {
    return null;
  }

  return (
    <Alert variant="warning" className="bg-amber-50 border-amber-200">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <div className="flex-1">
        <h5 className="font-medium text-amber-800">Upcoming Collections</h5>
        <p className="text-sm text-amber-700">
          You have {dueSoonCollections.length} collection{dueSoonCollections.length > 1 ? 's' : ''} due soon.
        </p>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onDismiss} 
        className="text-amber-800 hover:text-amber-900 hover:bg-amber-100"
      >
        Dismiss
      </Button>
    </Alert>
  );
}
