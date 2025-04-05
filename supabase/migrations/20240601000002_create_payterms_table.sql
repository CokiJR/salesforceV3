-- Create payterms table
CREATE TABLE IF NOT EXISTS payterms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payterm_code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add sample payment terms
INSERT INTO payterms (payterm_code, description) VALUES
('Z000', 'Cash on Delivery'),
('Z007', 'Due in 7 Days'),
('Z014', 'Due in 14 Days'),
('Z030', 'Due in 30 Days'),
('Z045', 'Due in 45 Days'),
('Z060', 'Due in 60 Days'),
('Z090', 'Due in 90 Days')
ON CONFLICT (payterm_code) DO NOTHING;

-- Enable row level security
ALTER TABLE payterms ENABLE ROW LEVEL SECURITY;

-- Create policy for read access
DROP POLICY IF EXISTS "Allow read access for all users" ON payterms;
CREATE POLICY "Allow read access for all users"
  ON payterms FOR SELECT
  USING (true);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE payterms;
