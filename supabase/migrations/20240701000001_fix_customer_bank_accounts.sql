-- Fix customer_bank_accounts table structure

-- First, rename the existing customer_id column to customer_uuid to match its actual purpose
ALTER TABLE customer_bank_accounts RENAME COLUMN customer_id TO customer_uuid;

-- Add a new customer_id column to store the customer_id (C0000000 format)
ALTER TABLE customer_bank_accounts ADD COLUMN customer_id TEXT;

-- Update the foreign key constraint to reference the correct column
ALTER TABLE customer_bank_accounts DROP CONSTRAINT IF EXISTS customer_bank_accounts_customer_id_fkey;
ALTER TABLE customer_bank_accounts ADD CONSTRAINT customer_bank_accounts_customer_uuid_fkey
  FOREIGN KEY (customer_uuid) REFERENCES customers(id) ON DELETE CASCADE;

-- Add the table to realtime publication if not already added
ALTER PUBLICATION supabase_realtime ADD TABLE customer_bank_accounts;
