-- Add account_number column to payments table
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS account_number VARCHAR(50);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS payments_account_number_idx ON payments(account_number);