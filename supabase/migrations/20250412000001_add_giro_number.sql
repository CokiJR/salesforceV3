-- Add giro_number column to payments table
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS giro_number VARCHAR(100);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS payments_giro_number_idx ON payments(giro_number);