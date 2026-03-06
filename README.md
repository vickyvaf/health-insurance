# 🚀 InsureHealth

**InsureHealth** adalah platform asuransi kesehatan digital yang mengintegrasikan alur pembayaran dengan sistem **Double-Entry Ledger** internal untuk menjamin akurasi finansial dan transparansi data transaksi.

## 📖 How to Run
Panduan cara menjalankan sistem asuransi kesehatan (Frontend & Backend).

## 🛠 Prerequisites
Pastikan kamu sudah menginstal:
- **Docker Desktop** (Paling direkomendasikan)
- **Bun Runtime** (Jika ingin menjalankan secara manual)

---

## 🐳 Option 1: Run with Docker (Recommended)
Cara termudah untuk menjalankan seluruh environment (Frontend, Backend, DB, dan Redis) sekaligus.

1.  **Start all services:**
    ```bash
    docker compose up --build -d
    ```
2.  **Access the application:**
    - **Frontend:** [http://localhost:3000](http://localhost:3000)
    - **Backend API:** [http://localhost:3001](http://localhost:3001)
    - **API Documentation (Swagger):** [http://localhost:3001/docs](http://localhost:3001/docs)

---

## 💻 Option 2: Run Locally (Manual Development)
Gunakan opsi ini jika kamu ingin melakukan pengembangan pada kode secara langsung.

1.  **Start Database & Redis only:**
    ```bash
    docker compose up db redis -d
    ```
2.  **Install dependencies and run Backend:**
    ```bash
    bun install
    bun backend:dev
    ```
3.  **Run Frontend:**
    ```bash
    bun dev
    ```

---

## 📋 Useful Commands
- `bun backend:db:migrate` - Menjalankan migrasi database Prisma.
- `bun backend:db:studio` - Membuka GUI database (Prisma Studio).
- `docker compose logs -f` - Melihat log real-time dari container.
- `docker compose down` - Mematikan semua layanan Docker.