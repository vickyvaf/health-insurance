const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface CreateOrderParams {
  productId: number;
  amount: number;
}

export interface OrderResponse {
  orderId: string;
  wixOrderId: string;
  amount: number;
  status: string;
  paymentUrl: string;
}

export interface WebhookParams {
  wixOrderId: string;
  status: "SUCCESS" | "FAILED";
  amount: number;
  timestamp: string;
}

export const createOrder = async (
  params: CreateOrderParams,
): Promise<OrderResponse> => {
  const response = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to create order");
  }

  return response.json();
};

export const triggerWebhook = async (
  params: WebhookParams,
): Promise<{ message: string; jobId: string }> => {
  const response = await fetch(`${API_URL}/webhooks/wix`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error("Payment processed, but internal sync failed.");
  }

  return response.json();
};
