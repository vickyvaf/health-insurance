import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { webhookQueue } from "../queue";

const webhookApp = new OpenAPIHono();

export const WixWebhookPayloadSchema = z.object({
  wixOrderId: z.string().openapi({ example: "WX-123456789" }),
  status: z.enum(["SUCCESS", "FAILED"]).openapi({ example: "SUCCESS" }),
  amount: z.number().positive().openapi({ example: 3500000 }),
  timestamp: z.string().datetime().openapi({ example: "2026-03-05T02:00:00Z" }),
});

const receiveWebhookRoute = createRoute({
  method: "post",
  path: "/wix",
  request: {
    body: {
      content: {
        "application/json": {
          schema: WixWebhookPayloadSchema,
        },
      },
      description: "Wix Webhook Payload",
    },
  },
  responses: {
    200: {
      description: "Webhook received and queued successfully",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
            jobId: z.string(),
          }),
        },
      },
    },
    500: {
      description: "Internal Server Error",
    },
  },
});

webhookApp.openapi(receiveWebhookRoute, async (c) => {
  const payload = c.req.valid("json");

  try {
    // Push the webhook payload to the BullMQ Redis queue
    // We use the wixOrderId as the jobId to enforce idempotency at the queue level if configured,
    // though we will also check it in the worker.
    const job = await webhookQueue.add("process-wix-webhook", payload, {
      jobId: payload.wixOrderId,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
    });

    console.log(
      `[Webhook Route] Received webhook for Wix Order: ${payload.wixOrderId}. Queued job: ${job.id}`,
    );

    return c.json(
      {
        message: "Webhook received and queued",
        jobId: job.id as string,
      },
      200,
    );
  } catch (error) {
    console.error("Failed to process webhook:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

export default webhookApp;
