-- Add customer_id column to customers table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'customer_id') THEN
    ALTER TABLE customers ADD COLUMN customer_id VARCHAR(50);
    -- Add a unique constraint to customer_id
    ALTER TABLE customers ADD CONSTRAINT customers_customer_id_unique UNIQUE (customer_id);
  END IF;
END $$;

-- Create bank_accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_name VARCHAR(100) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  account_holder_name VARCHAR(100) NOT NULL,
  customer_id UUID REFERENCES customers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT bank_accounts_account_number_unique UNIQUE (account_number)
);

-- Enable RLS for bank_accounts table
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- Create policy for bank_accounts table
DROP POLICY IF EXISTS "Public access to bank_accounts" ON bank_accounts;
CREATE POLICY "Public access to bank_accounts"
  ON bank_accounts
  FOR ALL
  USING (true);

-- Enable realtime for bank_accounts table
ALTER PUBLICATION supabase_realtime ADD TABLE bank_accounts;

-- Seed bank_accounts table with initial data
INSERT INTO bank_accounts (bank_name, account_number, account_holder_name)
VALUES
  ('BCA', '2770570134', 'SUSIATI'),
  ('BCA', '8161739529', 'SITI AWAIDA'),
  ('BCA', '1082548216', 'YARIS RIYADI'),
  ('BCA', '1082657872', 'YULI AGUSTINA'),
  ('BCA', '7020683974', 'ANGGI ERLANGGA'),
  ('BCA', '5940740403', 'ARIS MAHENDRA SUJANA'),
  ('BCA', '3310920583', 'SUSILO'),
  ('BCA', '3310994226', 'NGATEMI'),
  ('BCA', '8161739511', 'CANDRA HARYONO'),
  ('BCA', '8161739588', 'SUTONO'),
  ('BCA', '3310870187', 'SEPTIAN ARIF SETYA WARDHANA'),
  ('BCA', '3310870225', 'NANANG SUPRIYADI'),
  ('BCA', '4391079387', 'WALUYO AGUS SETIAWAN'),
  ('BCA', '6225053433', 'FINKI FERI FERNANDA'),
  ('BCA', '6225053425', 'RIZKI IWAN FAIZ'),
  ('BCA', '3310980942', 'RUDIK YULIANTO'),
  ('BCA', '3310944041', 'ANGGA KUSUMA'),
  ('BCA', '6225065938', 'MOH. FAJAR KUSTANTO'),
  ('BCA', '3310980632', 'PIPIT ISTIANAH'),
  ('BCA', '3310980659', 'SITI KHOLIFAH'),
  ('BCA', '3310994218', 'KRISTINA RISMANIAR'),
  ('BCA', '1080107788', 'TRI SAPUTRA'),
  ('BCA', '7020557979', 'SINAR ALAM ABADIJAYA PT'),
  ('BCA', '6470991117', 'FORTE TRITUNGGAL WIJAKS')
ON CONFLICT (account_number) DO NOTHING;