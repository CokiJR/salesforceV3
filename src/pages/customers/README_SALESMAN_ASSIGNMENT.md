# Fitur Assign Salesman ke Customer

## Deskripsi
Fitur ini memungkinkan admin/manager untuk mengassign satu atau lebih salesman ke customer melalui form customer yang sudah ada. Salesman yang diassign ke customer tertentu hanya akan dapat melihat customer tersebut.

## Implementasi

### Backend

#### 1. Tabel Database
Tabel junction `customer_salesman` dibuat untuk menyimpan relasi many-to-many antara customer dan salesman:

```sql
CREATE TABLE customer_salesman (
  customer_id UUID REFERENCES customers(id),
  salesman_id UUID REFERENCES profiles(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (customer_id, salesman_id)
);
```

#### 2. API Endpoint
Endpoint API dibuat untuk menangani assignment salesman ke customer:

```
POST /api/customers/{customer_id}/salesmen
Body: { "salesman_ids": ["uuid1", "uuid2"] }
```

#### 3. Service Layer
Class `CustomerSalesmanService` dibuat untuk menangani operasi terkait assignment salesman:

- `getSalesmen()`: Mengambil daftar salesman yang tersedia
- `getCustomerSalesmen(customerId)`: Mengambil daftar salesman yang diassign ke customer tertentu
- `assignSalesmen(customerId, salesmanIds)`: Mengassign salesman ke customer

#### 4. Row Level Security (RLS)
Policy RLS dibuat untuk mengatur hak akses pada tabel `customer_salesman`:

```sql
CREATE POLICY "Allow salesman assignment by admin/manager"
ON customer_salesman
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);
```

### Frontend

#### 1. Form Customer
Komponen multi-select dropdown ditambahkan ke form customer untuk memilih salesman:

```tsx
<FormField
  control={form.control}
  name="salesman_ids"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Salesman</FormLabel>
      <Select
        mode="multiple"
        onValueChange={(values) => {
          field.onChange(values);
        }}
        value={field.value}
        disabled={isLoadingSalesmen}
      >
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Pilih salesman" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {salesmen.map((salesman) => (
            <SelectItem
              key={salesman.id}
              value={salesman.id}
            >
              {salesman.full_name} ({salesman.email})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormItem>
  )}
/>
```

## Cara Penggunaan

1. Login sebagai admin/manager
2. Buka halaman edit customer
3. Pada bagian bawah form, terdapat field "Salesman"
4. Pilih satu atau lebih salesman dari dropdown
5. Klik tombol "Save Changes" untuk menyimpan perubahan

## Catatan

- Hanya admin/manager yang dapat mengassign salesman ke customer
- Salesman hanya dapat melihat customer yang diassign ke mereka
- Jika tidak ada salesman yang dipilih, customer tidak akan terlihat oleh salesman manapun
- Perubahan pada assignment salesman akan langsung terlihat setelah refresh halaman