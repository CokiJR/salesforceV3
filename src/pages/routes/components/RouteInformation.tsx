
import { format, startOfWeek, endOfWeek } from "date-fns";
import { DailyRoute } from "@/types";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCurrentWeekOfMonth } from "@/utils/routeScheduler";

interface RouteInformationProps {
  route: DailyRoute;
}

export const RouteInformation = ({ route }: RouteInformationProps) => {
  const routeDate = new Date(route.date);
  const weekStart = startOfWeek(routeDate, { weekStartsOn: 1 }); // Monday as start of week
  const weekEnd = endOfWeek(routeDate, { weekStartsOn: 1 }); // Sunday as end of week
  
  // Calculate the week number for the route date
  const weekOfMonth = (() => {
    const date = new Date(route.date);
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfMonth = date.getDate();
    const weekOfMonth = Math.ceil((dayOfMonth + firstDayOfMonth.getDay() - 1) / 7);
    return Math.min(weekOfMonth, 4); // Cap at 4
  })();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Route Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Route ID</p>
            <p>{route.id}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Week Period</p>
            <p>{format(weekStart, "MMMM d")} - {format(weekEnd, "MMMM d, yyyy")} (Week {weekOfMonth})</p>
          </div>
        </div>

        <Separator className="my-6" />
      </CardContent>
    </Card>
  );
};
