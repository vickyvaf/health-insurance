import { Queue } from "bullmq";
import Redis from "ioredis";

// Redis Connection
const redisConnection = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379",
  { maxRetriesPerRequest: null },
);

// Queue instance
export const webhookQueue = new Queue("webhookQueue", {
  connection: redisConnection as any,
});
