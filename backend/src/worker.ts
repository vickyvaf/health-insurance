import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import prisma from "./db";

// Interfaces mapping to webhook payload
interface WebhookPayload {
  wixOrderId: string;
  status: "SUCCESS" | "FAILED";
  amount: number;
  timestamp: string;
}

console.log("👷 Ledger Worker Initializing...");

const redisConnection = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379",
  { maxRetriesPerRequest: null },
);

export const webhookWorker = new Worker(
  "webhookQueue",
  async (job: Job<WebhookPayload>) => {
    const { wixOrderId, status, amount } = job.data;

    console.log(
      `[Worker] Processing Job ${job.id} for Wix Order: ${wixOrderId}`,
    );

    // 1. Fetch Local Order to validate idempotency and existence
    const order = await prisma.order.findUnique({
      where: { wix_order_id: wixOrderId },
    });

    if (!order) {
      console.error(`[Worker] Order not found for Wix ID: ${wixOrderId}`);
      throw new Error(`Order not found: ${wixOrderId}`); // Throws to retry if it's a race condition
    }

    if (order.status === "SUCCESS" || order.status === "FAILED") {
      console.log(
        `[Worker] Idempotency: Order ${wixOrderId} already processed. Status: ${order.status}`,
      );
      return { message: "Already processed" };
    }

    // 2. Process within an ACID Transaction
    // Ensure both the order update and ledger entries are atomic
    try {
      await prisma.$transaction(async (tx) => {
        // Update Order Status
        const updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: { status },
        });

        // 3. Double-Entry Ledger Logic
        if (status === "SUCCESS") {
          // Double Entry: Sum always equals 0
          // Gateway Receivable gets debited (-amount) and Revenue gets credited (+amount) or vice versa depending on accounting standards
          // For simplicity: RECEIVABLE + amount, REVENUE - amount => Total 0

          await tx.ledgerEntry.createMany({
            data: [
              {
                transaction_id: order.id,
                account_type: "GATEWAY_RECEIVABLE",
                amount: amount, // Positive
              },
              {
                transaction_id: order.id,
                account_type: "REVENUE",
                amount: -amount, // Negative
              },
            ],
          });

          console.log(
            `[Worker] Created balanced ledger entries for Order: ${order.id}`,
          );
        }
      });
      console.log(`[Worker] Job ${job.id} processed successfully.`);
      return { success: true };
    } catch (error) {
      console.error(`[Worker] Transaction failed for Job ${job.id}:`, error);
      throw error; // Causes BullMQ to retry the job
    }
  },
  {
    connection: redisConnection as any,
    concurrency: 5, // Process 5 jobs at a time
  },
);

webhookWorker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed.`);
});

webhookWorker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err);
});
