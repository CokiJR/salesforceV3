
import { Button } from "@/components/ui/button";
import { Customer } from "@/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Loader2, MoreVertical, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CustomerHeaderProps {
  customer: Customer;
  isDeleting?: boolean;
  onDelete?: () => Promise<void>;
}

export function CustomerHeader({ customer, isDeleting = false, onDelete }: CustomerHeaderProps) {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{customer.name}</h2>
        <p className="text-muted-foreground">
          {customer.address}, {customer.city}
        </p>
      </div>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={() => navigate(`/dashboard/customers/edit/${customer.id}`)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
        
        {onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the customer
                  and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={onDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
