import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import prisma from "../db";

const reconciliationApp = new OpenAPIHono();

export const ReconciliationReportSchema = z.object({
  totalProcessed: z.number().int().openapi({ example: 10 }),
  totalMismatches: z.number().int().openapi({ example: 2 }),
  mismatches: z.array(
    z.object({
      wixOrderId: z.string().openapi({ example: "WX-123456789" }),
      internalAmount: z.number().openapi({ example: 3500000 }),
      status: z.string().openapi({ example: "SUCCESS" }),
      reason: z.string().openapi({ example: "Mismatch Amount" }),
    }),
  ),
});

const getReconciliationRoute = createRoute({
  method: "get",
  path: "/",
  description:
    "Generate reconciliation report between Orders and Ledger Entries",
  responses: {
    200: {
      description: "Reconciliation report generated",
      content: {
        "application/json": {
          schema: ReconciliationReportSchema,
        },
      },
    },
    500: {
      description: "Internal Server Error",
    },
  },
});

reconciliationApp.openapi(getReconciliationRoute, async (c) => {
  try {
    // 1. Fetch all processed orders (SUCCESS or FAILED)
    const orders = await prisma.order.findMany({
      where: {
        status: {
          in: ["SUCCESS", "FAILED"],
        },
      },
      include: {
        ledger: true,
      },
    });

    const mismatches = [];

    // 2. Analyze each order
    for (const order of orders) {
      // In a real scenario, we might also call Wix API to verify their current status & amount.
      // For this system, we mainly check if the Ledger is balanced and exists for SUCCESS orders.

      const isSuccess = order.status === "SUCCESS";

      if (isSuccess) {
        // If SUCCESS, there MUST be at least two ledger entries
        if (order.ledger.length < 2) {
          mismatches.push({
            wixOrderId: order.wix_order_id,
            internalAmount: Number(order.amount),
            status: order.status,
            reason: "Missing Ledger Entries",
          });
          continue;
        }

        // The sum of ledger entries MUST be exactly 0
        const balance = order.ledger.reduce(
          (sum, entry) => sum + Number(entry.amount),
          0,
        );

        // Using a small epsilon value for floating point comparison safety, though Prisma Decimal helps
        if (Math.abs(balance) > 0.0001) {
          mismatches.push({
            wixOrderId: order.wix_order_id,
            internalAmount: Number(order.amount),
            status: order.status,
            reason: "Ledger Imbalance (Amount != 0)",
          });
          continue;
        }
      } else {
        // If FAILED, there shouldn't be ledger entries
        if (order.ledger.length > 0) {
          mismatches.push({
            wixOrderId: order.wix_order_id,
            internalAmount: Number(order.amount),
            status: order.status,
            reason: "Ledger Entries Exist for FAILED Order",
          });
          continue;
        }
      }
    }

    return c.json(
      {
        totalProcessed: orders.length,
        totalMismatches: mismatches.length,
        mismatches: mismatches,
      },
      200,
    );
  } catch (error) {
    console.error("Failed to generate reconciliation report:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

export default reconciliationApp;
