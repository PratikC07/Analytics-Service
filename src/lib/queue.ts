// src/lib/queue.ts
import { Queue } from "bullmq";
import { config } from "../config/index.js";

// 1. Parse the Redis URL to get the host and port
// (Our config.redisUrl is "redis://redis:6379" from .env.docker)
const redisUrl = new URL(config.REDIS_URL);

// 2. Create a connection options object
const connectionOptions = {
  host: redisUrl.hostname, // This will be 'redis'
  port: Number(redisUrl.port), // This will be 6379
  // You could add password here if you had one:
  // password: redisUrl.password
};

const analyticsQueue = new Queue("analytics", {
  // 3. Pass the connection *options*, not a client instance
  connection: connectionOptions,
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs 3 times
    backoff: {
      type: "exponential",
      delay: 1000, // 1s, 2s, 4s
    },
  },
});

export { analyticsQueue };
