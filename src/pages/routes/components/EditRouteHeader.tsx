
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EditRouteHeaderProps {
  id: string | undefined;
  saving: boolean;
  showMarkAllCompleted: boolean;
  onMarkAllCompleted: () => void;
  onSave: () => void;
}

export const EditRouteHeader = ({ 
  id, 
  saving, 
  showMarkAllCompleted, 
  onMarkAllCompleted, 
  onSave 
}: EditRouteHeaderProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/dashboard/routes/${id}`)}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Edit Route</h1>
      </div>
      <div className="flex gap-2">
        {showMarkAllCompleted && (
          <Button variant="default" onClick={onMarkAllCompleted}>
            <Check className="mr-2 h-4 w-4" />
            Mark All Completed
          </Button>
        )}
        <Button 
          onClick={onSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>Save Changes</>
          )}
        </Button>
      </div>
    </div>
  );
};
