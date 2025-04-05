
import { User } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Customer } from "@/types";

interface CustomerInfoCardProps {
  customer: Customer | null | undefined;
}

export function CustomerInfoCard({ customer }: CustomerInfoCardProps) {
  if (!customer) return null;

  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="text-base flex items-center">
          <User className="h-4 w-4 mr-2" />
          Customer Information
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="font-medium">{customer.name}</p>
        <p className="text-sm text-muted-foreground">
          {customer.address}, {customer.city}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          {customer.contact_person} • {customer.phone}
        </p>
        {customer.email && (
          <p className="text-sm text-muted-foreground">
            {customer.email}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
