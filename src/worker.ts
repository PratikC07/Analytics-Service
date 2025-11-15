import "dotenv/config";
import { Worker } from "bullmq";
import prisma from "./lib/prisma.js";
import { processAnalyticsJob } from "./modules/processor/analytics.processor.js";
import { config } from "./config/index.js";

// 1. Get Redis connection options from our config
const redisUrl = new URL(config.REDIS_URL);
const connectionOptions = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port),
  // You could add password here if you had one
};

async function startWorker() {
  console.log("Starting worker...");

  // 2. Connect to the database
  try {
    await prisma.$connect();
    console.log("Prisma Client Connected");
  } catch (error) {
    console.error("Failed to connect to database", error);
    process.exit(1);
  }

  // 3. Initialize the BullMQ Worker
  console.log("Initializing BullMQ Worker...");
  const worker = new Worker(
    "analytics", // The name of the queue to listen to
    processAnalyticsJob, // The function to run for each job
    {
      connection: connectionOptions,
      // 4. THIS IS THE FIX:
      // Process up to 50 jobs at the same time (in parallel)
      concurrency: 50,
    }
  );

  // 5. Add event listeners for logging
  worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed successfully.`);
  });

  worker.on("failed", (job, err) => {
    if (job) {
      // Log job-specific failure
      console.error(`Job ${job.id} failed with error:`, err.message);
    } else {
      // Log a general worker failure
      console.error(`The worker experienced a failure:`, err.message);
    }
  });

  console.log(`Worker started and listening for jobs with concurrency of 50.`);
}

startWorker();
