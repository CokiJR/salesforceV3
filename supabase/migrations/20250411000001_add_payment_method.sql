-- Add payment_method column to collections table
ALTER TABLE collections
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

-- Add payment_method column to payments table
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS collections_payment_method_idx ON collections(payment_method);
CREATE INDEX IF NOT EXISTS payments_payment_method_idx ON payments(payment_method);