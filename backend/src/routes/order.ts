import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { v4 as uuidv4 } from "uuid";
import prisma from "../db";
import { CreateOrderSchema, OrderCreatedResponseSchema } from "./order-schemas";

const orderApp = new OpenAPIHono();

const createOrderRoute = createRoute({
  method: "post",
  path: "/",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateOrderSchema,
        },
      },
      description: "Order details",
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: OrderCreatedResponseSchema,
        },
      },
      description: "Order created successfully with Wix payment URL",
    },
    500: {
      description: "Internal Server Error",
    },
  },
});

orderApp.openapi(createOrderRoute, async (c) => {
  const { productId, amount } = c.req.valid("json");

  try {
    // 1. Generate local Order ID
    const localOrderId = uuidv4();

    // 2. Mock Wix Payment Session creation
    // In a real app, we'd call the Wix API here.
    const mockWixOrderId = `WX-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const mockPaymentUrl = `https://wix.simulated-payment.com/pay/${mockWixOrderId}`;

    // 3. Save Order to Database with PENDING status
    const order = await prisma.order.create({
      data: {
        id: localOrderId,
        wix_order_id: mockWixOrderId,
        product_id: productId,
        amount: amount,
        status: "PENDING",
      },
    });

    return c.json(
      {
        orderId: order.id,
        wixOrderId: order.wix_order_id,
        amount: Number(order.amount),
        status: order.status,
        paymentUrl: mockPaymentUrl,
      },
      201,
    );
  } catch (error) {
    console.error("Failed to create order:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

export default orderApp;
