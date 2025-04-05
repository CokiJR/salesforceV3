import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BankAccountForm } from "./bank-accounts/components/BankAccountForm";
import { BankAccountList } from "./bank-accounts/components/BankAccountList";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  customer_id?: string;
  customer?: {
    id: string;
    customer_id: string;
    name: string;
  };
  created_at: string;
}

export default function BankAccounts() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(
    null,
  );
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchBankAccounts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("bank_accounts")
        .select(
          `
          *,
          customer:customers(id, customer_id, name)
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      setBankAccounts(data || []);
    } catch (error: any) {
      console.error("Error fetching bank accounts:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load bank accounts: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const handleAddAccount = () => {
    setSelectedAccount(null);
    setShowForm(true);
  };

  const handleEditAccount = (account: BankAccount) => {
    setSelectedAccount(account);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedAccount(null);
  };

  const handleFormSubmit = async (
    formData: Omit<BankAccount, "id" | "created_at">,
  ) => {
    try {
      if (selectedAccount) {
        // Update existing account
        const { error } = await supabase
          .from("bank_accounts")
          .update({
            bank_name: formData.bank_name,
            account_number: formData.account_number,
            account_holder_name: formData.account_holder_name,
            customer_id: formData.customer_id || null,
          })
          .eq("id", selectedAccount.id);

        if (error) throw error;

        toast({
          title: "Bank account updated",
          description: "The bank account has been updated successfully.",
        });
      } else {
        // Create new account
        const { error } = await supabase.from("bank_accounts").insert({
          bank_name: formData.bank_name,
          account_number: formData.account_number,
          account_holder_name: formData.account_holder_name,
          customer_id: formData.customer_id || null,
        });

        if (error) throw error;

        toast({
          title: "Bank account added",
          description: "The bank account has been added successfully.",
        });
      }

      // Refresh the list and close the form
      fetchBankAccounts();
      handleFormClose();
    } catch (error: any) {
      console.error("Error saving bank account:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to save bank account: ${error.message}`,
      });
    }
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      const { error } = await supabase
        .from("bank_accounts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Bank account deleted",
        description: "The bank account has been deleted successfully.",
      });

      // Refresh the list
      fetchBankAccounts();
    } catch (error: any) {
      console.error("Error deleting bank account:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete bank account: ${error.message}`,
      });
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bank Accounts</h2>
          <p className="text-muted-foreground">
            Manage bank accounts for payments and collections
          </p>
        </div>
        <Button onClick={handleAddAccount}>
          <Plus className="mr-2 h-4 w-4" />
          Add Bank Account
        </Button>
      </div>

      {showForm && (
        <BankAccountForm
          account={selectedAccount}
          onSubmit={handleFormSubmit}
          onCancel={handleFormClose}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Bank Account Records</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <BankAccountList
              accounts={bankAccounts}
              onEdit={handleEditAccount}
              onDelete={handleDeleteAccount}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
