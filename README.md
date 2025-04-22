# 🚀 SalesForce Web App

A web-based sales operation system designed to support and integrate with SAP Business One (SAP B1). This application facilitates streamlined sales activities, customer visits, billing collection, and inventory tracking.

---

## 📦 Features

- ✅ Customer & Product Master Data Sync
- 📍 Sales Visit Scheduler (Weekly Route Automation)
- 💳 Collection & Giro Management
- 🧾 Invoice Integration
- 🗃️ Inventory & Warehouse Monitoring
- 📈 Realtime Dashboard Reporting

---

## 🛠️ Tech Stack

- ⚙️ **Frontend**: React, TypeScript, Tailwind CSS
- 🌐 **Backend / DB**: Supabase (PostgreSQL)
- 💻 **Dev Tools**: Visual Studio Code, GitHub, Vercel (optional)
- ⚡ **Utilities**: Zod, React Hook Form, Lucide Icons

---

## 📅 Weekly Route Planner

Automated visit schedule for sales team based on customer cycle pattern (e.g., weekly, bi-weekly):

- `YYYY` - Every week  
- `YTYT` - Week 1 & 3  
- `TYTY` - Week 2 & 4  

---

## 📷 Screenshots

### 🧭 Dashboard Overview
Menampilkan ringkasan aktivitas sales, customer overdue, dan insight performa tim penjualan.
![Dashboard](./screenshots/dashboard.png)

---

### 💰 Collection Module
Form penagihan invoice yang dilakukan oleh tim sales ke customer.
![Collection](./screenshots/collection.png)

---

### 🧾 Giro Management
Pencatatan transaksi giro customer, status pencairan, dan histori clearing.
![Giro](./screenshots/giro.png)

---

### 📅 Route Planning
Penjadwalan kunjungan otomatis berdasarkan siklus mingguan pelanggan.
![Route](./screenshots/route.png)

---

### 🗂️ Customer & Product Management
Menu master data untuk pelanggan dan produk yang akan disinkronisasi ke SAP B1.
![Master Data](./screenshots/masterdata.png)

---

### 🏷️ Inventory Tracking
Pemantauan stok produk berdasarkan warehouse dan lokasi distribusi.
![Inventory](./screenshots/inventory.png)

---

## 🔌 Integration with SAP B1

This app is designed to serve as a staging system between SAP B1 and field sales operations, ensuring that data is:

- Validated before being pushed to SAP
- Maintained with user-level access controls
- Extended with additional features outside SAP licenses

---

## 📍 Future Phases

- 📝 Order Management (Web-to-SAP Order Sync)
- 📦 Real-Time Stock Availability
- 📧 Notifications (Email / WhatsApp)

---

## 👨‍💻 Author

**Hafiv Cokjr**  
📫 cokjr.cr@gmail.com  
💼 [LinkedIn](https://www.linkedin.com/in/hafiv-rienaldy-9272a2197/)