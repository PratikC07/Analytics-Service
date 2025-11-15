import { analyticsQueue } from "../../lib/queue.js";
import type { EventInput } from "./ingestion.types.js";

/**
 * Adds a new analytics event to the processing queue.
 * @param eventData The validated event data from the controller.
 */
export const addEventToQueue = async (eventData: EventInput) => {
  // 'analytics-event' is the name of this *job type*
  // eventData is the payload that will be processed by our worker
  await analyticsQueue.add("analytics-event", eventData);
};
