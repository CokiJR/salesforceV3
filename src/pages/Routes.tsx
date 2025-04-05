
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useRoutes } from "./routes/hooks/useRoutes";
import { useCustomers } from "./routes/hooks/useCustomers";
import { RoutesHeader } from "./routes/components/RoutesHeader";
import { RouteCalendar } from "./routes/components/RouteCalendar";
import { RoutesTable } from "./routes/components/RoutesTable";
import { EmptyRoutesState } from "./routes/components/EmptyRoutesState";
import { AutomatedRoutePanel } from "./routes/components/AutomatedRoutePanel";
import { startOfWeek } from "date-fns";

const RoutesPage = () => {
  // Initialize to start of current week
  const [date, setDate] = useState<Date>(() => {
    const now = new Date();
    return startOfWeek(now, { weekStartsOn: 1 });
  });
  
  const navigate = useNavigate();
  const { routes, loading, fetchRoutes } = useRoutes(date);
  const { customers, loadingCustomers } = useCustomers();

  const handleCreateRoute = () => {
    navigate("/dashboard/routes/create");
  };

  const handleRouteDetails = (routeId: string) => {
    navigate(`/dashboard/routes/${routeId}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <RoutesHeader onCreateRoute={handleCreateRoute} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <RouteCalendar date={date} setDate={setDate} />

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : routes.length > 0 ? (
            <RoutesTable routes={routes} onRouteClick={handleRouteDetails} />
          ) : (
            <EmptyRoutesState date={date} onCreateRoute={handleCreateRoute} />
          )}
        </div>
        
        <div className="md:col-span-1">
          <AutomatedRoutePanel 
            customers={customers} 
            loading={loadingCustomers}
            onRouteCreated={fetchRoutes}
          />
        </div>
      </div>
    </div>
  );
};

export default RoutesPage;
