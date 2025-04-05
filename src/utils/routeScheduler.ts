
import { Customer } from "@/types";

// Determine the current week number within the month (1-4)
export function getCurrentWeekOfMonth(): number {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const dayOfMonth = now.getDate();
  const weekOfMonth = Math.ceil((dayOfMonth + firstDayOfMonth.getDay() - 1) / 7);
  return Math.min(weekOfMonth, 4); // Cap at 4
}

// Check if a customer should be visited this week based on their cycle
export function shouldVisitThisWeek(customer: Customer): boolean {
  const weekOfMonth = getCurrentWeekOfMonth();
  
  switch (customer.cycle) {
    case 'YYYY': // Visit every week
      return true;
    case 'YTYT': // Week 1 & 3 visits
      return weekOfMonth === 1 || weekOfMonth === 3;
    case 'TYTY': // Week 2 & 4 visits
      return weekOfMonth === 2 || weekOfMonth === 4;
    default:
      return true; // Default to visiting if cycle is unknown
  }
}

// Generate suggested visits for a given date
export async function generateSuggestedVisits(date: Date, salespersonId: string) {
  // This will be implemented with Supabase logic
}
