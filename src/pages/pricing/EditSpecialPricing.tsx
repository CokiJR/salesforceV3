import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  customer_id: z.string().min(1, { message: "Pelanggan harus dipilih" }),
  sku: z.string().min(1, { message: "SKU produk harus diisi" }),
  special_price: z.coerce
    .number()
    .min(0, { message: "Harga tidak boleh negatif" }),
  currency: z.string().default("IDR"),
  min_qty: z.coerce
    .number()
    .min(1, { message: "Minimal kuantitas harus 1 atau lebih" })
    .default(1),
  valid_from: z.date().default(() => new Date()),
  valid_to: z.date().optional().nullable(),
  active: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

const EditSpecialPricing = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPricing, setCurrentPricing] = useState<any>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_id: "",
      sku: "",
      special_price: 0,
      currency: "IDR",
      min_qty: 1,
      valid_from: new Date(),
      valid_to: null,
      active: true,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch the special pricing data
        const { data: pricingData, error: pricingError } = await supabase
          .from("special_prices")
          .select("*")
          .eq("id", id)
          .single();

        if (pricingError) throw pricingError;
        setCurrentPricing(pricingData);

        // Fetch products
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("sku, name")
          .order("name");

        if (productsError) throw productsError;
        setProducts(productsData || []);

        // Fetch customers
        const { data: customersData, error: customersError } = await supabase
          .from("customers")
          .select("id, name")
          .order("name");

        if (customersError) throw customersError;
        setCustomers(customersData || []);

        // Set form values
        if (pricingData) {
          form.reset({
            customer_id: pricingData.customer_id,
            sku: pricingData.sku,
            special_price: pricingData.special_price,
            currency: pricingData.currency || "IDR",
            min_qty: pricingData.min_qty || 1,
            valid_from: pricingData.valid_from ? new Date(pricingData.valid_from) : new Date(),
            valid_to: pricingData.valid_to ? new Date(pricingData.valid_to) : null,
            active: pricingData.active !== undefined ? pricingData.active : true,
          });
        }
      } catch (error: any) {
        console.error("Error fetching data:", error.message);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Gagal memuat data: ${error.message}`,
        });
        navigate("/dashboard/pricing");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, toast, navigate, form]);

  const onSubmit = async (values: FormValues) => {
    if (!id || !currentPricing) return;
    
    setIsSubmitting(true);
    try {
      // Update the special pricing record
      const { error: updateError } = await supabase
        .from("special_prices")
        .update({
          customer_id: values.customer_id,
          sku: values.sku,
          special_price: values.special_price,
          currency: values.currency,
          min_qty: values.min_qty,
          valid_from: values.valid_from.toISOString().split("T")[0],
          valid_to: values.valid_to
            ? values.valid_to.toISOString().split("T")[0]
            : null,
          active: values.active,
        })
        .eq("id", id);

      if (updateError) throw updateError;

      toast({
        title: "Harga khusus berhasil diperbarui",
        description: "Data harga khusus pelanggan telah berhasil diperbarui.",
      });

      navigate("/dashboard/pricing");
    } catch (error: any) {
      console.error("Error updating special pricing:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memperbarui data harga khusus: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard/pricing")}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Edit Harga Khusus</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 border p-6 rounded-lg"
            >
              <FormField
                control={form.control}
                name="customer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pelanggan</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih pelanggan" />
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Produk</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih produk" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.sku} value={product.sku}>
                            {product.name} ({product.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="special_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga Khusus</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Masukkan harga khusus"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mata Uang</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih mata uang" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="IDR">IDR - Rupiah</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="min_qty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimal Kuantitas</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Masukkan minimal kuantitas"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valid_from"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Berlaku Dari</FormLabel>
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
                              <span>Pilih tanggal</span>
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
                            date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valid_to"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Berlaku Hingga (Opsional)</FormLabel>
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
                              <span>Tidak ada batas waktu</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Status Aktif</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Harga khusus ini aktif dan dapat digunakan
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard/pricing")}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
};

export default EditSpecialPricing;