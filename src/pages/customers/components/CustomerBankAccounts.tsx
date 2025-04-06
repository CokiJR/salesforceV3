import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BankAccount, Customer } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CreditCard, Building, User } from 'lucide-react';

interface CustomerBankAccountsProps {
  customer: Customer;
}

export function CustomerBankAccounts({ customer }: CustomerBankAccountsProps) {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        setIsLoading(true);
        // First get the relationships from customer_bank_accounts
        const { data: relationships, error: relError } = await supabase
          .from("customer_bank_accounts")
          .select("bank_account_id")
          .eq("customer_id", customer.id);
        
        if (relError) throw relError;
        
        if (relationships && relationships.length > 0) {
          // Get all bank account IDs
          const bankAccountIds = relationships.map(rel => rel.bank_account_id);
          
          // Fetch the actual bank accounts
          const { data: accounts, error: accError } = await supabase
            .from("bank_accounts")
            .select("*")
            .in("id", bankAccountIds);
            
          if (accError) throw accError;
          setBankAccounts(accounts || []);
        }
      } catch (error: any) {
        console.error("Error fetching bank accounts:", error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBankAccounts();
  }, [customer.id]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Bank Accounts</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (bankAccounts.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Bank Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            No bank accounts found for this customer.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Bank Accounts</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><div className="flex items-center"><Building className="h-4 w-4 mr-2" /> Bank Name</div></TableHead>
              <TableHead><div className="flex items-center"><CreditCard className="h-4 w-4 mr-2" /> Account Number</div></TableHead>
              <TableHead><div className="flex items-center"><User className="h-4 w-4 mr-2" /> Account Holder</div></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bankAccounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-medium">{account.bank_name}</TableCell>
                <TableCell>{account.account_number}</TableCell>
                <TableCell>{account.account_holder_name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}