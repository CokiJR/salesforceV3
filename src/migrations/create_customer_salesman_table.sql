-- Membuat tabel junction untuk relasi many-to-many antara customer dan salesman
CREATE TABLE IF NOT EXISTS customer_salesman (
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  salesman_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (customer_id, salesman_id)
);

-- Menambahkan indeks untuk mempercepat query
CREATE INDEX IF NOT EXISTS idx_customer_salesman_customer_id ON customer_salesman(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_salesman_salesman_id ON customer_salesman(salesman_id);

-- Mengaktifkan Row Level Security
ALTER TABLE customer_salesman ENABLE ROW LEVEL SECURITY;