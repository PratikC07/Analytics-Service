import { Job } from "bullmq";
import prisma from "../../lib/prisma.js";
import type { EventInput } from "../ingestion/ingestion.types.js";

/**
 * Processes a single analytics event job from the queue.
 * This function is called by the BullMQ Worker.
 */
export const processAnalyticsJob = async (
  job: Job<EventInput, any, string>
) => {
  console.log(`Processing job ${job.id} with data:`, job.data);

  try {
    // 1. Format the data for Prisma's 'create'
    const { site_id, event_type, timestamp, path, user_id } = job.data;
    const dataToInsert = {
      site_id,
      event_type,
      timestamp: new Date(timestamp), // Ensure timestamp is a Date object
      path: path ?? null, // Convert undefined to null
      user_id: user_id ?? null, // Convert undefined to null
    };

    // 2. Use 'create' to insert the single event
    await prisma.event.create({
      data: dataToInsert,
    });

    console.log(`Successfully inserted job ${job.id}.`);
    // 3. BullMQ will automatically move the job to 'completed'
    // when this function returns successfully.
  } catch (error: any) {
    // 4. IDEMPOTENCY: Check for unique constraint violation (error code P2002)
    // This happens if the job is processed more than once.
    if (error.code === "P2002") {
      console.warn(
        `Job ${job.id} is a duplicate and was skipped. (Idempotency check)`
      );
      // Return, DON'T throw. This tells BullMQ the job is "complete".
      return;
    }

    // 5. For all other errors, throw it so BullMQ retries the job
    console.error(`Error processing job ${job.id}:`, error);
    throw error;
  }
};
