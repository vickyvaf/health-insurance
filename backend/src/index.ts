import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { logger } from "hono/logger";
import { cors } from "hono/cors";

import orderApp from "./routes/order";
import webhookApp from "./routes/webhook";
import reconciliationApp from "./routes/reconciliation";
import "./worker"; // Initialize worker

const app = new OpenAPIHono();

// Middleware
app.use("*", logger());
app.use("*", cors());

// Welcome Route
app.get("/", (c) => c.text("InsureHealth API is running! 🚀"));

// API Routes
app.route("/orders", orderApp);
app.route("/webhooks", webhookApp);
app.route("/reconciliation", reconciliationApp);

// OpenAPI JSON
app.doc("/openapi.json", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "InsureHealth API",
    description: "API for Health Insurance Payment System",
  },
});

// Swagger UI
app.get("/docs", swaggerUI({ url: "/openapi.json" }));

export default {
  port: process.env.PORT || 3001,
  fetch: app.fetch,
};

console.log(`🦊 Server is running on port ${process.env.PORT || 3001}`);
