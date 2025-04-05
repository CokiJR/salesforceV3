
import { format, startOfWeek, endOfWeek } from "date-fns";
import { DailyRoute } from "@/types";
import { Separator } from "@/components/ui/separator";

interface RouteInfoProps {
  route: DailyRoute;
}

export function RouteInfo({ route }: RouteInfoProps) {
  const routeDate = new Date(route.date);
  const weekStart = startOfWeek(routeDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(routeDate, { weekStartsOn: 1 });
  
  // Calculate the week number for the route date
  const weekOfMonth = (() => {
    const date = new Date(route.date);
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfMonth = date.getDate();
    const weekOfMonth = Math.ceil((dayOfMonth + firstDayOfMonth.getDay() - 1) / 7);
    return Math.min(weekOfMonth, 4); // Cap at 4
  })();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Route ID</p>
        <p>{route.id}</p>
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">Week Period</p>
        <p>{format(weekStart, "MMMM d")} - {format(weekEnd, "MMMM d, yyyy")} (Week {weekOfMonth})</p>
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">Created</p>
        <p>{format(new Date(route.created_at), "MMM d, yyyy h:mm a")}</p>
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">Stops</p>
        <p>{route.stops.length} customer locations</p>
      </div>
    </div>
  );
}
