# InsureHealth Backend

This is the backend service for the InsureHealth payment system built with Hono, Prisma, and BullMQ on top of Bun.

## Architecture
- **API Server** (Hono + Zod OpenAPI)
- **Database** (PostgreSQL via Prisma ORM)
- **Queue & Worker** (Redis via BullMQ)

## Setup Requirements
1. **Docker Desktop** (Make sure Docker daemon is running)
2. **Bun runtime**

## Getting Started

1. **Start the Database and Redis Queue**
   Run the docker compose file from the project root:
   ```bash
   cd ..
   docker compose up -d
   ```

2. **Install Dependencies**
   ```bash
   bun install
   ```

3. **Database Migration**
   Initialize your schema in the PostgreSQL container:
   ```bash
   bunx prisma migrate dev --name init
   ```

4. **Start the API & Worker Server**
   ```bash
   bun run src/index.ts
   ```
   The server will start on `http://localhost:3001`

## API Documentation

Once the server is running, the Swagger UI is available at:
👉 **[http://localhost:3001/docs](http://localhost:3001/docs)**

## Verifying the Workflow (Simulation)

You can simulate the entire asynchronous payment and double-entry ledger process using `curl` or Postman.

### 1. Create an Order
```bash
curl -X POST http://localhost:3001/orders \
  -H "Content-Type: application/json" \
  -d '{"productId": 1, "amount": 3500000}'
```
*Note the `wixOrderId` from the response.*

### 2. Simulate Wix Webhook
Fire a webhook payload representing a completed transaction, replacing `wixOrderId` with the value from step 1.
```bash
curl -X POST http://localhost:3001/webhooks/wix \
  -H "Content-Type: application/json" \
  -d '{
    "wixOrderId": "YOUR_WIX_ORDER_ID_HERE",
    "status": "SUCCESS",
    "amount": 3500000,
    "timestamp": "2026-03-05T12:00:00Z"
  }'
```

The BullMQ Worker will automatically pick this up, update the `Order` status, and insert positive and negative entries into the `LedgerEntry` table to ensure a balanced 0-sum double entry.

### 3. Verify Reconciliation Report
Pull the internal reconciliation report to ensure there are no mismatches and that the ledger is balanced.
```bash
curl http://localhost:3001/reconciliation
```
If the workflow ran successfully, the order should show up in the `totalProcessed` and there should be `0` mismatches.

## Running Tests
Tests use Bun's built-in test runner. Tests require the PostgreSQL and Redis containers to be actively running.
```bash
bun test
```
