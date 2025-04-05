
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Customer } from '@/types';
import { BadgeCheck, BadgeX, Calendar, Landmark, MapPin, Phone, User, AtSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CustomerInfoProps {
  customer: Customer;
  getCycleDescription?: (cycle: string) => string;
}

export function CustomerInfo({ customer, getCycleDescription }: CustomerInfoProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Customer Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Contact Person</div>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{customer.contact_person}</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Status</div>
            <div className="flex items-center space-x-2">
              {customer.status === 'active' ? (
                <>
                  <BadgeCheck className="h-4 w-4 text-green-500" />
                  <Badge className="bg-green-500">Active</Badge>
                </>
              ) : (
                <>
                  <BadgeX className="h-4 w-4 text-red-500" />
                  <Badge className="bg-red-500">Inactive</Badge>
                </>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Phone</div>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{customer.phone}</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Email</div>
            <div className="flex items-center space-x-2">
              <AtSign className="h-4 w-4 text-muted-foreground" />
              <span>{customer.email || 'N/A'}</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Address</div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{customer.address}, {customer.city}</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Cycle</div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {getCycleDescription ? getCycleDescription(customer.cycle) : customer.cycle}
              </span>
            </div>
          </div>
          {customer.payment_term_description || customer.payment_term ? (
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Payment Term</div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {customer.payment_term_description || customer.payment_term || 'N/A'}
                </span>
              </div>
            </div>
          ) : null}
          {customer.bank_account && (
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Bank Account</div>
              <div className="flex items-center space-x-2">
                <Landmark className="h-4 w-4 text-muted-foreground" />
                <span>{customer.bank_account || 'N/A'}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
