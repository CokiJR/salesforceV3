
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface OrderSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const OrderSearch = ({ searchQuery, setSearchQuery }: OrderSearchProps) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search orders..."
        className="pl-10"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  );
};
