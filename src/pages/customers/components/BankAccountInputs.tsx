import { useState, useEffect } from "react";
import { useFieldArray, Control } from "react-hook-form";
import {
  Building,
  CreditCard,
  User,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BankAccountInputsProps {
  control: Control<any>;
  name: string;
}

interface BankOption {
  name: string;
  accounts: {
    id: string;
    account_number: string;
    account_holder_name: string;
  }[];
}

export function BankAccountInputs({ control, name }: BankAccountInputsProps) {
  const { fields, append, remove, update } = useFieldArray({
    control,
    name,
  });

  const [bankOptions, setBankOptions] = useState<BankOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch bank accounts from database
  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("bank_accounts")
          .select("*")
          .order("bank_name");

        if (error) throw error;

        // Group accounts by bank name
        const groupedByBank: Record<string, any[]> = {};
        data?.forEach((account) => {
          if (!groupedByBank[account.bank_name]) {
            groupedByBank[account.bank_name] = [];
          }
          groupedByBank[account.bank_name].push(account);
        });

        // Convert to array of bank options
        const options: BankOption[] = Object.keys(groupedByBank).map(
          (bankName) => ({
            name: bankName,
            accounts: groupedByBank[bankName].map((account) => ({
              id: account.id,
              account_number: account.account_number,
              account_holder_name: account.account_holder_name,
            })),
          }),
        );

        setBankOptions(options);
      } catch (error: any) {
        console.error("Error fetching bank accounts:", error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBankAccounts();
  }, []);

  const addBankAccount = () => {
    append({
      bank_name: "",
      account_number: "",
      account_holder_name: "",
      id: undefined, // Ensure ID is undefined for new accounts
    });
  };

  const handleBankChange = (value: string, index: number) => {
    // Update the bank name
    const currentField = { ...fields[index] };
    currentField.bank_name = value;
    currentField.account_number = "";
    currentField.account_holder_name = "";
    update(index, currentField);
  };

  const handleAccountNumberChange = (value: string, index: number) => {
    // Find the selected bank
    const selectedBank = bankOptions.find(
      (bank) => bank.name === fields[index].bank_name,
    );

    if (selectedBank) {
      // Find the selected account
      const selectedAccount = selectedBank.accounts.find(
        (account) => account.account_number === value,
      );

      if (selectedAccount) {
        // Update the account number, holder name, and ID
        const currentField = { ...fields[index] };
        currentField.account_number = value;
        currentField.account_holder_name = selectedAccount.account_holder_name;
        currentField.id = selectedAccount.id; // Set the ID from the existing account
        update(index, currentField);
      }
    }
  };

  return (
    <Card className="p-4 border-dashed">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>Bank Account Information</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addBankAccount}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Bank Account
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0 space-y-4">
        {isLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && fields.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            No bank accounts added. Click the button above to add one.
          </div>
        )}

        {fields.map((field, index) => (
          <div key={field.id} className="border rounded-md p-4 relative">
            <div className="absolute top-2 right-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-4">
              <FormField
                control={control}
                name={`${name}.${index}.bank_name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleBankChange(value, index);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <div className="relative">
                          <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Select bank" />
                          </SelectTrigger>
                          <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <SelectContent>
                        {bankOptions.map((bank) => (
                          <SelectItem key={bank.name} value={bank.name}>
                            {bank.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`${name}.${index}.account_number`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleAccountNumberChange(value, index);
                      }}
                      value={field.value}
                      disabled={!fields[index].bank_name}
                    >
                      <FormControl>
                        <div className="relative">
                          <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Select account number" />
                          </SelectTrigger>
                          <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <SelectContent>
                        {fields[index].bank_name &&
                          bankOptions
                            .find(
                              (bank) => bank.name === fields[index].bank_name,
                            )
                            ?.accounts.map((account) => (
                              <SelectItem
                                key={account.account_number}
                                value={account.account_number}
                              >
                                {account.account_number}
                              </SelectItem>
                            ))}
                        {fields[index].bank_name &&
                          bankOptions.find(
                            (bank) => bank.name === fields[index].bank_name,
                          )?.accounts.length === 0 && (
                            <div className="p-2 text-center text-muted-foreground">
                              No available account number for this bank.
                            </div>
                          )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={control}
              name={`${name}.${index}.account_holder_name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Holder Name *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        placeholder="Account holder name will appear here"
                        {...field}
                        readOnly
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    This field will be filled automatically when you select an
                    account number
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
