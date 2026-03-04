import { z } from "@hono/zod-openapi";

export const CreateOrderSchema = z.object({
  productId: z.number().int().positive().openapi({
    example: 1,
  }),
  amount: z.number().positive().openapi({
    example: 3500000,
  }),
});

export const OrderCreatedResponseSchema = z.object({
  orderId: z.string().uuid().openapi({
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  wixOrderId: z.string().openapi({
    example: "WX-123456789",
  }),
  amount: z.number().positive().openapi({
    example: 3500000,
  }),
  status: z.string().openapi({
    example: "PENDING",
  }),
  paymentUrl: z.string().url().openapi({
    example: "https://wix.simulated-payment.com/pay/WX-123456789",
  }),
});
