-- Update payments table to use bank_account_id instead of bank_account string
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES bank_accounts(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS payments_bank_account_id_idx ON payments(bank_account_id);
