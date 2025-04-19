import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePricingData } from "./pricing/hooks/usePricingData";
import { PricingTable } from "./pricing/components/PricingTable";
import { SpecialPricesTable } from "./pricing/components/SpecialPricesTable";
import { EmptyPricingState } from "./pricing/components/EmptyPricingState";

const Pricing = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("general");
  const { generalPricing, specialPricing, loading } = usePricingData();
  const navigate = useNavigate();

  const handleAddGeneralPrice = () => {
    navigate("/dashboard/pricing/add");
  };

  const handleAddSpecialPrice = () => {
    navigate("/dashboard/pricing/add-special");
  };

  const filteredGeneralPricing = generalPricing.filter(price => 
    price.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    price.product?.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSpecialPricing = specialPricing.filter(price => 
    price.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    price.product?.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    price.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Pricing</h1>
        {activeTab === "general" ? (
          <Button onClick={handleAddGeneralPrice}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Harga Umum
          </Button>
        ) : (
          <Button onClick={handleAddSpecialPrice}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Harga Khusus
          </Button>
        )}
      </div>

      <Tabs defaultValue="general" onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="general">Harga Umum</TabsTrigger>
          <TabsTrigger value="special">Harga Khusus</TabsTrigger>
        </TabsList>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari berdasarkan produk atau pelanggan..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <TabsContent value="general" className="mt-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredGeneralPricing.length > 0 ? (
            <PricingTable pricing={filteredGeneralPricing} />
          ) : (
            <EmptyPricingState 
              type="general"
              searchQuery={searchQuery} 
              onAddClick={handleAddGeneralPrice} 
            />
          )}
        </TabsContent>

        <TabsContent value="special" className="mt-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSpecialPricing.length > 0 ? (
            <SpecialPricesTable pricing={filteredSpecialPricing} />
          ) : (
            <EmptyPricingState 
              type="special"
              searchQuery={searchQuery} 
              onAddClick={handleAddSpecialPrice} 
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Pricing;