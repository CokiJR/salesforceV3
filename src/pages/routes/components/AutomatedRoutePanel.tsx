
import { useState, useEffect } from "react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuthentication } from "@/hooks/useAuthentication";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Loader2, Route } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getCurrentWeekOfMonth } from "@/utils/routeScheduler";
import { Customer } from "@/types";
import { createAutomatedRoute } from "../services/routeService";
import { supabase } from "@/integrations/supabase/client";

interface AutomatedRoutePanelProps {
  customers: Customer[];
  loading: boolean;
  onRouteCreated: () => void;
}

export function AutomatedRoutePanel({ 
  customers, 
  loading, 
  onRouteCreated 
}: AutomatedRoutePanelProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [isCreating, setIsCreating] = useState(false);
  const [eligibleCustomers, setEligibleCustomers] = useState<Customer[]>([]);
  const [existingRoute, setExistingRoute] = useState<boolean>(false);
  const { toast } = useToast();
  const { user } = useAuthentication();
  const weekOfMonth = getCurrentWeekOfMonth();
  
  // Check if a route already exists for this week
  useEffect(() => {
    const checkExistingRoute = async () => {
      if (!user) return;
      
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
      
      const { data, error } = await supabase
        .from("daily_routes")
        .select("id")
        .eq("salesperson_id", user.id)
        .gte("date", format(weekStart, "yyyy-MM-dd"))
        .lte("date", format(weekEnd, "yyyy-MM-dd"));
      
      if (error) {
        console.error("Error checking existing routes:", error);
        return;
      }
      
      setExistingRoute(data && data.length > 0);
    };
    
    checkExistingRoute();
  }, [date, user]);
  
  // Filter customers based on cycle pattern for the selected date
  useEffect(() => {
    if (!customers.length) return;
    
    // Filter customers who should be visited this week based on their cycle
    const weekNum = getCurrentWeekOfMonth();
    
    const filteredCustomers = customers.filter(customer => {
      switch (customer.cycle) {
        case 'YYYY': // Visit every week
          return true;
        case 'YTYT': // Week 1 & 3 visits
          return weekNum === 1 || weekNum === 3;
        case 'TYTY': // Week 2 & 4 visits
          return weekNum === 2 || weekNum === 4;
        default:
          return true;
      }
    });
    
    setEligibleCustomers(filteredCustomers);
  }, [customers, date]);
  
  const handleCreateAutomatedRoute = async () => {
    if (!user || !eligibleCustomers.length) return;
    
    try {
      setIsCreating(true);
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const createdRoute = await createAutomatedRoute(weekStart, user.id, eligibleCustomers);
      
      toast({
        title: "Route created",
        description: `Weekly route for ${format(weekStart, "MMMM d")} - ${format(endOfWeek(weekStart, { weekStartsOn: 1 }), "MMMM d, yyyy")} has been created.`,
      });
      
      onRouteCreated();
    } catch (error: any) {
      console.error("Error creating automated route:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create route: ${error.message}`,
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  // Calculate the current week range for the selected date
  const selectedWeekStart = startOfWeek(date, { weekStartsOn: 1 });
  const selectedWeekEnd = endOfWeek(date, { weekStartsOn: 1 });
  // Calculate the week number of the selected date, not just the current date
  const selectedWeekOfMonth = (() => {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfMonth = date.getDate();
    const weekOfMonth = Math.ceil((dayOfMonth + firstDayOfMonth.getDay() - 1) / 7);
    return Math.min(weekOfMonth, 4); // Cap at 4
  })();
  
  return (
    <div className="rounded-xl border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Route Planning</h3>
        <div className="px-3 py-1 rounded-full bg-primary/10 text-sm font-medium">
          Week {selectedWeekOfMonth}
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "justify-start text-left font-normal w-full",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(date) => date && setDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="p-4 rounded-lg bg-muted/50">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">Selected Week</h4>
            <span className="text-sm text-muted-foreground">
              {format(selectedWeekStart, "MMM d")} - {format(selectedWeekEnd, "MMM d, yyyy")}
            </span>
          </div>
        </div>
        
        {existingRoute && (
          <div className="p-4 rounded-lg bg-yellow-100/50">
            <p className="text-sm text-amber-700">
              A route already exists for this week. Creating a new route will not be possible.
            </p>
          </div>
        )}
        
        <div className="p-4 rounded-lg bg-muted/50">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">Route Summary</h4>
            <span className="text-sm text-muted-foreground">{eligibleCustomers.length} customers eligible</span>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : eligibleCustomers.length > 0 ? (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Based on customer visit cycles:
                <ul className="mt-1 space-y-1 list-disc list-inside">
                  <li>YYYY: Every week</li>
                  <li>YTYT: Week 1 and 3</li>
                  <li>TYTY: Week 2 and 4</li>
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No customers scheduled for this week.</p>
          )}
        </div>
        
        <Button 
          onClick={handleCreateAutomatedRoute} 
          disabled={isCreating || eligibleCustomers.length === 0 || existingRoute}
          className="w-full"
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : existingRoute ? (
            <>
              <Route className="mr-2 h-4 w-4" />
              Route Already Exists
            </>
          ) : (
            <>
              <Route className="mr-2 h-4 w-4" />
              Generate Weekly Route
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
