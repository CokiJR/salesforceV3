
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { useEffect } from "react";
import { Customer } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

// Order form schema
const orderSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  delivery_date: z.date(),
  notes: z.string().optional(),
});

export type OrderFormValues = z.infer<typeof orderSchema>;

interface OrderFormProps {
  customers: Customer[];
  isSubmitting: boolean;
  onSubmit: (data: OrderFormValues) => void;
  orderItemsComponent: React.ReactNode;
  onCancel: () => void;
  hasOrderItems: boolean;
  preselectedCustomer?: string | null;
  readOnlyCustomer?: boolean;
}

export function OrderForm({ 
  customers, 
  isSubmitting, 
  onSubmit, 
  orderItemsComponent,
  onCancel,
  hasOrderItems,
  preselectedCustomer,
  readOnlyCustomer = false
}: OrderFormProps) {
  // Initialize the form
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customer_id: preselectedCustomer || "",
      delivery_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      notes: "",
    },
  });

  // Update the form when preselectedCustomer changes
  useEffect(() => {
    if (preselectedCustomer) {
      form.setValue("customer_id", preselectedCustomer);
    }
  }, [preselectedCustomer, form]);
  
  // Find the customer name for display when in read-only mode
  const getCustomerName = () => {
    if (!preselectedCustomer) return "";
    const customer = customers.find(c => c.id === preselectedCustomer);
    return customer ? customer.name : "";
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="customer_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer</FormLabel>
                {readOnlyCustomer ? (
                  // Show a read-only input when customer is pre-selected from route
                  <FormControl>
                    <Input 
                      value={getCustomerName()}
                      readOnly
                      className="bg-gray-100"
                    />
                  </FormControl>
                ) : (
                  // Show the dropdown when customer is not pre-selected
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="delivery_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Delivery Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter any additional notes about this order" 
                  {...field} 
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {orderItemsComponent}
        
        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || !hasOrderItems}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>Create Order</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
