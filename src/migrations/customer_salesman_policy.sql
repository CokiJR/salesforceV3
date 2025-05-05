-- Policy RLS untuk tabel customer_salesman

-- Policy untuk INSERT: Hanya admin/manager yang bisa assign salesman ke customer
CREATE POLICY "Allow salesman assignment by admin/manager"
ON customer_salesman
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Policy untuk SELECT: Admin/manager bisa melihat semua, salesman hanya bisa melihat customer yang diassign ke mereka
CREATE POLICY "Allow admin/manager to view all customer assignments"
ON customer_salesman
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "Allow salesmen to view only their assigned customers"
ON customer_salesman
FOR SELECT USING (
  salesman_id = auth.uid()
);

-- Policy untuk DELETE: Hanya admin/manager yang bisa menghapus assignment
CREATE POLICY "Allow admin/manager to delete customer assignments"
ON customer_salesman
FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);