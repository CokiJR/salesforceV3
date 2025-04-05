
-- Collections table migration
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  amount DECIMAL NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL CHECK (status IN ('Paid', 'Unpaid')) DEFAULT 'Unpaid',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Enable read access for all users" ON collections
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert access for all users" ON collections
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON collections
  FOR UPDATE
  USING (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS collections_due_date_idx ON collections(due_date);
CREATE INDEX IF NOT EXISTS collections_status_idx ON collections(status);
