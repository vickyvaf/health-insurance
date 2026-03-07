# 🚀 InsureHealth

**InsureHealth** is a digital health insurance platform that integrates payment flows with an internal **Double-Entry Ledger** system to ensure financial accuracy and transaction data transparency.

## 📖 How to Run
Guide on how to run the health insurance system (Frontend & Backend).

## 🛠 Prerequisites
Ensure you have installed:
- **Docker Desktop** (Highly recommended)
- **Bun Runtime** (If you want to run manually)

---

## 🐳 Option 1: Run with Docker (Recommended)
The easiest way to run the entire environment (Frontend, Backend, DB, and Redis) at once.

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
Use this option if you want to perform code development directly.

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

## 🗄️ Database Management
To view transaction data directly in the database using a GUI:

1.  **Run Prisma Studio:**
    ```bash
    bun backend:db:studio
    ```
2.  **Access GUI:** Open [http://localhost:5555](http://localhost:5555) in your browser.

---

## 📋 Useful Commands
- `bun backend:db:migrate` - Run Prisma database migrations.
- `bun backend:db:studio` - Open the database GUI (Prisma Studio).
- `docker compose logs -f` - View real-time logs from containers.
- `docker compose down` - Shut down all Docker services.