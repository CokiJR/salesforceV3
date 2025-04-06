-- Create customer_bank_accounts table to store relationships between customers and bank accounts
CREATE TABLE IF NOT EXISTS customer_bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT customer_bank_accounts_unique UNIQUE (customer_id, bank_account_id)
);

-- Enable RLS for customer_bank_accounts table
ALTER TABLE customer_bank_accounts ENABLE ROW LEVEL SECURITY;

-- Create policy for customer_bank_accounts table
DROP POLICY IF EXISTS "Public access to customer_bank_accounts" ON customer_bank_accounts;
CREATE POLICY "Public access to customer_bank_accounts"
  ON customer_bank_accounts
  FOR ALL
  USING (true);

-- Enable realtime for customer_bank_accounts table
ALTER PUBLICATION supabase_realtime ADD TABLE customer_bank_accounts;