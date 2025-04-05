
import { DailyRoute } from "@/types";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { format, startOfWeek, endOfWeek } from "date-fns";

interface RoutesTableProps {
  routes: DailyRoute[];
  onRouteClick: (routeId: string) => void;
}

export function RoutesTable({ routes, onRouteClick }: RoutesTableProps) {
  const getStatusSummary = (route: DailyRoute) => {
    const completed = route.stops.filter(stop => stop.status === "completed").length;
    const total = route.stops.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      completed,
      total,
      percentage
    };
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Route ID</TableHead>
            <TableHead>Week Period</TableHead>
            <TableHead>Outlets</TableHead>
            <TableHead>Progress</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {routes.map((route) => {
            const status = getStatusSummary(route);
            const routeDate = new Date(route.date);
            const weekStart = startOfWeek(routeDate, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(routeDate, { weekStartsOn: 1 });
            
            return (
              <TableRow 
                key={route.id} 
                className="cursor-pointer hover:bg-muted/60"
                onClick={() => onRouteClick(route.id)}
              >
                <TableCell className="font-medium">{route.id.substring(0, 8)}</TableCell>
                <TableCell>{format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}</TableCell>
                <TableCell>{status.total} outlets</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ width: `${status.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium">
                      {status.completed}/{status.total} ({status.percentage}%)
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
