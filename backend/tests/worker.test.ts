import { test, expect, describe, beforeAll, afterAll } from "bun:test";
import prisma from "../src/db";
import { webhookWorker } from "../src/worker";

describe("Double-Entry Ledger & Webhook Worker", () => {
  let orderId: string;

  beforeAll(async () => {
    // 1. Create a dummy order to test
    const order = await prisma.order.create({
      data: {
        wix_order_id: "WX-TEST-123",
        product_id: 1,
        amount: 3500000,
        status: "PENDING",
      },
    });
    orderId = order.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.order.delete({ where: { id: orderId } });
  });

  test("Webhook processing creates balanced ledger entries", async () => {
    // 1. Mock the BullMQ Job
    const mockJob = {
      id: "job-1",
      data: {
        wixOrderId: "WX-TEST-123",
        status: "SUCCESS",
        amount: 3500000,
        timestamp: new Date().toISOString(),
      },
      moveToCompleted: async () => {},
      moveToFailed: async () => {},
    } as any;

    // 2. Run the worker directly
    await webhookWorker.processJob(mockJob, "token");

    // 3. Verify Order Status Updated
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { ledger: true },
    });

    expect(updatedOrder?.status).toBe("SUCCESS");
    expect(updatedOrder?.ledger.length).toBe(2);

    // 4. Verify Double-Entry Balance
    const balance = updatedOrder?.ledger.reduce(
      (sum, entry) => sum + Number(entry.amount),
      0,
    );

    expect(balance).toBe(0);

    // Specifically check the entries
    const receivable = updatedOrder?.ledger.find(
      (e) => e.account_type === "GATEWAY_RECEIVABLE",
    );
    const revenue = updatedOrder?.ledger.find(
      (e) => e.account_type === "REVENUE",
    );

    expect(Number(receivable?.amount)).toBe(3500000);
    expect(Number(revenue?.amount)).toBe(-3500000);
  });
});
