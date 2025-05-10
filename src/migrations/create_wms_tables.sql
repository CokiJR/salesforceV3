-- Membuat tabel untuk lokasi penyimpanan (Storage Locations)
CREATE TABLE IF NOT EXISTS storage_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  warehouse_code VARCHAR NOT NULL REFERENCES warehouses(code),
  location_code VARCHAR NOT NULL,
  location_type VARCHAR CHECK (location_type IN ('RECEIVING', 'STORAGE', 'PICKING', 'SHIPPING', 'DAMAGE')),
  max_capacity NUMERIC,
  current_quantity NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(warehouse_code, location_code)
);

-- Membuat tabel untuk perpindahan barang (Inventory Movements)
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku VARCHAR NOT NULL REFERENCES products(sku),
  from_location VARCHAR,
  to_location VARCHAR,
  quantity NUMERIC NOT NULL,
  uom VARCHAR DEFAULT 'pcs',
  movement_type VARCHAR NOT NULL CHECK (movement_type IN (
    'RECEIVING', 'PUTAWAY', 'PICKING', 'TRANSFER', 'ADJUSTMENT'
  )),
  reference_doc VARCHAR, -- Nomor dokumen terkait (PO, SO, dll)
  movement_time TIMESTAMPTZ DEFAULT NOW(),
  user_id VARCHAR -- Operator yang melakukan
);

-- Membuat tabel untuk stok opname (Stock Count)
CREATE TABLE IF NOT EXISTS stock_counts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  warehouse_code VARCHAR NOT NULL REFERENCES warehouses(code),
  count_date DATE NOT NULL,
  status VARCHAR DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'IN_PROGRESS', 'COMPLETED')),
  completed_by VARCHAR,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS stock_count_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  count_id UUID NOT NULL REFERENCES stock_counts(id),
  sku VARCHAR NOT NULL REFERENCES products(sku),
  location_code VARCHAR,
  system_quantity NUMERIC NOT NULL,
  counted_quantity NUMERIC,
  variance NUMERIC GENERATED ALWAYS AS (counted_quantity - system_quantity) STORED
);

-- Modifikasi tabel Inventory (Tambahkan Kolom)
ALTER TABLE inventory
ADD COLUMN IF NOT EXISTS last_count_date DATE,
ADD COLUMN IF NOT EXISTS min_stock_level NUMERIC,
ADD COLUMN IF NOT EXISTS max_stock_level NUMERIC,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Modifikasi tabel Warehouses (Tambahkan Kolom)
ALTER TABLE warehouses
ADD COLUMN IF NOT EXISTS contact_person VARCHAR,
ADD COLUMN IF NOT EXISTS operating_hours JSONB,
ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE'));

-- Fungsi Update Stok Otomatis
CREATE OR REPLACE FUNCTION update_inventory_on_movement()
RETURNS TRIGGER AS $$
BEGIN
  -- Update stok untuk lokasi asal (jika ada)
  IF NEW.from_location IS NOT NULL THEN
    UPDATE inventory
    SET quantity = quantity - NEW.quantity,
        last_updated_at = NOW()
    WHERE sku = NEW.sku
    AND warehouse_code = (
      SELECT warehouse_code FROM storage_locations
      WHERE location_code = NEW.from_location
    );
  END IF;
  
  -- Update stok untuk lokasi tujuan (jika ada)
  IF NEW.to_location IS NOT NULL THEN
    INSERT INTO inventory (sku, warehouse_code, quantity)
    SELECT NEW.sku, sl.warehouse_code, NEW.quantity
    FROM storage_locations sl
    WHERE sl.location_code = NEW.to_location
    ON CONFLICT (sku, warehouse_code)
    DO UPDATE SET
      quantity = inventory.quantity + NEW.quantity,
      last_updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trg_inventory_movement
AFTER INSERT ON inventory_movements
FOR EACH ROW EXECUTE FUNCTION update_inventory_on_movement();

-- Fungsi Peringatan Stok Rendah
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quantity < NEW.min_stock_level THEN
    RAISE NOTICE 'Peringatan: Stok SKU % di gudang % di bawah minimum!', NEW.sku, NEW.warehouse_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trg_low_stock_warning
AFTER UPDATE OF quantity ON inventory
FOR EACH ROW EXECUTE FUNCTION check_low_stock();

-- View untuk Laporan Ketersediaan Stok
CREATE OR REPLACE VIEW stock_availability_view AS
SELECT
  i.sku,
  p.name AS product_name,
  w.code AS warehouse_code,
  w.name AS warehouse_name,
  i.quantity AS on_hand,
  i.uom,
  i.min_stock_level,
  i.max_stock_level,
  CASE
    WHEN i.quantity <= i.min_stock_level THEN 'LOW'
    WHEN i.quantity >= i.max_stock_level THEN 'OVER'
    ELSE 'NORMAL'
  END AS stock_status
FROM inventory i
JOIN warehouses w ON i.warehouse_code = w.code
JOIN products p ON i.sku = p.sku;

-- View untuk Riwayat Perpindahan
CREATE OR REPLACE VIEW movement_history_view AS
SELECT
  m.id,
  m.sku,
  p.name AS product_name,
  m.movement_type,
  m.quantity,
  m.uom,
  fw.code AS from_warehouse_code,
  fw.name AS from_warehouse_name,
  fl.location_code AS from_location,
  tw.code AS to_warehouse_code,
  tw.name AS to_warehouse_name,
  tl.location_code AS to_location,
  m.reference_doc,
  m.movement_time,
  m.user_id
FROM inventory_movements m
LEFT JOIN storage_locations fl ON m.from_location = fl.location_code
LEFT JOIN storage_locations tl ON m.to_location = tl.location_code
LEFT JOIN warehouses fw ON fl.warehouse_code = fw.code
LEFT JOIN warehouses tw ON tl.warehouse_code = tw.code
JOIN products p ON m.sku = p.sku;

-- Menambahkan indeks untuk mempercepat query
CREATE INDEX IF NOT EXISTS idx_storage_locations_warehouse_code ON storage_locations(warehouse_code);
CREATE INDEX IF NOT EXISTS idx_storage_locations_location_code ON storage_locations(location_code);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_sku ON inventory_movements(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_movement_time ON inventory_movements(movement_time);
CREATE INDEX IF NOT EXISTS idx_stock_counts_warehouse_code ON stock_counts(warehouse_code);
CREATE INDEX IF NOT EXISTS idx_stock_count_details_count_id ON stock_count_details(count_id);
CREATE INDEX IF NOT EXISTS idx_stock_count_details_sku ON stock_count_details(sku);