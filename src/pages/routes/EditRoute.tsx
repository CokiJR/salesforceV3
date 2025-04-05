
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouteEdit } from "./hooks/useRouteEdit";
import { RouteLoading } from "./components/RouteLoading";
import { RouteNotFound } from "./components/RouteNotFound";
import { EditRouteHeader } from "./components/EditRouteHeader";
import { RouteInformation } from "./components/RouteInformation";
import { EditRouteStops } from "./components/EditRouteStops";
import { ArrowLeft, Loader2 } from "lucide-react";

const EditRoute = () => {
  const {
    id,
    route,
    stops,
    loading,
    saving,
    navigate,
    handleStatusChange,
    handleNotesChange,
    handleMarkAllCompleted,
    handleBackorder,
    handleSave
  } = useRouteEdit();

  if (loading) {
    return <RouteLoading />;
  }

  if (!route) {
    return <RouteNotFound />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <EditRouteHeader
        id={id}
        saving={saving}
        showMarkAllCompleted={stops.some(stop => stop.status !== "completed")}
        onMarkAllCompleted={handleMarkAllCompleted}
        onSave={handleSave}
      />

      <RouteInformation route={route} />

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Scheduled Stops</h3>
          <EditRouteStops
            stops={stops}
            onStatusChange={handleStatusChange}
            onNotesChange={handleNotesChange}
          />
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => navigate(`/dashboard/routes/${id}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        
        <Button 
          onClick={handleSave}
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

export default EditRoute;
