-- Fix foreign key constraint for customer_bank_accounts table

-- Drop the existing constraint
ALTER TABLE customer_bank_accounts DROP CONSTRAINT IF EXISTS customer_bank_accounts_bank_account_id_fkey;

-- Add the correct constraint
ALTER TABLE customer_bank_accounts ADD CONSTRAINT customer_bank_accounts_bank_account_id_fkey
  FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE CASCADE;
